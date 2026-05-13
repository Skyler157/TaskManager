import type { Request, Response } from "express";
import { z } from "zod";
import { UserModel } from "../models/User";
import { parseListQuery } from "../middleware/pagination";
import { ok } from "../utils/apiResponse";
import { AppError } from "../utils/errors";
import { logAudit } from "../services/auditService";

export async function listUsers(req: Request, res: Response) {
  const { page, limit, skip, sort } = parseListQuery(
    req.query,
    ["createdAt", "updatedAt", "name", "email", "lastSeen"],
    "createdAt",
    -1,
  );
  const roleFilter = z
    .object({ role: z.enum(["admin", "manager", "employee"]).optional() })
    .parse(req.query).role;
  const filter = roleFilter ? { role: roleFilter } : {};

  const [items, total] = await Promise.all([
    UserModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("name email role avatar department isActive lastSeen createdAt updatedAt"),
    UserModel.countDocuments(filter),
  ]);

  return res.json(ok({ items, page, limit, total }));
}

export async function getUserById(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (req.auth.role !== "admin" && req.auth.userId !== id) {
    throw new AppError("Forbidden", 403);
  }
  const user = await UserModel.findById(id).select(
    "name email role avatar department isActive lastSeen createdAt updatedAt",
  );
  if (!user) throw new AppError("User not found", 404);
  return res.json(ok(user));
}

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().url().or(z.literal("")).optional(),
  department: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function updateUser(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = updateProfileSchema.parse(req.body);

  if (req.auth.role !== "admin" && req.auth.userId !== id) {
    throw new AppError("Forbidden", 403);
  }
  if (req.auth.role !== "admin" && typeof body.isActive !== "undefined") {
    throw new AppError("Forbidden", 403);
  }

  const user = await UserModel.findByIdAndUpdate(id, body, { new: true }).select(
    "name email role avatar department isActive lastSeen createdAt updatedAt",
  );
  if (!user) throw new AppError("User not found", 404);
  return res.json(ok(user, "User updated"));
}

const updateRoleSchema = z.object({
  role: z.enum(["admin", "manager", "employee"]),
});

export async function updateUserRole(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { role } = updateRoleSchema.parse(req.body);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

  const user = await UserModel.findByIdAndUpdate(
    id,
    { role },
    { new: true },
  ).select("name email role createdAt updatedAt");

  if (!user) throw new AppError("User not found", 404);
  await logAudit({
    actorId: req.auth.userId,
    action: "user.role_update",
    targetType: "user",
    targetId: id,
    metadata: { role },
  });
  return res.json(ok(user, "Role updated"));
}

export async function deleteUser(req: Request, res: Response) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

  const deleted = await UserModel.findByIdAndDelete(id);
  if (!deleted) throw new AppError("User not found", 404);
  await logAudit({
    actorId: req.auth.userId,
    action: "user.delete",
    targetType: "user",
    targetId: id,
  });
  return res.json(ok(true, "User deleted"));
}

