import 'dotenv/config';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';
import mongoose from 'mongoose';
import { redisClient } from './config/redis.js';
import { reportWorker } from './workers/report.worker.js';
import { reportQueue } from './queues/report.queue.js';

connectDB()
  .then(() => {
    logger.info('Worker process started and connected to DB.');

    const shutdown = async (signal) => {
      try {
        await reportWorker.close();
        // await reportQueue.obliterate({ force: true });
        await redisClient.quit();
        await mongoose.connection.close();
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Worker shutdown error');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    logger.fatal({ err }, 'Worker startup failed. Shutting down application.');
    process.exit(1);
  });
