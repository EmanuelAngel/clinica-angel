import { Router } from "express";
import { UserController } from "./user.controller.js";
import {
  auth,
  checkOwnership,
} from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";

export const userRouter = Router();
const userController = new UserController();

userRouter.get("/register", userController.registerView);
userRouter.post("/", userController.register);
userRouter.get("/", userController.listAll);
userRouter.get(
  "/:id",
  auth(),
  checkOwnership(Roles.ADMIN),
  userController.show
);
