import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import 'dotenv/config';

export const authenticate = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Unauthorized - No token provided');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id (decoded.sub matched Prisma's id pattern, often standard for JWT)
    const user = await User.findById(decoded.sub || decoded.id).select('-password');

    if (!user) {
      const error = new Error('Unauthorized - User not found');
      error.statusCode = 401;
      return next(error);
    }

    if (!user.isActive) {
      const error = new Error('Unauthorized - User is deactivated');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err) {
    const error = new Error('Unauthorized - Invalid token');
    error.statusCode = 401;
    next(error);
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error('Forbidden - Insufficient permissions');
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};
