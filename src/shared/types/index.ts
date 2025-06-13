// ========================================
// src/shared/types/index.ts
// ========================================
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum CourseLevel {
  I = 1,
  II = 2,
  III = 3,
  IV = 4,
  V = 5
}
 
export enum UserRank {
  BEGINNER = 'Beginner',
  NOVICE = 'Novice',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert'
}