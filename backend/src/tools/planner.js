import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import logger from '../utils/logger.js';
import { model, getStructuredModel } from '../config/llm.js';
import { reportGapsAndPlanSchema } from '../schemas/interview_report.schema.js';
import { getGapsAndPlanPrompt } from '../prompts/prompts.js';
import { searchTool } from './search.js';
import { formatRequirementsForPrompt } from '../utils/format.js';

const SEARCH_TOOL_NAME = 'tavily_web_search';
const MAX_AGENT_STEPS = 3;
const NO_RESULTS_FALLBACK = 'No web search results available.';

/**
 * Runs a bounded tool-calling loop, letting the model search the web for
 * tutorials/guides on the candidate's skill gaps.
 *
 * @returns {Promise<string>} Newline-joined search notes, or a fallback string.
 */
async function findLearningResources({ missingTermsFormatted, weakTermsFormatted, userId }) {
    const agentLlm = model.bindTools([searchTool]);
    const notes = [];

    const messages = [
        new HumanMessage(
            `You are a learning path planning agent. Identify high-quality tutorials and guides for these candidate skill gaps:
            MISSING: ${missingTermsFormatted || 'None'}
            WEAK: ${weakTermsFormatted || 'None'}
            Use the ${SEARCH_TOOL_NAME} tool to find documentation links for any required skills.`
        ),
    ];

    for (let step = 1; step <= MAX_AGENT_STEPS; step++) {
        logger.info({ userId, step }, '[Agentic Planner] Executing reasoning loop step');

        const aiMessage = await agentLlm.invoke(messages);
        messages.push(aiMessage);

        const toolCalls = (aiMessage.tool_calls || []).filter((call) => call.name === SEARCH_TOOL_NAME);
        
        if (toolCalls.length === 0) {
            logger.info({ userId, step }, '[Agentic Planner] Loop finished (no more tool calls)');
            break;
        }

        for (const toolCall of toolCalls) {
            const result = await searchTool.invoke(toolCall.args);
            const resultText = typeof result === 'string' ? result : JSON.stringify(result);

            notes.push(resultText);
            messages.push(new ToolMessage({ content: resultText, tool_call_id: toolCall.id }));
        }
    }

    return notes.length > 0 ? notes.join('\n\n') : NO_RESULTS_FALLBACK;
}

/**
 * Builds the candidate's structured prep roadmap: identifies skill gaps against
 * the job requirements, searches for supporting learning resources, then asks
 * the model to turn that into a day-by-day plan.
 *
 * @param {Object} pipelineState - Current pipeline audit state
 * @returns {Promise<Object>} { preparationGaps, preparationPlan, learningResources }
 */
export async function generateLearningPlan(pipelineState) {
    const { userId, evaluatedTechnicalRequirements = [], daysLimit = 7 } = pipelineState;
    logger.info({ userId }, '[Agentic Planner] Starting learning path generation');

    const missingTechnicalRequirements = evaluatedTechnicalRequirements.filter((s) => s.matchStatus === 'MISSING');
    const weakTechnicalRequirements = evaluatedTechnicalRequirements.filter((s) => s.matchStatus === 'WEAK_MATCH');

    const missingTermsFormatted = formatRequirementsForPrompt(missingTechnicalRequirements);
    const weakTermsFormatted = formatRequirementsForPrompt(weakTechnicalRequirements);

    const searchTerms = [...missingTechnicalRequirements, ...weakTechnicalRequirements].map((t) => t.requirementName);

    const searchResultsText = searchTerms.length > 0
        ? await findLearningResources({ missingTermsFormatted, weakTermsFormatted, userId })
        : NO_RESULTS_FALLBACK;

    const finalPrompt = getGapsAndPlanPrompt({
        missingTermsFormatted,
        weakTermsFormatted,
        searchResultsText,
        daysLimit,
    });

    const structuredLlm = getStructuredModel(reportGapsAndPlanSchema);
    const response = await structuredLlm.invoke(finalPrompt);

    if (process.env.NODE_ENV !== 'production') {
        logger.debug({ userId, response }, '[Agentic Planner] Finished learning path generation');
    }

    return {
        preparationGaps: response.preparationGaps,
        preparationPlan: response.preparationPlan,
        learningResources: response.learningResources,
    };
}