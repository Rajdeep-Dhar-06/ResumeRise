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

  const stateContext = {
    userId: auditData.userId,
    resumeBuffer: auditData.resumeBuffer,
    jobDescriptionUrl: auditData.jobDescriptionUrl,
    daysLimit: auditData.daysLimit,
    resumeId: auditData.resumeDoc._id,
    resumeHash: auditData.resumeDoc.contentHash,
    techResumeText: auditData.techResumeText,
    nonTechResumeText: auditData.nonTechResumeText,
    jobDescriptionId: auditData.jobDoc._id,
    jobDescriptionCompany: auditData.jobDescriptionCompany,
    jobDescriptionRole: auditData.jobDescriptionRole,
    jobDescriptionTechnicalRequirements: auditData.jobDescriptionTechnicalRequirements,
    jobDescriptionNonTechnicalRequirements: auditData.jobDescriptionNonTechnicalRequirements,
    evaluatedTechnicalRequirements: auditData.evaluatedTechnicalRequirements,
    evaluatedNonTechnicalRequirements: auditData.evaluatedNonTechnicalRequirements,
  };

  const [scoreRes, pathRes, techRes, nonTechRes] = await Promise.all([
    generateScoreAndTitle(stateContext),
    processLearningPath(stateContext),
    generateTechnicalQuestions(stateContext),
    generateNonTechnicalQuestions(stateContext)
  ]);

  return {
    auditData,
    scoreRes,
    pathRes,
    techRes,
    nonTechRes
  };
}
