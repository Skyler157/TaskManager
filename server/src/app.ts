import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";
import { apiRateLimit, authRateLimit } from "./middleware/rateLimit";
import { adminRouter } from "./routes/adminRoutes";
import { authRouter } from "./routes/authRoutes";
import { projectsRouter } from "./routes/projectsRoutes";
import { reportsRouter } from "./routes/reportsRoutes";
import { tasksRouter } from "./routes/tasksRoutes";
import { usersRouter } from "./routes/usersRoutes";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https:", "data:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(requestLogger);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use("/api", apiRateLimit);

  app.get("/api/health", (_req, res) => {
    return res.json({ success: true, data: { ok: true, timestamp: new Date().toISOString() } });
  });

  app.use("/api/auth", authRateLimit, authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/reports", reportsRouter);

  app.use(errorHandler);
  return app;
}
