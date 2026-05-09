import jwt from 'jsonwebtoken';
import blackListTokenModel from '../models/blacklist.model.js';

const authUser = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }

  const isTokenBlacklisted = await blackListTokenModel.findOne({ token });
  if (isTokenBlacklisted) {
    return res.status(401).json({ error: 'Token is invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token is invalid' });
    }

    req.user = decoded; //creates user property inside req
    next();
  });
};

export default authUser;
