import { BadRequestError, ConflictError, UnauthorizedError } from './error_handler.js';

const normalizeMongooseValidation = (err) =>
    new BadRequestError(
        'Validation Error',
        Object.values(err.errors).map((el) => ({ field: el.path, message: el.message }))
    );

const normalizeMongooseCast = (err) =>
    new BadRequestError(`Invalid ${err.path}: ${err.value}`);

const normalizeMongoDuplicateKey = (err) => {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    return new ConflictError(`Duplicate entry: User with this ${field} already exists.`);
};

const normalizeJwtError = () => new UnauthorizedError('Invalid token. Please log in again.');
const normalizeJwtExpired = () => new UnauthorizedError('Your session has expired. Please log in again.');

const byName = {
    ValidationError: normalizeMongooseValidation,
    CastError: normalizeMongooseCast,
    JsonWebTokenError: normalizeJwtError,
    TokenExpiredError: normalizeJwtExpired,
};
const byCode = { 11000: normalizeMongoDuplicateKey };

export const normalizeError = (err) => {
    const normalizer = byName[err.name] || byCode[err.code];
    return normalizer ? normalizer(err) : null; // null = truly unrecognized
};