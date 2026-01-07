import { z } from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import {
  validateCreateLocation,
  validateUpdateLocation,
} from "./location.schemas.js";

export class LocationController {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async listView(req, res) {
    const locations = await services.locationService.findAll();
    res.render("list-locations", { locations });
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  createView(req, res) {
    res.render("create-location");
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async create(req, res) {
    res.locals.view = "create-location";

    const result = await validateCreateLocation(req.body);

    if (!result.success) {
      res.status(422).render(res.locals.view, {
        errors: z.treeifyError(result.error),
        values: req.body,
      });
      return;
    }

    const createResult = await services.locationService.create(result.data);

    createResult.match(
      () => {
        res.redirect("/locations");
      },
      (error) => {
        /** @type {number} */
        const statusCode =
          "statusCode" in error && typeof error.statusCode === "number"
            ? error.statusCode
            : 500;
        res.status(statusCode).render(res.locals.view, {
          result: { type: "failure", message: error.message },
          values: req.body,
        });
      }
    );
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async update(req, res) {
    const id = parseInt(req.params.id, 10);

    const result = await validateUpdateLocation(req.body);

    if (!result.success) {
      res.redirect("/locations");
      return;
    }

    const updateResult = await services.locationService.update(id, result.data);

    updateResult.match(
      () => {
        res.redirect("/locations");
      },
      () => {
        res.redirect("/locations");
      }
    );
  }
}
