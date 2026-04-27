import mongoose, { Schema } from "mongoose";

export type ProjectStatus = "active" | "archived";

export type ProjectDoc = {
  title: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
};

const projectSchema = new Schema<ProjectDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: false, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { timestamps: true },
);

projectSchema.index({ title: "text", description: "text" });
projectSchema.index({ createdBy: 1, status: 1 });

export const ProjectModel =
  (mongoose.models.Project as mongoose.Model<ProjectDoc>) ||
  mongoose.model<ProjectDoc>("Project", projectSchema);

