import logger from '../utils/logger.js';
import { getCreativeStructuredModel } from '../config/llm.js';
import { reportNonTechnicalQuestionsSchema } from '../schemas/interview_report.schema.js';
import { getNonTechnicalQuestionsPrompt } from '../prompts/prompts.js';
import { formatTerms } from '../utils/format.js';

/**
 * Helper to generate customized non-technical questions
 * @param {Object} state - Graph state
 * @returns {Promise<Object>} - Generated non-technical questions array
 */
export async function generateNonTechnicalQuestions(state) {
    const { userId } = state;
    logger.info({ userId }, '[Agent] Generating customized non-technical assessment questions');

    const {
        evaluatedTechnicalRequirements = [],
        evaluatedNonTechnicalRequirements = [],
        nonTechResumeText = '',
        jobDescriptionText = '',
    } = state;

    // use the evaluated requirements to generate questions, and the resume text as narrative to make the questions feel personal
    const missingRequirements = [
        ...evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING"),
        ...evaluatedNonTechnicalRequirements.filter(r => r.matchStatus === "MISSING")
    ];
    const weakRequirements = [
        ...evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH"),
        ...evaluatedNonTechnicalRequirements.filter(r => r.matchStatus === "WEAK_MATCH")
    ];

    const prompt = getNonTechnicalQuestionsPrompt({
        resumeText: nonTechResumeText,
        missingTermsFormatted: formatTerms(missingRequirements),
        weakTermsFormatted: formatTerms(weakRequirements),
        jobDescriptionText
    });

    const structuredLlm = getCreativeStructuredModel(reportNonTechnicalQuestionsSchema);
    const response = await structuredLlm.invoke(prompt);

    return {
        nonTechnicalQuestions: response.nonTechnicalQuestions || []
    };
}
