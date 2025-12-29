import jwt from "jsonwebtoken";
import { env } from "../../_shared/infrastructure/env-variables.js";

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
export function generateToken(payload, options) {
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Verifies a JWT token.
 * @param {string} token
 * @returns {UserPayload} The decoded token.
 */
export function verifyToken(token) {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  // eslint-disable-next-line
  return /** @type {any} */ (decoded);
}
