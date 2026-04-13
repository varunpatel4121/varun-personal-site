import type { Project, Chat, Message } from "@/lib/supabase/types";

export interface PersonaDefinition {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export type PersonaProject = Project & { app: "persona" };

export type PersonaChat = Chat;
export type PersonaMessage = Message;

export interface PersonaWorkspaceProps {
  userId: string;
  projectId: string;
  initialChats: PersonaChat[];
  children?: React.ReactNode;
}

export interface ChatPanelProps {
  chatId: string | null;
  messages: PersonaMessage[];
  isStreaming: boolean;
  streamingContent: string;
  onSendMessage: (content: string) => void;
  onRetry: () => void;
  error: string | null;
}

export interface ChatSidebarProps {
  chats: PersonaChat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

export interface StreamPayload {
  chatId: string;
  type: "delta" | "done" | "error";
  content?: string;
  messageId?: string;
  error?: string;
}
