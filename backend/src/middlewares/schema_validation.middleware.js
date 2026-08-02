/**
 * Reusable Express middleware to validate request data against a Zod schema and return parsed data.
 * Supports validating req.body, req.query, or req.params.
 *
 * @param {object} schemas - An object containing Zod schemas (body, query, params)
 */
export const validate = (schemas) => (req, res, next) => {
  if (schemas.body) req.body = schemas.body.parse(req.body);
  if (schemas.query) req.query = schemas.query.parse(req.query);
  if (schemas.params) req.params = schemas.params.parse(req.params);
  if (schemas.file) req.file = schemas.file.parse(req.file);
  next();
};