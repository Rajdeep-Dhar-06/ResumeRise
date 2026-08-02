import logger from '../utils/logger.js';
import { getCreativeStructuredModel } from '../config/llm.js';
import { reportNonTechnicalQuestionsSchema } from '../schemas/interview_report.schema.js';
import { getNonTechnicalQuestionsPrompt } from '../prompts/prompts.js';
import { formatTerms } from '../utils/format.js';
import { withLlmCache } from '../utils/llm_cache.js';

/**
 * Helper to generate customized non-technical questions
 * @param {Object} state - Graph state
 * @returns {Promise<Object>} - Generated non-technical questions array
 */
export async function generateNonTechnicalQuestions(state) {
    const { userId } = state;
    logger.info({ userId }, '[Agent] Generating customized non-technical assessment questions');

    const {
        evaluatedTechnicalRequirements,
        evaluatedNonTechnicalRequirements,
        nonTechResumeText,
        jobDoc,
    } = state;

    const jobDescriptionText = `${jobDoc.role} at ${jobDoc.companyName}`;

    const missingRequirements = [
        ...evaluatedTechnicalRequirements.filter(s => s.matchStatus === "MISSING"),
        ...evaluatedNonTechnicalRequirements.filter(r => r.matchStatus === "MISSING")
    ];
    const weakRequirements = [
        ...evaluatedTechnicalRequirements.filter(s => s.matchStatus === "WEAK_MATCH"),
        ...evaluatedNonTechnicalRequirements.filter(r => r.matchStatus === "WEAK_MATCH")
    ];

    const missingTermsFormatted = formatTerms(missingRequirements);
    const weakTermsFormatted = formatTerms(weakRequirements);

    const prompt = getNonTechnicalQuestionsPrompt({
        resumeText: nonTechResumeText,
        missingTermsFormatted,
        weakTermsFormatted,
        jobDescriptionText
    });

    const structuredLlm = getCreativeStructuredModel(reportNonTechnicalQuestionsSchema);
    const response = await withLlmCache(
        'non_technical_questions',
        { nonTechResumeText, missingTermsFormatted, weakTermsFormatted, jobDescriptionText },
        () => structuredLlm.invoke(prompt)
    );

    return {
        nonTechnicalQuestions: response.nonTechnicalQuestions
    };
}
