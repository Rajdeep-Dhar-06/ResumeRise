import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
import { UnauthorizedError, ForbiddenError } from '../utils/error_handler.js';
import { asyncHandler } from '../utils/async_handler.js';

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

    const user = await userModel.findById(decoded.id);
    if (!user || !user.refreshToken) {
        throw new UnauthorizedError('Session has expired or you have logged out');
    }

    req.user = decoded;
    next();
});

export default verifyAccess;