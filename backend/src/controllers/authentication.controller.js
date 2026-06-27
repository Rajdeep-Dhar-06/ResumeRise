import userModel from '../models/user.model.js';
import blackListTokenModel from '../models/blacklist.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import BaseError, { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errorHandler.js';

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

  const doesUserExist = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (doesUserExist) {
    throw new BaseError('ConflictError', 409, true, 'User already exists');
  }

  const hash = await bcrypt.hash(password, 10);
  const newUser = await userModel.create({ username, email, password: hash });
  const token = jwt.sign(
    { id: newUser._id, username: newUser.username },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d',
    }
  );
  res.cookie('token', token, { httpOnly: true, secure: false }); // TODO: Change to true before deploying!
  res.status(201).json({
    message: 'User registered successfully',
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

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d',
    }
  );
  res.cookie('token', token, { httpOnly: true, secure: false }); // TODO: Change to true before deploying!
  res.status(200).json({
    message: 'User logged in successfully',
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
  const token = req.cookies.token;

  if (!token) {
    throw new BadRequestError('No token provided');
  }

  await blackListTokenModel.create({ token });
  res.clearCookie('token');
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

export {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
};
