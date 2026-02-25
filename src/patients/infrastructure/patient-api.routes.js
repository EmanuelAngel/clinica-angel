import { Router } from "express";
import { auth } from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";
import { services } from "../../_shared/infrastructure/services-container.js";

export const patientApiRouter = Router();

// All routes require SECRETARY or ADMIN
patientApiRouter.use(auth(Roles.SECRETARY, Roles.ADMIN));

/**
 * GET /api/v1/patients/search?dni=12345678
 * Search for a patient by DNI.
 */
patientApiRouter.get("/search", async (req, res) => {
  const { dni } = req.query;

  if (!dni || typeof dni !== "string" || dni.trim().length === 0) {
    res.status(422).json({ message: "El DNI es obligatorio." });
    return;
  }

  const patient = await services.patientService.findByNationalId(dni.trim());

  if (!patient) {
    res.status(404).json({ message: "Paciente no encontrado." });
    return;
  }

  res.status(200).json({
    id: patient.id,
    firstNames: patient.firstNames,
    lastNames: patient.lastNames,
    nationalId: patient.nationalId,
    phone: patient.phone,
    email: patient.email,
  });
  return;
});
