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
    <section className="soft-card chat-card">
      <div className="card-topline chat-heading">
        <div>
          <div className="eyebrow">Guided conversation</div>
          <h2>Talk through the case</h2>
        </div>
        <div className="language-slot">
          <LanguageSelector languages={LANGUAGES} onChange={setLanguage} selected={language} />
        </div>
      </div>
      <p className="section-copy">{helperText}</p>
      <div className="message-feed">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.role}-${index}`} message={message} />
        ))}
      </div>
      <div className="composer">
        <textarea
          className="field field-area"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Tell Saarthi what you know, what was uploaded, or what the family is worried about."
          value={input}
        />
        <div className="helper-row">
          <span className="small-copy">Responses stream live so the next step appears as soon as it is ready.</span>
          <button className="primary-button" onClick={() => sendMessage(input)} type="button">
            {loading ? "Working..." : "Send message"}
          </button>
        </div>
      </div>
    </section>
  );
}
