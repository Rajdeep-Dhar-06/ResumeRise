import logger from '../utils/logger.js';
import { generateScoreAndTitle } from '../tools/scorer.js';
import { processLearningPath } from '../tools/planner.js';
import { generateTechnicalQuestions } from '../tools/tech.js';
import { generateNonTechnicalQuestions } from '../tools/non_tech.js';

/**
 * Step 3: Assemble final report components (score, learning path, tech & non-tech questions) in parallel.
 */
export async function assembleReportComponentsStep(auditData) {
  const { userId } = auditData;
  logger.info({ userId }, 'Assembling final report components');

  const [scoreRes, pathRes, techRes, nonTechRes] = await Promise.all([
    generateScoreAndTitle(auditData),
    processLearningPath(auditData),
    generateTechnicalQuestions(auditData),
    generateNonTechnicalQuestions(auditData)
  ]);

  return {
    ...auditData,
    ...scoreRes,
    ...pathRes,
    ...techRes,
    ...nonTechRes
  };
}
