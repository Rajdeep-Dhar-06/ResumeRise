import 'dotenv/config';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import app from './app.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 8000;

Promise.all([connectDB(), connectRedis()])
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.fatal({ err }, 'Startup failed. Shutting down application.');
    process.exit(1);
  });
