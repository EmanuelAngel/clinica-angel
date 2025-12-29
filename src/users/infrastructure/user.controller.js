import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import { validateBaseUserRegistration } from "./user.schemas.js";

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

    await services.userService.register(result.data);

    res.status(201).render(res.locals.view, {
      result: {
        message: "Usuario registrado correctamente.",
        type: "success",
      },
    });
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
   */
  async show(req, res) {
    const user = await services.userService.getProfile(+req.params.id);

    res.render("user-profile", { user });
  }
}
