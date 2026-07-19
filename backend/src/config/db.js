import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Establishes a connection to the MongoDB database.
 * 
 * - Uses the MONGO_URI environment variable.
 * - Logs successful connection or throws on failure.
 * 
 * @throws {Error} If connection fails
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`Database connection established successfully with host: ${conn.connection.host}`);
  } catch (error) {
    logger.fatal({ err: error }, `Database connection failed: ${error.message}`);
    throw error;
  }
};
