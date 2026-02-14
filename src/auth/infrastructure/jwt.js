import jwt from "jsonwebtoken";
import { err, ok } from "neverthrow";
import { env } from "../../_shared/infrastructure/env-variables.js";
import { SessionInvalidError } from "../domain/auth.errors.js";

/**
 * @typedef {import("express").Request & { user: UserPayload }} AuthenticatedRequest
 */

/**
 * @typedef {object} UserPayload
 * @property {number} sub User ID
 * @property {import("../domain/roles.js").Role} role User role
 */

/**
 * Generates a JWT token.
 * @param {UserPayload} payload
 * @param {jwt.SignOptions} options
 * @returns {string} The JWT token.
 */
export function generateToken(payload, options = {}) {
  const opts = {
    expiresIn: env.JWT_EXPIRES,
    ...options,
  };

  return jwt.sign(payload, env.JWT_SECRET, opts);
}

/**
 * Verifies a JWT token.
 * @param {string} token
 * @returns {import("neverthrow").Result<UserPayload, SessionInvalidError>} The decoded token or an error.
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // eslint-disable-next-line
    return ok(/** @type {any} */ (decoded));
  } catch {
    return err(new SessionInvalidError());
  }
}
