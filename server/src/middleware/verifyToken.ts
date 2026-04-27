import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/tokenService";
import { AppError } from "../utils/errors";

export function verifyToken(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw new AppError("Unauthorized", 401);

  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch {
    throw new AppError("Unauthorized", 401);
  }
}

