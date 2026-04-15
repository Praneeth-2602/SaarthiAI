import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { Nominee } from "../models/Nominee.js";

describe("auth routes", () => {
  const app = createApp();

  beforeEach(async () => {
    await Nominee.deleteMany({});
  });

  it("requests and verifies a dev OTP", async () => {
    const phone = "9876543210";

    const requestOtpResponse = await request(app)
      .post("/api/auth/request-otp")
      .send({ phone })
      .expect(200);

    expect(requestOtpResponse.body.maskedPhone).toContain("3210");
    expect(requestOtpResponse.body.debugOtp).toHaveLength(6);

    const verifyResponse = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone, otp: requestOtpResponse.body.debugOtp, name: "Test Nominee" })
      .expect(200);

    expect(verifyResponse.body.token).toBeTypeOf("string");
    expect(verifyResponse.body.nominee.name).toBe("Test Nominee");
  });
});
