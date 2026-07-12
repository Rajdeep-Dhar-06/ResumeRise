import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`Database connection established successfully with host: ${conn.connection.host}`);
  } catch (error) {
    logger.fatal({ err: error }, `Database connection failed: ${error.message}`);
    process.exit(1);
  }
};
