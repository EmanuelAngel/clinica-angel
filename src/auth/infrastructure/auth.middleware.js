/**
 * @typedef {import('express').Request & { user?: import('./jwt.js').UserPayload }} AuthenticatedRequest
 */

import { SessionMissingError, ForbiddenError } from "../domain/auth.errors.js";
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
      return next(new SessionMissingError());
    }

    const result = verifyToken(token);

    if (result.isErr()) {
      res.clearCookie("access_token");
      return next(result.error);
    }

    const decoded = result.value;

    if (allowedRoles.length > 0) {
      if (!allowedRoles.includes(decoded.role)) {
        return next(new ForbiddenError());
      }
    }

    authReq.user = decoded;
    res.locals.user = decoded;

    next();
  };
}

/**
 * Middleware to check ownership of a resource (User ID matches Route ID)
 * or if the user has one of the allowed roles.
 *
 * Assumes the resource ID is passed as a route parameter named 'id' (req.params.id).
 * @param {...import("../domain/roles.js").Role} allowedRoles
 * @returns {import('express').RequestHandler} Middleware function.
 */
export function checkOwnership(...allowedRoles) {
  return (req, _res, next) => {
    const authReq = /** @type {AuthenticatedRequest} */ (req);
    const user = authReq.user;

    if (!user) {
      return next(new SessionMissingError());
    }

    const resourceId = parseInt(req.params.id, 10);
    const isOwner = user.sub === resourceId;
    const hasRoleAccess = allowedRoles.includes(user.role);

    if (!isOwner && !hasRoleAccess) {
      return next(new ForbiddenError());
    }

    next();
  };
}
