import { ZodError } from 'zod';

/**
 * Reusable Express middleware to validate request data against a Zod schema.
 * Supports validating req.body, req.query, or req.params.
 * 
 * @param {object} schemas - An object containing Zod schemas (body, query, params)
 * @returns {import('express').RequestHandler}
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};
