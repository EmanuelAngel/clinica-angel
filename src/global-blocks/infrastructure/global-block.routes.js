import { Router } from "express";
import { GlobalBlockController } from "./global-block.controller.js";

export const globalBlockRouter = Router();
const globalBlockController = new GlobalBlockController();

globalBlockRouter.get("/", globalBlockController.listView);
globalBlockRouter.get("/create", globalBlockController.createView);
globalBlockRouter.post("/", globalBlockController.create);
globalBlockRouter.post("/:id", globalBlockController.update);
globalBlockRouter.post("/:id/delete", globalBlockController.delete);
