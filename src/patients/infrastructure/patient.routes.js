import { Router } from "express";
import { PatientController } from "./patient.controller.js";
import { auth } from "../../auth/infrastructure/auth.middleware.js";
import { Roles } from "../../auth/domain/roles.js";
import { upload } from "./multer.middleware.js";
import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * @typedef {import('express').Request & { user?: import('../../auth/infrastructure/jwt.js').UserPayload }} AuthenticatedRequest
 */

export const patientRouter = Router();
const patientController = new PatientController();

/**
 * Middleware to authorize access to patient profile.
 * Allows SECRETARY, ADMIN roles, or the patient owner.
 * @returns {import('express').RequestHandler} Middleware function.
 */
function authorizePatientProfileAccess() {
  return (req, _res, next) => {
    const authReq = /** @type {AuthenticatedRequest} */ (req);
    const user = authReq.user;

    if (!user) {
      throw new CustomError("Debes iniciar sesión para acceder.", 401);
    }

    const patientId = parseInt(req.params.id, 10);
    const isOwner = user.sub === patientId;
    const hasRoleAccess =
      user.role === Roles.SECRETARY || user.role === Roles.ADMIN;

    if (!isOwner && !hasRoleAccess) {
      throw new CustomError("No tienes permisos para acceder aquí.", 403);
    }

    next();
  };
}

patientRouter.get("/register", patientController.registerView);

patientRouter.post(
  "/",
  upload.single("nationalIdImage"),
  patientController.register
);

patientRouter.get(
  "/:id",
  auth(),
  authorizePatientProfileAccess(),
  patientController.profileView
);

patientRouter.get(
  "/",
  auth(Roles.ADMIN, Roles.SECRETARY),
  patientController.listAll
);
