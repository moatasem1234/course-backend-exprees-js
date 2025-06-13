// ========================================
// src/modules/course/course.routes.ts
// ========================================
import { Router } from 'express';
import { courseController } from './course.controller';
import { authenticate } from '../../shared/middlewares/auth';

const router = Router();

router.get('/', courseController.getAllCourses);
router.get('/sections/stats', courseController.getSectionStats);
router.get('/my-courses', authenticate, courseController.getUserCourses);
router.get('/:id', courseController.getCourse);
router.post('/:id/start', authenticate, courseController.startCourse);
router.put('/:id/progress', authenticate, courseController.updateProgress);
router.post('/:id/retake', authenticate, courseController.retakeCourse);
router.get('/:id/progress', authenticate, courseController.getUserProgress);

export default router;