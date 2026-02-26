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

if (env.NODE_ENV !== "test") {
  app.use(
    morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
      skip: (req) => req.url.startsWith("/health") || req.url.includes("."),
    })
  );
}

app.use(express.static(join(__dirname, "./_assets")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "njk");

const viewPaths = [
  join(__dirname, "./_shared/views"),
  join(__dirname, "./users/views"),
  join(__dirname, "./auth/views"),
  join(__dirname, "./patients/views"),
  join(__dirname, "./specialties/views"),
  join(__dirname, "./professionals/views"),
  join(__dirname, "./classifications/views"),
  join(__dirname, "./locations/views"),
  join(__dirname, "./schedules/views"),
  join(__dirname, "./health-insurances/views"),
  join(__dirname, "./waiting-list/views"),
  join(__dirname, "./global-blocks/views"),
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

njkEnv.addFilter("date", (date, format = "DD/MM/YYYY", locale = "es") => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  if (format === "DD/MM/YYYY") return `${day}/${month}/${year}`;
  if (format === "yyyy-MM-dd") return `${year}-${month}-${day}`;
  if (format === "EEEE, d MMMM yyyy") {
    return d.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  if (format === "H") return d.getHours().toString();
  if (format === "m") return d.getMinutes().toString();

  return d.toLocaleDateString();
});

njkEnv.addFilter("dateAdd", (date, amount, unit) => {
  if (!date) return new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();

  if (unit === "days") {
    d.setDate(d.getDate() + amount);
  } else if (unit === "months") {
    d.setMonth(d.getMonth() + amount);
  } else if (unit === "years") {
    d.setFullYear(d.getFullYear() + amount);
  }

  return d;
});

njkEnv.addFilter("padStart", (value, length, char = "0") => {
  return String(value).padStart(length, char);
});

njkEnv.addFilter("upper", (value) => {
  if (!value) return "";
  return String(value).toUpperCase();
});

app.use("/", viewsRouter);
app.use("/api/v1", apiV1Router);

app.get("/error", () => {
  throw new Error("Error de prueba");
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
