class BaseError extends Error {
    constructor(name, statusCode, isOperational, description, details = null) {
        super(description);
        this.name = name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends BaseError {
    constructor(description = 'Bad Request', details = null) {
        super('BadRequestError', 400, true, description, details);
    }
}
export class UnauthorizedError extends BaseError {
    constructor(description = 'Unauthorized', details = null) {
        super('UnauthorizedError', 401, true, description, details);
    }
}
export class ForbiddenError extends BaseError {
    constructor(description = 'Forbidden', details = null) {
        super('ForbiddenError', 403, true, description, details);
    }
}
export class NotFoundError extends BaseError {
    constructor(description = 'Not Found', details = null) {
        super('NotFoundError', 404, true, description, details);
    }
}
export class ConflictError extends BaseError {
    constructor(description = 'Conflict', details = null) {
        super('ConflictError', 409, true, description, details);
    }
}
export default BaseError;