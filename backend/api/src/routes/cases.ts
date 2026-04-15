import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { Case } from "../models/Case.js";
import { Document } from "../models/Document.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { deceased, language } = req.body as {
      deceased?: {
        name?: string;
        aadhaar?: string;
        pan?: string;
        dateOfDeath?: string;
        employer?: string;
        city?: string;
        state?: string;
      };
      language?: string;
    };

    if (!deceased?.name) {
      throw new HttpError(400, "Deceased name is required.");
    }

    const createdCase = await Case.create({
      nomineeId: new mongoose.Types.ObjectId(req.user.id),
      deceased: {
        name: deceased.name,
        aadhaar: deceased.aadhaar,
        pan: deceased.pan,
        dateOfDeath: deceased.dateOfDeath ? new Date(deceased.dateOfDeath) : undefined,
        employer: deceased.employer,
        city: deceased.city,
        state: deceased.state
      },
      language: language ?? "en",
      conversationHistory: [
        {
          role: "assistant",
          content:
            "Namaste. I am Saarthi. I will help you identify policies, gather the right documents, and prepare claim letters step by step.",
          agentName: "saarthi",
          language: language ?? "en"
        }
      ]
    });

    res.status(201).json(createdCase);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cases = await Case.find({ nomineeId: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ items: cases });
  })
);

router.patch(
  "/:id/history",
  asyncHandler(async (req, res) => {
    const { role, content, agentName, language } = req.body as {
      role?: string;
      content?: string;
      agentName?: string;
      language?: string;
    };

    if (!role || !content) {
      throw new HttpError(400, "Role and content are required.");
    }

    const updatedCase = await Case.findOneAndUpdate(
      { _id: req.params.id, nomineeId: req.user.id },
      {
        $push: {
          conversationHistory: {
            role,
            content,
            agentName,
            language: language ?? "en",
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!updatedCase) {
      throw new HttpError(404, "Case not found.");
    }

    res.json(updatedCase);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const selectedCase = await Case.findOne({
      _id: req.params.id,
      nomineeId: req.user.id
    }).lean();

    if (!selectedCase) {
      throw new HttpError(404, "Case not found.");
    }

    const documents = await Document.find({
      caseId: req.params.id,
      nomineeId: req.user.id
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ...selectedCase,
      documents
    });
  })
);

export default router;
