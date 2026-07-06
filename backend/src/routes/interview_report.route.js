import express from 'express';
import authUser from '../middlewares/jwt_auth.middleware.js';
import {
  parseResumeController,
  parseJobDescriptionController,
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  deleteInterviewReportController
} from '../controllers/interview_report.controller.js';
import upload from '../middlewares/resume_upload.middleware.js';
import { validate } from '../middlewares/schema_validation.middleware.js';
import { z } from 'zod';

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
      .string({ required_error: 'Resume ID is required.' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID format.'),
    jobDescriptionId: z
      .string({ required_error: 'Job description ID is required.' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid job description ID format.'),
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
  authUser,
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
  authUser,
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
  authUser,
  validate(generateReportSchema),
  generateInterviewReportController
);

/**
 * @route GET /api/interview/report/:interviewId
 * @description Get interview report by ID
 * @access private
 */
interviewRouter.get(
  '/report/:interviewId',
  authUser,
  validate(interviewIdParamsSchema),
  getInterviewReportByIdController
);

/**
 * @route DELETE /api/interview/report/:interviewId
 * @description Delete interview report by ID
 * @access private
 */
interviewRouter.delete(
  '/report/:interviewId',
  authUser,
  validate(interviewIdParamsSchema),
  deleteInterviewReportController
);

/**
 * @route GET /api/interview/
 * @description Get all interview reports for a user
 * @access private
 */
interviewRouter.get('/', authUser, getAllInterviewReportsController);

export default interviewRouter;
