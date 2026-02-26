import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import {
  validateCreateGlobalBlock,
  validateUpdateGlobalBlock,
} from "./global-block.schemas.js";

export class GlobalBlockController {
  /**
   * Renders the list of global blocks.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async listView(req, res) {
    const blocks = await services.globalBlockService.findAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    res.render("list-global-blocks", { blocks, today });
  }

  /**
   * Renders the create global block form.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  createView(req, res) {
    res.render("create-global-block");
  }

  /**
   * Handles the creation of a new global block.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async create(req, res) {
    res.locals.view = "create-global-block";

    const result = await validateCreateGlobalBlock(req.body);

    if (!result.success) {
      res.status(422).render(res.locals.view, {
        errors: z.treeifyError(result.error),
        values: req.body,
      });
      return;
    }

    const createResult = await services.globalBlockService.create(result.data);

    createResult.match(
      () => {
        res.redirect("/global-blocks");
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
   * Handles the update of an existing global block.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async update(req, res) {
    const id = parseInt(req.params.id, 10);

    const result = await validateUpdateGlobalBlock(req.body);

    if (!result.success) {
      res.redirect("/global-blocks");
      return;
    }

    const updateResult = await services.globalBlockService.update(
      id,
      result.data
    );

    updateResult.match(
      () => {
        res.redirect("/global-blocks");
      },
      () => {
        res.redirect("/global-blocks");
      }
    );
  }

  /**
   * Handles the deletion of a global block.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async delete(req, res) {
    const id = parseInt(req.params.id, 10);

    const deleteResult = await services.globalBlockService.delete(id);

    deleteResult.match(
      () => {
        res.redirect("/global-blocks");
      },
      (error) => {
        res.status(error.statusCode).render("list-global-blocks", {
          result: { type: "failure", message: error.message },
          blocks: [],
        });
      }
    );
  }
}
