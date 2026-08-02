import 'dotenv/config'; 
import { connectDB } from './config/db.js';

import app from './app.js';
import logger from './utils/logger.js';

import mongoose from 'mongoose';
import { redisClient } from './config/redis.js';

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      server.close(async () => {
        try {
          await redisClient.quit();
          await mongoose.connection.close();
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Server shutdown error');
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    logger.fatal({ err }, 'Startup failed. Shutting down application.');
    process.exit(1);
  });
