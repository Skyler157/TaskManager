import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { parseListQuery } from "../middleware/pagination";
import { ProjectModel } from "../models/Project";
import { assertProjectAccess } from "../services/accessService";
import { logAudit } from "../services/auditService";
import { ok } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

const createProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional(),
  icon: z.string().min(1).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.coerce.date().optional(),
  memberIds: z.array(z.string().min(1)).default([]),
  status: z
    .enum(["planning", "active", "on_hold", "completed", "archived"])
    .optional(),
});

export async function listProjects(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { page, limit, skip, sort } = parseListQuery(
    req.query,
    ["createdAt", "updatedAt", "title", "dueDate", "status", "priority"],
    "updatedAt",
    -1,
  );

  const uid = new mongoose.Types.ObjectId(req.auth.userId);
  const filter =
    req.auth.role === "admin"
      ? {}
      : { $or: [{ createdBy: uid }, { members: uid }] };

  const [items, total] = await Promise.all([
    ProjectModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("owner", "name email role avatar department isActive")
      .populate("createdBy", "name email role")
      .populate("members", "name email role"),
    ProjectModel.countDocuments(filter),
  ]);

  return res.json(ok({ items, page, limit, total }));
}

export async function createProject(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const body = createProjectSchema.parse(req.body);

  const members = Array.from(new Set(body.memberIds)).map(
    (id) => new mongoose.Types.ObjectId(id),
  );
  const creatorId = new mongoose.Types.ObjectId(req.auth.userId);

  if (!members.some((m) => m.equals(creatorId))) members.push(creatorId);

  const project = new ProjectModel({
    title: body.title,
    description: body.description ?? "",
    color: body.color ?? "#6366F1",
    icon: body.icon ?? "🚀",
    priority: body.priority ?? "medium",
    ...(body.dueDate ? { dueDate: body.dueDate } : {}),
    status: body.status ?? "active",
    owner: creatorId,
    createdBy: creatorId,
    members,
  });
  await project.save();

  const populated = await ProjectModel.findById(project._id)
    .populate("owner", "name email role avatar department isActive")
    .populate("createdBy", "name email role")
    .populate("members", "name email role");

  await logAudit({
    actorId: req.auth.userId,
    action: "project.create",
    targetType: "project",
    targetId: project._id.toString(),
  });
  return res.status(201).json(ok(populated, "Project created"));
}

export async function getProject(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

  await assertProjectAccess({
    projectId: id,
    userId: req.auth.userId,
    role: req.auth.role,
  });

  const project = await ProjectModel.findById(id)
    .populate("owner", "name email role avatar department isActive")
    .populate("createdBy", "name email role")
    .populate("members", "name email role");
  if (!project) throw new AppError("Project not found", 404);

  return res.json(ok(project));
}

const updateProjectSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional(),
    icon: z.string().min(1).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    status: z.enum(["planning", "active", "on_hold", "completed", "archived"]).optional(),
    dueDate: z.coerce.date().optional(),
    memberIds: z.array(z.string().min(1)).optional(),
  })
  .strict();

export async function updateProject(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = updateProjectSchema.parse(req.body);

  const project = await assertProjectAccess({
    projectId: id,
    userId: req.auth.userId,
    role: req.auth.role,
  });

  // Only admin/manager can modify project details. Employees can view only.
  if (req.auth.role === "employee") throw new AppError("Forbidden", 403);

  if (typeof body.title === "string") project.title = body.title;
  if (typeof body.description === "string") project.description = body.description;
  if (typeof body.color === "string") project.color = body.color;
  if (typeof body.icon === "string") project.icon = body.icon;
  if (typeof body.priority === "string") project.priority = body.priority;
  if (typeof body.status === "string") project.status = body.status;
  if (body.dueDate) project.dueDate = body.dueDate;
  project.completedAt = project.status === "completed" ? new Date() : undefined;
  if (body.memberIds) {
    const members = Array.from(new Set(body.memberIds)).map(
      (mid) => new mongoose.Types.ObjectId(mid),
    );
    const creatorId = new mongoose.Types.ObjectId(project.createdBy.toString());
    if (!members.some((m) => m.equals(creatorId))) members.push(creatorId);
    project.members = members;
  }

  await project.save();

  const populated = await ProjectModel.findById(project._id)
    .populate("owner", "name email role avatar department isActive")
    .populate("createdBy", "name email role")
    .populate("members", "name email role");

  await logAudit({
    actorId: req.auth.userId,
    action: "project.update",
    targetType: "project",
    targetId: project._id.toString(),
  });
  return res.json(ok(populated, "Project updated"));
}

export async function deleteProject(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const deleted = await ProjectModel.findByIdAndDelete(id);
  if (!deleted) throw new AppError("Project not found", 404);
  await logAudit({
    actorId: req.auth.userId,
    action: "project.delete",
    targetType: "project",
    targetId: id,
  });
  return res.json(ok(true, "Project deleted"));
}

const addMembersSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1),
});

export async function addProjectMembers(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = addMembersSchema.parse(req.body);

  const project = await assertProjectAccess({
    projectId: id,
    userId: req.auth.userId,
    role: req.auth.role,
  });
  if (req.auth.role === "employee") throw new AppError("Forbidden", 403);

  const incoming = body.memberIds.map((mid) => new mongoose.Types.ObjectId(mid));
  const set = new Set(project.members.map((m) => m.toString()));
  for (const m of incoming) set.add(m.toString());
  set.add(project.owner.toString());
  project.members = Array.from(set).map((v) => new mongoose.Types.ObjectId(v));
  await project.save();

  const populated = await ProjectModel.findById(project._id)
    .populate("owner", "name email role avatar department isActive")
    .populate("createdBy", "name email role")
    .populate("members", "name email role");
  await logAudit({
    actorId: req.auth.userId,
    action: "project.members_add",
    targetType: "project",
    targetId: project._id.toString(),
    metadata: { added: body.memberIds.length },
  });
  return res.json(ok(populated, "Members added"));
}

