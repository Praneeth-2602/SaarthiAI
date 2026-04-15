import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Case } from "../models/Case.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { AgentBridgeService } from "../services/agentBridge.js";

const router = Router();
const agentBridge = new AgentBridgeService();

router.use(authenticate);

router.get(
  "/state/:caseId",
  asyncHandler(async (req, res) => {
    const caseId = String(req.params.caseId);
    const selectedCase = await Case.findOne({
      _id: caseId,
      nomineeId: req.user.id
    });

    if (!selectedCase) {
      throw new HttpError(404, "Case not found.");
    }

    const state = await agentBridge.getAgentState(caseId);
    res.json(state);
  })
);

router.post("/invoke", async (req, res, next) => {
  try {
    const { caseId, userMessage, language } = req.body as {
      caseId?: string;
      userMessage?: string;
      language?: string;
    };

    if (!caseId || !userMessage) {
      throw new HttpError(400, "caseId and userMessage are required.");
    }

    const selectedCase = await Case.findOne({
      _id: caseId,
      nomineeId: req.user.id
    });

    if (!selectedCase) {
      throw new HttpError(404, "Case not found.");
    }

    selectedCase.conversationHistory.push({
      role: "user",
      content: userMessage,
      language: language ?? selectedCase.language,
      timestamp: new Date()
    });
    await selectedCase.save();

    const upstream = await agentBridge.invokeStream({
      caseId,
      nomineeId: req.user.id,
      userMessage,
      language: language ?? selectedCase.language
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reader = upstream.body?.getReader();
    if (!reader) {
      throw new HttpError(502, "Agent stream missing.");
    }

    const decoder = new TextDecoder();
    let sseBuffer = "";
    let assistantMessage = "";
    let assistantAgent = "saarthi";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
      sseBuffer += chunk;

      const events = sseBuffer.split("\n\n");
      sseBuffer = events.pop() ?? "";

      for (const event of events) {
        const payloadLine = event
          .split("\n")
          .find((line) => line.startsWith("data: "));

        if (!payloadLine) {
          continue;
        }

        const payload = payloadLine.replace("data: ", "");
        if (payload === "[DONE]") {
          continue;
        }

        try {
          const parsed = JSON.parse(payload) as {
            contentDelta?: string;
            agent?: string;
          };
          if (parsed.contentDelta) {
            assistantMessage += parsed.contentDelta;
          }
          if (parsed.agent) {
            assistantAgent = parsed.agent;
          }
        } catch {
          continue;
        }
      }
    }

    if (assistantMessage.trim()) {
      selectedCase.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
        agentName: assistantAgent,
        language: language ?? selectedCase.language,
        timestamp: new Date()
      });
      await selectedCase.save();
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;
