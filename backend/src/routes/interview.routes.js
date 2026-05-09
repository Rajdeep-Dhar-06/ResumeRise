import express from 'express';
import authUser from '../middlewares/auth.middleware.js';
import {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController
} from '../controllers/interview.controller.js';
import upload from '../middlewares/file.middleware.js';

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description Generate an interview report for a candidate
 * @access private
 */
interviewRouter.post(
  '/',
  authUser,
  upload.single('resume'),
  generateInterviewReportController
);

/**
 * @route POST /api/interview/report/:interviewId
 * @description Get interview report by ID
 * @access private
 */
interviewRouter.get(
  '/report/:interviewId',
  authUser,
  getInterviewReportByIdController
);

/**
 * @route POST /api/interview/
 * @description Get all interview reports for a user
 * @access private
 */
interviewRouter.get('/', authUser, getAllInterviewReportsController);

/**
 * @route GET /api/interview/resume/pdf
 * @description Generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authUser, generateResumePdfController)

export default interviewRouter;
