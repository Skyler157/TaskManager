import mongoose, { Schema } from "mongoose";

export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export type ProjectDoc = {
  title: string;
  description?: string;
  color: string;
  icon: string;
  priority: ProjectPriority;
  owner: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  status: ProjectStatus;
  dueDate?: Date | undefined;
  completedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
};

const projectSchema = new Schema<ProjectDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: false, default: "" },
    color: { type: String, required: true, default: "#6366F1" },
    icon: { type: String, required: true, default: "🚀" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    status: {
      type: String,
      enum: ["planning", "active", "on_hold", "completed", "archived"],
      default: "active",
      index: true,
    },
    dueDate: { type: Date, required: false },
    completedAt: { type: Date, required: false },
  },
  { timestamps: true },
);

projectSchema.index({ title: "text", description: "text" });
projectSchema.index({ createdBy: 1, status: 1 });

export const ProjectModel =
  (mongoose.models.Project as mongoose.Model<ProjectDoc>) ||
  mongoose.model<ProjectDoc>("Project", projectSchema);

