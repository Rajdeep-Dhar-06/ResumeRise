import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { generateInterviewReport, generateResumePdf } from '../services/ai.service.js';
import InterviewReportModel from '../models/interviewReport.model.js';

/**
 * @description Controller to generate an interview report
 */
async function generateInterviewReportController(req, res) {
  const resumeFile = req.file;
  if (!resumeFile) {
    return res.status(400).json({ error: 'Resume PDF file is required.' });
  }
  const { selfDescription, jobDescription } = req.body;
  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required.' });
  }

  const resumeContent = await new pdfParse.PDFParse(
    Uint8Array.from(resumeFile.buffer)
  ).getText();

  try {
    const report = await generateInterviewReport({
      resume: resumeContent.text,
      selfDescription,
      jobDescription,
    });
    // console.log('RAW AI OUTPUT:', report);
    const interviewReport = await InterviewReportModel.create({
      user: req.user.id,
      jobDescription,
      resume: resumeContent.text,
      selfDescription,

      matchScore: report.matchScore,
      technicalQuestions: report.technicalQuestion,
      behavioralQuestions: report.behavioralQuestion,
      skillGaps: report.skillGap,
      preparationPlan: report.preparationPlan,
    });
    res.status(201).json({
      message: 'Interview Report Generated Successfully!',
      interviewReport,
    });
  } catch (error) {
    console.error('Error generating interview report:', error);
    res.status(500).json({ error: 'Failed to generate interview report' });
  }
}

/**
 * @description Controller to get an interview report by ID
 */
async function getInterviewReportByIdController(req, res) {
  const { interviewId } = req.params;
  try {
    const interviewReport = await InterviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });
    if (!interviewReport) {
      return res.status(404).json({ error: 'Interview report not found' });
    }
    res.status(200).json({
      message: 'Interview report fetched successfully',
      interviewReport,
    });
  } catch (error) {
    console.error('Error fetching interview report:', error);
    res.status(500).json({ error: 'Failed to fetch interview report' });
  }
}

/**
 * @description Controller to get all interview reports for a user
 */
async function getAllInterviewReportsController(req, res) {
  try {
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
  } catch (error) {
    console.error('Error fetching interview reports:', error);
    res.status(500).json({ error: 'Failed to fetch interview reports' });
  }
}

async function generateResumePdfController(req, res) {
  const { interviewReportId } = req.params;

  const interviewReport = await InterviewReportModel.findOne({
    _id: interviewReportId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({ error: 'Interview report not found' });
  }

  const pdfBuffer = await generateResumePdf({
    resume: interviewReport.resume,
    selfDescription: interviewReport.selfDescription,
    jobDescription: interviewReport.jobDescription,
  });

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="resume-${interviewReportId}.pdf"`,
  });

  res.send(pdfBuffer);
}

export {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
};
