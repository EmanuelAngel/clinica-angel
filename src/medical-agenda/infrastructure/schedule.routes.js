import { Router } from "express";
import { ScheduleController } from "./schedule.controller.js";

export const scheduleRouter = Router();
const controller = new ScheduleController();

scheduleRouter.get("/", controller.listView);
scheduleRouter.get("/create", controller.createView);
scheduleRouter.get("/:id", controller.showView);
scheduleRouter.post("/", controller.create);
