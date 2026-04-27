import mongoose from "mongoose";
import { ProjectModel } from "../models/Project";
import { TaskModel } from "../models/Task";
import type { Role } from "../types/roles";
import { AppError } from "../utils/errors";

export async function assertProjectAccess(opts: {
  projectId: string;
  userId: string;
  role: Role;
}) {
  const project = await ProjectModel.findById(opts.projectId);
  if (!project) throw new AppError("Project not found", 404);

  if (opts.role === "admin") return project;

  const uid = new mongoose.Types.ObjectId(opts.userId);
  const isMember =
    project.createdBy.equals(uid) || project.members.some((m) => m.equals(uid));
  if (!isMember) throw new AppError("Forbidden", 403);

  // managers/members who are in the project can access
  return project;
}

export async function assertTaskAccess(opts: {
  taskId: string;
  userId: string;
  role: Role;
}) {
  const task = await TaskModel.findById(opts.taskId);
  if (!task) throw new AppError("Task not found", 404);

  if (opts.role === "admin") return task;

  const uid = new mongoose.Types.ObjectId(opts.userId);

  if (opts.role === "employee") {
    if (!task.assignedTo.equals(uid)) throw new AppError("Forbidden", 403);
    return task;
  }

  // manager must be part of the project
  const project = await ProjectModel.findById(task.project);
  if (!project) throw new AppError("Project not found", 404);

  const isMember =
    project.createdBy.equals(uid) || project.members.some((m) => m.equals(uid));
  if (!isMember) throw new AppError("Forbidden", 403);

  return task;
}

