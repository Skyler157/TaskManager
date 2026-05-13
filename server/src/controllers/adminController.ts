import type { Request, Response } from "express";
import { z } from "zod";
import { AuditLogModel } from "../models/AuditLog";
import { ProjectModel } from "../models/Project";
import { TaskModel } from "../models/Task";
import { UserModel } from "../models/User";
import { parseListQuery } from "../middleware/pagination";
import { ok } from "../utils/apiResponse";

export async function getAdminOverview(_req: Request, res: Response) {
  const [users, activeUsers, projects, tasks, doneTasks] = await Promise.all([
    UserModel.countDocuments({}),
    UserModel.countDocuments({ isActive: true }),
    ProjectModel.countDocuments({}),
    TaskModel.countDocuments({}),
    TaskModel.countDocuments({ status: "done" }),
  ]);

  return res.json(
    ok({
      users,
      activeUsers,
      projects,
      tasks,
      doneTasks,
      completionRate: tasks ? Number(((doneTasks / tasks) * 100).toFixed(2)) : 0,
      systemHealth: "healthy",
    }),
  );
}

export async function getAuditLogs(req: Request, res: Response) {
  const { page, limit, skip, sort } = parseListQuery(
    req.query,
    ["createdAt", "action", "targetType"],
    "createdAt",
    -1,
  );
  const filters = z
    .object({
      targetType: z.enum(["user", "task", "project"]).optional(),
      action: z.string().min(1).optional(),
    })
    .parse(req.query);

  const query: Record<string, unknown> = {};
  if (filters.targetType) query.targetType = filters.targetType;
  if (filters.action) query.action = { $regex: filters.action, $options: "i" };

  const [items, total] = await Promise.all([
    AuditLogModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("actor", "name email role"),
    AuditLogModel.countDocuments(query),
  ]);

  return res.json(ok({ items, page, limit, total }));
}

export async function getAdminUsers(_req: Request, res: Response) {
  const users = await UserModel.find({})
    .select("name email role avatar department lastSeen isActive createdAt")
    .sort({ createdAt: -1 });
  return res.json(ok(users));
}

