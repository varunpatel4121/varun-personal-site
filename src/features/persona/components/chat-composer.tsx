"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function ChatComposer({
  onSend,
  disabled = false,
  isStreaming = false,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
    setValue("");
    // Reset height after clearing
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });
  }, [value, disabled, isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const canSend = value.trim().length > 0 && !disabled && !isStreaming;

  return (
    <div className="border-t border-border-subtle bg-background/80 px-4 pb-4 pt-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-xl border border-border-subtle bg-surface/50 px-4 py-3 transition-colors focus-within:border-border focus-within:bg-surface/80">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            rows={1}
            disabled={disabled}
            className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-subtle focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-all hover:bg-accent-muted disabled:opacity-30 disabled:hover:bg-accent"
            aria-label="Send message"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-subtle">
          Persona can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
