import mongoose, { Schema, type InferSchemaType } from "mongoose";

const nomineeSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    otpCodeHash: { type: String },
    otpExpiresAt: { type: Date },
    lastOtpRequestedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export type NomineeDocument = InferSchemaType<typeof nomineeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Nominee = mongoose.model("Nominee", nomineeSchema);
