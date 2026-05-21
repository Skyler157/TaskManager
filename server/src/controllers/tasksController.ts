import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { parseListQuery } from "../middleware/pagination";
import { ProjectModel } from "../models/Project";
import { TaskModel } from "../models/Task";
import { assertTaskAccess } from "../services/accessService";
import { logAudit } from "../services/auditService";
import { ok } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

const listTasksQuerySchema = z.object({
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  project: z
    .string()
    .min(1)
    .refine((v) => mongoose.isValidObjectId(v), "Invalid project id")
    .optional(),
  assignee: z
    .string()
    .min(1)
    .refine((v) => mongoose.isValidObjectId(v), "Invalid assignee id")
    .optional(),
  dueDate: z.coerce.date().optional(),
});

export async function listTasks(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { page, limit, skip, sort } = parseListQuery(
    req.query,
    ["createdAt", "updatedAt", "dueDate", "priority", "status"],
    "updatedAt",
    -1,
  );
  const q = listTasksQuerySchema.parse(req.query);

  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.project) filter.project = new mongoose.Types.ObjectId(q.project);
  if (q.dueDate) filter.dueDate = { $lte: q.dueDate };

  if (req.auth.role === "admin") {
    if (q.assignee) filter.assignedTo = new mongoose.Types.ObjectId(q.assignee);
  } else if (req.auth.role === "employee") {
    filter.assignedTo = new mongoose.Types.ObjectId(req.auth.userId);
  } else {
    // manager: tasks within projects where manager is creator/member
    const uid = new mongoose.Types.ObjectId(req.auth.userId);
    const projects = await ProjectModel.find({
      $or: [{ createdBy: uid }, { members: uid }],
    }).select("_id");
    filter.project = { $in: projects.map((p) => p._id) };
    if (q.assignee) filter.assignedTo = new mongoose.Types.ObjectId(q.assignee);
  }

  const [items, total] = await Promise.all([
    TaskModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("project", "title status")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role"),
    TaskModel.countDocuments(filter),
  ]);

  return res.json(ok({ items, page, limit, total }));
}

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().min(1).refine((v) => mongoose.isValidObjectId(v), "Invalid project id"),
  assignedToId: z.string().min(1).refine((v) => mongoose.isValidObjectId(v), "Invalid assignee id"),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  tags: z.array(z.string().min(1)).optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  loggedHours: z.coerce.number().min(0).optional(),
  dueDate: z.coerce.date().optional(),
});

export async function createTask(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  if (req.auth.role === "employee") throw new AppError("Forbidden", 403);

  const body = createTaskSchema.parse(req.body);

  // Ensure creator can access project (manager must be member/creator; admin ok)
  const project = await ProjectModel.findById(body.projectId);
  if (!project) throw new AppError("Project not found", 404);

  if (req.auth.role !== "admin") {
    const uid = new mongoose.Types.ObjectId(req.auth.userId);
    const isMember =
      project.createdBy.equals(uid) || project.members.some((m) => m.equals(uid));
    if (!isMember) throw new AppError("Forbidden", 403);
  }

  const task = await TaskModel.create({
    title: body.title,
    description: body.description ?? "",
    project: new mongoose.Types.ObjectId(body.projectId),
    assignedTo: new mongoose.Types.ObjectId(body.assignedToId),
    createdBy: new mongoose.Types.ObjectId(req.auth.userId),
    status: body.status ?? "todo",
    priority: body.priority ?? "medium",
    tags: body.tags ?? [],
    estimatedHours: body.estimatedHours ?? 0,
    loggedHours: body.loggedHours ?? 0,
    ...(body.dueDate ? { dueDate: body.dueDate } : {}),
  });

  const populated = await TaskModel.findById(task._id)
    .populate("project", "title status")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role");

  await logAudit({
    actorId: req.auth.userId,
    action: "task.create",
    targetType: "task",
    targetId: task._id.toString(),
    metadata: { projectId: body.projectId },
  });
  return res.status(201).json(ok(populated, "Task created"));
}

