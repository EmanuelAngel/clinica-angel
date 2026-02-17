import { services } from "../../_shared/infrastructure/services-container.js";

/**
 * @import { Request, Response } from 'express'
 */

export class HealthInsuranceController {
  /**
   * @param {Request} req
   * @param {Response} res
   */
  async list(req, res) {
    const healthInsurances = await services.healthInsuranceService.findAll({
      includeDeleted: true,
    });

    res.render("health-insurances-list", {
      healthInsurances,
    });
  }
}
