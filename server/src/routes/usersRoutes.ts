import { Router } from "express";
import {
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
  updateUserRole,
} from "../controllers/usersController";
import { requireRole } from "../middleware/requireRole";
import { verifyToken } from "../middleware/verifyToken";

export const usersRouter = Router();

usersRouter.use(verifyToken);

usersRouter.get("/", requireRole("admin", "manager"), listUsers);
usersRouter.get("/:id", getUserById);
usersRouter.patch("/:id", updateUser);
usersRouter.patch("/:id/role", requireRole("admin"), updateUserRole);
usersRouter.delete("/:id", requireRole("admin"), deleteUser);

