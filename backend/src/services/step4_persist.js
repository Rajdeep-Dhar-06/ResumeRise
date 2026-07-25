import logger from '../utils/logger.js';
import InterviewReportModel from '../models/interview_report.model.js';

/**
 * Step 4: Persist the generated interview report document to MongoDB.
 */
export async function persistReportStep(assembledData) {
  const { auditData, scoreRes, pathRes, techRes, nonTechRes } = assembledData;
  const {
    userId,
    jobDoc,
    resumeDoc,
    jobDescriptionUrl,
    daysLimit,
    jobDescriptionCompany,
    jobDescriptionRole,
    evaluatedTechnicalRequirements,
    evaluatedNonTechnicalRequirements
  } = auditData;

  logger.info({ userId }, 'Persisting report to database');

  const savedReport = await InterviewReportModel.create({
    userId,
    jobDescriptionId: jobDoc._id,
    resumeId: resumeDoc._id,
    resumeHash: resumeDoc.contentHash,
    jobDescriptionUrl,
    daysLimit,
    companyName: jobDescriptionCompany,
    role: jobDescriptionRole,
    evaluatedTechnicalRequirements,
    evaluatedNonTechnicalRequirements,
    reportTitle: scoreRes.reportTitle || 'My Interview Plan',
    matchScore: scoreRes.matchScore || 0,
    technicalQuestions: techRes.technicalQuestions || [],
    nonTechnicalQuestions: nonTechRes.nonTechnicalQuestions || [],
    preparationGaps: pathRes.preparationGaps || [],
    preparationPlan: pathRes.preparationPlan || [],
    learningResources: pathRes.learningResources || [],
  });

  logger.info({ reportId: savedReport._id, userId }, 'Report generated successfully');

  return { savedReport };
}
