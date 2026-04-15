import type { Message } from "@/lib/types";

export function MessageBubble({ message }: { message: Message }) {
  const className =
    message.role === "user"
      ? "message-bubble message-user"
      : "message-bubble message-assistant";

  return (
    <div className={className}>
      <strong>{message.role === "user" ? "You" : "Saarthi"}</strong>
      <div>{message.content}</div>
    </div>
  );
}
