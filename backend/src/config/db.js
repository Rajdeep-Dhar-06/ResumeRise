import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Establishes a connection to the MongoDB database using the MONGO_URI environment variable.
 * Logs successful connection or handles connection errors by terminating the process.
 * 
 * @async
 * @function connectDB
 * @throws {Error} If connection fails and process exits
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`Database connection established successfully with host: ${conn.connection.host}`);
  } catch (error) {
    logger.fatal({ err: error }, `Database connection failed: ${error.message}`);
    process.exit(1);
  }
};
