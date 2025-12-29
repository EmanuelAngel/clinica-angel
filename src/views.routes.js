import { Router } from "express";
import { userRouter } from "./users/infrastructure/user.routes.js";
import { authRouter } from "./auth/infrastructure/auth.routes.js";
import { auth } from "./auth/infrastructure/auth.middleware.js";
import { Roles } from "./auth/domain/roles.js";

export const viewsRouter = Router();

viewsRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

viewsRouter.get("/example", (req, res) => {
  res.render("example");
});

viewsRouter.get("/", (req, res) => {
  res.render("home");
});

viewsRouter.use("/users", auth(Roles.ADMIN), userRouter);
viewsRouter.use("/auth", authRouter);
