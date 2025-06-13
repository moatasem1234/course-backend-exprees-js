
// ========================================
// src/modules/user/user.model.ts
// ========================================
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserRank } from '../../shared/types';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  rememberMe?: boolean;
  rememberMeExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordResetAttempts: number;
  passwordResetLastAttempt?: Date;
  accountLocked: boolean;
  accountLockedUntil?: Date;
  totalXP: number;
  totalKeys: number;
  rank: UserRank;
  coursesCompleted: number;
  imageChangeCount: number;
  imageChangeLastReset: Date;
  usernameChangeCount: number;
  usernameChangeLastReset: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateRank(): void;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 12
  },
  profileImage: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  rememberMe: {
    type: Boolean,
    default: false
  },
  rememberMeExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordResetAttempts: {
    type: Number,
    default: 0
  },
  passwordResetLastAttempt: Date,
  accountLocked: {
    type: Boolean,
    default: false
  },
  accountLockedUntil: Date,
  totalXP: {
    type: Number,
    default: 0
  },
  totalKeys: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    enum: Object.values(UserRank),
    default: UserRank.BEGINNER
  },
  coursesCompleted: {
    type: Number,
    default: 0
  },
  imageChangeCount: {
    type: Number,
    default: 0
  },
  imageChangeLastReset: {
    type: Date,
    default: Date.now
  },
  usernameChangeCount: {
    type: Number,
    default: 0
  },
  usernameChangeLastReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update rank based on courses completed
userSchema.methods.updateRank = function(): void {
  const completed = this.coursesCompleted;
  
  if (completed >= 15) {
    this.rank = UserRank.EXPERT;
  } else if (completed >= 12) {
    this.rank = UserRank.ADVANCED;
  } else if (completed >= 9) {
    this.rank = UserRank.INTERMEDIATE;
  } else if (completed >= 6) {
    this.rank = UserRank.NOVICE;
  } else if (completed >= 3) {
    this.rank = UserRank.BEGINNER;
  }
};

export const User = mongoose.model<IUser>('User', userSchema);
