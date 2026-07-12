import userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/async_handler.js';
import { BadRequestError, UnauthorizedError, NotFoundError, ConflictError, ForbiddenError } from '../utils/error_handler.js';
import logger from '../utils/logger.js';

/**
 * @route POST /api/auth/register
 * @desc Register a new user, expects username, email and password
 * @access Public
 */
const registerUserController = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new BadRequestError('All fields are required');
  }

  const doesUserExist = await userModel.findOne({ username });

  if (doesUserExist) {
    throw new ConflictError('User already exists');
  }

  const hash = await bcrypt.hash(password, 10);
  const newUser = await userModel.create({ username, email, password: hash });
  const accessToken = jwt.sign(
    {
      id: newUser._id,
      username: newUser.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '15m',
    }
  );
  const refreshToken = jwt.sign(
    {
      id: newUser._id,
      username: newUser.username
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
    }
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  newUser.refreshToken = refreshToken;
  await newUser.save();

  res.status(201).json({
    message: 'User registered successfully',
    accessToken,
    user: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    },
  });
});

/**
 * @route POST /api/auth/login
 * @desc Login a user, expects email and password
 * @access Public
 */
const loginUserController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('All fields are required');
  }

  const user = await userModel.findOne({ email }).select('+password');
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const accessToken = jwt.sign(
    { 
      id: user._id, 
      username: user.username 
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '15m',
    }
  );
  const refreshToken = jwt.sign(
    { 
      id: user._id, 
      username: user.username 
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
    }
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  user.refreshToken = refreshToken;
  await user.save();

  res.status(200).json({
    message: 'User logged in successfully',
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

/**
 * @route GET /api/auth/logout
 * @desc Clear token from cookie and add in blacklist
 * @access Public
 */
const logoutUserController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await userModel.findByIdAndUpdate(decoded.id, { refreshToken: '' });
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to clear refresh token during user logout');
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
  });
  res.status(200).json({ message: 'User logged out successfully' });
});

/**
 * @route GET /api/auth/get-me
 * @desc Get current user information
 * @access Private
 */
const getMeController = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(200).json({
    message: 'User retrieved successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
});

const refreshAccessController = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) {
    throw new UnauthorizedError('Refresh token is missing');
  }

  const refreshToken = cookies.refreshToken;

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new ForbiddenError('Session has expired or you have logged out');
    }
    const accessToken = jwt.sign(
      { 
        id: decoded.id, 
        username: decoded.username 
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '15m' 
      }
    );
    res.status(200).json({ accessToken });
  } catch (err) {
    if (err instanceof ForbiddenError) throw err;
    throw new ForbiddenError('Refresh token is expired or invalid');
  }
});

export {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
  refreshAccessController,
};
