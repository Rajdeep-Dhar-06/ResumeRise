import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import { QUEUE_NAME } from './queue.js';
import axios from 'axios';
import InterviewReportModel from '../models/interview_report.model.js';
import logger from '../utils/logger.js';

/**
 * BullMQ Background Worker for AI processing.
 * 
 * This worker processes jobs pushed by the `/api/interview/reports` endpoint.
 * We use a background queue instead of waiting synchronously because the Python 
 * AI service can take ~10-20 seconds to generate the full roadmap. If we waited 
 * synchronously, the HTTP request might timeout and crash.
 * 
 * Flow:
 * 1. Takes the job data (which already has the parsed PDF text).
 * 2. POSTs it to the Python AI service.
 * 3. Validates the JSON response schema perfectly matches the MongoDB schema.
 * 4. Saves to MongoDB.
 */
export const interviewWorker = new Worker(QUEUE_NAME, async (job) => {
  const { userId, profileHash, jobDescriptionUrl, days, candidateProfile } = job.data;

  logger.info({ jobId: job.id, userId }, 'Processing interview report generation');

  let aiResponse;
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/analyze';
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info({ attempt, aiServiceUrl }, 'Attempting AI service request');
      aiResponse = await axios.post(aiServiceUrl, {
        candidateProfile: candidateProfile,
        jdUrl: jobDescriptionUrl.trim(),
        daysLimit: days
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000 // 2 minutes
      });
      break; // Success
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const detail = error.response?.data?.detail || error.response?.data || error.message;
      logger.warn({ attempt, status, detail: typeof detail === 'string' ? detail.slice(0, 200) : detail }, 'AI service request failed');
      
      // If service returned 502/503/504 or network error (e.g. cold starting), wait and retry
      if (attempt < maxRetries) {
        const backoffMs = attempt * 8000;
        logger.info(`AI service is likely waking up from cold start. Retrying in ${backoffMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  if (!aiResponse) {
    const detail = lastError?.response?.data?.detail || lastError?.response?.data || lastError?.message;
    logger.error({ detail }, 'All attempts to call AI service failed');
    throw new Error('AI analysis failed. Please try again later.');
  }

  const aiData = aiResponse.data;
  
  // Boundary Validation: ensure AI didn't drop keys
  const requiredKeys = [
    'companyName', 'role', 'matchScore', 'technicalEvaluations', 
    'nonTechnicalEvaluations', 'technicalQuestions', 'nonTechnicalQuestions', 
    'preparationPlan', 'learningResources', 'preparationGaps'
  ];
  for (const key of requiredKeys) {
    if (aiData[key] === undefined) {
      throw new Error(`AI response validation failed: missing field '${key}'`);
    }
  }

  // Save report to MongoDB
  const savedReport = await new InterviewReportModel({
    userId,
    profileHash,
    jobDescriptionUrl: jobDescriptionUrl.trim(),
    daysLimit: days,
    companyName: aiData.companyName,
    role: aiData.role,
    reportTitle: `${aiData.role} at ${aiData.companyName}`,
    matchScore: aiData.matchScore,
    technicalEvaluations: aiData.technicalEvaluations,
    nonTechnicalEvaluations: aiData.nonTechnicalEvaluations,
    technicalQuestions: aiData.technicalQuestions,
    nonTechnicalQuestions: aiData.nonTechnicalQuestions,
    preparationPlan: aiData.preparationPlan,
    learningResources: aiData.learningResources,
    preparationGaps: aiData.preparationGaps,
  }).save();

  logger.info({ jobId: job.id, reportId: savedReport._id }, 'Report generated successfully');
  return { reportId: savedReport._id };
}, {
  connection: redisClient,
  concurrency: 5 // Process up to 5 jobs concurrently
});

interviewWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
});
