import path from "node:path";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { uploadSingleDocument } from "../middleware/upload.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { Case } from "../models/Case.js";
import { Document } from "../models/Document.js";
import { fileStorage } from "../services/fileStorage.js";

const router = Router();

router.use(authenticate);

router.post(
  "/upload",
  (req, res, next) => uploadSingleDocument(req, res, next),
  asyncHandler(async (req, res) => {
    const { caseId, policyId, documentType } = req.body as {
      caseId?: string;
      policyId?: string;
      documentType?: string;
    };

    if (!caseId || !documentType || !req.file) {
      throw new HttpError(400, "caseId, documentType, and file are required.");
    }

    const selectedCase = await Case.findOne({
      _id: caseId,
      nomineeId: req.user.id
    });

    if (!selectedCase) {
      throw new HttpError(404, "Case not found.");
    }

    const extension = path.extname(req.file.originalname) || ".bin";
    const stored = await fileStorage.store({
      buffer: req.file.buffer,
      extension
    });

    const document = await Document.create({
      caseId,
      nomineeId: req.user.id,
      policyId,
      documentType,
      originalName: req.file.originalname,
      storageKey: stored.storageKey,
      storagePath: stored.absolutePath,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    if (policyId) {
      selectedCase.policies = selectedCase.policies.map((policy) =>
        policy.policyNumber === policyId
          ? {
              ...policy.toObject(),
              documentsUploaded: Array.from(
                new Set([...(policy.documentsUploaded ?? []), documentType])
              )
            }
          : policy
      ) as typeof selectedCase.policies;
      await selectedCase.save();
    }

    res.status(201).json(document);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const caseId = req.query.caseId?.toString();

    if (!caseId) {
      throw new HttpError(400, "caseId is required.");
    }

    const documents = await Document.find({
      caseId,
      nomineeId: req.user.id
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items: documents });
  })
);

router.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const document = await Document.findOne({
      _id: req.params.id,
      nomineeId: req.user.id
    });

    if (!document) {
      throw new HttpError(404, "Document not found.");
    }

    res.download(document.storagePath, document.originalName);
  })
);

export default router;
