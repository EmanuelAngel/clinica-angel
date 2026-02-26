import { Router } from "express";
import { ProfessionalController } from "./professional.controller.js";
import {
  auth,
  checkOwnership,
} from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";

export const professionalRouter = Router();
const professionalController = new ProfessionalController();

professionalRouter.get("/", professionalController.listView);
professionalRouter.get("/create", professionalController.createView);
professionalRouter.post("/", professionalController.create);

professionalRouter.get(
  "/:id/profile",
  auth(),
  checkOwnership(Roles.ADMIN),
  professionalController.profileView
);

professionalRouter.post(
  "/:id/specialties",
  auth(Roles.ADMIN),
  professionalController.addSpecialty
);
