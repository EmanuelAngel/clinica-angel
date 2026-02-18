import { Router } from "express";
import { HealthInsuranceController } from "./health-insurance.controller.js";
import { auth } from "../../auth/infrastructure/auth.middleware.js";

export const healthInsuranceRouter = Router();
const controller = new HealthInsuranceController();

healthInsuranceRouter.get("/", auth(), controller.list);
