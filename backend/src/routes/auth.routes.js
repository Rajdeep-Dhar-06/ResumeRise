import express from 'express';
import {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
} from '../controllers/auth.controller.js';
import authUser from '../middlewares/auth.middleware.js';

const authRouter = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', registerUserController);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
authRouter.post('/login', loginUserController);

/**
 * @route GET /api/auth/logout
 * @desc Clear token from cookie and add in blacklist
 * @access Public
 */
authRouter.get('/logout', logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @desc Get current user information
 * @access Private
 */
authRouter.get('/get-me', authUser, getMeController);

export default authRouter;
