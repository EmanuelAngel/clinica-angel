import { negotiateResponse } from "./negotiate-response.js";

/**
 * Sends a 404 Not Found response.
 * Negotiates content type (JSON vs HTML).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {string} message - The error message to display.
 */
export function sendNotFound(req, res, message) {
  const responseType = negotiateResponse(req);

  if (responseType === "json") {
    res.status(404).json({
      status: "fail",
      message: message,
    });

    return;
  }

  res.status(404).render("errors/not-found", {
    title: "Página no encontrada",
    error: {
      message: message,
    },
  });
}
