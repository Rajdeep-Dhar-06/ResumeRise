import { generateResumePdf } from '../services/resume.service.js';
import { fetchOrCreateJobDescription } from '../services/scraping.service.js';
import InterviewReportModel from '../models/interview_report.model.js';
import { runInterviewReportPipeline } from '../pipelines/interview_report.pipeline.js';
import { asyncHandler } from '../utils/async_handler.js';
import { BadRequestError, NotFoundError } from '../utils/error_handler.js';

/**
 * @description Controller to generate an interview report
 */
const generateInterviewReportController = asyncHandler(async (req, res) => {
  const resumeFile = req.file;
  if (!resumeFile) {
    throw new BadRequestError('Resume PDF file is required.');
  }

  let { selfDescription, jobDescription, jobDescriptionUrl, scrapedSkills, scrapedRequirements } = req.body;

  // If sent via multipart form data, these fields could be stringified JSON arrays.
  if (typeof scrapedSkills === 'string') {
    try {
      scrapedSkills = JSON.parse(scrapedSkills);
    } catch (e) {
      scrapedSkills = [];
    }
  }
  if (typeof scrapedRequirements === 'string') {
    try {
      scrapedRequirements = JSON.parse(scrapedRequirements);
    } catch (e) {
      scrapedRequirements = [];
    }
  }

  const pipelineContext = await runInterviewReportPipeline({
    userId: req.user.id,
    resumeFileBuffer: resumeFile.buffer,
    resumeFileName: resumeFile.originalname,
    selfDescription,
    jobDescriptionUrl,
    scrapedSkills,
    scrapedRequirements,
  });

  res.status(201).json({
    message: 'Interview Report Generated Successfully!',
    interviewReport: pipelineContext.savedReport,
  });
});

/**
 * @description Controller to get an interview report by ID
 */
const getInterviewReportByIdController = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const interviewReport = await InterviewReportModel.findOne({
    _id: interviewId,
    user: req.user.id,
  }).populate('jobDescription');

  if (!interviewReport) {
    throw new NotFoundError('Interview report not found');
  }

  res.status(200).json({
    message: 'Interview report fetched successfully',
    interviewReport,
  });
});

/**
 * @description Controller to get all interview reports for a user
 */
const getAllInterviewReportsController = asyncHandler(async (req, res) => {
  const interviewReports = await InterviewReportModel.find({
    user: req.user.id,
  })
    .sort({ createdAt: -1 })
    .select(
      '-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan'
    );

  res.status(200).json({
    message: 'Interview reports fetched successfully',
    interviewReports,
  });
});

/**
 * @description Controller to generate resume pdf
 */
const generateResumePdfController = asyncHandler(async (req, res) => {
  const { interviewReportId } = req.params;

  const interviewReport = await InterviewReportModel.findOne({
    _id: interviewReportId,
    user: req.user.id,
  }).populate('jobDescription');

  if (!interviewReport) {
    throw new NotFoundError('Interview report not found');
  }

  const pdfBuffer = await generateResumePdf({
    resume: interviewReport.resume,
    selfDescription: interviewReport.selfDescription,
    jobDescription: interviewReport.jobDescription.rawText,
  });

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="resume-${interviewReportId}.pdf"`,
  });

  res.send(pdfBuffer);
});

/**
 * @description Controller to scrape a job description from a URL and structure it
 */
const scrapeJobDescriptionController = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    throw new BadRequestError('URL is required.');
  }

  const job = await fetchOrCreateJobDescription(url);

  res.status(200).json({
    message: 'Job description scraped and structured successfully!',
    data: {
      title: job.role,
      jobDescription: job.rawText,
      skills: job.skills,
      requirements: job.requirements,
    },
  });
});

export {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
  scrapeJobDescriptionController,
};
