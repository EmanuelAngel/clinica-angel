import { Router } from "express";
import { WaitingListController } from "./waiting-list.controller.js";
import { auth } from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";

export const waitingListRouter = Router();
const controller = new WaitingListController();

// All routes require SECRETARY or ADMIN
waitingListRouter.use(auth(Roles.SECRETARY, Roles.ADMIN));

// POST /api/v1/waiting-list - Add patient to waiting list
waitingListRouter.post("/", controller.create);

// GET /api/v1/waiting-list - List waiting list entries
waitingListRouter.get("/", controller.list);

// DELETE /api/v1/waiting-list/:id - Remove entry from waiting list
waitingListRouter.delete("/:id", controller.remove);
