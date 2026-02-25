import { Router } from "express";
import { slotRouter } from "./slots/infrastructure/slot.routes.js";
import { waitingListRouter } from "./waiting-list/infrastructure/waiting-list.routes.js";
import { patientApiRouter } from "./patients/infrastructure/patient-api.routes.js";
import { professionalApiRouter } from "./professionals/infrastructure/professional-api.routes.js";
import { specialtyApiRouter } from "./specialties/infrastructure/specialty-api.routes.js";

export const apiV1Router = Router();

apiV1Router.use("/slots", slotRouter);
apiV1Router.use("/waiting-list", waitingListRouter);
apiV1Router.use("/patients", patientApiRouter);
apiV1Router.use("/professionals", professionalApiRouter);
apiV1Router.use("/specialties", specialtyApiRouter);