export async function getTask(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

  await assertTaskAccess({ taskId: id, userId: req.auth.userId, role: req.auth.role });

  const task = await TaskModel.findById(id)
    .populate("project", "title status")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .populate("comments.author", "name email role");
  if (!task) throw new AppError("Task not found", 404);

  return res.json(ok(task));
}

const updateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    assignedToId: z
      .string()
      .min(1)
      .refine((v) => mongoose.isValidObjectId(v), "Invalid assignee id")
      .optional(),
    status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    tags: z.array(z.string().min(1)).optional(),
    estimatedHours: z.coerce.number().min(0).optional(),
    loggedHours: z.coerce.number().min(0).optional(),
    dueDate: z.coerce.date().optional(),
  })
  .strict();

export async function updateTask(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = updateTaskSchema.parse(req.body);

  const task = await assertTaskAccess({ taskId: id, userId: req.auth.userId, role: req.auth.role });

  if (req.auth.role === "employee") {
    // Employees can only update status (and completedAt auto-managed)
    const allowed = z.object({ status: z.enum(["todo", "in_progress", "review", "done"]) }).partial();
    const safeBody = allowed.parse(body);
    if (safeBody.status) {
      task.status = safeBody.status;
      task.completedAt = safeBody.status === "done" ? new Date() : undefined;
    }
  } else {
    if (typeof body.title === "string") task.title = body.title;
    if (typeof body.description === "string") task.description = body.description;
    if (typeof body.status === "string") {
      task.status = body.status;
      task.completedAt = body.status === "done" ? new Date() : undefined;
    }
    if (typeof body.priority === "string") task.priority = body.priority;
    if (Array.isArray(body.tags)) task.tags = body.tags;
    if (typeof body.estimatedHours === "number") task.estimatedHours = body.estimatedHours;
    if (typeof body.loggedHours === "number") task.loggedHours = body.loggedHours;
    if (body.dueDate) task.dueDate = body.dueDate;
    if (body.assignedToId) task.assignedTo = new mongoose.Types.ObjectId(body.assignedToId);
  }

  await task.save();

  const populated = await TaskModel.findById(task._id)
    .populate("project", "title status")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .populate("comments.author", "name email role");

  await logAudit({
    actorId: req.auth.userId,
    action: "task.update",
    targetType: "task",
    targetId: task._id.toString(),
  });
  return res.json(ok(populated, "Task updated"));
}

export async function deleteTask(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  if (req.auth.role === "employee") throw new AppError("Forbidden", 403);

  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

  await assertTaskAccess({ taskId: id, userId: req.auth.userId, role: req.auth.role });

  const deleted = await TaskModel.findByIdAndDelete(id);
  if (!deleted) throw new AppError("Task not found", 404);
  await logAudit({
    actorId: req.auth.userId,
    action: "task.delete",
    targetType: "task",
    targetId: id,
  });
  return res.json(ok(true, "Task deleted"));
}

const addCommentSchema = z.object({
  text: z.string().min(1),
});

export async function addTaskComment(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = addCommentSchema.parse(req.body);

  const task = await assertTaskAccess({ taskId: id, userId: req.auth.userId, role: req.auth.role });
  task.comments.push({
    author: new mongoose.Types.ObjectId(req.auth.userId),
    text: body.text,
    createdAt: new Date(),
  });

  await task.save();

  const populated = await TaskModel.findById(task._id)
    .populate("project", "title status")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .populate("comments.author", "name email role");

  await logAudit({
    actorId: req.auth.userId,
    action: "task.comment_add",
    targetType: "task",
    targetId: task._id.toString(),
  });
  return res.status(201).json(ok(populated, "Comment added"));
}

const updateStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "review", "done"]),
});

export async function updateTaskStatus(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = updateStatusSchema.parse(req.body);
  const task = await assertTaskAccess({ taskId: id, userId: req.auth.userId, role: req.auth.role });
  task.status = body.status;
  task.completedAt = body.status === "done" ? new Date() : undefined;
  await task.save();
  await logAudit({
    actorId: req.auth.userId,
    action: "task.status_update",
    targetType: "task",
    targetId: id,
    metadata: { status: body.status },
  });
  return res.json(ok(task, "Task status updated"));
}
