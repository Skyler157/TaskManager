import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { parsePagination } from "../middleware/pagination";
import { ProjectModel } from "../models/Project";
import { assertProjectAccess } from "../services/accessService";
import { ok } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

const createProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  memberIds: z.array(z.string().min(1)).default([]),
  status: z.enum(["active", "archived"]).optional(),
});

export async function listProjects(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { page, limit, skip } = parsePagination(req.query);

  const uid = new mongoose.Types.ObjectId(req.auth.userId);
  const filter =
    req.auth.role === "admin"
      ? {}
      : { $or: [{ createdBy: uid }, { members: uid }] };

  const [items, total] = await Promise.all([
    ProjectModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
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

  const project = await ProjectModel.create({
    title: body.title,
    description: body.description ?? "",
    status: body.status ?? "active",
    createdBy: creatorId,
    members,
  });

  const populated = await ProjectModel.findById(project._id)
    .populate("createdBy", "name email role")
    .populate("members", "name email role");

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
    .populate("createdBy", "name email role")
    .populate("members", "name email role");
  if (!project) throw new AppError("Project not found", 404);

  return res.json(ok(project));
}

const updateProjectSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["active", "archived"]).optional(),
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
  if (typeof body.status === "string") project.status = body.status;
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
    .populate("createdBy", "name email role")
    .populate("members", "name email role");

  return res.json(ok(populated, "Project updated"));
}

export async function deleteProject(req: Request, res: Response) {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const deleted = await ProjectModel.findByIdAndDelete(id);
  if (!deleted) throw new AppError("Project not found", 404);
  return res.json(ok(true, "Project deleted"));
}

