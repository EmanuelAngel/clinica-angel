import { CustomError } from "../domain/custom-error.js";
import { env } from "./env-variables.js";

/**
 * @param {CustomError | Error} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function globalErrorHandler(err, req, res, next) {
  const isDev = env.NODE_ENV === "development";
  // @ts-ignore
  const statusCode = err.statusCode || 500;

  if (isDev) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR - ${statusCode}]: ${err.stack}`);
  }

  let resultMessage =
    err instanceof CustomError ? err.message : "Algo salió mal";
  let resultType = "failure";

  if (req.path.startsWith("/api")) {
    res.status(statusCode).json({
      result: {
        message: resultMessage,
        type: resultType,
        ...(isDev && { stack: err.stack }),
      },
    });

    return;
  }

  if (res.locals.view && statusCode < 500) {
    res.status(statusCode).render(res.locals.view, {
      result: {
        message: resultMessage,
        type: resultType,
      },
      values: req.body,
    });

    return;
  }

  res.status(statusCode).render("errors/generic", {
    error: {
      message: resultMessage,
      statusCode,
      stack: isDev ? err.stack : null,
      isDev,
    },
  });
}
