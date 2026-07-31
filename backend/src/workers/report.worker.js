import { Worker } from 'bullmq';
import { runInterviewReportPipeline } from '../pipeline.js/report_pipeline.js';
import logger from '../utils/logger.js';
import { redisClient } from '../config/redis.js';

/**
 * Process a single report generation job from BullMQ queue.
 */
export async function processReportJob(job) {
  logger.info({ jobId: job.id, userId: job.data.userId }, 'Started processing report generation job');

  const { resumeBufferBase64, ...restData } = job.data;
  const resumeBuffer = Buffer.from(resumeBufferBase64, 'base64');

  // Run the report pipeline
  const state = await runInterviewReportPipeline({
    ...restData,
    resumeBuffer,
  });

  // Invalidate stats cache
  try {
    await redisClient.del(`stats:${job.data.userId}`);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to invalidate stats cache after report generation');
  }

  // Return the final report ID so the polling endpoint can fetch it
  return { reportId: state.savedReport._id };
}

export const reportWorker = new Worker(
  'report-generation',
  processReportJob,
  {
    connection: redisClient.duplicate(),
    concurrency: 5,
  }
);

reportWorker.on('completed', (job, returnvalue) => {
  logger.info({ jobId: job.id, reportId: returnvalue.reportId }, 'Report generation job completed');
});

reportWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, err: err.message }, 'Report generation job failed');
});