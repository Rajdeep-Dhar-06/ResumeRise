import express from 'express';
import { z } from 'zod';
import {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
  refreshAccessController,
} from '../controllers/auth.controller.js';
import verifyAccess from '../middlewares/verify_access.middleware.js';
import { validate } from '../middlewares/schema_validation.middleware.js';
import { loginLimiter, registerLimiter } from '../middlewares/rate_limiter.middleware.js';

const authRouter = express.Router();

// Validation schemas
const registerSchema = {
  body: z.object({
    username: z.string({ required_error: 'Username is required' }).trim().min(1, 'Username is required'),
    email: z.email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', registerLimiter, validate(registerSchema), registerUserController);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
authRouter.post('/login', loginLimiter, validate(loginSchema), loginUserController);

/**
 * @route POST /api/auth/refresh
 * @desc Mint a new access token using a refresh token cookie
 * @access Public
 */
authRouter.post('/refresh', refreshAccessController);

/**
 * @route POST /api/auth/logout
 * @desc Clear token from cookie and add in blacklist
 * @access Private
 */
authRouter.post('/logout', verifyAccess, logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @desc Get current user information
 * @access Private
 */
authRouter.get('/get-me', verifyAccess, getMeController);

export default authRouter;
