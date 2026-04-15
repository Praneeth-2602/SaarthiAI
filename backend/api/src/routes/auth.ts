import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requestOtp, verifyOtp } from "../services/otpService.js";
import { signToken } from "../services/tokenService.js";

const router = Router();

router.post(
  "/request-otp",
  asyncHandler(async (req, res) => {
    const { phone } = req.body as { phone?: string };
    const payload = await requestOtp(phone ?? "");
    res.status(200).json(payload);
  })
);

router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const { phone, otp, name } = req.body as {
      phone?: string;
      otp?: string;
      name?: string;
    };

    const nominee = await verifyOtp(phone ?? "", otp ?? "");
    if (name && !nominee.name) {
      nominee.name = name;
      await nominee.save();
    }

    const token = signToken({
      sub: nominee._id.toString(),
      phone: nominee.phone
    });

    res.json({
      token,
      nominee: {
        id: nominee._id.toString(),
        phone: nominee.phone,
        name: nominee.name ?? null
      }
    });
  })
);

export default router;
