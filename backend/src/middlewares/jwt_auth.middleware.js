import jwt from 'jsonwebtoken';
import blackListTokenModel from '../models/blacklist.model.js';
import userModel from '../models/user.model.js';
import { UnauthorizedError } from '../utils/error_handler.js';
import { asyncHandler } from '../utils/async_handler.js';

const authUser = asyncHandler(async (req, res, next) => {
  if (process.env.DISABLE_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    let user = await userModel.findOne();
    if (!user) {
      user = await userModel.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'testpassword123',
      });
    }
    req.user = { id: user._id.toString(), username: user.username };
    return next();
  }

  const token = req.cookies.token;

  if (!token) {
    throw new UnauthorizedError('Token is missing');
  }

  const isTokenBlacklisted = await blackListTokenModel.findOne({ token });
  if (isTokenBlacklisted) {
    throw new UnauthorizedError('Token is invalid');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    throw new UnauthorizedError('Token is invalid');
  }
});

export default authUser;
