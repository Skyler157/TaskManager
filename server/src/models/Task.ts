import mongoose, { Schema } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskComment = {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
};

export type TaskAttachment = {
  name: string;
  url: string;
  size: number;
};

export type TaskDoc = {
  title: string;
  description?: string;
  project: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  estimatedHours: number;
  loggedHours: number;
  dueDate?: Date | undefined;
  completedAt?: Date | undefined;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
};

const commentSchema = new Schema<TaskComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const attachmentSchema = new Schema<TaskAttachment>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const taskSchema = new Schema<TaskDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    estimatedHours: { type: Number, required: true, default: 0, min: 0 },
    loggedHours: { type: Number, required: true, default: 0, min: 0 },
    dueDate: { type: Date, required: false },
    completedAt: { type: Date, required: false },
    comments: { type: [commentSchema], default: [] },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true },
);

taskSchema.index({ title: "text", description: "text" });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1, priority: 1 });

export const TaskModel =
  (mongoose.models.Task as mongoose.Model<TaskDoc>) ||
  mongoose.model<TaskDoc>("Task", taskSchema);

