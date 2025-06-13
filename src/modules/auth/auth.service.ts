// ========================================
// src/modules/auth/auth.service.ts
// ========================================
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, IUser } from "../user/user.model";
import { emailService } from "../../infrastructure/email/service";
import { redisClient } from "../../infrastructure/cache/redis";
import config from "../../config/env";
import { AppError } from "../../shared/middlewares/errorHandler";
import ms from "ms"; // Import the ms library
import { sendResetPasswordEmail } from "../../infrastructure/email/emailJsService";

class AuthService {
  private generateToken(userId: string, rememberMe: boolean = false): string {
    const expiresIn = rememberMe
      ? config.JWT_REMEMBER_EXPIRE
      : config.JWT_EXPIRE;
    const secret = config.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }
    if (!expiresIn) {
      throw new Error("JWT_EXPIRE is not defined");
    }

    // Parse expiresIn with ms to ensure it's a number or valid string
    const expiresInParsed =
      typeof expiresIn === "string" ? expiresIn : ms(expiresIn);

    return jwt.sign({ id: userId }, secret, {
      expiresIn: Number(expiresInParsed),
    });
  }
  private async checkPasswordResetLimits(user: IUser): Promise<void> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check if account is locked
    if (
      user.accountLocked &&
      user.accountLockedUntil &&
      user.accountLockedUntil > now
    ) {
      throw new AppError(
        "Account is temporarily locked. Please try again later.",
        423
      );
    }

    // Reset counter if 24 hours have passed
    if (
      !user.passwordResetLastAttempt ||
      user.passwordResetLastAttempt < oneDayAgo
    ) {
      user.passwordResetAttempts = 0;
      user.passwordResetLastAttempt = now;
    }

    // Check if user has exceeded reset attempts
    if (user.passwordResetAttempts >= 3) {
      user.accountLocked = true;
      user.accountLockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await user.save();
      throw new AppError(
        "Too many password reset attempts. Account locked for 24 hours.",
        423
      );
    }
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<{ user: Partial<IUser>; token: string }> {
    // Check for weak passwords
    const weakPasswords = ["password", "secret", "qwerty"];
    const isWeakPassword = weakPasswords.some((weak) =>
      userData.password.toLowerCase().includes(weak)
    );

    if (isWeakPassword) {
      throw new AppError("Password contains weak keywords", 400);
    }

    // Check if password is similar to username or email
    if (
      userData.password
        .toLowerCase()
        .includes(userData.username.toLowerCase()) ||
      userData.password
        .toLowerCase()
        .includes(userData.email.split("@")[0].toLowerCase())
    ) {
      throw new AppError(
        "Password cannot be similar to username or email",
        400
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      throw new AppError(
        "User with this email or username already exists",
        400
      );
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = this.generateToken(user._id.toString());

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalXP: user.totalXP,
        totalKeys: user.totalKeys,
        rank: user.rank,
      },
      token,
    };
  }

  async login(
    usernameOrEmail: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ user: Partial<IUser>; token: string }> {
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail },
      ],
    });

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError("Invalid credentials", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account is deactivated", 401);
    }

    // Check if account is locked
    if (
      user.accountLocked &&
      user.accountLockedUntil &&
      user.accountLockedUntil > new Date()
    ) {
      throw new AppError("Account is temporarily locked", 423);
    }

    // Update user login info
    user.lastLogin = new Date();
    user.rememberMe = rememberMe;
    user.accountLocked = false;
    user.accountLockedUntil = undefined;

    if (rememberMe) {
      user.rememberMeExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }

    await user.save();

    // Generate token
    const token = this.generateToken(user._id.toString(), rememberMe);

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalXP: user.totalXP,
        totalKeys: user.totalKeys,
        rank: user.rank,
      },
      token,
    };
  }

  async forgotPassword(usernameOrEmail: string): Promise<void> {
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail },
      ],
    });

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    await this.checkPasswordResetLimits(user);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.passwordResetAttempts += 1;
    user.passwordResetLastAttempt = new Date();

    await user.save();
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // Send email
    // await emailService.sendPasswordResetEmail(user.email, resetToken);
    await sendResetPasswordEmail({
      to_email: user.email,
      to_name: user.username,
      reset_link: resetUrl,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    // Check for weak passwords
    const weakPasswords = ["password", "secret", "qwerty"];
    const isWeakPassword = weakPasswords.some((weak) =>
      newPassword.toLowerCase().includes(weak)
    );

    if (isWeakPassword) {
      throw new AppError("Password contains weak keywords", 400);
    }

    // Check if password is similar to username or email
    if (
      newPassword.toLowerCase().includes(user.username.toLowerCase()) ||
      newPassword.toLowerCase().includes(user.email.split("@")[0].toLowerCase())
    ) {
      throw new AppError(
        "Password cannot be similar to username or email",
        400
      );
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetAttempts = 0;
    user.accountLocked = false;
    user.accountLockedUntil = undefined;

    await user.save();
  }

  async logout(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      user.rememberMe = false;
      user.rememberMeExpires = undefined;
      await user.save();
    }

    // Invalidate token in Redis (optional - for more security)
    await redisClient.del(`user_session:${userId}`);
  }
}

export const authService = new AuthService();
