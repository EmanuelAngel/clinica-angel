import { Router } from "express";
import { SpecialtyController } from "./specialty.controller.js";

export const specialtyRouter = Router();
const specialtyController = new SpecialtyController();

specialtyRouter.get("/", specialtyController.listView);
specialtyRouter.get("/create", specialtyController.createView);
specialtyRouter.post("/", specialtyController.create);
