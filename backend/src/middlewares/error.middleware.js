import BaseError from '../utils/errorHandler.js';

/**
 * Centered error handling middleware for Express.
 * Catches all unhandled errors, formats them, and sends JSON response.
 */
export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Map database, auth, and other common errors to appropriate HTTP status codes
  if (!(error instanceof BaseError) && !error.statusCode) {
    let statusCode = 500;
    let message = error.message || 'Internal Server Error';
    let details = null;

    // Handle Mongoose Validation Error
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      details = Object.values(error.errors).map((el) => ({
        field: el.path,
        message: el.message,
      }));
    }
    // Handle Mongoose Cast Error (e.g. invalid ObjectId)
    else if (error.name === 'CastError') {
      statusCode = 400;
      message = `Invalid ${error.path}: ${error.value}`;
    }
    // Handle MongoDB Duplicate Key Error (code 11000)
    else if (error.code === 11000) {
      statusCode = 409;
      const keys = error.keyValue ? Object.keys(error.keyValue) : [];
      const field = keys.length > 0 ? keys[0] : 'field';
      message = `Duplicate entry: User with this ${field} already exists.`;
    }
    // Handle JWT Errors
    else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token. Please log in again.';
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Your session has expired. Please log in again.';
    }

    // Standardize error info
    error = {
      statusCode,
      message,
      details,
      stack: error.stack,
    };
  }

  const statusCode = error.statusCode || 500;
  const response = {
    error: error.message || 'Internal Server Error',
    ...(error.details && { details: error.details }),
  };

  // Include stack trace in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
    console.error(`[API Error Log] Status: ${statusCode} | Message: ${error.message}\n`, error.stack || '');
  } else {
    // In production, log internal server errors for alerting
    if (statusCode === 500) {
      console.error('[Production Internal Server Error]:', error);
    }
  }

  res.status(statusCode).json(response);
};

export default errorMiddleware;
