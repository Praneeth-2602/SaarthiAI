"use client";

import { useEffect, useMemo, useState } from "react";
import { streamAgentResponse } from "@/lib/api";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { LanguageSelector } from "./LanguageSelector";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" }
];

export function ChatPanel({
  caseId,
  initialMessages,
  initialLanguage,
  onConversationFinished
}: {
  caseId: string;
  initialMessages: Message[];
  initialLanguage: string;
  onConversationFinished: () => Promise<void>;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(initialLanguage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) {
      return;
    }

    setLoading(true);
    setInput("");
    const userMessage: Message = { role: "user", content: messageText };
    setMessages((current) => [...current, userMessage, { role: "assistant", content: "" }]);

    try {
      await streamAgentResponse({
        caseId,
        userMessage: messageText,
        language,
        onChunk: (chunk) => {
          if (!chunk.contentDelta) {
            return;
          }

          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            next[next.length - 1] = {
              ...last,
              role: "assistant",
              content: `${last?.content ?? ""}${chunk.contentDelta}`,
              agentName: chunk.agent
            };
            return next;
          });
        }
      });
      await onConversationFinished();
    } finally {
      setLoading(false);
    }
  };

  const helperText = useMemo(() => {
    if (loading) {
      return "Saarthi is reviewing the case and preparing the next step.";
    }
    return "Ask about policy discovery, missing documents, or claim-letter drafting.";
  }, [loading]);

  return (
    <section className="panel">
      <div className="split">
        <div>
          <div className="eyebrow">Case Conversation</div>
          <h2 className="section-title">Guided chat</h2>
        </div>
        <div style={{ minWidth: 160 }}>
          <LanguageSelector languages={LANGUAGES} onChange={setLanguage} selected={language} />
        </div>
      </div>
      <p className="muted">{helperText}</p>
      <div className="message-list">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.role}-${index}`} message={message} />
        ))}
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        <textarea
          className="textarea"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe what you know about the case, or tell Saarthi what you uploaded."
          value={input}
        />
        <div className="split">
          <span className="muted small">The response streams live from the agent service.</span>
          <button className="primary-button" onClick={() => sendMessage(input)} type="button">
            {loading ? "Working..." : "Send message"}
          </button>
        </div>
      </div>
    </section>
  );
}
