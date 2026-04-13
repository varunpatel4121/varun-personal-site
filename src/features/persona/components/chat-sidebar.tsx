"use client";

import { useState } from "react";
import clsx from "clsx";
import type { PersonaChat } from "../types";

interface ChatSidebarProps {
  chats: PersonaChat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChatSidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border-subtle bg-background transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-subtle">
            Conversations
          </span>
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-surface"
            aria-label="New conversation"
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
              className="text-muted"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto py-2">
          {chats.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-subtle">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {chats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const isHovered = chat.id === hoveredId;

                return (
                  <div
                    key={chat.id}
                    className="relative"
                    onMouseEnter={() => setHoveredId(chat.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <button
                      onClick={() => {
                        onSelectChat(chat.id);
                        onClose();
                      }}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-surface text-foreground"
                          : "text-muted hover:bg-surface/50 hover:text-foreground",
                      )}
                    >
                      <p className="truncate text-sm leading-tight">
                        {chat.title ?? "Untitled"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-subtle">
                        {formatRelativeDate(chat.updated_at)}
                      </p>
                    </button>

                    {/* Delete action */}
                    {isHovered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-md bg-surface transition-colors hover:bg-red-950/50 hover:text-red-400"
                        aria-label="Delete conversation"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
