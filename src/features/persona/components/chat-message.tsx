"use client";

import { MarkdownRenderer } from "./markdown-renderer";
import type { PersonaMessage } from "../types";

interface ChatMessageProps {
  message: PersonaMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser
            ? "rounded-2xl rounded-br-md bg-accent/15 px-4 py-2.5"
            : "px-1 py-1"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  );
}

export function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] px-1 py-1 sm:max-w-[75%]">
        <MarkdownRenderer content={content} />
        <span className="inline-block h-4 w-0.5 animate-pulse bg-accent-foreground/60" />
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 px-1 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
      </div>
    </div>
  );
}
