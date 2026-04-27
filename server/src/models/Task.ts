import mongoose, { Schema } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskComment = {
  author: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
};

export type TaskDoc = {
  title: string;
  description?: string;
  project: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | undefined;
  completedAt?: Date | undefined;
  comments: TaskComment[];
  createdAt: Date;
  updatedAt: Date;
};

const commentSchema = new Schema<TaskComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
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
    dueDate: { type: Date, required: false },
    completedAt: { type: Date, required: false },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true },
);

taskSchema.index({ title: "text", description: "text" });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1, priority: 1 });

export const TaskModel =
  (mongoose.models.Task as mongoose.Model<TaskDoc>) ||
  mongoose.model<TaskDoc>("Task", taskSchema);

