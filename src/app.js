import express from "express";
import nunjucks from "nunjucks";
import morgan from "morgan";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./_shared/infrastructure/env-variables.js";

const app = express();

app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: (req) => req.url.startsWith("/health") || req.url.includes("."),
  })
);

app.set("view engine", "njk");

const __dirname = dirname(fileURLToPath(import.meta.url));

const viewPaths = [
  join(__dirname, "./example/views"),
  join(__dirname, "./_shared/views"),
];

const njkEnv = nunjucks.configure(viewPaths, {
  autoescape: true,
  express: app,
  watch: false,
  noCache: env.NODE_ENV === "development",
});

njkEnv.addGlobal("title", "Clinica Angel");

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/example", (req, res) => {
  res.render("example");
});

export default app;
