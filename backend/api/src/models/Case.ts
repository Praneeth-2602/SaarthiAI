import mongoose, { Schema, type InferSchemaType } from "mongoose";

const policySchema = new Schema(
  {
    insurerName: { type: String, required: true },
    policyNumber: { type: String, required: true },
    policyType: { type: String, default: "life" },
    sumAssured: { type: Number },
    source: { type: String, default: "mock_bima_sugam" },
    nomineeStatus: {
      type: String,
      enum: ["confirmed", "disputed", "unknown"],
      default: "unknown"
    },
    claimStatus: {
      type: String,
      enum: ["not_started", "in_progress", "submitted", "settled", "rejected"],
      default: "not_started"
    },
    documentsRequired: [{ type: String }],
    documentsUploaded: [{ type: String }],
    claimLetterGenerated: { type: Boolean, default: false },
    submittedAt: { type: Date },
    settledAt: { type: Date },
    settlementAmount: { type: Number }
  },
  { _id: false }
);

const conversationSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["system", "user", "assistant", "agent"],
      required: true
    },
    content: { type: String, required: true },
    agentName: { type: String },
    language: { type: String, default: "en" },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const caseSchema = new Schema(
  {
    nomineeId: {
      type: Schema.Types.ObjectId,
      ref: "Nominee",
      required: true,
      index: true
    },
    deceased: {
      name: { type: String, required: true },
      aadhaar: { type: String },
      pan: { type: String },
      dateOfDeath: { type: Date },
      employer: { type: String },
      city: { type: String },
      state: { type: String }
    },
    phase: {
      type: String,
      enum: [
        "discovery",
        "documentation",
        "drafting",
        "submitted",
        "settled",
        "escalated"
      ],
      default: "discovery"
    },
    policies: [policySchema],
    conversationHistory: [conversationSchema],
    agentState: { type: Schema.Types.Mixed, default: {} },
    language: { type: String, default: "en" },
    feeAgreementSigned: { type: Boolean, default: false },
    feePercentage: { type: Number, default: 0.75 },
    feeCollected: { type: Boolean, default: false },
    feeAmount: { type: Number }
  },
  {
    timestamps: true
  }
);

export type CaseDocument = InferSchemaType<typeof caseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Case = mongoose.model("Case", caseSchema);
