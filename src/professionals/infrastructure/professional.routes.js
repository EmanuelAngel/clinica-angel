import { Router } from "express";
import { ProfessionalController } from "./professional.controller.js";

export const professionalRouter = Router();
const professionalController = new ProfessionalController();

professionalRouter.get("/", professionalController.listView);
professionalRouter.get("/create", professionalController.createView);
professionalRouter.post("/", professionalController.create);
professionalRouter.get("/:id", professionalController.show);
