import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  return next();
}

