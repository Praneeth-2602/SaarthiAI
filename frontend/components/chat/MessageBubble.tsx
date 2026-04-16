import type { Message } from "@/lib/types";

export function MessageBubble({ message }: { message: Message }) {
  const className =
    message.role === "user"
      ? "message-bubble message-user"
      : "message-bubble message-assistant";

  return (
    <div className={className}>
      <div className="bubble-label">{message.role === "user" ? "You" : "Saarthi"}</div>
      <div>{message.content}</div>
    </div>
  );
}
