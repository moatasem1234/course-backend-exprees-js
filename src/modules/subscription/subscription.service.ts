
// ========================================
// src/modules/subscription/subscription.service.ts
// ========================================
import { Subscription, ISubscription } from './subscription.model';
import { User } from '../user/user.model';
import { emailService } from '../../infrastructure/email/service';
import { AppError } from '../../shared/middlewares/errorHandler';

class SubscriptionService {
  async subscribe(userId: string, plan: 'monthly' | 'yearly'): Promise<ISubscription> {
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    if (existingSubscription) {
      throw new AppError('User already has an active subscription', 400);
    }

    const startDate = new Date();
    let endDate: Date;

    if (plan === 'monthly') {
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
    } else {
      // Yearly plan gets 3 additional months (15 months total)
      endDate = new Date(startDate.getTime() + 15 * 30 * 24 * 60 * 60 * 1000); // 15 months
    }

    const subscription = new Subscription({
      userId,
      plan,
      startDate,
      endDate,
      status: 'active'
    });

    await subscription.save();
    return subscription;
  }

  async cancelSubscription(userId: string, reason?: string): Promise<void> {
    const subscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    if (!subscription) {
      throw new AppError('No active subscription found', 404);
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;

    await subscription.save();

    // Send cancellation email
    const user = await User.findById(userId);
    if (user) {
      await emailService.sendUnsubscriptionEmail(user.email);
    }
  }

  async getUserSubscription(userId: string): Promise<ISubscription | null> {
    return await Subscription.findOne({ userId }).sort({ createdAt: -1 });
  }

  async checkSubscriptionAccess(userId: string): Promise<boolean> {
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    return !!subscription;
  }

  // Background job to handle expired subscriptions
  async processExpiredSubscriptions(): Promise<void> {
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lt: new Date() }
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = 'expired';
      await subscription.save();
    }
  }
}

export const subscriptionService = new SubscriptionService();