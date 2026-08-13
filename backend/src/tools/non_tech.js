import logger from '../utils/logger.js';
import { getCreativeStructuredModel } from '../config/llm.js';
import { reportNonTechnicalQuestionsSchema } from '../schemas/interview_report.schema.js';
import { getNonTechnicalQuestionsPrompt } from '../prompts/prompts.js';
import { formatRequirementsForPrompt } from '../utils/format.js';

/**
 * Helper to generate customized non-technical questions
 * @param {Object} pipelineState - Graph state
 * @returns {Promise<Object>} - Generated non-technical questions array
 */
export async function generateNonTechnicalQuestions(pipelineState) {
    const { userId } = pipelineState;
    logger.info({ userId }, '[Agent] Generating customized non-technical assessment questions');

    const {
        evaluatedTechnicalRequirements,
        evaluatedNonTechnicalRequirements,
        resumeText,
        jobDoc,
    } = pipelineState;

    const jobDescriptionText = `${jobDoc.role} at ${jobDoc.companyName}`;

    const missingRequirements = [
        ...evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING"),
        ...evaluatedNonTechnicalRequirements.filter(r => r.matchStatus === "MISSING")
    ];
    const weakRequirements = [
        ...evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH"),
        ...evaluatedNonTechnicalRequirements.filter(r => r.matchStatus === "WEAK_MATCH")
    ];

    const missingTermsFormatted = formatRequirementsForPrompt(missingRequirements);
    const weakTermsFormatted = formatRequirementsForPrompt(weakRequirements);

    const prompt = getNonTechnicalQuestionsPrompt({
        resumeText,
        missingTermsFormatted,
        weakTermsFormatted,
        jobDescriptionText
    });

    const structuredLlm = getCreativeStructuredModel(reportNonTechnicalQuestionsSchema);
    const response = await structuredLlm.invoke(prompt);

    return {
        nonTechnicalQuestions: response.nonTechnicalQuestions
    };
}
