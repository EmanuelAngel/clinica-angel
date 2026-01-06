import { Router } from "express";
import { ClassificationController } from "./classification.controller.js";

export const classificationRouter = Router();
const classificationController = new ClassificationController();

classificationRouter.get("/", classificationController.listView);
classificationRouter.get("/create", classificationController.createView);
classificationRouter.post("/", classificationController.create);
classificationRouter.post("/:id", classificationController.update);
classificationRouter.post("/:id/delete", classificationController.delete);
