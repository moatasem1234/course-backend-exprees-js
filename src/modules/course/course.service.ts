// ========================================
// src/modules/course/course.service.ts
// ========================================
import { Course, ICourse } from "./course.model";
import { UserProgress, IUserProgress } from "./userProgress.model";
import { User } from "../user/user.model";
import { subscriptionService } from "../subscription/subscription.service";
import { AppError } from "../../shared/middlewares/errorHandler";
import { CourseLevel } from "../../shared/types";

class CourseService {
  async getAllCourses(filters?: {
    search?: string;
    section?: string;
    level?: CourseLevel;
    sort?: string;
  }): Promise<ICourse[]> {
    let query: any = { isActive: true };

    if (filters?.search) {
      query.title = { $regex: filters.search, $options: "i" };
    }

    if (filters?.section) {
      query.section = filters.section;
    }

    if (filters?.level) {
      query.level = filters.level;
    }

    let sortOptions: any = { createdAt: -1 }; // Default: newest first

    if (filters?.sort) {
      switch (filters.sort) {
        case "oldest":
          sortOptions = { createdAt: 1 };
          break;
        case "hardest":
          sortOptions = { level: -1 };
          break;
        case "easiest":
          sortOptions = { level: 1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    }

    return await Course.find(query).sort(sortOptions);
  }

  async getCourseById(courseId: string): Promise<ICourse> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }
    return course;
  }

  async getUserProgress(
    userId: string,
    courseId: string
  ): Promise<IUserProgress | null> {
    return await UserProgress.findOne({ userId, courseId });
  }

  async startCourse(userId: string, courseId: string): Promise<IUserProgress> {
    // Check if user has subscription access
    const hasAccess = await subscriptionService.checkSubscriptionAccess(userId);
    if (!hasAccess) {
      throw new AppError("Subscription required to access courses", 403);
    }

    const course = await this.getCourseById(courseId);

    // Check if progress already exists
    let progress = await UserProgress.findOne({ userId, courseId });

    if (!progress) {
      progress = new UserProgress({
        userId,
        courseId,
        currentModule: course.modules[0]?.id || "",
        lastAccessedAt: new Date(),
      });
      await progress.save();
    }

    return progress;
  }

  async updateProgress(
    userId: string,
    courseId: string,
    moduleId: string,
    challengeId?: string
  ): Promise<IUserProgress> {
    const course = await this.getCourseById(courseId);
    let progress = await UserProgress.findOne({ userId, courseId });

    if (!progress) {
      throw new AppError("Course not started", 400);
    }

    // Update module progress
    if (moduleId && !progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId);
    }

    // Update challenge progress and award XP/keys
    if (challengeId && !progress.completedChallenges.includes(challengeId)) {
      const challenge = course.challenges.find((c) => c.id === challengeId);
      if (challenge) {
        progress.completedChallenges.push(challengeId);
        progress.xpEarned += challenge.xpReward;
        progress.keysEarned += challenge.keyReward;

        // Update user's total XP and keys
        const user = await User.findById(userId);
        if (user) {
          user.totalXP += challenge.xpReward;
          user.totalKeys += challenge.keyReward;
          await user.save();
        }
      }
    }

    // Calculate progress percentage
    const totalModules = course.modules.length;
    const totalChallenges = course.challenges.length;
    const completedItems =
      progress.completedModules.length + progress.completedChallenges.length;
    const totalItems = totalModules + totalChallenges;

    progress.progressPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Check if course is completed
    if (progress.progressPercentage === 100 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();

      // Update user's courses completed count and rank
      const user = await User.findById(userId);
      if (user) {
        user.coursesCompleted += 1;
        user.updateRank();
        await user.save();
      }
    }

    progress.currentModule = moduleId;
    progress.lastAccessedAt = new Date();
    await progress.save();

    return progress;
  }

  async retakeCourse(userId: string, courseId: string): Promise<IUserProgress> {
    // Reset progress
    let progress = await UserProgress.findOne({ userId, courseId });

    if (progress) {
      progress.completedModules = [];
      progress.completedChallenges = [];
      progress.progressPercentage = 0;
      progress.isCompleted = false;
      progress.completedAt = undefined;
      progress.xpEarned = 0;
      progress.keysEarned = 0;
      progress.lastAccessedAt = new Date();
      await progress.save();
    }

    return progress || (await this.startCourse(userId, courseId));
  }

  async getUserCourses(userId: string): Promise<{
    inProgress: Array<ICourse & { progress: IUserProgress }>;
    completed: Array<ICourse & { progress: IUserProgress }>;
  }> {
    // Use explicit typing for the populated courseId
    const progresses = await UserProgress.find({ userId }).populate<{
      courseId: ICourse;
    }>("courseId");

    const inProgress: Array<ICourse & { progress: IUserProgress }> = [];
    const completed: Array<ICourse & { progress: IUserProgress }> = [];

    for (const progress of progresses) {
      if (!progress.courseId) {
        continue; // Skip if courseId is not populated (optional safety check)
      }

      const courseWithProgress = {
        ...progress.courseId.toObject(), // No type cast needed
        progress: progress.toObject(),
      };

      if (progress.isCompleted) {
        completed.push(courseWithProgress);
      } else {
        inProgress.push(courseWithProgress);
      }
    }

    return { inProgress, completed };
  }
  async   getSectionStats(): Promise<
    Array<{
      section: string;
      totalCourses: number;
      availableCourses: string[];
    }>
  > {
    const sections = ["General", "Red Teaming", "Blue Teaming"];
    const stats = [];

    for (const section of sections) {
      const courses = await Course.find({ section, isActive: true });
      const availableCourses = [];

      // Define which courses are available for each section
      if (section === "General") {
        availableCourses.push(
          "Computing Fundamentals",
          "Cybersecurity Fundamentals"
        );
      } else if (section === "Red Teaming") {
        availableCourses.push("Red Teaming I");
      } else if (section === "Blue Teaming") {
        availableCourses.push("Blue Teaming I");
      }

      stats.push({
        section,
        totalCourses: courses.length,
        availableCourses,
      });
    }

    return stats;
  }
}

export const courseService = new CourseService();
