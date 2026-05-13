import { Router } from "express";
import {
  getAdminOverview,
  getAdminUsers,
  getAuditLogs,
} from "../controllers/adminController";
import { requireRole } from "../middleware/requireRole";
import { verifyToken } from "../middleware/verifyToken";

export const adminRouter = Router();

adminRouter.use(verifyToken, requireRole("admin"));
adminRouter.get("/overview", getAdminOverview);
adminRouter.get("/audit-logs", getAuditLogs);
adminRouter.get("/users", getAdminUsers);

