import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/httpError.js";
import { verifyToken } from "../services/tokenService.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing bearer token."));
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      phone: payload.phone
    };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token."));
  }
};
