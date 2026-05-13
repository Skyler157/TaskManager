import mongoose, { Schema } from "mongoose";
import type { Role } from "../types/roles";

export type UserDoc = {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatar?: string;
  department?: string;
  lastSeen?: Date;
  isActive: boolean;
  refreshToken?: string;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },
    avatar: { type: String, required: false, default: "" },
    department: { type: String, required: false, default: "General", index: true },
    lastSeen: { type: Date, required: false },
    isActive: { type: Boolean, required: true, default: true, index: true },
    refreshToken: { type: String, required: false, select: false },
    refreshTokenHash: { type: String, required: false, select: false },
  },
  { timestamps: true },
);

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema);

