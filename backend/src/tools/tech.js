import logger from '../utils/logger.js';
import { getCreativeStructuredModel } from '../config/llm.js';
import { reportTechQuestionsSchema } from '../schemas/interview_report.schema.js';
import { getTechQuestionsPrompt } from '../prompts/prompts.js';
import { formatTerms } from '../utils/format.js';

/**
 * Helper to generate customized technical questions
 * @param {Object} state - Graph state
 * @returns {Promise<Object>} - Generated technical questions array
 */
export async function generateTechnicalQuestions(state) {
    const { userId } = state;
    logger.info({ userId }, '[Agent] Generating customized technical assessment questions');

    const {
        evaluatedTechnicalRequirements = [],
        jobDescriptionText = '',
    } = state;

    const matchedRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MATCHED");
    const missingRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING");
    const weakRequirements = evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH");

    const prompt = getTechQuestionsPrompt({
        missingTermsFormatted: formatTerms(missingRequirements, 'None'),
        weakTermsFormatted: formatTerms(weakRequirements, 'None'),
        matchedTermsFormatted: formatTerms(matchedRequirements, 'None'),
        jobDescriptionText
    });

    const structuredLlm = getCreativeStructuredModel(reportTechQuestionsSchema);
    const response = await structuredLlm.invoke(prompt);

    return {
        technicalQuestions: response.technicalQuestions || []
    };
}
