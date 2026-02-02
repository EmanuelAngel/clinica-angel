import { Router } from "express";
import { SlotController } from "./slot.controller.js";
import { services } from "../../_shared/infrastructure/services-container.js";
import { auth } from "../../auth/infrastructure/auth.middleware.js";

export const slotRouter = Router();
const slotController = new SlotController(services.slotService);

// All routes require authentication
slotRouter.use(auth());

// POST /api/v1/slots/:id/reserve - Reserve a slot (requires body with consultationReason)
slotRouter.post("/:id/reserve", slotController.reserve);

// PATCH /api/v1/slots/:id/status - Status transitions
slotRouter.patch("/:id/confirm", slotController.confirm);
slotRouter.patch("/:id/cancel", slotController.cancel);
slotRouter.patch("/:id/arrive", slotController.markArrived);
slotRouter.patch("/:id/no-show", slotController.markNoShow);
slotRouter.patch("/:id/start", slotController.startConsultation);
slotRouter.patch("/:id/fulfill", slotController.markFulfilled);

// POST /api/v1/slots/:id/release - Release a slot (hard reset)
slotRouter.post("/:id/release", slotController.release);
