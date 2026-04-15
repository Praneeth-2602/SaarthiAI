import "dotenv/config";
import path from "node:path";

const required = (value: string | undefined, fallback: string) => value ?? fallback;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  mongoUri: required(process.env.MONGODB_URI, "mongodb://localhost:27017/saarthi"),
  jwtSecret: required(process.env.JWT_SECRET, "dev-jwt-secret"),
  otpSecret: required(process.env.OTP_SECRET, "dev-otp-secret"),
  agentServiceUrl: process.env.AGENT_SERVICE_URL ?? "http://localhost:8000",
  uploadDir: path.resolve(
    process.cwd(),
    process.env.UPLOAD_DIR ?? "../../storage/uploads"
  ),
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10)
};

export const isProduction = env.nodeEnv === "production";
