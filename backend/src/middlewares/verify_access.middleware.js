import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { redisClient } from '../config/redis.js';
import { UnauthorizedError, ForbiddenError } from '../utils/error_handler.js';
import { asyncHandler } from '../utils/async_handler.js';

/**
 * Authentication middleware to verify incoming JWT access tokens.
 * 
 * - Extracts token from the `Authorization: Bearer <token>` header.
 * - Checks against the Redis logout blacklist.
 * - Decodes and verifies the signature using the access secret.
 * - Attaches the decoded payload (`{ id, username }`) to `req.user`.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 * 
 * @throws {UnauthorizedError} If the Authorization header is missing/malformed or the token is blacklisted.
 * @throws {ForbiddenError} If the token signature verification fails or it is expired.
 */
const verifyAccess = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Access token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    let isTokenBlacklisted = false;
    try {
        isTokenBlacklisted = await redisClient.exists(`blacklist:${token}`);
    } catch (err) {
        logger.warn({ err: err.message }, 'Failed to check blacklist in Redis');
    }

    if (isTokenBlacklisted) {
        throw new UnauthorizedError('Session has expired or you have logged out');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new UnauthorizedError('Access token is expired or invalid');
    }

    req.user = decoded;
    next();
});

export default verifyAccess;