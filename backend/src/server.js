import 'dotenv/config';
import { connectDB } from './config/db.js';
import app from './app.js';
import errorMiddleware from './middlewares/error.middleware.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    // Fallback error handler before app.listen(...)
    app.use(errorMiddleware);
    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.fatal({ err }, 'Database connection failed. Shutting down application.');
  });
