
// ========================================
// src/modules/course/userProgress.model.ts
// ========================================
import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  completedModules: string[];
  completedChallenges: string[];
  currentModule: string;
  progressPercentage: number;
  timeSpent: number; // in minutes
  xpEarned: number;
  keysEarned: number;
  isCompleted: boolean;
  completedAt?: Date;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userProgressSchema = new Schema<IUserProgress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completedModules: [{
    type: String
  }],
  completedChallenges: [{
    type: String
  }],
  currentModule: {
    type: String,
    default: ''
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  keysEarned: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for user-course combination
userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserProgress = mongoose.model<IUserProgress>('UserProgress', userProgressSchema);