"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PersonaChat, PersonaMessage } from "../types";

interface UseChatOptions {
  projectId: string;
  initialChats: PersonaChat[];
}

interface UseChatReturn {
  chats: PersonaChat[];
  activeChatId: string | null;
  messages: PersonaMessage[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  sendMessage: (content: string) => void;
  selectChat: (chatId: string) => Promise<void>;
  startNewChat: () => void;
  deleteChat: (chatId: string) => Promise<void>;
  retry: () => void;
}

export function useChat(
  initialChatId: string | null,
  options: UseChatOptions,
): UseChatReturn {
  const [chats, setChats] = useState<PersonaChat[]>(options.initialChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<PersonaMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lastUserMessage = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async (chatId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
  }, []);

  const refreshChats = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("project_id", options.projectId)
      .order("updated_at", { ascending: false });
    setChats(data ?? []);
  }, [options.projectId]);

  // Load messages when mounting with a deep-linked chatId
  useEffect(() => {
    if (initialChatId) {
      loadMessages(initialChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectChat = useCallback(
    async (chatId: string) => {
      if (abortRef.current) abortRef.current.abort();
      setActiveChatId(chatId);
      setStreamingContent("");
      setError(null);
      setIsStreaming(false);
      await loadMessages(chatId);
      window.history.pushState(null, "", `/apps/persona/c/${chatId}`);
    },
    [loadMessages],
  );

  const startNewChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setActiveChatId(null);
    setMessages([]);
    setStreamingContent("");
    setError(null);
    setIsStreaming(false);
    window.history.pushState(null, "", "/apps/persona");
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      lastUserMessage.current = content;
      setError(null);
      setIsStreaming(true);
      setStreamingContent("");

      // Optimistic user message
      const tempUserMsg: PersonaMessage = {
        id: `temp-${Date.now()}`,
        chat_id: activeChatId ?? "",
        role: "user",
        content,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/persona/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, chatId: activeChatId }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Request failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let resolvedChatId = activeChatId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ") && eventType) {
              try {
                const data = JSON.parse(line.slice(6));
                switch (eventType) {
                  case "meta": {
                    resolvedChatId = data.chatId;
                    if (data.isNewChat) {
                      setActiveChatId(resolvedChatId);
                      window.history.replaceState(
                        null,
                        "",
                        `/apps/persona/c/${resolvedChatId}`,
                      );
                    }
                    break;
                  }
                  case "delta": {
                    accumulated += data.content;
                    setStreamingContent(accumulated);
                    break;
                  }
                  case "done": {
                    // Stream finished — append final assistant message and refresh
                    const assistantMsg: PersonaMessage = {
                      id: data.messageId ?? `assistant-${Date.now()}`,
                      chat_id: resolvedChatId ?? "",
                      role: "assistant",
                      content: accumulated,
                      metadata: { response_id: data.responseId },
                      created_at: new Date().toISOString(),
                    };
                    setMessages((prev) => [...prev, assistantMsg]);
                    setStreamingContent("");
                    await refreshChats();
                    break;
                  }
                  case "error": {
                    throw new Error(data.error);
                  }
                }
              } catch (parseErr) {
                if (
                  parseErr instanceof Error &&
                  parseErr.message !== "Unexpected end of JSON input"
                ) {
                  throw parseErr;
                }
              }
              eventType = "";
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStreamingContent("");
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeChatId, isStreaming, refreshChats],
  );

  const retry = useCallback(() => {
    if (lastUserMessage.current) {
      // Remove the last user message and failed state, then resend
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "user") return prev.slice(0, -1);
        return prev;
      });
      sendMessage(lastUserMessage.current);
    }
  }, [sendMessage]);

  const deleteChat = useCallback(
    async (chatId: string) => {
      const supabase = createClient();
      await supabase.from("chats").delete().eq("id", chatId);

      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        startNewChat();
      }
    },
    [activeChatId, startNewChat],
  );

  return {
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
  };
}
