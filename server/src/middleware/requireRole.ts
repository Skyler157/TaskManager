import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types/roles";
import { AppError } from "../utils/errors";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);
    if (!roles.includes(req.auth.role)) throw new AppError("Forbidden", 403);
    return next();
  };
}

