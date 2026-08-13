import express from 'express';
import verifyAccess from '../middlewares/verify_access.middleware.js';
import {
  generateReport,
  getReportById,
  getAllReports,
  getStats,
  deleteReport
} from '../controllers/interview.controller.js';
import uploadPdfMiddleware from '../middlewares/resume_upload.middleware.js';
import { validate } from '../middlewares/schema_validation.middleware.js';
import { z } from 'zod';
import { reportLimiter } from '../middlewares/rate_limiter.middleware.js';

const interviewRouter = express.Router();

// Validation schemas
const generateReportSchema = {
  body: z.object({
    jobDescriptionUrl: z.string().url(),
    daysLimit: z.enum(["3", "5", "7"]).default("7"),
  }),
};

const interviewIdSchema = {
  params: z.object({
    interviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid interview ID format'),
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
  uploadPdfMiddleware.single('resume'),
  validate(generateReportSchema),
  generateReport
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
 * @route GET /api/interview/reports/:interviewId
 * @description Get interview report by ID
 * @access private
 */
interviewRouter.get(
  '/reports/:interviewId',
  verifyAccess,
  validate(interviewIdSchema),
  getReportById
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
  deleteReport
);

export default interviewRouter;
