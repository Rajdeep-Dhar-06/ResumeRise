import express from 'express';
import verifyAccess from '../middlewares/verify_access.middleware.js';
import {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  getInterviewStatsController,
  deleteInterviewReportController,
  checkDuplicateInterviewPlanController
} from '../controllers/interview_report.controller.js';
import upload from '../middlewares/resume_upload.middleware.js';
import { validate } from '../middlewares/schema_validation.middleware.js';
import { z } from 'zod';
import { parseLimiter, reportLimiter } from '../middlewares/rate_limiter.middleware.js';

const interviewRouter = express.Router();

const optionalUrlSchema = z
  .string()
  .trim()
  .transform((val) => (!val ? val : /^https?:\/\//i.test(val) ? val : `https://${val}`))
  .pipe(z.string().url('Invalid URL format.'))
  .optional();

const requiredUrlSchema = z
  .string({ required_error: 'jobDescriptionUrl is required.' })
  .trim()
  .transform((val) => (/^https?:\/\//i.test(val) ? val : `https://${val}`))
  .pipe(z.string().url('Invalid URL format.'));

// Validation schemas
const generateReportSchema = {
  body: z.object({
    resumeId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID format.')
      .optional(),
    jobDescriptionId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid job description ID format.')
      .optional(),
    jobDescriptionUrl: optionalUrlSchema,
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

const checkDuplicateSchema = {
  body: z.object({
    resumeHash: z.string({ required_error: 'resumeHash is required.' }),
    jobDescriptionUrl: requiredUrlSchema,
    daysLimit: z.union([z.string(), z.number()]).optional(),
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
 * @route POST /api/interview/checkDuplicate
 * @description Check if an interview plan already exists for this resume and job details combination
 * @access private
 */
interviewRouter.post(
  '/checkDuplicate',
  verifyAccess,
  validate(checkDuplicateSchema),
  checkDuplicateInterviewPlanController
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
