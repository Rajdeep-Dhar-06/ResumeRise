import BaseError from '../utils/error_handler.js';
import { normalizeError } from '../utils/error_normaliser.js';

const wrapUnknown = (err) => Object.assign(err, { statusCode: 500, isOperational: false });

export const errorMiddleware = (err, req, res, next) => {
  const error = err instanceof BaseError ? err : (normalizeError(err) || wrapUnknown(err));
  const response = {
    error: error.message || 'Internal Server Error',
    ...(error.details && { details: error.details }),
  };
  if (process.env.NODE_ENV !== 'production') response.stack = error.stack;

  if (error.isOperational) {
    // Expected, handled failure mode — bad input, auth failure, not found.
    console.warn(`[Operational] ${error.statusCode} ${error.name}: ${error.message}`);
  } else {
    // A genuine bug. The app may be in an unknown state.
    console.error('[BUG] Unexpected error:', error.stack || error);
    // Classic Node practice: for non-operational errors, some teams
    // deliberately let PM2/Kubernetes restart the process after logging,
    // rather than keep serving on possibly-corrupted state. Worth a
    // conscious decision, not silence.
  }

  res.status(error.statusCode || 500).json(response);
};

export default errorMiddleware;