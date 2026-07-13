import mongoose from 'mongoose';
import InterviewReportModel from '../models/interview_report.model.js';
import { runInterviewReportGraph } from '../graph/builder.js';
import { asyncHandler } from '../utils/async_handler.js';
import { BadRequestError, NotFoundError } from '../utils/error_handler.js';



/** @description Controller to generate an interview report from pre-parsed resume and JD */
const generateInterviewReportController = asyncHandler(async (req, res) => {
  const { jobDescriptionUrl, daysLimit } = req.body;
  const resumeFile = req.file;

  if (!resumeFile) {
    throw new BadRequestError('Resume PDF file is required.');
  }
  if (!jobDescriptionUrl) {
    throw new BadRequestError('Job description URL is required.');
  }

  // Calculate daysLimit based on user selection or default to 7 days
  let calculatedDaysLimit = 7; // Default fallback is 7 days
  if (daysLimit) {
    const parsed = parseInt(daysLimit, 10);
    if ([3, 5, 7].includes(parsed)) {
      calculatedDaysLimit = parsed;
    }
  }

  // Invoke the LangGraph starting at startAgent
  const graphState = await runInterviewReportGraph({
    userId: req.user.id,
    resumeBuffer: resumeFile.buffer,
    jobDescriptionUrl,
    daysLimit: calculatedDaysLimit,
  });

  res.status(201).json({
    message: 'Interview Report Generated Successfully!',
    interviewReport: graphState.savedReport,
  });
});

/** @description Controller to get an interview report by ID */
const getInterviewReportByIdController = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const interviewReport = await InterviewReportModel.findOne({
    _id: interviewId,
    userId: req.user.id,
  }).populate('jobDescriptionId').lean();

  if (!interviewReport) {
    throw new NotFoundError('Interview report not found');
  }

  res.status(200).json({
    message: 'Interview report fetched successfully',
    interviewReport,
  });
});

/** @description Controller to get all interview reports for a user */
const getAllInterviewReportsController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 9;
  const search = req.query.search ? req.query.search.trim() : "";
  const minScore = parseInt(req.query.minScore, 10) || 0;

  const skip = (page - 1) * limit;
  const query = { userId: req.user.id };

  if (minScore > 0) {
    query.matchScore = { $gte: minScore };
  }

  if (search) {
    query.$or = [
      { reportTitle: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } }
    ];
  }

  const totalCount = await InterviewReportModel.countDocuments(query);
  const interviewReports = await InterviewReportModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('reportTitle matchScore createdAt companyName role jobDescriptionUrl')
    .lean();

  res.status(200).json({
    message: 'Interview reports fetched successfully',
    pagination: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    },
    interviewReports,
  });

});

export const getInterviewStatsController = asyncHandler(async (req, res) => {
  const defaultStats = {
    totalPlans: 0,
    averageMatch: 0,
    bestMatch: 0,
  };

  const stats = await InterviewReportModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: null,
        totalPlans: { $sum: 1 },
        averageMatch: { $avg: '$matchScore' },
        bestMatch: { $max: '$matchScore' },
      },
    },
  ]);

  res.status(200).json({
    message: 'Stats retrieved successfully',
    stats: stats[0]
      ? {
        totalPlans: stats[0].totalPlans,
        averageMatch: Math.round(stats[0].averageMatch),
        bestMatch: stats[0].bestMatch,
      }
      : defaultStats,
  });
});


/** @description Controller to delete an interview report by ID */
const deleteInterviewReportController = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const deletedReport = await InterviewReportModel.findOneAndDelete({
    _id: interviewId,
    userId: req.user.id,
  });

  if (!deletedReport) {
    throw new NotFoundError('Interview report not found');
  }

  res.status(200).json({
    message: 'Interview report deleted successfully',
    deletedReport,
  });
});

/** @description Check if an interview report with this resume and job posting combination already exists. */
export const checkDuplicateInterviewPlanController = asyncHandler(async (req, res) => {
  const { resumeHash, jobDescriptionUrl, daysLimit } = req.body;

  if (!resumeHash || !jobDescriptionUrl) {
    throw new BadRequestError('resumeHash and jobDescriptionUrl are required.');
  }

  let calculatedDaysLimit = 7;
  if (daysLimit) {
    const parsed = parseInt(daysLimit, 10);
    if ([3, 5, 7].includes(parsed)) {
      calculatedDaysLimit = parsed;
    }
  }

  const existingReport = await InterviewReportModel.findOne({
    userId: req.user.id,
    resumeHash,
    jobDescriptionUrl: jobDescriptionUrl.trim(),
    daysLimit: calculatedDaysLimit
  }).lean();

  if (existingReport) {
    return res.status(200).json({
      exists: true,
      reportId: existingReport._id,
      interviewReport: existingReport
    });
  }

  res.status(200).json({ exists: false });
});

export {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  deleteInterviewReportController,
};

