import express from 'express';
import verifyAccess from '../middlewares/verify_access.middleware.js';
import {
  parseResumeController,
  parseJobDescriptionController,
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
import { parseLimiter, reportLimiter } from '../middlewares/ratelimiter.js';

const interviewRouter = express.Router();

// Validation schemas
const parseJobDescriptionSchema = {
  body: z.object({
    jobDescriptionUrl: z
      .string({ required_error: 'Job description URL is required.' })
      .trim()
      .url('Invalid URL format.'),
  }),
};

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
    jobDescriptionUrl: z
      .string()
      .trim()
      .url('Invalid URL format.')
      .optional(),
    daysLimit: z.string().optional(),
  }),
};

const interviewIdParamsSchema = {
  params: z.object({
    interviewId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid interview ID format'),
  }),
};

/**
 * @route POST /api/interview/parseResume
 * @description Upload and parse the candidate's resume
 * @access private
 */
interviewRouter.post(
  '/parseResume',
  verifyAccess,
  parseLimiter,
  upload.single('resume'),
  parseResumeController
);

/**
 * @route POST /api/interview/parseJobDescription
 * @description Scrape and parse the job description from a URL using LangChain and LLM
 * @access private
 */
interviewRouter.post(
  '/parseJobDescription',
  verifyAccess,
  parseLimiter,
  validate(parseJobDescriptionSchema),
  parseJobDescriptionController
);

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
