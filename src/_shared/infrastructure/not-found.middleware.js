import { sendNotFound } from "./response-helpers.js";

/**
 * Global Not Found handler.
 * Handles 404 situations without passing them to the global error handler.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */
export const notFoundHandler = (req, res, _next) => {
  const message = `No se encontró la ruta ${req.originalUrl} en este servidor.`;

  sendNotFound(req, res, message);
};
