import crypto from "node:crypto";
import { Nominee } from "../models/Nominee.js";
import { env, isProduction } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

const OTP_TTL_MS = 10 * 60 * 1000;

const hashOtp = (phone: string, otp: string) =>
  crypto
    .createHash("sha256")
    .update(`${phone}:${otp}:${env.otpSecret}`)
    .digest("hex");

const maskPhone = (phone: string) =>
  phone.length < 4 ? phone : `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;

export const generateOtp = () =>
  crypto.randomInt(100_000, 999_999).toString();

export const requestOtp = async (phone: string) => {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 10) {
    throw new HttpError(400, "Please provide a valid phone number.");
  }

  const otp = generateOtp();
  const otpCodeHash = hashOtp(normalizedPhone, otp);
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  const nominee = await Nominee.findOneAndUpdate(
    { phone: normalizedPhone },
    {
      $set: {
        otpCodeHash,
        otpExpiresAt,
        lastOtpRequestedAt: new Date()
      },
      $setOnInsert: { phone: normalizedPhone }
    },
    { new: true, upsert: true }
  );

  return {
    nomineeId: nominee._id.toString(),
    phone: normalizedPhone,
    maskedPhone: maskPhone(normalizedPhone),
    expiresAt: otpExpiresAt.toISOString(),
    ...(isProduction ? {} : { debugOtp: otp })
  };
};

export const verifyOtp = async (phone: string, otp: string) => {
  const normalizedPhone = phone.replace(/\D/g, "");
  const nominee = await Nominee.findOne({ phone: normalizedPhone });

  if (!nominee?.otpCodeHash || !nominee?.otpExpiresAt) {
    throw new HttpError(400, "OTP not requested for this phone number.");
  }

  if (nominee.otpExpiresAt.getTime() < Date.now()) {
    throw new HttpError(400, "OTP expired. Please request a fresh code.");
  }

  const otpCodeHash = hashOtp(normalizedPhone, otp);
  if (otpCodeHash !== nominee.otpCodeHash) {
    throw new HttpError(401, "Invalid OTP.");
  }

  nominee.otpCodeHash = undefined;
  nominee.otpExpiresAt = undefined;
  await nominee.save();

  return nominee;
};
