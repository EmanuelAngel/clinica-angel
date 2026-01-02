import { Router } from "express";
import { PatientController } from "./patient.controller.js";
import { auth } from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";
import { upload } from "./multer.middleware.js";

export const patientRouter = Router();
const patientController = new PatientController();

patientRouter.get("/register", patientController.registerView);

patientRouter.post(
  "/",
  upload.single("nationalIdImage"),
  patientController.register
);

patientRouter.get("/:id", auth(), patientController.profileView);

patientRouter.get(
  "/",
  auth(Roles.ADMIN, Roles.SECRETARY),
  patientController.listAll
);
