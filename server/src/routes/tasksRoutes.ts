import { Router } from "express";
import {
  addTaskComment,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "../controllers/tasksController";
import { verifyToken } from "../middleware/verifyToken";

export const tasksRouter = Router();

tasksRouter.use(verifyToken);

tasksRouter.get("/", listTasks);
tasksRouter.post("/", createTask);
tasksRouter.get("/:id", getTask);
tasksRouter.patch("/:id", updateTask);
tasksRouter.delete("/:id", deleteTask);
tasksRouter.post("/:id/comments", addTaskComment);

