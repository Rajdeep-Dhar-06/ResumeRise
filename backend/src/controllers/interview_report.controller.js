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

/**
 * @description Controller to upload, parse and anonymize a candidate's resume PDF
 */
const parseResumeController = asyncHandler(async (req, res) => {
  const resumeFile = req.file;
  if (!resumeFile) {
    throw new BadRequestError('Resume PDF file is required.');
  }

  // 1. Compute SHA256 content hash of the PDF buffer
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
    const anonymizedText = anonymizeResume(parsedText);

    // 5. Create new Resume document
    resumeDoc = await resumeModel.create({
      user: req.user.id,
      fileName: resumeFile.originalname,
      contentHash,
      resumeContent: anonymizedText,
    });
  }

  res.status(200).json({
    message: 'Resume parsed and anonymized successfully!',
    resumeId: resumeDoc._id,
    fileName: resumeDoc.fileName,
  });
});

/**
 * @description Controller to scrape, parse and structure a job description from a URL using LangChain and LLM
 */
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
    let details = { companyName: 'Company', role: 'Job Description', skills: [], requirements: [] };
    try {
      const prompt = getScrapeJobDescriptionPrompt({ rawText: cleanedText });
      const structuredLlm = getStructuredModel(jobDescriptionSchema);
      details = await structuredLlm.invoke(prompt);
    } catch (err) {
      console.error('[Controller] Gemini extraction failed on parsed text:', err);
      throw new BadRequestError(`Failed to extract structured details from scraped content: ${err.message}`);
    }

    if ((!details.skills || details.skills.length === 0) && (!details.requirements || details.requirements.length === 0)) {
      throw new BadRequestError('Could not extract any skills or requirements from this job posting. Please try a different URL containing a detailed job description.');
    }

    // 4. Save the structured job description to the database (without raw webpage text)
    jobDoc = await JobDescriptionModel.create({
      url: cleanedUrl,
      companyName: details.companyName || 'Company',
      role: details.role || 'Job Description',
      skills: details.skills || [],
      requirements: details.requirements || [],
    });
  }

  res.status(200).json({
    message: 'Job description parsed successfully!',
    jobDescriptionId: jobDoc._id,
    companyName: jobDoc.companyName,
    role: jobDoc.role,
    skills: jobDoc.skills || [],
    requirements: jobDoc.requirements || [],
  });
});

/**
 * @description Controller to generate an interview report from pre-parsed resume and JD
 */
const generateInterviewReportController = asyncHandler(async (req, res) => {
  const { resumeId, jobDescriptionId } = req.body;
  if (!resumeId || !jobDescriptionId) {
    throw new BadRequestError('Both resumeId and jobDescriptionId are required.');
  }

  // 1. Fetch matching documents from MongoDB
  const resumeDoc = await resumeModel.findOne({ _id: resumeId, user: req.user.id });
  if (!resumeDoc) {
    throw new NotFoundError('Resume record not found.');
  }

  const jobDoc = await JobDescriptionModel.findById(jobDescriptionId);
  if (!jobDoc) {
    throw new NotFoundError('Job Description record not found.');
  }

  // 2. Compile a structured job description summary text from the saved skills and requirements
  const jobDescriptionText = `Role: ${jobDoc.role || 'Job Description'}.
Skills:
${(jobDoc.skills || []).map(s => `- ${s.term} (${s.priority}): ${s.context}`).join('\n')}
Requirements:
${(jobDoc.requirements || []).map(r => `- ${r.term} (${r.priority}): ${r.context}`).join('\n')}`;

  const threadId = `${req.user.id}_${Date.now()}`;

  // 3. Invoke the LangGraph starting at startAgent
  const graphState = await runInterviewReportGraph({
    userId: req.user.id,
    resumeId: resumeDoc._id,
    resumeText: resumeDoc.resumeContent,
    jobDescriptionId: jobDoc._id,
    jobDescriptionText,
    jobDescriptionSkills: jobDoc.skills || [],
    jobDescriptionRequirements: jobDoc.requirements || [],
    jobDescriptionUrl: jobDoc.url,
    jobDescriptionCompany: jobDoc.companyName || 'Company',
    jobDescriptionRole: jobDoc.role || 'Role',
  }, threadId);

  res.status(201).json({
    message: 'Interview Report Generated Successfully!',
    interviewReport: graphState.savedReport,
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
      '-resume -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan'
    );

  res.status(200).json({
    message: 'Interview reports fetched successfully',
    interviewReports,
  });
});

/**
 * @description Controller to delete an interview report by ID
 */
const deleteInterviewReportController = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const deletedReport = await InterviewReportModel.findOneAndDelete({
    _id: interviewId,
    user: req.user.id,
  });

  if (!deletedReport) {
    throw new NotFoundError('Interview report not found');
  }

  res.status(200).json({
    message: 'Interview report deleted successfully',
    deletedReport,
  });
});

export {
  parseResumeController,
  parseJobDescriptionController,
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  deleteInterviewReportController,
};

