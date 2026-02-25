import { Router } from "express";
import { auth } from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";
import { services } from "../../_shared/infrastructure/services-container.js";

export const specialtyApiRouter = Router();

specialtyApiRouter.use(auth(Roles.SECRETARY, Roles.ADMIN));

/**
 * GET /api/v1/specialties
 * List all active specialties.
 */
specialtyApiRouter.get("/", async (_req, res) => {
  const specialties = await services.specialtyService.findAll();

  const data = specialties.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  res.status(200).json(data);
  return;
});
