import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
import { UnauthorizedError, ForbiddenError } from '../utils/error_handler.js';
import { asyncHandler } from '../utils/async_handler.js';

/**
 * Authentication middleware that verifies JWT access tokens from the Authorization header.
 * Extracts the Bearer token, validates it using the secret key, verifies user existence
 * and session state in the database, and attaches decoded credentials payload to req.user.
 * 
 * @type {import('express').RequestHandler}
 * @throws {UnauthorizedError} If Authorization header is missing, invalid, or the user is logged out.
 * @throws {ForbiddenError} If the JWT verification fails due to expiration or invalid signature.
 */
const verifyAccess = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Access token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new ForbiddenError('Access token is expired or invalid');
    }

    const user = await userModel.findById(decoded.id).lean();
    if (!user || !user.refreshToken) {
        throw new UnauthorizedError('Session has expired or you have logged out');
    }

    req.user = decoded;
    next();
});

export default verifyAccess;