import { Router } from "express";
import {
  addTaskComment,
  createTask,
  deleteTask,
  getTaskStats,
  getTask,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "../controllers/tasksController";
import { verifyToken } from "../middleware/verifyToken";

export const tasksRouter = Router();

tasksRouter.use(verifyToken);

tasksRouter.get("/stats", getTaskStats);
tasksRouter.get("/", listTasks);
tasksRouter.post("/", createTask);
tasksRouter.get("/:id", getTask);
tasksRouter.patch("/:id", updateTask);
tasksRouter.delete("/:id", deleteTask);
tasksRouter.post("/:id/comments", addTaskComment);
tasksRouter.patch("/:id/status", updateTaskStatus);
