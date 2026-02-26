import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import {
  validateBaseUserRegistration,
  validateUpdateProfile,
} from "./user.schemas.js";
import { sendNotFound } from "../../_shared/infrastructure/response-helpers.js";

export class UserController {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  registerView(req, res) {
    res.render("register-user");
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async register(req, res) {
    res.locals.view = "register-user";

    const result = await validateBaseUserRegistration(req.body);

    if (!result.success) {
      res.status(422).render(res.locals.view, {
        errors: z.treeifyError(result.error),
        values: req.body,
      });

      return;
    }

    const registerResult = await services.userService.register(result.data);

    registerResult.match(
      () => {
        res.status(201).render(res.locals.view, {
          result: {
            message: "Usuario registrado correctamente.",
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

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async listAll(req, res) {
    const users = await services.userService.listAll();

    res.render("list-all-users", { users });
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @param {import("express").NextFunction} next
   */
  async show(req, res, next) {
    const result = await services.userService.getProfile(+req.params.id);

    result.match(
      (user) => {
        res.render("user-profile", { user });
      },
      (error) => {
        // If it's a 404, let the not-found-handler handle it.
        if (error.statusCode == 404) {
          sendNotFound(req, res, error.message);
          return;
        }

        next(error);
      }
    );
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @param {import("express").NextFunction} next
   */
  async editView(req, res, next) {
    const result = await services.userService.getProfile(+req.params.id);

    result.match(
      (user) => {
        res.render("edit-user", { user });
      },
      (error) => {
        if (error.statusCode == 404) {
          sendNotFound(req, res, error.message);
          return;
        }

        next(error);
      }
    );
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async update(req, res) {
    const userId = +req.params.id;

    const profileResult = await services.userService.getProfile(userId);

    if (profileResult.isErr()) {
      sendNotFound(req, res, profileResult.error.message);
      return;
    }

    const user = profileResult.value;
    const result = await validateUpdateProfile(req.body);

    if (!result.success) {
      res.status(422).render("edit-user", {
        errors: z.treeifyError(result.error),
        values: req.body,
        user,
      });

      return;
    }

    const updateResult = await services.userService.updateProfile(
      userId,
      result.data
    );

    updateResult.match(
      () => {
        res.redirect(`/users/${userId}`);
      },
      (error) => {
        res.status(error.statusCode).render("edit-user", {
          result: { type: "failure", message: error.message },
          values: req.body,
          user,
        });
      }
    );
  }
}
