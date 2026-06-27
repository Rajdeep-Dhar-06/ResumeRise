class BaseError extends Error {
    constructor(name, statusCode, isOperational, description, details = null) {
        super(description)

        Object.setPrototypeOf(this, new.target.prototype)
        this.name = name
        this.statusCode = statusCode
        this.isOperational = isOperational
        this.details = details
        Error.captureStackTrace(this)
    }
}

export class BadRequestError extends BaseError {
    constructor(description = 'Bad Request', details = null) {
        super('BadRequestError', 400, true, description, details);
    }
}

export class UnauthorizedError extends BaseError {
    constructor(description = 'Unauthorized') {
        super('UnauthorizedError', 401, true, description);
    }
}

export class ForbiddenError extends BaseError {
    constructor(description = 'Forbidden') {
        super('ForbiddenError', 403, true, description);
    }
}

export class NotFoundError extends BaseError {
    constructor(description = 'Not Found') {
        super('NotFoundError', 404, true, description);
    }
}

export default BaseError;