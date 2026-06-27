import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import { generateInterviewReport, matchTermsAgainstResume } from '../services/report.service.js';
import { fetchOrCreateJobDescription } from '../services/scraping.service.js';
import InterviewReportModel from '../models/interviewReport.model.js';
import resumeModel from '../models/resume.model.js';
import { BadRequestError } from '../utils/errorHandler.js';
import { compactText } from '../utils/textCompact.js';

// Parse and save resume to DB or reuse if existing.
export async function parseAndSaveResumeStep(ctx) {
  // If no file buffer, default to empty values
  if (!ctx.resumeFileBuffer) {
    ctx.resumeText = '';
    ctx.resumeId = null;
    return ctx;
  }

  // Check if saved resume exists with same name
  let resumeDoc = await resumeModel.findOne({
    user: ctx.userId,
    fileName: ctx.resumeFileName,
  });

  if (resumeDoc) {
    console.log(`[Pipeline] Found existing resume for file name: "${ctx.resumeFileName}". Reusing existing document.`);
  } else {
    // Parse PDF resume buffer
    let parsedText = '';
    try {
      const parsedPdf = await new pdfParse.PDFParse(
        Uint8Array.from(ctx.resumeFileBuffer)
      ).getText();
      parsedText = parsedPdf.text;
      const RESUME_NOISE = [/references available (on|upon) request/i, /\b(hobbies|interests|objective)\b.*$/im];
      parsedText = compactText(parsedText, { extraNoise: RESUME_NOISE, maxLines: 120 });
    } catch (err) {
      throw new BadRequestError(`Failed to parse the uploaded resume PDF: ${err.message}`);
    }

    if (!parsedText) {
      throw new BadRequestError('The uploaded resume PDF does not contain any extractable text. Please upload a text-based, copy-pasteable PDF resume.');
    }

    // Save new resume document
    resumeDoc = await resumeModel.create({
      user: ctx.userId,
      fileName: ctx.resumeFileName,
      rawText: parsedText,
    });
  }

  // Store resume document details in context
  ctx.resumeText = resumeDoc.rawText;
  ctx.resumeId = resumeDoc._id;

  return ctx;
}

// Get cached job description or scrape/save it.
export async function fetchOrScrapeJobDescriptionStep(ctx) {
  if (ctx.jobDescriptionUrl) {
    const url = ctx.jobDescriptionUrl;
    const jobDoc = await fetchOrCreateJobDescription(url);

    ctx.jobDescriptionId = jobDoc._id;
    ctx.jobDescriptionText = jobDoc.rawText;
    ctx.jobDescriptionSkills = jobDoc.skills || [];
    ctx.jobDescriptionRequirements = jobDoc.requirements || [];
  }

  return ctx;
}

