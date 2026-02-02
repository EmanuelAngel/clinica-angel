import { Router } from "express";
import { slotRouter } from "./slots/infrastructure/slot.routes.js";

export const apiV1Router = Router();

apiV1Router.use("/slots", slotRouter);
