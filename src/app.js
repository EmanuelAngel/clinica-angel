import express from "express";
import "express-async-errors";

import nunjucks from "nunjucks";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./_shared/infrastructure/env-variables.js";
import { viewsRouter } from "./views.routes.js";
import { apiV1Router } from "./api-v1.routes.js";
import { Roles } from "./auth/domain/roles.js";
import { links } from "./_shared/infrastructure/links.js";
import { globalErrorHandler } from "./_shared/infrastructure/global-error-handler.js";
import { notFoundHandler } from "./_shared/infrastructure/not-found.middleware.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: (req) => req.url.startsWith("/health") || req.url.includes("."),
  })
);

app.use(express.static(join(__dirname, "./_assets")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "njk");

const viewPaths = [
  join(__dirname, "./example/views"),
  join(__dirname, "./_shared/views"),
  join(__dirname, "./users/views"),
  join(__dirname, "./auth/views"),
  join(__dirname, "./patients/views"),
  join(__dirname, "./specialties/views"),
  join(__dirname, "./professionals/views"),
];

const njkEnv = nunjucks.configure(viewPaths, {
  autoescape: true,
  express: app,
  watch: false,
  noCache: env.NODE_ENV === "development",
});

njkEnv.addGlobal("title", "Clinica Angel");
njkEnv.addGlobal("Roles", Roles);
njkEnv.addGlobal("links", links);
njkEnv.addGlobal("isDev", env.NODE_ENV === "development");

app.use("/", viewsRouter);
app.use("/api/v1", apiV1Router);

app.get("/error", () => {
  throw new Error("Error de prueba");
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
