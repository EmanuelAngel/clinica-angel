import { Router } from "express";
import { ScheduleController } from "./schedule.controller.js";
import { auth } from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";

export const scheduleRouter = Router();
const scheduleController = new ScheduleController();

scheduleRouter.post("/", auth(Roles.ADMIN), scheduleController.create);
scheduleRouter.get("/create", auth(Roles.ADMIN), scheduleController.showCreate);
scheduleRouter.get("/list", auth(Roles.ADMIN), scheduleController.renderList);
scheduleRouter.get(
  "/details/:id",
  auth(Roles.ADMIN),
  scheduleController.showDetails
);
scheduleRouter.get("/compare", scheduleController.showComparison);
scheduleRouter.get("/slots/:id", auth(), scheduleController.getSlotDetails);
scheduleRouter.patch(
  "/slots/:id/status",
  auth(),
  scheduleController.updateSlotStatus
);
