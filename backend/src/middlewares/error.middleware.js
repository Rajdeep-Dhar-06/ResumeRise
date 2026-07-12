import BaseError from '../utils/error_handler.js';
import { normalizeError } from '../utils/error_normaliser.js';
import logger from '../utils/logger.js';

const wrapUnknown = (err) => Object.assign(err, { statusCode: 500, isOperational: false });

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