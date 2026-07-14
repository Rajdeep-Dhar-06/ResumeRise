import BaseError from '../utils/error_handler.js';
import { normalizeError } from '../utils/error_normaliser.js';
import logger from '../utils/logger.js';

/**
 * Wraps an untyped or unexpected error object with default internal server error status and metadata.
 * 
 * @param {Error} err - Raw error object to wrap
 * @returns {Error & {statusCode: number, isOperational: boolean}} Wrapped error object
 */
const wrapUnknown = (err) => Object.assign(err, { statusCode: 500, isOperational: false });

/**
 * Centralized Express error-handling middleware.
 * Normalizes all database, validation, or generic system errors, logs them appropriately,
 * and responds to the client with structured error information (including stack traces in non-production environments).
 * 
 * @type {import('express').ErrorRequestHandler}
 */
export const errorMiddleware = (err, req, res, next) => {
  const error = err instanceof BaseError ? err : (normalizeError(err) || wrapUnknown(err));
  const response = {
    error: error.message || 'Internal Server Error',
    ...(error.details && { details: error.details }),
  };
  if (process.env.NODE_ENV !== 'production') response.stack = error.stack;

  if (error.isOperational) {
    if (error.statusCode !== 401) {
      logger.warn({ statusCode: error.statusCode, name: error.name }, `Operational error handled: ${error.message}`);
    }
  } else {
    logger.error({ err: error }, 'Unhandled system error occurred');
  }

  res.status(error.statusCode || 500).json(response);
};

export default errorMiddleware;