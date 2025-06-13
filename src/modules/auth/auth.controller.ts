
// ========================================
// src/modules/auth/auth.controller.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from './auth.validators';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        sendError(res, error.details[0].message, 400);
        return;
      }

      const result = await authService.register(value);
      sendSuccess(res, 'User registered successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        sendError(res, error.details[0].message, 400);
        return;
      }

      const { usernameOrEmail, password, rememberMe } = value;
      const result = await authService.login(usernameOrEmail, password, rememberMe);
      
      sendSuccess(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = forgotPasswordSchema.validate(req.body);
      if (error) {
        sendError(res, error.details[0].message, 400);
        return;
      }

      await authService.forgotPassword(value.usernameOrEmail);
      sendSuccess(res, 'Password reset email sent if account exists');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) {
        sendError(res, error.details[0].message, 400);
        return;
      }

      await authService.resetPassword(value.token, value.newPassword);
      sendSuccess(res, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id) {
        await authService.logout(req.user.id);
      }
      sendSuccess(res, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();