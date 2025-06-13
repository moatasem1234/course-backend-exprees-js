// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { notFoundHandler } from "./shared/middlewares/notFoundHandler";
import { rateLimiterMiddleware } from "./shared/middlewares/rateLimiter";
import authRoutes from "./modules/auth/auth.routes";
import subscriptionRoutes from "./modules/subscription/subscription.routes";
import courseRoutes from "./modules/course/course.routes";

const app = express();

// Enable trust proxy for correct req.ip handling
app.set("trust proxy", true);

// Security middleware
app.use(helmet());
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   })
// );

// Rate limiting
// app.use(rateLimiterMiddleware);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
app.get("/test", (req, res) => {
  res
    .status(200)
    .json({
      status: "OK",
      timestamp: new Date().toISOString(),
      message: "hello",
    });
});
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/courses", courseRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
