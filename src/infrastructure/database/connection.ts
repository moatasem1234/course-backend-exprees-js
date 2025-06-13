// ========================================
// src/infrastructure/database/connection.ts
// ========================================
import mongoose from 'mongoose';
import config from '../../config/env';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};