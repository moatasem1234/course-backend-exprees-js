
// ========================================
// src/modules/auth/auth.routes.ts
// ========================================
import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middlewares/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authenticate, authController.logout);

export default router;