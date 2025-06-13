// src/infrastructure/cache/redis.ts
import { createClient } from 'redis';
import config from '../../config/env';

export const redisClient = createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection failed');
      }
      console.log(`Retrying Redis connection (attempt ${retries + 1})...`);
      return Math.min(retries * 100, 3000);
    },
  },
});

export async function connectRedis(): Promise<void> {
  try {
    console.log(`Connecting to Redis at ${config.REDIS_URL}`);
    await redisClient.connect();
    console.log('✅ Redis client connected');
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('reconnecting', () => console.log('Redis client reconnecting...'));
    redisClient.on('ready', () => console.log('Redis client ready'));
    // Test Redis connection
    await redisClient.ping();
    console.log('Redis ping response: PONG');
  } catch (error) {
    console.error(`Failed to connect to Redis at ${config.REDIS_URL}:`, error);
    throw error;
  }
}

process.on('SIGINT', async () => {
  await redisClient.quit().catch((err) => console.error('Error closing Redis:', err));
  console.log('Redis connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redisClient.quit().catch((err) => console.error('Error closing Redis:', err));
  console.log('Redis connection closed');
  process.exit(0);
});