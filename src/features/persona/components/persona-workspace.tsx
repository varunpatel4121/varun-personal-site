"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChatSidebar } from "./chat-sidebar";
import { ChatPanel } from "./chat-panel";
import { useChat } from "../hooks/use-chat";
import type { PersonaWorkspaceProps } from "../types";

function extractChatIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/apps\/persona\/c\/([^/]+)/);
  return match?.[1] ?? null;
}

export function PersonaWorkspace({
  projectId,
  initialChats,
  children,
}: PersonaWorkspaceProps) {
  const pathname = usePathname();
  const initialChatId = extractChatIdFromPath(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    chats,
    activeChatId,
    messages,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    selectChat,
    startNewChat,
    deleteChat,
    retry,
  } = useChat(initialChatId, { projectId, initialChats });

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={startNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatPanel
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        error={error}
        onSendMessage={sendMessage}
        onRetry={retry}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />

      {/* Route children (pages return null — exist for URL routing) */}
      <div className="hidden">{children}</div>
    </div>
  );
}
