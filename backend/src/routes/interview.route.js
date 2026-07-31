import express from 'express';
import verifyAccess from '../middlewares/verify_access.middleware.js';
import {
  generateInterviewReportController,
  getJobStatusController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  getInterviewStatsController,
  deleteInterviewReportController
} from '../controllers/interview.controller.js';
import upload from '../middlewares/resume_upload.middleware.js';
import { validate } from '../middlewares/schema_validation.middleware.js';
import { z } from 'zod';
import { reportLimiter } from '../middlewares/rate_limiter.middleware.js';

const interviewRouter = express.Router();

// Validation schemas
const generateReportSchema = {
  body: z.object({
    jobDescriptionUrl: z.url({ error: 'Invalid URL format.' }).trim(),
    daysLimit: z.enum(["3", "5", "7"]).default("7"),
  }),
};

const interviewIdSchema = {
  params: z.object({
    interviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid interview ID format'),
  }),
};

const jobStatusSchema = {
  params: z.object({
    jobId: z.string({ required_error: 'Job ID is required' }).trim().min(1, 'Job ID is required'),
  }),
};

/**
 * @route POST /api/interview/reports/generate-report
 * @description Generate an interview report from pre-parsed resume and job description
 * @access private
 */
interviewRouter.post(
  '/reports/generate-report',
  verifyAccess,
  reportLimiter,
  upload.single('resume'),
  validate(generateReportSchema),
  generateInterviewReportController
);

/**
 * @route GET /api/interview/reports/status/:jobId
 * @description Check report generation job status
 * @access private
 */
interviewRouter.get(
  '/reports/status/:jobId',
  verifyAccess,
  validate(jobStatusSchema),
  getJobStatusController
);

/**
 * @route GET /api/interview/reports/:interviewId
 * @description Get interview report by ID
 * @access private
 */
interviewRouter.get(
  '/reports/:interviewId',
  verifyAccess,
  validate(interviewIdSchema),
  getInterviewReportByIdController
);

/**
 * @route GET /api/interview/reports/stats
 * @description Get interview reports stats for a user
 * @access private
 */
interviewRouter.get(
  '/reports/stats',
  verifyAccess,
  getInterviewStatsController
);

/**
 * @route DELETE /api/interview/reports/:interviewId
 * @description Delete interview report by ID
 * @access private
 */
interviewRouter.delete(
  '/reports/:interviewId',
  verifyAccess,
  validate(interviewIdSchema),
  deleteInterviewReportController
);

/**
 * @route GET /api/interview/reports
 * @description Get all interview reports for a user
 * @access private
 */
interviewRouter.get(
  '/reports',
  verifyAccess,
  getAllInterviewReportsController
);

export default interviewRouter;
