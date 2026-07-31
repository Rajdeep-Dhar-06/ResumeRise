import logger from '../utils/logger.js';
import { generateScoreAndTitle } from '../tools/scorer.js';
import { processLearningPath } from '../tools/planner.js';
import { generateTechnicalQuestions } from '../tools/tech.js';
import { generateNonTechnicalQuestions } from '../tools/non_tech.js';

/**
 * Node to concurrently execute title/score calculation, study plan generation,
 * technical question generation, and non-technical question generation.
 */
export async function assembleFinalReport(state) {
    const { userId } = state;
    logger.info({ userId }, '[Agent] Assembling final comprehensive interview report');

    const [scoreRes, pathRes, techRes, nonTechRes] = await Promise.all([
        generateScoreAndTitle(state),
        processLearningPath(state),
        generateTechnicalQuestions(state),
        generateNonTechnicalQuestions(state)
    ]);

    return {
        ...scoreRes,
        ...pathRes,
        ...techRes,
        ...nonTechRes
    };
}
