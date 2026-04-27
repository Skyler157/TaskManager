import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/authRoutes";
import { projectsRouter } from "./routes/projectsRoutes";
import { tasksRouter } from "./routes/tasksRoutes";
import { usersRouter } from "./routes/usersRoutes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    return res.json({ success: true, data: { ok: true } });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/tasks", tasksRouter);

  app.use(errorHandler);
  return app;
}

