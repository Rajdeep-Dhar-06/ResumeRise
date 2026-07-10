import mongoose from 'mongoose';
import InterviewReportModel from '../models/interview_report.model.js';
import resumeModel from '../models/resume.model.js';
import JobDescriptionModel from '../models/job_description.model.js';
import { runInterviewReportGraph } from '../langgraph/interview_report.graph.js';
import { asyncHandler } from '../utils/async_handler.js';
import { BadRequestError, NotFoundError } from '../utils/error_handler.js';
import { anonymizeResume } from '../utils/anonymizer.js';
import { compactText } from '../utils/text_compact.js';
import { createHash } from 'crypto';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import axios from 'axios';
import { getStructuredModel } from '../nodes/graph_nodes.js';
import { jobDescriptionSchema } from '../schemas/job_description.schema.js';
import { getScrapeJobDescriptionPrompt } from '../prompts/prompts.js';

/** @description Controller to upload, parse and anonymize a candidate's resume PDF */
const parseResumeController = asyncHandler(async (req, res) => {
  const resumeFile = req.file;
  if (!resumeFile) {
    throw new BadRequestError('Resume PDF file is required.');
  }

  // 1. Compute SHA256 content hash of the PDF buffer, buffer -> binary data
  const contentHash = createHash('sha256').update(resumeFile.buffer).digest('hex');

  // 2. Check if this exact file has already been parsed for this user
  let resumeDoc = await resumeModel.findOne({
    user: req.user.id,
    contentHash,
  });

  if (resumeDoc) {
    console.log('[Controller] Retrieving cached parsed resume by content hash.');
  } else {
    console.log('[Controller] Parsing PDF and anonymizing resume content...');

    // 3. Load text from PDF buffer
    let parsedText = '';
    try {
      const blob = new Blob([resumeFile.buffer]);
      const loader = new PDFLoader(blob);
      const docs = await loader.load();
      parsedText = docs.map((doc) => doc.pageContent).join('\n');

      const RESUME_NOISE = [
        /references available (on|upon) request/i,
        /\b(hobbies|interests|objective)\b.*$/im
      ];
      parsedText = compactText(parsedText, { extraNoise: RESUME_NOISE, maxLines: 120 });
    } catch (err) {
      throw new BadRequestError(`Failed to parse the uploaded resume PDF: ${err.message}`);
    }

    if (!parsedText) {
      throw new BadRequestError('The uploaded resume PDF does not contain any extractable text.');
    }

    // 4. Anonymize personal details (Names, Contacts, Locations, Schools)
    const resumeContent = anonymizeResume(parsedText);

    // 5. Create new Resume document
    resumeDoc = await resumeModel.create({
      user: req.user.id,
      contentHash,
      resumeContent,
    });
  }

  res.status(200).json({
    message: 'Resume parsed and anonymized successfully!',
    resumeId: resumeDoc._id,
  });
});


/** @description Controller to scrape, parse and structure a job description from a URL using LangChain and LLM */
const parseJobDescriptionController = asyncHandler(async (req, res) => {
  const { jobDescriptionUrl } = req.body;
  if (!jobDescriptionUrl) {
    throw new BadRequestError('Job description URL is required.');
  }

  const cleanedUrl = jobDescriptionUrl.trim();

  // 1. Check if the job description is already cached globally in the database
  let jobDoc = await JobDescriptionModel.findOne({ url: cleanedUrl });

  if (jobDoc) {
    console.log('[Controller] Job description found in cache database.');
  } else {
    console.log('[Controller] Scraping job webpage and extracting skills/requirements...');

    // 2. Load webpage via Jina Reader API (handles dynamic rendering in cloud)
    let cleanedText = '';
    try {
      const jinaUrl = `https://r.jina.ai/${cleanedUrl}`;
      const headers = {};

      if (process.env.JINA_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
      }

      console.log(`[Controller] Scraping job description via Jina Reader: ${cleanedUrl}...`);
      const response = await axios.get(jinaUrl, { headers, timeout: 20000 });
      cleanedText = response.data || '';
    } catch (err) {
      console.error('[Controller] Jina Reader scraping failed:', err.message);
      throw new BadRequestError(`Failed to load or scrape the job URL : ${err.message}`);
    }

    if (!cleanedText || cleanedText.length < 50) {
      throw new BadRequestError('No sufficient text content could be extracted from this URL.');
    }

    // 3. Extract title, description, skills, and requirements using Gemini
    let details = { companyName: 'Company', role: 'Job Description', technicalRequirements: [], nonTechnicalRequirements: [] };
    try {
      const prompt = getScrapeJobDescriptionPrompt({ rawText: cleanedText });
      const structuredLlm = getStructuredModel(jobDescriptionSchema);
      details = await structuredLlm.invoke(prompt);
    } catch (err) {
      console.error('[Controller] Gemini extraction failed on parsed text:', err);
      throw new BadRequestError(`Failed to extract structured details from scraped content: ${err.message}`);
    }

    if ((!details.technicalRequirements || details.technicalRequirements.length === 0) && (!details.nonTechnicalRequirements || details.nonTechnicalRequirements.length === 0)) {
      throw new BadRequestError('Could not extract any skills or requirements from this job posting. Please try a different URL containing a detailed job description.');
    }

    // 4. Save the structured job description to the database (without raw webpage text)
    jobDoc = await JobDescriptionModel.create({
      url: cleanedUrl,
      companyName: details.companyName || 'Company',
      role: details.role || 'Job Description',
      technicalRequirements: details.technicalRequirements || [],
      nonTechnicalRequirements: details.nonTechnicalRequirements || [],
    });
  }

  res.status(200).json({
    message: 'Job description parsed successfully!',
    jobDescriptionId: jobDoc._id,
    companyName: jobDoc.companyName,
    role: jobDoc.role,
    technicalRequirements: jobDoc.technicalRequirements || [],
    nonTechnicalRequirements: jobDoc.nonTechnicalRequirements || [],
  });
});

