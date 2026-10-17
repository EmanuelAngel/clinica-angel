import multer from "multer";
import { extname, join } from "node:path";
import { mkdirSync } from "node:fs";

const uploadDir = join("src", "_assets", "uploads");
mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, file.fieldname + "-" + uniqueSuffix + extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fieldSize: 1024 * 1024 * 5,
  },
});
