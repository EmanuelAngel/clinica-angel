import { Router } from "express";
import { auth } from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";
import { services } from "../../_shared/infrastructure/services-container.js";

export const professionalApiRouter = Router();

professionalApiRouter.use(auth(Roles.SECRETARY, Roles.ADMIN));

/**
 * GET /api/v1/professionals
 * List all active professionals with their specialties.
 */
professionalApiRouter.get("/", async (_req, res) => {
  const professionals = await services.professionalService.findAll();

  const data = professionals.map((p) => ({
    id: p.id,
    name: `${p.lastNames}, ${p.firstNames}`,
    specialties: p.credentials.map((c) => ({
      id: c.specialtyId,
      name: c.specialtyName,
    })),
  }));

  res.status(200).json(data);
  return;
});
