
// ========================================
// src/modules/subscription/subscription.controller.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

class SubscriptionController {
  async subscribe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plan } = req.body;
      
      if (!['monthly', 'yearly'].includes(plan)) {
        sendError(res, 'Invalid subscription plan', 400);
        return;
      }

      const subscription = await subscriptionService.subscribe(req.user!.id, plan);
      sendSuccess(res, 'Subscription created successfully', subscription, 201);
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      
      await subscriptionService.cancelSubscription(req.user!.id, reason);
      sendSuccess(res, 'Subscription cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscription = await subscriptionService.getUserSubscription(req.user!.id);
      sendSuccess(res, 'Subscription retrieved successfully', subscription);
    } catch (error) {
      next(error);
    }
  }

  async checkAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hasAccess = await subscriptionService.checkSubscriptionAccess(req.user!.id);
      sendSuccess(res, 'Access status retrieved', { hasAccess });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();