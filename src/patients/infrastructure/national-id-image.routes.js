import { Router } from "express";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, extname, resolve, sep } from "node:path";
import { NATIONAL_ID_IMAGE_CONTENT_TYPES } from "../domain/national-id-image.js";
import { uploadDir } from "./multer.middleware.js";

/**
 * Serves stored national ID images under the public `/uploads/<filename>`
 * path. The database keeps that same URL, so existing rows keep resolving.
 */
export const nationalIdImageRouter = Router();

const uploadRoot = resolve(uploadDir);

/**
 * Responds 404 without ever hinting that the requested file could exist.
 * @param {import("express").Response} res Express response.
 * @returns {void}
 */
function sendNotFound(res) {
  res.status(404).type("text/plain").send("Not found");
}

nationalIdImageRouter.get("/:filename", async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");

  const { filename } = req.params;

  // Only a single path segment can name a stored file. Anything that resolves
  // somewhere else is refused before it reaches the filesystem.
  if (filename !== basename(filename)) {
    sendNotFound(res);

    return;
  }

  const filePath = resolve(uploadRoot, filename);

  if (!filePath.startsWith(uploadRoot + sep)) {
    sendNotFound(res);

    return;
  }

  const contentType =
    NATIONAL_ID_IMAGE_CONTENT_TYPES[extname(filename).toLowerCase()];

  // The content type is chosen from the extension allowlist. A file with any
  // other extension is unreachable, even if it is sitting in the directory.
  if (!contentType) {
    sendNotFound(res);

    return;
  }

  let fileStats;

  try {
    fileStats = await stat(filePath);
  } catch {
    sendNotFound(res);

    return;
  }

  if (!fileStats.isFile()) {
    sendNotFound(res);

    return;
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(fileStats.size));

  createReadStream(filePath)
    .on("error", () => {
      res.destroy();
    })
    .pipe(res);
});
