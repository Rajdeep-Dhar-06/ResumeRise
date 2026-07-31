import logger from '../utils/logger.js';
import InterviewReportModel from '../models/interview_report.model.js';

/**
 * Node to persist the generated preparation roadmap to the database.
 */
export async function persistInterviewReport(state) {
    const {
        userId,
        jobDescriptionId,
        resumeId,
        resumeHash,
        jobDescriptionUrl,
        daysLimit = 7,
        jobDescriptionCompany = 'Company',
        jobDescriptionRole = 'Role',

        evaluatedTechnicalRequirements = [],
        evaluatedNonTechnicalRequirements = [],

        reportTitle = 'My Interview Plan',
        matchScore = 0,
        technicalQuestions = [],
        nonTechnicalQuestions = [],
        preparationGaps = [],
        preparationPlan = [],
        learningResources = []
    } = state;

    logger.info({ userId, resumeId, jobDescriptionId }, '[Agent] Persisting completed interview report to database');

    const savedReport = await InterviewReportModel.create({
        userId,
        jobDescriptionId,
        resumeId,
        resumeHash,
        jobDescriptionUrl,
        daysLimit,
        companyName: jobDescriptionCompany,
        role: jobDescriptionRole,

        evaluatedTechnicalRequirements,
        evaluatedNonTechnicalRequirements,

        reportTitle,
        matchScore,
        technicalQuestions,
        nonTechnicalQuestions,
        preparationGaps,
        preparationPlan,
        learningResources,
    });

    logger.info({ reportId: savedReport._id, userId }, '[Agent] Saved completed interview report to database');

    return { savedReport };
}
