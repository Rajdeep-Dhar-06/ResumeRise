import logger from '../utils/logger.js';
import { getCreativeStructuredModel } from '../config/llm.js';
import { reportTechQuestionsSchema } from '../schemas/interview_report.schema.js';
import { getTechQuestionsPrompt } from '../prompts/prompts.js';
import { formatRequirementsForPrompt } from '../utils/format.js';

/**
 * Helper to generate customized technical questions
 * @param {Object} pipelineState - Graph state
 * @returns {Promise<Object>} - Generated technical questions array
 */
export async function generateTechnicalQuestions(pipelineState) {
    const { userId } = pipelineState;
    logger.info({ userId }, '[Agent] Generating customized technical assessment questions');

    const {
        evaluatedTechnicalRequirements,
        jobDoc,
    } = pipelineState;

    const jobDescriptionText = `${jobDoc.role} at ${jobDoc.companyName}`;

    const matchedRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MATCHED");
    const missingRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING");
    const weakRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH");

    const missingTermsFormatted = formatRequirementsForPrompt(missingRequirements);
    const weakTermsFormatted = formatRequirementsForPrompt(weakRequirements);
    const matchedTermsFormatted = formatRequirementsForPrompt(matchedRequirements);

    const prompt = getTechQuestionsPrompt({
        missingTermsFormatted,
        weakTermsFormatted,
        matchedTermsFormatted,
        jobDescriptionText
    });

    const structuredLlm = getCreativeStructuredModel(reportTechQuestionsSchema);
    const response = await structuredLlm.invoke(prompt);

    return {
        technicalQuestions: response.technicalQuestions
    };
}