/** @description Controller to generate an interview report from pre-parsed resume and JD */
const generateInterviewReportController = asyncHandler(async (req, res) => {
  const { jobDescriptionUrl, daysLimit } = req.body;
  const resumeFile = req.file;

  if (!resumeFile) {
    throw new BadRequestError('Resume PDF file is required.');
  }
  if (!jobDescriptionUrl) {
    throw new BadRequestError('Job description URL is required.');
  }

  // Calculate daysLimit based on user selection or default to 7 days
  let calculatedDaysLimit = 7; // Default fallback is 7 days
  if (daysLimit) {
    const parsed = parseInt(daysLimit, 10);
    if ([3, 5, 7].includes(parsed)) {
      calculatedDaysLimit = parsed;
    }
  }

  // Invoke the LangGraph starting at startAgent
  const graphState = await runInterviewReportGraph({
    userId: req.user.id,
    resumeBuffer: resumeFile.buffer,
    jobDescriptionUrl,
    daysLimit: calculatedDaysLimit,
  });

  res.status(201).json({
    message: 'Interview Report Generated Successfully!',
    interviewReport: graphState.savedReport,
  });
});

/** @description Controller to get an interview report by ID */
const getInterviewReportByIdController = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const interviewReport = await InterviewReportModel.findOne({
    _id: interviewId,
    userId: req.user.id,
  }).populate('jobDescriptionId');

  if (!interviewReport) {
    throw new NotFoundError('Interview report not found');
  }

  res.status(200).json({
    message: 'Interview report fetched successfully',
    interviewReport,
  });
});

/** @description Controller to get all interview reports for a user */
const getAllInterviewReportsController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 9;
  const search = req.query.search ? req.query.search.trim() : "";
  const minScore = parseInt(req.query.minScore, 10) || 0;

  const skip = (page - 1) * limit;
  const query = { userId: req.user.id };

  if (minScore > 0) {
    query.matchScore = { $gte: minScore };
  }

  if (search) {
    const matchingJobs = await JobDescriptionModel.find({
      $or: [
        { companyName: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');

    const matchingJobIds = matchingJobs.map(job => job._id);

    query.$or = [
      { reportTitle: { $regex: search, $options: 'i' } },
      { jobDescriptionId: { $in: matchingJobIds } }
    ];
  }

  const totalCount = await InterviewReportModel.countDocuments(query);
  const interviewReports = await InterviewReportModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('jobDescriptionId', 'companyName role url') // Fetch company info
    .select('reportTitle matchScore createdAt');

  res.status(200).json({
    message: 'Interview reports fetched successfully',
    pagination: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    },
    interviewReports,
  });

});

export const getInterviewStatsController = asyncHandler(async (req, res) => {
  const defaultStats = {
    totalPlans: 0,
    averageMatch: 0,
    bestMatch: 0,
  };

  const stats = await InterviewReportModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: null,
        totalPlans: { $sum: 1 },
        averageMatch: { $avg: '$matchScore' },
        bestMatch: { $max: '$matchScore' },
      },
    },
  ]);

  res.status(200).json({
    message: 'Stats retrieved successfully',
    stats: stats[0]
      ? {
        totalPlans: stats[0].totalPlans,
        averageMatch: Math.round(stats[0].averageMatch),
        bestMatch: stats[0].bestMatch,
      }
      : defaultStats,
  });
});


/** @description Controller to delete an interview report by ID */
const deleteInterviewReportController = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const deletedReport = await InterviewReportModel.findOneAndDelete({
    _id: interviewId,
    userId: req.user.id,
  });

  if (!deletedReport) {
    throw new NotFoundError('Interview report not found');
  }

  res.status(200).json({
    message: 'Interview report deleted successfully',
    deletedReport,
  });
});

/** @description Check if an interview report with this resume and job posting combination already exists. */
export const checkDuplicateInterviewPlanController = asyncHandler(async (req, res) => {
  const { resumeHash, jobDescriptionUrl, daysLimit } = req.body;

  if (!resumeHash || !jobDescriptionUrl) {
    throw new BadRequestError('resumeHash and jobDescriptionUrl are required.');
  }

  let calculatedDaysLimit = 7;
  if (daysLimit) {
    const parsed = parseInt(daysLimit, 10);
    if ([3, 5, 7].includes(parsed)) {
      calculatedDaysLimit = parsed;
    }
  }

  // Optimize: single DB query to find existing report using compound index!
  const existingReport = await InterviewReportModel.findOne({
    userId: req.user.id,
    resumeHash,
    jobDescriptionUrl: jobDescriptionUrl.trim(),
    daysLimit: calculatedDaysLimit
  });

  if (existingReport) {
    return res.status(200).json({
      exists: true,
      reportId: existingReport._id,
      interviewReport: existingReport
    });
  }

  res.status(200).json({ exists: false });
});

export {
  parseResumeController,
  parseJobDescriptionController,
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  deleteInterviewReportController,
};

