import multer from "multer";
import { env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const uploadSingleDocument = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadSizeMb * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new HttpError(400, "Only PDF, JPEG, PNG, and WEBP files are allowed."));
  }
}).single("file");
