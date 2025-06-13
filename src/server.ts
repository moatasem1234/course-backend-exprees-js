// src/server.ts
import app from './app';
import { connectDatabase } from './infrastructure/database/connection';
import { connectRedis } from './infrastructure/cache/redis';
import config from './config/env';

const PORT = config.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Connect to Redis
    try {
      await connectRedis();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('⚠️ Redis connection failed, continuing without rate limiting:', error);
      // Optionally disable rate limiting if Redis fails
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📖 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Only exit for critical errors
  if (reason instanceof Error && reason.message.includes('Redis')) {
    console.warn('Redis error detected, continuing without rate limiting');
    return;
  }
  process.exit(1);
});

startServer();