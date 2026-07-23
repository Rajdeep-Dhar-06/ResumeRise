import userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/async_handler.js';
import { BadRequestError, UnauthorizedError, NotFoundError, ConflictError, ForbiddenError } from '../utils/error_handler.js';
import logger from '../utils/logger.js';
import { redisClient } from '../config/redis.js';

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
  path: '/',
};

/**
 * Registers a new user account.
 * 
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUserController = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new BadRequestError('All fields are required');
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const doesUsernameExist = await userModel.findOne({ username: normalizedUsername }).lean();
  if (doesUsernameExist) {
    throw new ConflictError('Username is already taken');
  }

  const doesEmailExist = await userModel.findOne({ email: normalizedEmail }).lean();
  if (doesEmailExist) {
    throw new ConflictError('An account with this email already exists');
  }

  const hash = await bcrypt.hash(password, 10);
  const newUser = await userModel.create({ username: normalizedUsername, email: normalizedEmail, password: hash });
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

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  newUser.refreshToken = await bcrypt.hash(refreshToken, 10);
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
 * Authenticates user credentials and logs them in.
 * 
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUserController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('All fields are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userModel.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
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

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  user.refreshToken = await bcrypt.hash(refreshToken, 10);
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
 * Logs out the current user.
 * 
 * - Blacklists the access token in Redis.
 * - Deletes the cached user session key.
 * - Clears cookies and invalidates MongoDB session.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const logoutUserController = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const refreshToken = req.cookies.refreshToken;

  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.split(' ')[1];

    if (accessToken) {
      try {
        const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const ttl = decodedAccessToken.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redisClient.set(`blacklist:${accessToken}`, 1, { EX: ttl });
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Failed to add access token to blacklist during user logout');
      }
    }
  }

  if (req.user?.id) {
    try {
      await redisClient.del(`user:${req.user.id}`);
      await userModel.findByIdAndUpdate(req.user.id, { refreshToken: '' });
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to clear user session during logout');
    }
  }

  res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
  res.status(200).json({ message: 'User logged out successfully' });
});

/**
 * Retrieves the current logged-in user profile info.
 * 
 * - Checks the Redis user session cache first.
 * - Queries MongoDB and warms Redis cache on miss.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const getMeController = asyncHandler(async (req, res) => {
  const cacheKey = `user:${req.user.id}`;

  try {
    const cachedUser = await redisClient.get(cacheKey);
    if (cachedUser) {
      return res.status(200).json({
        message: 'User retrieved successfully',
        user: JSON.parse(cachedUser),
      });
    }
  } catch (error) {
    logger.warn({ err: error }, 'Failed to retrieve user from cache');
  }

  const user = await userModel.findById(req.user.id).lean();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const userProfile = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
  }

  try {
    await redisClient.set(cacheKey, JSON.stringify(userProfile), { EX: 60 * 15 });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to set user in cache');
  }

  res.status(200).json({
    message: 'User retrieved successfully',
    user: userProfile,
  });
});

/**
 * Refreshes the JWT access token using the refresh token cookie.
 * 
 * @route POST /api/auth/refresh
 * @access Public
 */
export const refreshAccessController = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) {
    throw new UnauthorizedError('Refresh token is missing');
  }

  const refreshToken = cookies.refreshToken;

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await userModel.findById(decoded.id).select('+refreshToken').lean();
    if (!user || !user.refreshToken) {
      throw new ForbiddenError('Session has expired or you have logged out');
    }
    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isTokenValid) {
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
