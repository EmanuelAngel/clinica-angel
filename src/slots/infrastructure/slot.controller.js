import { ReserveSlotSchema } from "./slot.schemas.js";
import { Roles } from "../../auth/domain/roles.js";
import { services } from "../../_shared/infrastructure/services-container.js";

/**
 * @import { AuthenticatedRequest } from "../../auth/infrastructure/jwt.js";
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 * @typedef {import("express").NextFunction} NextFunction
 */

export class SlotController {
  /**
   * POST /api/v1/slots/:id/reserve
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async reserve(req, res, _next) {
    const slotId = parseInt(req.params.id, 10);
    const { role, sub: userId } = req.user;

    // Validate body
    const parseResult = ReserveSlotSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(422).json({
        message: parseResult.error.issues[0].message,
      });
      return;
    }

    const { consultationReason } = parseResult.data;

    // PATIENT can only reserve for themselves
    // Non-PATIENT roles must provide patientId in the body
    /** @type {number | null} */
    let patientId;
    if (role === Roles.PATIENT) {
      patientId = userId;
    } else {
      patientId = req.body.patientId ? parseInt(req.body.patientId, 10) : null;
    }

    if (!patientId) {
      res.status(422).json({
        message: "El ID del paciente es obligatorio.",
      });
      return;
    }

    const result = await services.slotService.reserve(
      slotId,
      role,
      patientId,
      consultationReason
    );

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: "Turno reservado exitosamente." });
    return;
  }

  /**
   * PATCH /api/v1/slots/:id/status - Confirm
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async confirm(req, res, _next) {
    const slotId = parseInt(req.params.id, 10);
    const { role } = req.user;

    const result = await services.slotService.confirm(slotId, role);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: "Turno confirmado exitosamente." });
    return;
  }

  /**
   * PATCH /api/v1/slots/:id/status - Cancel
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async cancel(req, res, _next) {
    const slotId = parseInt(req.params.id, 10);
    const { role } = req.user;

    const result = await services.slotService.cancel(slotId, role);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: "Turno cancelado exitosamente." });
    return;
  }

  /**
   * PATCH /api/v1/slots/:id/status - Mark as arrived
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async markArrived(req, res, _next) {
    const slotId = parseInt(req.params.id, 10);
    const { role } = req.user;

    const result = await services.slotService.markArrived(slotId, role);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: "Paciente marcado como presente." });
    return;
  }

  /**
   * PATCH /api/v1/slots/:id/status - Mark as no-show
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async markNoShow(req, res, _next) {
    const slotId = parseInt(req.params.id, 10);
    const { role } = req.user;

    const result = await services.slotService.markNoShow(slotId, role);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: "Paciente marcado como ausente." });
    return;
  }

  /**
   * PATCH /api/v1/slots/:id/status - Start consultation
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async startConsultation(req, res, _next) {
    const slotId = parseInt(req.params.id, 10);
    const { role } = req.user;

    const result = await services.slotService.startConsultation(slotId, role);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: "Consulta iniciada." });
    return;
  }

  /**
   * PATCH /api/v1/slots/:id/status - Mark as fulfilled
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async markFulfilled(req, res, _next) {
    const slotId = parseInt(req.params.id, 10);
    const { role } = req.user;

    const result = await services.slotService.markFulfilled(slotId, role);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: "Consulta finalizada." });
    return;
  }

  /**
   * POST /api/v1/slots/:id/release
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async release(req, res, _next) {
    const slotId = parseInt(req.params.id, 10);
    const { role } = req.user;

    const result = await services.slotService.release(slotId, role);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(200).json({ message: "Turno liberado exitosamente." });
    return;
  }
}
