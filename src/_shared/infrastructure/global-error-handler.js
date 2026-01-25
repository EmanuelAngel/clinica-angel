import { CustomError } from "../domain/custom-error.js";
import { env } from "./env-variables.js";
import { negotiateResponse } from "./negotiate-response.js";

/**
 * @param {CustomError | Error} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */
export function globalErrorHandler(err, req, res, _next) {
  const isDev = env.NODE_ENV === "development";
  const showLogs = isDev || env.LOG_ERRORS === true;
  // @ts-ignore
  const statusCode = err.statusCode || 500;

  if (showLogs) {
    const firstStackLine = err.stack?.split("\n")[1]?.trim();
    // eslint-disable-next-line no-console
    console.log(`❌ ${err.message} --> ${firstStackLine}`);
  }

  const resultMessage =
    err instanceof CustomError ? err.message : "Algo salió mal";
  const resultType = "failure";

  const responseType = negotiateResponse(req);

  if (responseType === "json") {
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
      ...res.locals.commonData,
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