// Run AI analysis to generate report content.
export async function generateAiAnalysisStep(ctx) {
  // Match resume against requirements if text is available
  if (ctx.resumeText) {
    const skillObjects = ctx.jobDescriptionSkills;   // [{ term, priority }]
    const reqObjects = ctx.jobDescriptionRequirements; // [{ term, priority }]

    if (skillObjects.length > 0 || reqObjects.length > 0) {
      console.log('[Pipeline] Matching job terms against candidate resume...');
      try {
        const matchResult = await matchTermsAgainstResume(ctx.resumeText, skillObjects, reqObjects);
        ctx.matchedSkills = matchResult.scrapedSkills || [];
        ctx.matchedRequirements = matchResult.scrapedRequirements || [];
      } catch (err) {
        console.error('[Pipeline] Error matching terms against resume:', err);
        ctx.matchedSkills = skillObjects.map(s => ({ term: s.term, status: 'MISSING', evidence: 'Matching failed', verdict: 'Matching failed', complexity: 'N/A' }));
        ctx.matchedRequirements = reqObjects.map(r => ({ term: r.term, status: 'MISSING', evidence: 'Matching failed', verdict: 'Matching failed', complexity: 'N/A' }));
      }

      // Merge priority from original JD terms onto audit results
      const skillPriorityMap = Object.fromEntries(skillObjects.map(s => [s.term, s.priority || 'REQUIRED']));
      const reqPriorityMap = Object.fromEntries(reqObjects.map(r => [r.term, r.priority || 'REQUIRED']));

      ctx.matchedSkills = ctx.matchedSkills.map(s => ({
        ...s,
        priority: skillPriorityMap[s.term] || 'REQUIRED',
      }));
      ctx.matchedRequirements = ctx.matchedRequirements.map(r => ({
        ...r,
        priority: reqPriorityMap[r.term] || 'REQUIRED',
      }));
    } else {
      ctx.matchedSkills = [];
      ctx.matchedRequirements = [];
    }
  } else {
    ctx.matchedSkills = [];
    ctx.matchedRequirements = [];
  }

  console.log('[Pipeline] Generating interview report content using AI service...');

  // Generate report content
  ctx.aiReport = await generateInterviewReport({
    selfDescription: ctx.selfDescription || '',
    jobDescription: ctx.jobDescriptionText,
    matchedSkills: ctx.matchedSkills,
    matchedRequirements: ctx.matchedRequirements,
  });

  // Map to Mongoose schema format
  ctx.matchedSkills = ctx.matchedSkills.map(s => ({
    term: s.term,
    matched: s.status === 'MATCHED',
    reason: `${s.status}: ${s.verdict || ''} (Evidence: ${s.evidence || ''})`,
    matchStrength: s.matchStrength,
  }));

  ctx.matchedRequirements = ctx.matchedRequirements.map(r => ({
    term: r.term,
    matched: r.status === 'MATCHED',
    reason: `${r.status}: ${r.verdict || ''} (Evidence: ${r.evidence || ''})`,
    matchStrength: r.matchStrength,
  }));

  return ctx;
}

// Save interview report to database.
export async function saveInterviewReportStep(ctx) {
  console.log('[Pipeline] Saving final interview report to database...');

  ctx.savedReport = await InterviewReportModel.create({
    user: ctx.userId,
    jobDescription: ctx.jobDescriptionId,
    resume: ctx.resumeId,
    scrapedSkills: ctx.matchedSkills,
    scrapedRequirements: ctx.matchedRequirements,
    title: (ctx.aiReport && ctx.aiReport.title) || 'My Interview Plan',
    matchScore: (ctx.aiReport && ctx.aiReport.matchScore) || 0,
    technicalQuestions: (ctx.aiReport && ctx.aiReport.technicalQuestions) || [],
    behavioralQuestions: (ctx.aiReport && ctx.aiReport.behavioralQuestions) || [],
    skillGaps: (ctx.aiReport && ctx.aiReport.skillGaps) || [],
    preparationPlan: (ctx.aiReport && ctx.aiReport.preparationPlan) || [],
    selfDescription: ctx.selfDescription || '',
  });

  return ctx;
}

// Run a sequence of pipeline steps.
export async function runInterviewReportPipeline(initialContext, steps = [
  parseAndSaveResumeStep,
  fetchOrScrapeJobDescriptionStep,
  generateAiAnalysisStep,
  saveInterviewReportStep
]) {
  console.log('STARTING INTERVIEW REPORT GENERATION PIPELINE');
  let ctx = { ...initialContext };

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`[Stage ${i + 1}/${steps.length}] Running: ${step.name}...`);
    try {
      ctx = await step(ctx);
      console.log(`[Stage ${i + 1}/${steps.length}] ${step.name} completed successfully.`);
    } catch (err) {
      console.error(`[Stage ${i + 1}/${steps.length}] ${step.name} failed!`);
      // Attach the failed step's name to the error so controllers/middlewares can log it properly
      err.stepName = step.name;
      err.message = `Pipeline failed at step [${step.name}]: ${err.message}`;
      throw err;
    }
  }

  console.log('PIPELINE COMPLETED SUCCESSFULLY!');
  return ctx;
}
