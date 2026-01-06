import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import { validateCreateSpecialty } from "./specialty.schemas.js";

export class SpecialtyController {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async listView(req, res) {
    const specialties = await services.specialtyService.findAll();
    res.render("list-specialties", { specialties });
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  createView(req, res) {
    res.render("create-specialty");
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async create(req, res) {
    res.locals.view = "create-specialty";

    const result = await validateCreateSpecialty(req.body);

    if (!result.success) {
      res.status(422).render(res.locals.view, {
        errors: z.treeifyError(result.error),
        values: req.body,
      });
      return;
    }

    const createResult = await services.specialtyService.create(result.data);

    createResult.match(
      () => {
        res.status(201).render(res.locals.view, {
          result: {
            message: "Especialidad creada correctamente.",
            type: "success",
          },
        });
      },
      (error) => {
        res.status(error.statusCode).render(res.locals.view, {
          result: { type: "failure", message: error.message },
          values: req.body,
        });
      }
    );
  }
}
