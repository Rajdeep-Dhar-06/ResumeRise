import express from 'express';
import authUser from '../middlewares/jwtAuth.middleware.js';
import {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
  scrapeJobDescriptionController
} from '../controllers/interviewReport.controller.js';
import upload from '../middlewares/resumeUpload.middleware.js';
import { validate } from '../middlewares/schemaValidation.middleware.js';
import { z } from 'zod';

const interviewRouter = express.Router();

// Validation schemas
const generateReportSchema = {
  body: z.object({
    jobDescriptionUrl: z
      .string({ required_error: 'Job description URL is required.' })
      .trim()
      .url('Invalid URL format.'),
    selfDescription: z.string().trim().default(''),
    jobDescription: z.string().trim().optional(),
    scrapedSkills: z.union([z.array(z.any()), z.string()]).optional(),
    scrapedRequirements: z.union([z.array(z.any()), z.string()]).optional(),
  }),
};

const scrapeJdSchema = {
  body: z.object({
    url: z
      .string({ required_error: 'URL is required.' })
      .trim()
      .url('Invalid URL format.'),
  }),
};

const interviewIdParamsSchema = {
  params: z.object({
    interviewId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid interview ID format'),
  }),
};

const interviewReportIdParamsSchema = {
  params: z.object({
    interviewReportId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid report ID format'),
  }),
};

/**
 * @route POST /api/interview/
 * @description Generate an interview report for a candidate
 * @access private
 */
interviewRouter.post(
  '/',
  authUser,
  upload.single('resume'),
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
 * @route GET /api/interview/
 * @description Get all interview reports for a user
 * @access private
 */
interviewRouter.get('/', authUser, getAllInterviewReportsController);

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description Generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post(
  '/resume/pdf/:interviewReportId',
  authUser,
  validate(interviewReportIdParamsSchema),
  generateResumePdfController
);

/**
 * @route POST /api/interview/scrape-jd
 * @description Scrape and parse a job description webpage
 * @access private
 */
interviewRouter.post(
  '/scrape-jd',
  authUser,
  validate(scrapeJdSchema),
  scrapeJobDescriptionController
);

export default interviewRouter;


