import { Router } from "express";
import { LocationController } from "./location.controller.js";

export const locationRouter = Router();
const locationController = new LocationController();

locationRouter.get("/", locationController.listView);
locationRouter.get("/create", locationController.createView);
locationRouter.post("/", locationController.create);
locationRouter.post("/:id", locationController.update);
