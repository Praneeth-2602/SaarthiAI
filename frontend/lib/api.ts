import { getSession } from "@/lib/store";
import type { CaseRecord, DocumentRecord, Nominee } from "@/lib/types";

const proxyBase = process.env.NEXT_PUBLIC_PROXY_BASE ?? "/api/proxy";

type RequestOptions = RequestInit & {
  token?: string;
};

const buildHeaders = (options?: RequestOptions) => {
  const headers = new Headers(options?.headers);
  const token = options?.token ?? getSession()?.token;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

async function apiRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${proxyBase}${path}`, {
    ...options,
    headers: buildHeaders(options)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed." }));
    throw new Error(error.error ?? "Request failed.");
  }

  return (await response.json()) as T;
}

export const requestOtp = (phone: string) =>
  apiRequest<{ maskedPhone: string; expiresAt: string; debugOtp?: string }>(
    "/api/auth/request-otp",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    }
  );

export const verifyOtp = (payload: {
  phone: string;
  otp: string;
  name: string;
}) =>
  apiRequest<{ token: string; nominee: Nominee }>("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

export const createCase = (payload: {
  language: string;
  deceased: Record<string, string>;
}) =>
  apiRequest<CaseRecord>("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

export const listCases = () =>
  apiRequest<{ items: CaseRecord[] }>("/api/cases");

export const getCase = (caseId: string) =>
  apiRequest<CaseRecord>(`/api/cases/${caseId}`);

export const listDocuments = (caseId: string) =>
  apiRequest<{ items: DocumentRecord[] }>(`/api/documents?caseId=${caseId}`);

export const uploadDocument = async (formData: FormData) => {
  const response = await fetch(`${proxyBase}/api/documents/upload`, {
    method: "POST",
    headers: buildHeaders(),
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed." }));
    throw new Error(error.error ?? "Upload failed.");
  }

  return (await response.json()) as DocumentRecord;
};

export const streamAgentResponse = async (params: {
  caseId: string;
  userMessage: string;
  language: string;
  onChunk: (chunk: { contentDelta?: string; agent?: string }) => void;
}) => {
  const response = await fetch(`${proxyBase}/api/agents/invoke`, {
    method: "POST",
    headers: buildHeaders({ headers: { "Content-Type": "application/json" } }),
    body: JSON.stringify({
      caseId: params.caseId,
      userMessage: params.userMessage,
      language: params.language
    })
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to start agent streaming.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const payloadLine = event
        .split("\n")
        .find((line) => line.startsWith("data: "));

      if (!payloadLine) {
        continue;
      }

      const rawPayload = payloadLine.replace("data: ", "");
      if (rawPayload === "[DONE]") {
        continue;
      }

      try {
        params.onChunk(JSON.parse(rawPayload) as { contentDelta?: string; agent?: string });
      } catch {
        continue;
      }
    }
  }
};
