import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import caseRoutes from "./routes/cases.js";
import documentRoutes from "./routes/documents.js";
import agentRoutes from "./routes/agents.js";
import healthRoutes from "./routes/health.js";
import { HttpError } from "./lib/httpError.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true
    })
  );
  app.use(express.json());

  app.use("/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/cases", caseRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/agents", agentRoutes);

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: "Unexpected server error." });
    }
  );

  return app;
};
