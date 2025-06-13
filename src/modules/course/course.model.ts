
// ========================================
// src/modules/course/course.model.ts
// ========================================
import mongoose, { Document, Schema } from 'mongoose';
import { CourseLevel } from '../../shared/types';

export interface IModule {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  completedAt?: Date;
}

export interface IChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  keyReward: number;
  completed: boolean;
  completedAt?: Date;
  attempts: number;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  level: CourseLevel;
  section: string;
  modules: IModule[];
  challenges: IChallenge[];
  totalXP: number;
  totalKeys: number;
  estimatedHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date
});

const challengeSchema = new Schema<IChallenge>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  xpReward: { type: Number, required: true },
  keyReward: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  attempts: { type: Number, default: 0 }
});

const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    required: true,
    enum: ['General', 'Red Teaming', 'Blue Teaming']
  },
  modules: [moduleSchema],
  challenges: [challengeSchema],
  totalXP: {
    type: Number,
    required: true
  },
  totalKeys: {
    type: Number,
    required: true
  },
  estimatedHours: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate XP and keys based on level
courseSchema.pre('save', function(next) {
  if (this.isNew) {
    this.totalXP = this.level * 100;
    this.totalKeys = this.level;
  }
  next();
});

export const Course = mongoose.model<ICourse>('Course', courseSchema);
