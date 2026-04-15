import { env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

export type AgentInvokePayload = {
  caseId: string;
  nomineeId: string;
  userMessage: string;
  language: string;
};

export class AgentBridgeService {
  async invokeStream(payload: AgentInvokePayload) {
    const response = await fetch(`${env.agentServiceUrl}/agent/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok || !response.body) {
      throw new HttpError(502, "Agent service is unavailable.");
    }

    return response;
  }

  async getAgentState(caseId: string) {
    const response = await fetch(`${env.agentServiceUrl}/agent/state/${caseId}`);

    if (!response.ok) {
      throw new HttpError(502, "Unable to fetch agent state.");
    }

    return response.json();
  }
}
