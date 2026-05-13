import { Router } from "express";
import {
  addProjectMembers,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/projectsController";
import { requireRole } from "../middleware/requireRole";
import { verifyToken } from "../middleware/verifyToken";

export const projectsRouter = Router();

projectsRouter.use(verifyToken);

projectsRouter.get("/", listProjects);
projectsRouter.post("/", requireRole("admin", "manager"), createProject);
projectsRouter.get("/:id", getProject);
projectsRouter.patch("/:id", updateProject);
projectsRouter.delete("/:id", requireRole("admin", "manager"), deleteProject);
projectsRouter.post("/:id/members", requireRole("admin", "manager"), addProjectMembers);

