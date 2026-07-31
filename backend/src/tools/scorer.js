import logger from '../utils/logger.js';
import { computeMatchScore } from '../utils/score_calculator.js';

/**
 * Helper to generate candidate fit score and roadmap title
 * @param {Object} state - Graph state
 * @returns {Promise<Object>} - roadmap title and calculated score
 */
export function generateScoreAndTitle(state) {
    const { userId } = state;
    logger.info({ userId }, '[Agent] Generating match score and report title');

    const {
        jobDoc,
        evaluatedTechnicalRequirements,
        evaluatedNonTechnicalRequirements
    } = state;

    const title = `${jobDoc.companyName} | ${jobDoc.role}`;
    const matchScore = computeMatchScore(evaluatedTechnicalRequirements, evaluatedNonTechnicalRequirements);

    return {
        reportTitle: title,
        matchScore
    };
}
