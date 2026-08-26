import express from 'express';
import verifyAccess from '../middlewares/verify_access.middleware.js';
import {
  generateReport,
  getReportById,
  getAllReports,
  getStats,
  deleteReport,
  getJobStatus
} from '../controllers/interview.controller.js';
import { validate } from '../middlewares/schema_validation.middleware.js';
import { z } from 'zod';
import { reportLimiter } from '../middlewares/rate_limiter.middleware.js';
import upload from '../middlewares/resume_upload.middleware.js';

const interviewRouter = express.Router();

// Validation schemas
const generateReportSchema = {
  body: z.object({
    careerTranscript: z.string().optional(),
    jobDescriptionUrl: z.string().url(),
    daysLimit: z.coerce.number().pipe(z.union([z.literal(3), z.literal(5), z.literal(7)])).default(7),
  }),
};

const reportIdSchema = {
  params: z.object({
    reportId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid report ID format'),
  }),
};

/**
 * @route POST /api/interview/reports
 * @description Generate an interview report from raw candidate text profile
 * @access private
 */
interviewRouter.post(
  '/reports',
  verifyAccess,
  reportLimiter,
  upload.single('resumePdf'),
  validate(generateReportSchema),
  generateReport
);

/**
 * @route GET /api/interview/reports/job/:jobId
 * @description Get the status of an interview report generation job
 * @access private
 */
interviewRouter.get(
  '/reports/job/:jobId',
  verifyAccess,
  getJobStatus
);

/**
 * @route GET /api/interview/reports/stats
 * @description Get interview reports stats for a user
 * @access private
 */
interviewRouter.get(
  '/reports/stats',
  verifyAccess,
  getStats
);

/**
 * @route GET /api/interview/reports
 * @description Get all interview reports for a user
 * @access private
 */
interviewRouter.get(
  '/reports',
  verifyAccess,
  getAllReports
);

/**
 * @route GET /api/interview/reports/:reportId
 * @description Get interview report by ID
 * @access private
 */
interviewRouter.get(
  '/reports/:reportId',
  verifyAccess,
  validate(reportIdSchema),
  getReportById
);

/**
 * @route DELETE /api/interview/reports/:reportId
 * @description Delete interview report by ID
 * @access private
 */
interviewRouter.delete(
  '/reports/:reportId',
  verifyAccess,
  validate(reportIdSchema),
  deleteReport
);

export default interviewRouter;
