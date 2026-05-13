import mongoose from "mongoose";
import { AuditLogModel } from "../models/AuditLog";

type TargetType = "user" | "task" | "project";

export async function logAudit(input: {
  actorId: string;
  action: string;
  targetType: TargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  const payload: {
    actor: mongoose.Types.ObjectId;
    action: string;
    targetType: TargetType;
    targetId: mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
  } = {
    actor: new mongoose.Types.ObjectId(input.actorId),
    action: input.action,
    targetType: input.targetType,
    targetId: new mongoose.Types.ObjectId(input.targetId),
  };
  if (input.metadata) payload.metadata = input.metadata;
  await AuditLogModel.create(payload);
}

