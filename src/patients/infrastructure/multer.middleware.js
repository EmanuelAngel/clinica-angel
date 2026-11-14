import multer from "multer";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import {
  NATIONAL_ID_IMAGE_EXTENSIONS,
  NATIONAL_ID_IMAGE_MAX_SIZE_BYTES,
  NATIONAL_ID_IMAGE_MIME_TYPES,
} from "../domain/national-id-image.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Directory where patient documents are stored.
 *
 * It lives outside `src/_assets` on purpose: that tree is published by
 * `express.static`, and uploaded content must never be reachable through it.
 * The files are served by the dedicated `/uploads/:filename` route instead.
 * @type {string}
 */
export const uploadDir = join(__dirname, "../../../var/uploads");

mkdirSync(uploadDir, { recursive: true });

/**
 * Names generated for the current request. They are needed to remove a file
 * that multer already started writing when a limit aborts the upload.
 * @type {WeakMap<import("express").Request, string[]>}
 */
const generatedNamesByRequest = new WeakMap();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // The extension comes from the accepted MIME type, never from the name the
    // client sent: that name is what turned an image upload into a stored
    // HTML file served from our own origin.
    const extension = NATIONAL_ID_IMAGE_EXTENSIONS[file.mimetype] ?? "";
    const storedName = `${file.fieldname}-${uniqueSuffix}${extension}`;

    generatedNamesByRequest.set(req, [
      ...(generatedNamesByRequest.get(req) ?? []),
      storedName,
    ]);

    cb(null, storedName);
  },
});

/**
 * Messages shown to the user for each upload failure multer can raise.
 * @type {Readonly<Record<string, string>>}
 */
const UPLOAD_ERROR_MESSAGES = Object.freeze({
  LIMIT_FILE_SIZE: "El archivo no debe pesar más de 5MB",
  LIMIT_FILE_COUNT: "Solo se puede subir una imagen",
  LIMIT_UNEXPECTED_FILE: "Solo se puede subir una imagen",
  INVALID_FILE_TYPE: "Solo se aceptan formatos PNG, JPG o JPEG",
});

/**
 * Translates an upload failure into a message the registration form can show.
 * @param {unknown} error Error raised by multer or by the file filter.
 * @returns {string} User-facing message.
 */
export function uploadErrorMessage(error) {
  const code = /** @type {{ code?: string } | undefined} */ (error)?.code;

  return (
    (code ? UPLOAD_ERROR_MESSAGES[code] : undefined) ??
    "No se pudo procesar la imagen"
  );
}

/**
 * Deletes every file this request generated, including a partial write left
 * behind by an aborted upload.
 * @param {import("express").Request} req Current request.
 * @returns {Promise<void>} Resolves once every generated file is gone.
 */
async function removeGeneratedUploads(req) {
  const storedNames = generatedNamesByRequest.get(req) ?? [];

  generatedNamesByRequest.delete(req);

  await Promise.all(
    storedNames.map((storedName) =>
      unlink(join(uploadDir, storedName)).catch(() => {})
    )
  );
}

const upload = multer({
  storage,
  limits: {
    fieldSize: 1024 * 1024 * 5,
    fileSize: NATIONAL_ID_IMAGE_MAX_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (NATIONAL_ID_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);

      return;
    }

    const error = new Error(UPLOAD_ERROR_MESSAGES.INVALID_FILE_TYPE);
    error.code = "INVALID_FILE_TYPE";

    cb(error);
  },
});

/**
 * Accepts the national ID image and turns an upload failure into
 * `res.locals.uploadError`, so the controller can render the registration form
 * instead of forwarding a raw multer error to the global error handler.
 *
 * A rejected upload never leaves a file behind: anything multer wrote before
 * aborting is removed here.
 * @type {import("express").RequestHandler}
 */
export function uploadNationalIdImage(req, res, next) {
  upload.single("nationalIdImage")(req, res, (error) => {
    if (!error) {
      next();

      return;
    }

    void removeGeneratedUploads(req).finally(() => {
      res.locals.uploadError = error;
      next();
    });
  });
}
