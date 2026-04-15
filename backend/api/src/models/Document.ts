import mongoose, { Schema, type InferSchemaType } from "mongoose";

const documentSchema = new Schema(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: "Case",
      required: true,
      index: true
    },
    nomineeId: {
      type: Schema.Types.ObjectId,
      ref: "Nominee",
      required: true,
      index: true
    },
    policyId: { type: String },
    documentType: { type: String, required: true },
    originalName: { type: String, required: true },
    storageKey: { type: String, required: true },
    storagePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    validationStatus: {
      type: String,
      enum: [
        "uploaded",
        "valid",
        "blurry",
        "incomplete",
        "wrong_document",
        "pending_manual_review"
      ],
      default: "uploaded"
    },
    validationNote: { type: String }
  },
  {
    timestamps: true
  }
);

export type DocumentModel = InferSchemaType<typeof documentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Document = mongoose.model("Document", documentSchema);
