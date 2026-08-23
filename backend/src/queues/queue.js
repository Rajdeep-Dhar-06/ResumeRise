import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.js';

export const QUEUE_NAME = 'interview-reports';

// Create the Queue instance
export const interviewQueue = new Queue(QUEUE_NAME, {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600, // keep for 24 hours
      count: 1000
    },
    removeOnFail: {
      age: 24 * 3600, // keep for 24 hours
      count: 1000
    },
  },
});
