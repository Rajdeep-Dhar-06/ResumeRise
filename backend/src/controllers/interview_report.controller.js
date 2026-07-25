import mongoose from 'mongoose';
import crypto from 'crypto';
import InterviewReportModel from '../models/interview_report.model.js';
import { reportQueue } from '../queues/report.queue.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/error_handler.js';
import { redisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Enqueues a report generation job to BullMQ.
 * 
 * - Checks for existing duplicate report.
 * - Adds job to BullMQ queue and returns jobId immediately with 202 status.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const generateInterviewReportController = async (req, res) => {
  const { jobDescriptionUrl, daysLimit } = req.body;
  const resumeFile = req.file;

  if (!resumeFile) {
    throw new BadRequestError('Resume PDF file is required.');
  }

  // Calculate daysLimit based on user selection or default to 7 days
  let calculatedDaysLimit = 7; // Default fallback is 7 days
  if (daysLimit) {
    const parsed = parseInt(daysLimit, 10);
    if ([3, 5, 7].includes(parsed)) {
      calculatedDaysLimit = parsed;
    }
  }

  // Generate hash and check for duplicates
  const resumeHash = crypto.createHash('sha256').update(resumeFile.buffer).digest('hex');
  const existingReport = await InterviewReportModel.findOne({
    userId: req.user.id,
    resumeHash,
    jobDescriptionUrl: jobDescriptionUrl.trim(),
    daysLimit: calculatedDaysLimit
  }).populate('jobDescriptionId').lean();

  if (existingReport) {
    return res.status(200).json({
      message: 'Existing preparation plan loaded!',
      isDuplicate: true,
      interviewReport: existingReport
    });
  }

  // Add job to BullMQ queue
  const job = await reportQueue.add('generate', {
    userId: req.user.id,
    resumeBufferBase64: resumeFile.buffer.toString('base64'),
    jobDescriptionUrl: jobDescriptionUrl.trim(),
    daysLimit: calculatedDaysLimit,
  });

  res.status(202).json({
    message: 'Report generation started successfully',
    jobId: job.id,
  });
};

/**
 * Checks the status of a BullMQ report generation job.
 * 
 * @route GET /api/interview/status/:jobId
 * @access Private
 */
export const getJobStatusController = async (req, res) => {
  const { jobId } = req.params;
  const job = await reportQueue.getJob(jobId);

  if (!job) {
    throw new NotFoundError('Report generation job not found');
  }

  // Ensure user owns this job
  if (job.data.userId !== req.user.id) {
    throw new UnauthorizedError('Unauthorized access to this job');
  }

  const state = await job.getState();

  if (state === 'completed') {
    return res.status(200).json({
      status: 'completed',
      reportId: job.returnvalue?.reportId,
    });
  }

  if (state === 'failed') {
    return res.status(200).json({
      status: 'failed',
      failedReason: job.failedReason || 'Report generation failed',
    });
  }

  return res.status(200).json({
    status: 'processing',
    state,
  });
};

/**
 * Retrieves a single interview report by its unique ID.
 * 
 * @route GET /api/interview/report/:interviewId
 * @access Private
 */
export const getInterviewReportByIdController = async (req, res) => {
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
}

/**
 * Retrieves all interview reports belonging to the current user.
 * 
 * @route GET /api/interview/
 * @access Private
 */
export const getAllInterviewReportsController = async (req, res) => {
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
export const getInterviewStatsController = async (req, res) => {
  const cacheKey = `stats:${req.user.id}`;

  const defaultStats = {
    totalPlans: 0,
    averageMatch: 0,
    bestMatch: 0,
  };

  try {
    const cachedStats = await redisClient.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json({
        message: 'Stats retrieved successfully',
        stats: JSON.parse(cachedStats),
      });
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to retrieve stats from cache');
  }

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
    : defaultStats;

  try {
    await redisClient.set(cacheKey, JSON.stringify(statsResult)); // no ttl needed
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to cache stats');
  }

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
export const deleteInterviewReportController = async (req, res) => {
  const { interviewId } = req.params;
  const deletedReport = await InterviewReportModel.findOneAndDelete({
    _id: interviewId,
    userId: req.user.id,
  });

  if (!deletedReport) {
    throw new NotFoundError('Interview report not found');
  }

  try {
    await redisClient.del(`stats:${req.user.id}`);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to invalidate stats cache after report deletion');
  }

  res.status(200).json({
    message: 'Interview report deleted successfully',
    deletedReport,
  });
}
