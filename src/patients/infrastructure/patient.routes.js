import { Router } from "express";
import { PatientController } from "./patient.controller.js";
import {
  auth,
  checkOwnership,
} from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";
import { upload } from "./multer.middleware.js";

/**
 * @typedef {import('express').Request & { user?: import('../../auth/infrastructure/jwt.js').UserPayload }} AuthenticatedRequest
 */

export const patientRouter = Router();
const patientController = new PatientController();

patientRouter.get("/register", patientController.registerView);

patientRouter.post(
  "/",
  upload.single("nationalIdImage"),
  patientController.register
);

patientRouter.get(
  "/:id",
  auth(),
  checkOwnership(Roles.SECRETARY, Roles.ADMIN),
  patientController.profileView
);

patientRouter.get(
  "/",
  auth(Roles.ADMIN, Roles.SECRETARY),
  patientController.listAll
);
