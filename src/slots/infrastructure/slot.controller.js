import { ReserveSlotSchema } from "./slot.schemas.js";
import { Roles } from "../../auth/domain/roles.js";

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 * @typedef {import("express").NextFunction} NextFunction
 * @typedef {import("../application/slot.service.js").SlotService} SlotService
 */

export class SlotController {
  /**
   * @param {SlotService} slotService
   */
  constructor(slotService) {
    this.slotService = slotService;
  }

  /**
   * POST /api/v1/slots/:id/reserve
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   */
  reserve = async (req, res, next) => {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { role, sub: userId } = req.user;

      // Validate body
      const parseResult = ReserveSlotSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(422).json({
          message: parseResult.error.issues[0].message,
        });
      }

      const { consultationReason } = parseResult.data;

      // PATIENT can only reserve for themselves
      // Non-PATIENT roles must provide patientId in the body
      /** @type {number | null} */
      let patientId;
      if (role === Roles.PATIENT) {
        patientId = userId;
      } else {
        patientId = req.body.patientId
          ? parseInt(req.body.patientId, 10)
          : null;
      }

      if (!patientId) {
        return res.status(422).json({
          message: "El ID del paciente es obligatorio.",
        });
      }

      const result = await this.slotService.reserve(
        slotId,
        role,
        patientId,
        consultationReason
      );

      if (result.isErr()) {
        const error = result.error;
        return res.status(error.statusCode).json({ message: error.message });
      }

      return res.status(200).json({ message: "Turno reservado exitosamente." });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/slots/:id/status - Confirm
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   */
  confirm = async (req, res, next) => {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { role } = req.user;

      const result = await this.slotService.confirm(slotId, role);

      if (result.isErr()) {
        const error = result.error;
        return res.status(error.statusCode).json({ message: error.message });
      }

      return res
        .status(200)
        .json({ message: "Turno confirmado exitosamente." });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/slots/:id/status - Cancel
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   */
  cancel = async (req, res, next) => {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { role } = req.user;

      const result = await this.slotService.cancel(slotId, role);

      if (result.isErr()) {
        const error = result.error;
        return res.status(error.statusCode).json({ message: error.message });
      }

      return res.status(200).json({ message: "Turno cancelado exitosamente." });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/slots/:id/status - Mark as arrived
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   */
  markArrived = async (req, res, next) => {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { role } = req.user;

      const result = await this.slotService.markArrived(slotId, role);

      if (result.isErr()) {
        const error = result.error;
        return res.status(error.statusCode).json({ message: error.message });
      }

      return res
        .status(200)
        .json({ message: "Paciente marcado como presente." });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/slots/:id/status - Mark as no-show
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   */
  markNoShow = async (req, res, next) => {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { role } = req.user;

      const result = await this.slotService.markNoShow(slotId, role);

      if (result.isErr()) {
        const error = result.error;
        return res.status(error.statusCode).json({ message: error.message });
      }

      return res
        .status(200)
        .json({ message: "Paciente marcado como ausente." });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/slots/:id/status - Start consultation
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   */
  startConsultation = async (req, res, next) => {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { role } = req.user;

      const result = await this.slotService.startConsultation(slotId, role);

      if (result.isErr()) {
        const error = result.error;
        return res.status(error.statusCode).json({ message: error.message });
      }

      return res.status(200).json({ message: "Consulta iniciada." });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/slots/:id/status - Mark as fulfilled
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   */
  markFulfilled = async (req, res, next) => {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { role } = req.user;

      const result = await this.slotService.markFulfilled(slotId, role);

      if (result.isErr()) {
        const error = result.error;
        return res.status(error.statusCode).json({ message: error.message });
      }

      return res.status(200).json({ message: "Consulta finalizada." });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/slots/:id/release
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   */
  release = async (req, res, next) => {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { role } = req.user;

      const result = await this.slotService.release(slotId, role);

      if (result.isErr()) {
        const error = result.error;
        return res.status(error.statusCode).json({ message: error.message });
      }

      return res.status(200).json({ message: "Turno liberado exitosamente." });
    } catch (error) {
      next(error);
    }
  };
}
