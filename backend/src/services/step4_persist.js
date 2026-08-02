import logger from '../utils/logger.js';
import InterviewReportModel from '../models/interview_report.model.js';

/**
 * Step 4: Persist the generated interview report document to MongoDB.
 */
export async function persistReportStep(assembledData) {
  const {
    userId,
    jobDoc,
    resumeDoc,
    jobDescriptionUrl,
    daysLimit,
    reportTitle,
    matchScore,
    technicalQuestions,
    nonTechnicalQuestions,
    preparationGaps,
    preparationPlan,
    learningResources,
  } = assembledData;

  logger.info({ userId }, 'Persisting report to database');

  const savedReport = await InterviewReportModel.create({
    userId,
    jobDescriptionId: jobDoc._id,
    resumeId: resumeDoc._id,
    resumeHash: resumeDoc.contentHash,
    jobDescriptionUrl,
    daysLimit,
    companyName: jobDoc.companyName,
    role: jobDoc.role,
    reportTitle,
    matchScore,
    technicalQuestions,
    nonTechnicalQuestions,
    preparationGaps,
    preparationPlan,
    learningResources,
  });

  logger.info({ reportId: savedReport._id, userId }, 'Report generated successfully');

  return { savedReport };
}
