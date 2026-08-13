import mongoose from 'mongoose';
import crypto from 'crypto';
import InterviewReportModel from '../models/interview_report.model.js';
import { runInterviewReportPipeline } from '../pipeline/report_pipeline.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/error_handler.js';
import logger from '../utils/logger.js';

/**
 * Generates an interview report synchronously using the pipeline.
 * 
 * - Checks for existing duplicate report.
 * - Runs report generation pipeline directly and returns completed report.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const generateReport = async (req, res) => {
  const { jobDescriptionUrl, daysLimit } = req.body;
  const resumeFile = req.file;

  if (!resumeFile) {
    throw new BadRequestError('Resume PDF file is required.');
  }

  const days = parseInt(daysLimit, 10);

  // Generate hash and check for duplicates
  const resumeHash = crypto.createHash('sha256').update(resumeFile.buffer).digest('hex');
  const existingReport = await InterviewReportModel.findOne({
    userId: req.user.id,
    resumeHash,
    jobDescriptionUrl: jobDescriptionUrl.trim(),
    daysLimit: days,
  }).populate('jobDescriptionId');

  if (existingReport) {
    return res.status(200).json({
      message: 'Existing preparation plan loaded!',
      isDuplicate: true,
      interviewReport: existingReport
    });
  }

  // Run pipeline directly
  const state = await runInterviewReportPipeline({
    userId: req.user.id,
    resumeBuffer: resumeFile.buffer,
    jobDescriptionUrl: jobDescriptionUrl.trim(),
    daysLimit: days,
  });

  res.status(201).json({
    message: 'Report generation completed successfully',
    interviewReport: state.savedReport,
  });
};

/**
 * Retrieves a single interview report by its unique ID.
 * 
 * @route GET /api/interview/reports/:interviewId
 * @access Private
 */
export const getReportById = async (req, res) => {
  const { interviewId } = req.params;
  const interviewReport = await InterviewReportModel.findOne({
    _id: interviewId,
    userId: req.user.id,
  }).populate('jobDescriptionId');

  if (!interviewReport) {
    throw new NotFoundError('Interview report not found');
  }

  res.status(200).json({
    message: 'Interview report fetched successfully',
    interviewReport,
  });
}

/**
 * Retrieves all interview reports belonging to the current user.
 * 
 * @route GET /api/interview/reports
 * @access Private
 */
export const getAllReports = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 9, 50);
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
    .select('reportTitle matchScore createdAt companyName role jobDescriptionUrl');

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

}

/**
 * Retrieves stats for the current user's reports.
 * 
 * - Checks Redis cache first for fast response.
 * - Computes aggregation in MongoDB and caches it on miss.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const getStats = async (req, res) => {
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

  const statsResult = stats[0]
    ? {
      totalPlans: stats[0].totalPlans,
      averageMatch: Math.round(stats[0].averageMatch),
      bestMatch: stats[0].bestMatch,
    }
    : {
      totalPlans: 0,
      averageMatch: 0,
      bestMatch: 0,
    };

  res.status(200).json({
    message: 'Stats retrieved successfully',
    stats: statsResult,
  });
}


/**
 * Deletes a single interview report.
 * 
 * - Removes the report from MongoDB.
 * - Invalidates the user's dashboard stats cache.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const deleteReport = async (req, res) => {
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
}
