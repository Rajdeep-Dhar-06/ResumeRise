import express from 'express';
import {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
  refreshAccessController,
} from '../controllers/authentication.controller.js';
import verifyAccess from '../middlewares/verify_access.middleware.js';
import { loginLimiter, registerLimiter } from '../middlewares/rate_limiter.middleware.js';

const authRouter = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', registerLimiter, registerUserController);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
authRouter.post('/login', loginLimiter, loginUserController);

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
