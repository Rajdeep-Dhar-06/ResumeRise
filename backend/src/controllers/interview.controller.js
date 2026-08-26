import mongoose from 'mongoose';
import crypto from 'crypto';
import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import InterviewReportModel from '../models/interview_report.model.js';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from '../utils/error_handler.js';
import logger from '../utils/logger.js';

import { interviewQueue } from '../queues/queue.js';
import { Job } from 'bullmq';

/**
 * Generates an interview report by enqueuing a background job.
 * 
 * Flow:
 * 1. Accepts a multipart/form-data payload containing an optional Resume PDF file.
 * 2. Parses the PDF into memory using `pdf-parse` and concatenates it with the text `careerTranscript`.
 * 3. Hashes the text to check for duplicates to prevent wasting AI resources.
 * 4. Pushes the job to BullMQ, where a background worker will call the Python AI Service.
 * 
 * @param {import('express').Request} req - Express request object containing `req.file` and `req.body`.
 * @param {import('express').Response} res - Express response object.
 * @throws {BadRequestError} If the PDF cannot be read or is missing.
 * @throws {ConflictError} If an identical report already exists.
 */
export const generateReport = async (req, res) => {
  const { careerTranscript, jobDescriptionUrl, daysLimit } = req.body;
  const days = parseInt(daysLimit, 10);

  if (!req.file) {
    throw new BadRequestError('Please upload your resume as a PDF file.');
  }

  // Extract text from PDF
  let pdfText = '';
  try {
    const pdfData = await pdfParse(req.file.buffer);
    pdfText = pdfData.text || '';
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to parse PDF');
    throw new BadRequestError('Failed to read the PDF file. Please ensure it is a valid, text-based PDF.');
  }

  // Merge them together
  const candidateProfile = `=== RESUME ===\n${pdfText.trim()}\n\n=== ADDITIONAL CONTEXT ===\n${careerTranscript ? careerTranscript.trim() : 'None provided.'}`;

  // Generate hash from the text description and check for duplicates
  const profileHash = crypto.createHash('sha256').update(candidateProfile).digest('hex');
  const existingReport = await InterviewReportModel.findOne({
    userId: req.user.id,
    profileHash,
    jobDescriptionUrl: jobDescriptionUrl.trim(),
    daysLimit: days,
  });

  if (existingReport) {
    throw new ConflictError('A preparation plan for this profile already exists.', {
      reportId: existingReport._id,
    });
  }

  // Deduplicate actively running jobs using the same unique jobId
  const customJobId = `report-${req.user.id}-${profileHash}-${days}`;

  // Fix Deduplication Deadlock: Handle existing jobs that are failed or completed (e.g. user deleted report and retried)
  const existingJob = await Job.fromId(interviewQueue, customJobId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'failed' || state === 'completed') {
      await existingJob.remove();
    } else {
      return res.status(202).json({
        message: 'Report generation already in progress',
        jobId: existingJob.id,
      });
    }
  }

  // Add the job to BullMQ
  const job = await interviewQueue.add('generate', {
    userId: req.user.id,
    profileHash,
    candidateProfile,
    jobDescriptionUrl,
    days
  }, {
    jobId: customJobId
  });

  res.status(202).json({
    message: 'Report generation queued successfully',
    jobId: job.id,
  });
};

/**
 * Retrieves the status of a BullMQ job.
 * 
 * @route GET /api/interview/reports/job/:jobId
 * @access Private
 */
export const getJobStatus = async (req, res) => {
  const { jobId } = req.params;
  
  const job = await Job.fromId(interviewQueue, jobId);
  
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  const state = await job.getState();
  const isCompleted = state === 'completed';
  const isFailed = state === 'failed';
  
  // Verify ownership of the job
  if (job.data.userId !== req.user.id) {
    throw new ForbiddenError('You do not have permission to view this job');
  }

  res.status(200).json({
    jobId,
    status: state,
    reportId: isCompleted ? job.returnvalue?.reportId : null,
    error: isFailed ? job.failedReason : null
  });
};


/**
 * Retrieves a single interview report by its unique ID.
 * 
 * @route GET /api/interview/reports/:reportId
 * @access Private
 */
export const getReportById = async (req, res) => {
  const { reportId } = req.params;
  const interviewReport = await InterviewReportModel.findOne({
    _id: reportId,
    userId: req.user.id,
  });

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
 * - Computes aggregation in MongoDB.
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
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const deleteReport = async (req, res) => {
  const { reportId } = req.params;
  const deletedReport = await InterviewReportModel.findOneAndDelete({
    _id: reportId,
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
