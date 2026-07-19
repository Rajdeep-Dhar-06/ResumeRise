import { TavilySearch } from '@langchain/tavily';
import logger from '../utils/logger.js';
import { getStructuredModel } from '../config/llm.js';
import { reportGapsAndPlanSchema } from '../schemas/interview_report.schema.js';
import { getGapsAndPlanPrompt } from '../prompts/prompts.js';
import { getResourceForTerm } from './search.js';
import { formatTerms } from '../utils/format.js';

/**
 * Helper to process skill gaps and plan learning roadmap
 * @param {Object} state - Graph state
 * @returns {Promise<Object>} - Preparation gaps, plan and learning resources
 */
export async function processLearningPath(state) {
    const { userId } = state;
    logger.info({ userId }, '[Agent] Identifying educational tutorials for identified skill gaps');

    const { evaluatedTechnicalRequirements = [], daysLimit = 7 } = state;

    // We only process technical skills for the learning path, skipping abstract requirements
    const missingTechnicalRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING");
    const weakTechnicalRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH");

    const searchTechnicalRequirements = [...missingTechnicalRequirements, ...weakTechnicalRequirements].map(t => t.requirementName);
    let searchResultsText = "No web search required.";

    if (searchTechnicalRequirements.length > 0) {
        const searchTool = new TavilySearch({ maxResults: 2 });
        const resultsArray = await Promise.all(
            searchTechnicalRequirements.map(term => getResourceForTerm(term, searchTool))
        );
        // Filter out nulls
        const validResults = resultsArray.filter(Boolean);
        searchResultsText = validResults.length > 0 ? validResults.join('\n') : "No search results available.";
    }

    const prompt = getGapsAndPlanPrompt({
        missingTermsFormatted: formatTerms(missingTechnicalRequirements),
        weakTermsFormatted: formatTerms(weakTechnicalRequirements),
        searchResultsText,
        daysLimit
    });

    const structuredLlm = getStructuredModel(reportGapsAndPlanSchema);
    const response = await structuredLlm.invoke(prompt);

    if (process.env.NODE_ENV !== 'production') {
        logger.debug({ userId, response }, '[Agent] Received processLearningPath response from LLM');
    }

    return {
        preparationGaps: response.preparationGaps || [],
        preparationPlan: response.preparationPlan || [],
        learningResources: response.learningResources || [],
    };
}
