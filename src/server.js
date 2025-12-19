/* eslint-disable no-console */

import app from "./app.js";

import { createServer } from "node:http";

import { env } from "./_shared/infrastructure/env-variables.js";

const { PORT, NODE_ENV } = env;

const server = createServer(app);

server.listen(PORT);

server.on("error", onError);
server.on("listening", onListening);

/**
 * Handles uncaught errors.
 * @param {NodeJS.ErrnoException} error Error object.
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? `Pipe ${PORT}` : `Port ${PORT}`;

  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Handles server listening.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;

  console.clear();

  if (NODE_ENV === "development") {
    console.log(`Server listening on ${bind}`);
    console.log(`Index on: http://localhost:${PORT}`);
  } else {
    console.log(`Server listening on ${bind} in ${NODE_ENV} mode`);
  }
}
