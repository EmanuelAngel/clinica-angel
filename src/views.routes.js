import { Router } from "express";
import { userRouter } from "./users/infrastructure/user.routes.js";
import { authRouter } from "./auth/infrastructure/auth.routes.js";
import { auth } from "./auth/infrastructure/auth.middleware.js";
import { Roles } from "./auth/domain/roles.js";
import { patientRouter } from "./patients/infrastructure/patient.routes.js";
import { specialtyRouter } from "./specialties/infrastructure/specialty.routes.js";
import { professionalRouter } from "./professionals/infrastructure/professional.routes.js";
import { classificationRouter } from "./classifications/infrastructure/classification.routes.js";

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
viewsRouter.use("/patients", patientRouter);
viewsRouter.use("/specialties", auth(Roles.ADMIN), specialtyRouter);
viewsRouter.use("/professionals", auth(Roles.ADMIN), professionalRouter);
viewsRouter.use("/classifications", auth(Roles.ADMIN), classificationRouter);
