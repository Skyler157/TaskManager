import type { Request, Response } from "express";
import { z } from "zod";
import { UserModel } from "../models/User";
import { hashPassword, verifyPassword } from "../services/passwordService";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/tokenService";
import { ok } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie("refreshToken", { path: "/api/auth" });
}

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const existing = await UserModel.findOne({ email: body.email });
  if (existing) throw new AppError("Email already in use", 409);

  const passwordHash = await hashPassword(body.password);
  const user = await UserModel.create({
    name: body.name,
    email: body.email,
    passwordHash,
    role: "employee",
  });

  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);
  return res.json(
    ok(
      {
        accessToken,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      },
      "Registered",
    ),
  );
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const user = await UserModel.findOne({ email: body.email }).select("+passwordHash +refreshTokenHash");
  if (!user) throw new AppError("Invalid credentials", 401);

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) throw new AppError("Invalid credentials", 401);

  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);
  return res.json(
    ok(
      {
        accessToken,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      },
      "Logged in",
    ),
  );
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) throw new AppError("Unauthorized", 401);

  let payload: { userId: string; role: "admin" | "manager" | "employee" };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Unauthorized", 401);
  }

  const user = await UserModel.findById(payload.userId).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) throw new AppError("Unauthorized", 401);

  const incomingHash = hashRefreshToken(token);
  if (incomingHash !== user.refreshTokenHash) throw new AppError("Unauthorized", 401);

  // rotation: replace refresh token hash each refresh
  const newAccessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const newRefreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

  user.refreshTokenHash = hashRefreshToken(newRefreshToken);
  await user.save();

  setRefreshCookie(res, newRefreshToken);
  return res.json(ok({ accessToken: newAccessToken }, "Refreshed"));
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await UserModel.updateOne({ _id: payload.userId }, { $unset: { refreshTokenHash: "" } });
    } catch {
      // ignore invalid token
    }
  }
  clearRefreshCookie(res);
  return res.json(ok(true, "Logged out"));
}

