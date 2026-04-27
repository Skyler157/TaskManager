import type { Request, Response } from "express";
import { z } from "zod";
import { UserModel } from "../models/User";
import { parsePagination } from "../middleware/pagination";
import { ok } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

export async function listUsers(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    UserModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name email role createdAt updatedAt"),
    UserModel.countDocuments({}),
  ]);

  return res.json(ok({ items, page, limit, total }));
}

const updateRoleSchema = z.object({
  role: z.enum(["admin", "manager", "employee"]),
});

export async function updateUserRole(req: Request, res: Response) {
  const { role } = updateRoleSchema.parse(req.body);
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

  const user = await UserModel.findByIdAndUpdate(
    id,
    { role },
    { new: true },
  ).select("name email role createdAt updatedAt");

  if (!user) throw new AppError("User not found", 404);
  return res.json(ok(user, "Role updated"));
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

  const deleted = await UserModel.findByIdAndDelete(id);
  if (!deleted) throw new AppError("User not found", 404);

  return res.json(ok(true, "User deleted"));
}

