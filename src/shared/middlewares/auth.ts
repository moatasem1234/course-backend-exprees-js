// ========================================
// src/shared/middlewares/auth.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../modules/user/user.model';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';
import config from '../../config/env';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      sendError(res, 'No token provided', 401);
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      sendError(res, 'Invalid token', 401);
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username
    };

    next();
  } catch (error) {
    sendError(res, 'Invalid token', 401);
  }
};