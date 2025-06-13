
// ========================================
// src/modules/course/course.controller.ts
// ========================================
import { Request, Response, NextFunction } from 'express';
import { courseService } from './course.service';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

class CourseController {
  async getAllCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, section, level, sort } = req.query;
      
      const courses = await courseService.getAllCourses({
        search: search as string,
        section: section as string,
        level: level ? parseInt(level as string) : undefined,
        sort: sort as string
      });

      sendSuccess(res, 'Courses retrieved successfully', courses);
    } catch (error) {
      next(error);
    }
  }

  async getCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const course = await courseService.getCourseById(id);
      sendSuccess(res, 'Course retrieved successfully', course);
    } catch (error) {
      next(error);
    }
  }

  async startCourse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const progress = await courseService.startCourse(req.user!.id, id);
      sendSuccess(res, 'Course started successfully', progress);
    } catch (error) {
      next(error);
    }
  }

  async updateProgress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { moduleId, challengeId } = req.body;
      
      const progress = await courseService.updateProgress(
        req.user!.id,
        id,
        moduleId,
        challengeId
      );
      
      sendSuccess(res, 'Progress updated successfully', progress);
    } catch (error) {
      next(error);
    }
  }

  async retakeCourse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const progress = await courseService.retakeCourse(req.user!.id, id);
      sendSuccess(res, 'Course reset for retake', progress);
    } catch (error) {
      next(error);
    }
  }

  async getUserProgress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const progress = await courseService.getUserProgress(req.user!.id, id);
      sendSuccess(res, 'Progress retrieved successfully', progress);
    } catch (error) {
      next(error);
    }
  }

  async getUserCourses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const courses = await courseService.getUserCourses(req.user!.id);
      sendSuccess(res, 'User courses retrieved successfully', courses);
    } catch (error) {
      next(error);
    }
  }

  async getSectionStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await courseService.getSectionStats();
      sendSuccess(res, 'Section stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
}

export const courseController = new CourseController();