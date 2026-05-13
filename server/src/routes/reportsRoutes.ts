import { Router } from "express";
import {
  getBurndown,
  getMemberStats,
  getVelocity,
} from "../controllers/reportsController";
import { requireRole } from "../middleware/requireRole";
import { verifyToken } from "../middleware/verifyToken";

export const reportsRouter = Router();

reportsRouter.use(verifyToken, requireRole("admin", "manager"));
reportsRouter.get("/burndown/:projectId", getBurndown);
reportsRouter.get("/velocity/:projectId", getVelocity);
reportsRouter.get("/member-stats", getMemberStats);

