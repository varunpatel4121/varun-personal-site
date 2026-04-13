import { createClient } from "@/lib/supabase/server";
import { createChat, appendMessage } from "@/features/persona/lib/server/chats";
import { getOrCreateDefaultProject } from "@/features/persona/lib/server/project";
import { buildPromptInput } from "@/features/persona/lib/openai/prompt";
import { createStreamingResponse, encodeSSE } from "@/features/persona/lib/openai/stream";
import { resolvePersonaForChat } from "@/features/persona/lib/personas/resolve-persona";
import { DEFAULT_PERSONA_ID } from "@/features/persona/lib/personas";
import type { Chat } from "@/lib/supabase/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, chatId: existingChatId } = body as {
      message: string;
      chatId: string | null;
    };

    if (!message?.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const project = await getOrCreateDefaultProject(supabase, user.id);

    // Resolve or create the chat
    let chatId = existingChatId;
    let isNewChat = false;
    let chatRow: Chat | null = null;

    if (!chatId) {
      const title = message.slice(0, 100) + (message.length > 100 ? "…" : "");
      const chat = await createChat(supabase, project.id, user.id, title, {
        persona_id: DEFAULT_PERSONA_ID,
      });
      chatId = chat.id;
      chatRow = chat;
      isNewChat = true;
    } else {
      const { data } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();
      chatRow = data as Chat | null;
    }

    // Resolve persona from chat metadata (falls back to default)
    const persona = resolvePersonaForChat(chatRow?.metadata);

    // Persist user message
    await appendMessage(supabase, chatId, "user", message);

    // Load conversation history
    const { data: history } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    const priorMessages = (history ?? []).slice(0, -1);

    // Assemble prompt layers with the resolved persona's system prompt
    const promptInput = buildPromptInput({
      systemInstructions: persona.systemPrompt,
      conversationHistory: priorMessages,
      userMessage: message,
      retrievedContext: [], // RAG slot — empty in V1
    });

    // Stream from OpenAI
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send chatId first so client knows which thread to track
          controller.enqueue(
            encodeSSE("meta", { chatId, isNewChat }),
          );

          const response = await createStreamingResponse({
            messages: promptInput,
          });

          let fullContent = "";

          for await (const event of response) {
            if (event.type === "response.output_text.delta") {
              fullContent += event.delta;
              controller.enqueue(
                encodeSSE("delta", { content: event.delta }),
              );
            }

            if (event.type === "response.completed") {
              const resp = event.response;
              await appendMessage(supabase, chatId!, "assistant", fullContent, {
                response_id: resp.id,
                usage: resp.usage,
              });

              controller.enqueue(
                encodeSSE("done", { responseId: resp.id }),
              );
            }
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Stream failed";
          controller.enqueue(encodeSSE("error", { error: errorMessage }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return Response.json({ error: message }, { status: 500 });
  }
}
