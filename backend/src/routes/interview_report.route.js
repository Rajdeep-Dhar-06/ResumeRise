import express from 'express';
import verifyAccess from '../middlewares/verify_access.middleware.js';
import {
  generateInterviewReportController,
  getJobStatusController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  getInterviewStatsController,
  deleteInterviewReportController
} from '../controllers/interview_report.controller.js';
import upload from '../middlewares/resume_upload.middleware.js';
import { validate } from '../middlewares/schema_validation.middleware.js';
import { z } from 'zod';
import { reportLimiter } from '../middlewares/rate_limiter.middleware.js';

const interviewRouter = express.Router();

const jobDescriptionUrlSchema = z
  .url({ error: 'Invalid URL format.'})
  .trim();

// Validation schemas
const generateReportSchema = {
  body: z.object({
    jobDescriptionUrl: jobDescriptionUrlSchema,
    daysLimit: z.union([z.string(), z.number()]).optional(),
  }),
};

const interviewIdParamsSchema = {
  params: z.object({
    interviewId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid interview ID format'),
  }),
};

const jobIdParamsSchema = {
  params: z.object({
    jobId: z
      .string({ required_error: 'Job ID is required' })
      .trim()
      .min(1, 'Job ID is required'),
  }),
};

/**
 * @route POST /api/interview/generateReport
 * @description Generate an interview report from pre-parsed resume and job description
 * @access private
 */
interviewRouter.post(
  '/generateReport',
  verifyAccess,
  reportLimiter,
  upload.single('resume'),
  validate(generateReportSchema),
  generateInterviewReportController
);

/**
 * @route GET /api/interview/status/:jobId
 * @description Check report generation job status
 * @access private
 */
interviewRouter.get(
  '/status/:jobId',
  verifyAccess,
  validate(jobIdParamsSchema),
  getJobStatusController
);

/**
 * @route GET /api/interview/report/:interviewId
 * @description Get interview report by ID
 * @access private
 */
interviewRouter.get(
  '/report/:interviewId',
  verifyAccess,
  validate(interviewIdParamsSchema),
  getInterviewReportByIdController
);

/**
 * @route GET /api/interview/stats
 * @description Get interview stats for a user
 * @access private
 */
interviewRouter.get(
  '/stats',
  verifyAccess,
  getInterviewStatsController
);

/**
 * @route DELETE /api/interview/report/:interviewId
 * @description Delete interview report by ID
 * @access private
 */
interviewRouter.delete(
  '/report/:interviewId',
  verifyAccess,
  validate(interviewIdParamsSchema),
  deleteInterviewReportController
);

/**
 * @route GET /api/interview/
 * @description Get all interview reports for a user
 * @access private
 */
interviewRouter.get(
  '/',
  verifyAccess,
  getAllInterviewReportsController
);

export default interviewRouter;
