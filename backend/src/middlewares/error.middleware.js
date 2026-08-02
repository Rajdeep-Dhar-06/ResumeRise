import BaseError, { ConflictError, UnauthorizedError, BadRequestError } from '../utils/error_handler.js';
import { ZodError } from 'zod';
import logger from '../utils/logger.js';

const normalizeError = (err) => {
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    return new ConflictError(`Duplicate entry: User with this ${field} already exists.`);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Invalid or expired token. Please log in again.');
  }

  if (err instanceof ZodError) {
    return new BadRequestError('Validation failed. Please try again.');
  }

  return null;
};

export const errorMiddleware = (err, req, res, next) => {
  const error = err instanceof BaseError ? err : (normalizeError(err) || Object.assign(err, { statusCode: 500, isOperational: false }));

  let clientErrorMessage = error.message;

  if (!error.isOperational) {
    clientErrorMessage = 'An unexpected error occurred. Please try again later.';
  }

  const response = {
    error: clientErrorMessage || 'Internal Server Error',
    ...(error.details && { details: error.details }),
  };

  // Stack traces intentionally omitted to prevent leakage of backend implementation details

  if (error.isOperational) {
    logger.warn({ statusCode: error.statusCode, name: error.name }, `Operational error handled: ${error.message}`);
  } else {
    logger.error({ err: error }, 'Unhandled system error occurred');
  }

  res.status(error.statusCode || 500).json(response);
};