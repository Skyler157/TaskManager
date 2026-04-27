import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { fail } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json(fail("Validation failed", err.flatten()));
  }

  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(fail(err.message, err.details));
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json(fail("Internal server error"));
}

