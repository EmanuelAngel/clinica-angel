import { Router } from "express";
import { AuthController } from "./auth.controller.js";

export const authRouter = Router();
const authController = new AuthController();

authRouter.get("/login", authController.loginView);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
