"use client";

import { useRef, useEffect } from "react";
import { ChatMessage, StreamingMessage, TypingIndicator } from "./chat-message";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatComposer } from "./chat-composer";
import type { PersonaMessage } from "../types";

interface ChatPanelProps {
  messages: PersonaMessage[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  onSendMessage: (content: string) => void;
  onRetry: () => void;
  onToggleSidebar: () => void;
}

export function ChatPanel({
  messages,
  isStreaming,
  streamingContent,
  error,
  onSendMessage,
  onRetry,
  onToggleSidebar,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);

  // Track if user is near bottom of scroll
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    isNearBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  // Auto-scroll during streaming
  useEffect(() => {
    if (isNearBottom.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar for mobile sidebar toggle */}
      <div className="flex h-11 items-center border-b border-border-subtle px-4 lg:hidden">
        <button
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-surface"
          aria-label="Toggle sidebar"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>

      {isEmpty ? (
        <ChatEmptyState onSelectPrompt={onSendMessage} />
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isStreaming && streamingContent && (
              <StreamingMessage content={streamingContent} />
            )}

            {isStreaming && !streamingContent && <TypingIndicator />}

            {error && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-red-400"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-300">{error}</p>
                    <button
                      onClick={onRetry}
                      className="mt-1 text-xs text-red-400 underline underline-offset-2 transition-colors hover:text-red-300"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ChatComposer
        onSend={onSendMessage}
        disabled={!!error}
        isStreaming={isStreaming}
      />
    </div>
  );
}
