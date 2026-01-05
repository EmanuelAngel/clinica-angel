import z from "zod";
import { env } from "../../_shared/infrastructure/env-variables.js";
import { services } from "../../_shared/infrastructure/services-container.js";
import { validateLogin } from "./auth.schemas.js";
import { generateToken } from "./jwt.js";
import { Roles } from "../domain/roles.js";

export class AuthController {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async loginView(req, res) {
    res.render("login");
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async login(req, res) {
    res.locals.view = "login";

    const result = await validateLogin(req.body);

    if (!result.success) {
      res.status(422).render("login", {
        errors: z.treeifyError(result.error),
        values: req.body,
      });

      return;
    }

    const authResult = await services.authService.authenticate(result.data);

    authResult.match(
      (user) => {
        const token = generateToken(
          {
            sub: user.id,
            role: /** @type {import("../domain/roles.js").Role} */ (user.role),
          },
          {
            expiresIn: env.JWT_EXPIRES,
          }
        );

        res.cookie("access_token", token, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: env.COOKIE_MAX_AGE,
        });

        // Redirect based on user role
        if (user.role === Roles.PATIENT) {
          res.redirect(`/patients/${user.id}`);
        } else {
          res.redirect("/users");
        }
      },
      (error) => {
        res.status(error.statusCode).render("login", {
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
  async logout(req, res) {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    });

    if (req.accepts("html")) {
      res.redirect("/auth/login");
    } else {
      res.status(200).json({ message: "Sesión cerrada correctamente." });
    }
  }
}
