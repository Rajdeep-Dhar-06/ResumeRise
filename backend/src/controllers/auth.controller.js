import userModel from '../models/user.model.js';
import blackListTokenModel from '../models/blacklist.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * @route POST /api/auth/register
 * @desc Register a new user, expects username, email and password
 * @access Public
 */
async function registerUserController(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const doesUserExist = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (doesUserExist) {
    //TODO : elaborate check
    return res.status(409).json({ error: 'User already exists' });
  }

  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
}

/**
 * @route POST /api/auth/login
 * @desc Login a user, expects email and password
 * @access Public
 */
async function loginUserController(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
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
}

async function logoutUserController(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    await blackListTokenModel.create({ token });
    res.clearCookie('token');
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout user' });
  }
}

async function getMeController(req, res) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
}

export {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
};
