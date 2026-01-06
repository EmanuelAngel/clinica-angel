import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import {
  validateCreateClassification,
  validateUpdateClassification,
} from "./classification.schemas.js";

export class ClassificationController {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async listView(req, res) {
    const classifications = await services.classificationService.findAll();
    res.render("list-classifications", { classifications });
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  createView(req, res) {
    res.render("create-classification");
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async create(req, res) {
    res.locals.view = "create-classification";

    const result = await validateCreateClassification(req.body);

    if (!result.success) {
      res.status(422).render(res.locals.view, {
        errors: z.treeifyError(result.error),
        values: req.body,
      });
      return;
    }

    const createResult = await services.classificationService.create(
      result.data
    );

    createResult.match(
      () => {
        res.redirect("/classifications");
      },
      (error) => {
        res.status(error.statusCode).render(res.locals.view, {
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

    const result = await validateUpdateClassification(req.body);

    if (!result.success) {
      // Redirect back - HTML5 validation should prevent most errors
      res.redirect("/classifications");
      return;
    }

    const updateResult = await services.classificationService.update(
      id,
      result.data
    );

    updateResult.match(
      () => {
        res.redirect("/classifications");
      },
      () => {
        // On error (e.g., duplicate name), just redirect back
        res.redirect("/classifications");
      }
    );
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async delete(req, res) {
    const id = parseInt(req.params.id, 10);

    const deleteResult = await services.classificationService.delete(id);

    deleteResult.match(
      () => {
        res.redirect("/classifications");
      },
      (error) => {
        res.status(error.statusCode).render("list-classifications", {
          result: { type: "failure", message: error.message },
          values: req.body,
          classification: { id },
        });
      }
    );
  }
}
