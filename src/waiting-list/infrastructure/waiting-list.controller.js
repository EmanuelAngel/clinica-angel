import {
  CreateWaitlistSchema,
  ListWaitlistQuerySchema,
} from "./waiting-list.schemas.js";
import { services } from "../../_shared/infrastructure/services-container.js";

/**
 * @typedef {import("../../auth/infrastructure/jwt.js").AuthenticatedRequest} AuthenticatedRequest
 * @typedef {import("express").Response} Response
 * @typedef {import("express").NextFunction} NextFunction
 */

export class WaitingListController {
  /**
   * POST /api/v1/waiting-list
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async create(req, res, _next) {
    const parseResult = CreateWaitlistSchema.safeParse(req.body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      res.status(422).json({ message: firstIssue.message });
      return;
    }

    const result = await services.waitingListService.create(parseResult.data);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(201).json({
      message: "Paciente agregado a la lista de espera.",
      data: result.value,
    });
    return;
  }

  /**
   * GET /api/v1/waiting-list
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async list(req, res, _next) {
    const parseResult = ListWaitlistQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      res.status(422).json({ message: firstIssue.message });
      return;
    }

    const result = await services.waitingListService.list(parseResult.data);

    res.status(200).json(result);
    return;
  }

  /**
   * DELETE /api/v1/waiting-list/:id
   * @param {AuthenticatedRequest} req
   * @param {Response} res
   * @param {NextFunction} _next
   * @returns {Promise<void>}
   */
  async remove(req, res, _next) {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(422).json({ message: "ID inválido." });
      return;
    }

    const result = await services.waitingListService.delete(id);

    if (result.isErr()) {
      const error = result.error;
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res
      .status(200)
      .json({ message: "Paciente liberado de la lista de espera." });
    return;
  }
}
