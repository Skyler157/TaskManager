import mongoose, { Schema } from "mongoose";

export type AuditTargetType = "user" | "task" | "project";

export type AuditLogDoc = {
  actor: mongoose.Types.ObjectId;
  action: string;
  targetType: AuditTargetType;
  targetId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: {
      type: String,
      enum: ["user", "task", "project"],
      required: true,
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1, actor: 1, targetType: 1 });

export const AuditLogModel =
  (mongoose.models.AuditLog as mongoose.Model<AuditLogDoc>) ||
  mongoose.model<AuditLogDoc>("AuditLog", auditLogSchema);

