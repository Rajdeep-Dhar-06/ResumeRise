import { Queue } from 'bullmq';
import logger from '../utils/logger.js';
import { redisClient } from '../config/redis.js';

export const reportQueue = new Queue('report-generation', { 
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 60 * 60,
      count: 1000, 
    },
    removeOnFail: false,
  }
});

reportQueue.on('error', (err) => {
  logger.error({ err }, 'BullMQ Queue Error');
});
