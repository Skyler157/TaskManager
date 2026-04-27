import { Router } from "express";
import { deleteUser, listUsers, updateUserRole } from "../controllers/usersController";
import { requireRole } from "../middleware/requireRole";
import { verifyToken } from "../middleware/verifyToken";

export const usersRouter = Router();

usersRouter.use(verifyToken, requireRole("admin"));

usersRouter.get("/", listUsers);
usersRouter.patch("/:id/role", updateUserRole);
usersRouter.delete("/:id", deleteUser);

