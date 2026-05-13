import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { TaskModel } from "../models/Task";
import { ok } from "../utils/apiResponse";

export async function getBurndown(req: Request, res: Response) {
  const { projectId } = z.object({ projectId: z.string().min(1) }).parse(req.params);
  const pid = new mongoose.Types.ObjectId(projectId);

  const tasks = await TaskModel.find({ project: pid }).select("status createdAt dueDate");
  const today = new Date();
  const data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const remaining = tasks.filter((t) => t.status !== "done").length;
    return { date: d.toISOString().slice(0, 10), remaining };
  });

  return res.json(ok({ projectId, points: data }));
}

export async function getVelocity(req: Request, res: Response) {
  const { projectId } = z.object({ projectId: z.string().min(1) }).parse(req.params);
  const pid = new mongoose.Types.ObjectId(projectId);

  const points = await TaskModel.aggregate([
    { $match: { project: pid, status: "done", completedAt: { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
        completed: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  return res.json(ok({ projectId, points }));
}

export async function getMemberStats(_req: Request, res: Response) {
  const stats = await TaskModel.aggregate([
    {
      $group: {
        _id: "$assignedTo",
        total: { $sum: 1 },
        done: {
          $sum: {
            $cond: [{ $eq: ["$status", "done"] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        name: "$user.name",
        email: "$user.email",
        total: 1,
        done: 1,
        completionRate: {
          $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$done", "$total"] }, 100] }],
        },
      },
    },
  ]);
  return res.json(ok(stats));
}

