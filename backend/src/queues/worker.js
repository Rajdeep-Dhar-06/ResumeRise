import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import { QUEUE_NAME } from './queue.js';
import axios from 'axios';
import InterviewReportModel from '../models/interview_report.model.js';
import logger from '../utils/logger.js';

export const interviewWorker = new Worker(QUEUE_NAME, async (job) => {
  const { userId, profileHash, jobDescriptionUrl, days, candidateProfile } = job.data;

  logger.info({ jobId: job.id, userId }, 'Processing interview report generation');

  let aiResponse;
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/analyze';
    aiResponse = await axios.post(aiServiceUrl, {
      candidate_profile: candidateProfile,
      jd_url: jobDescriptionUrl.trim(),
      days_limit: days
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000 // 2 minutes
    });
  } catch (error) {
    const detail = error.response?.data?.detail || error.response?.data || error.message;
    logger.error({ detail }, 'Error calling AI service');
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
