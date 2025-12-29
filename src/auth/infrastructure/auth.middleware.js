/**
 * @typedef {import('express').Request & { user?: import('./jwt.js').UserPayload }} AuthenticatedRequest
 */

import { CustomError } from "../../_shared/domain/custom-error.js";
import { verifyToken } from "./jwt.js";

/**
 * Multi-role authentication and authorization middleware.
 * @param {...import("../domain/roles.js").Role} allowedRoles
 * @returns {import('express').RequestHandler} Middleware function.
 */
export function auth(...allowedRoles) {
  return (req, res, next) => {
    const authReq = /** @type {AuthenticatedRequest} */ (req);
    const token = req.cookies.access_token;

    if (!token) {
      throw new CustomError("Debes iniciar sesión para acceder.", 401);
    }

    try {
      const decoded = verifyToken(token);

      if (allowedRoles.length > 0) {
        if (!allowedRoles.includes(decoded.role)) {
          throw new CustomError("No tienes permisos para acceder aquí.", 403);
        }
      }

      authReq.user = decoded;
      res.locals.user = decoded;

      next();
    } catch (error) {
      if (error instanceof CustomError) throw error;

      res.clearCookie("access_token");
      throw new CustomError("Sesión inválida o expirada.", 401);
    }
  };
}
