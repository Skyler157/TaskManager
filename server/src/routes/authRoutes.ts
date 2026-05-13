import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/authController";
import { verifyToken } from "../middleware/verifyToken";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", verifyToken, me);

