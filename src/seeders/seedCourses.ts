import mongoose from 'mongoose';
import { Course, ICourse } from '../modules/course/course.model';
import { CourseLevel } from '../shared/types';
import config from '../config/env';

const MONGO_URI = config.MONGODB_URI || 'mongodb://localhost:27017/your-db-name';

async function seedCourses() {
  await mongoose.connect(MONGO_URI);
  await Course.deleteMany({});

  const courses  = [
    {
      title: 'Cybersecurity Essentials',
      description: 'An introductory course on cybersecurity basics.',
      level: 1, // 1
      section: 'General',
      modules: [
        {
          id: 'mod1',
          title: 'Introduction to Cybersecurity',
          content: 'What is cybersecurity? Why is it important?',
          completed: false,
        },
        {
          id: 'mod2',
          title: 'Types of Threats',
          content: 'Overview of common security threats.',
          completed: false,
        }
      ],
      challenges: [
        {
          id: 'ch1',
          title: 'Basic Quiz',
          description: 'Test your fundamental knowledge.',
          xpReward: 50,
          keyReward: 1,
          completed: false,
          attempts: 0,
        }
      ],
      totalXP: 100,
      totalKeys: 1,
      estimatedHours: 2,
      isActive: true,
    },
    {
      title: 'Red Team Fundamentals',
      description: 'Learn how to think like an attacker and test defenses.',
      level: CourseLevel.II, // 2
      section: 'Red Teaming',
      modules: [
        {
          id: 'mod1',
          title: 'Penetration Testing Basics',
          content: 'Understanding the basics of penetration testing.',
          completed: false,
        }
      ],
      challenges: [
        {
          id: 'ch1',
          title: 'Simulated Attack',
          description: 'Apply red team concepts in a safe environment.',
          xpReward: 200,
          keyReward: 2,
          completed: false,
          attempts: 0,
        }
      ],
      totalXP: 200,
      totalKeys: 2,
      estimatedHours: 4,
      isActive: true,
    },
    {
      title: 'Blue Team Defense',
      description: 'Defend and monitor systems from attacks.',
      level: 3, // 3
      section: 'Blue Teaming',
      modules: [
        {
          id: 'mod1',
          title: 'Incident Response',
          content: 'Learn the steps in incident response.',
          completed: false,
        }
      ],
      challenges: [
        {
          id: 'ch1',
          title: 'Log Analysis Challenge',
          description: 'Analyze suspicious logs to find threats.',
          xpReward: 300,
          keyReward: 3,
          completed: false,
          attempts: 0,
        }
      ],
      totalXP: 300,
      totalKeys: 3,
      estimatedHours: 5,
      isActive: true,
    }
  ];

  await Course.insertMany(courses);
  console.log('Courses seeded!');
  await mongoose.disconnect();
}

seedCourses().catch(err => {
  console.error(err);
  mongoose.disconnect();
});