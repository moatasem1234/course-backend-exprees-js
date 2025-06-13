// ========================================
// src/modules/subscription/subscription.routes.ts
// ========================================
import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { authenticate } from '../../shared/middlewares/auth';

const router = Router();

router.use(authenticate); // All routes require authentication

router.post('/', subscriptionController.subscribe);
router.delete('/', subscriptionController.cancelSubscription);
router.get('/', subscriptionController.getSubscription);
router.get('/access', subscriptionController.checkAccess);

export default router;