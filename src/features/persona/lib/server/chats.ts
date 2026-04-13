import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Chat, Message } from "@/lib/supabase/types";
import { log } from "@/lib/logger";

export async function listChats(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    log.error({ event: "persona.chats.list_failed", projectId, errorMessage: error.message });
  }

  return (data as Chat[] | null) ?? [];
}

export async function getChatWithMessages(
  supabase: SupabaseClient<Database>,
  chatId: string,
): Promise<{ chat: Chat; messages: Message[] } | null> {
  const { data: chat } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .single();

  if (!chat) return null;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  return {
    chat: chat as Chat,
    messages: (messages as Message[] | null) ?? [],
  };
}

export async function createChat(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
  title?: string,
  metadata: Record<string, unknown> = {},
): Promise<Chat> {
  const { data, error } = await supabase
    .from("chats")
    .insert({
      project_id: projectId,
      user_id: userId,
      title: title ?? null,
      metadata,
    })
    .select()
    .single();

  if (error) {
    log.error({
      event: "persona.chat.create_failed",
      projectId,
      userId,
      errorMessage: error.message,
    });
    throw new Error(`Failed to create chat: ${error.message}`);
  }

  log.info({
    event: "persona.chat.created",
    chatId: (data as Chat).id,
    projectId,
    personaId: metadata.persona_id,
  });

  return data as Chat;
}

export async function appendMessage(
  supabase: SupabaseClient<Database>,
  chatId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata: Record<string, unknown> = {},
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, role, content, metadata })
    .select()
    .single();

  if (error) {
    log.error({
      event: "persona.message.append_failed",
      chatId,
      role,
      errorMessage: error.message,
    });
    throw new Error(`Failed to append message: ${error.message}`);
  }

  return data as Message;
}

export async function updateChatTitle(
  supabase: SupabaseClient<Database>,
  chatId: string,
  title: string,
) {
  await supabase.from("chats").update({ title }).eq("id", chatId);
}

export async function deleteChat(
  supabase: SupabaseClient<Database>,
  chatId: string,
) {
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) {
    log.error({ event: "persona.chat.delete_failed", chatId, errorMessage: error.message });
    throw new Error(`Failed to delete chat: ${error.message}`);
  }

  log.info({ event: "persona.chat.deleted", chatId });
}
