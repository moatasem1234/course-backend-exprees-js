// src/shared/middlewares/rateLimiter.ts
import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "../../infrastructure/cache/redis";
import { AppError } from "./errorHandler";

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  keyPrefix: "rate-limit", // Re-enable keyPrefix
  execEvenly: false, // Disable even execution to simplify
});

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key =
      typeof req.ip === "string" && req.ip.trim() !== "" ? req.ip : "anonymous";
    console.log("Rate limiter key:", key, "Type:", typeof key);
    // Debug Redis command
    const result = await rateLimiter.consume(key);
    console.log("Rate limiter result:", result);
    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    throw new AppError("Too many requests, please try again later", 429);
  }
}
