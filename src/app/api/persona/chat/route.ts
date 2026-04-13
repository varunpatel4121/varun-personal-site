import { createClient } from "@/lib/supabase/server";
import { createChat, appendMessage } from "@/features/persona/lib/server/chats";
import { getOrCreateDefaultProject } from "@/features/persona/lib/server/project";
import { buildPromptInput } from "@/features/persona/lib/openai/prompt";
import { createStreamingResponse, encodeSSE } from "@/features/persona/lib/openai/stream";
import { resolvePersonaForChat } from "@/features/persona/lib/personas/resolve-persona";
import { DEFAULT_PERSONA_ID } from "@/features/persona/lib/personas";
import { log, createRequestId } from "@/lib/logger";
import type { Chat } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      log.warn({ event: "persona.chat.unauthorized", requestId });
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, chatId: existingChatId } = body as {
      message: string;
      chatId: string | null;
    };

    if (!message?.trim()) {
      log.warn({ event: "persona.chat.empty_message", requestId, userId: user.id });
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const project = await getOrCreateDefaultProject(supabase, user.id);

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

    const persona = resolvePersonaForChat(chatRow?.metadata);

    await appendMessage(supabase, chatId, "user", message);

    const { data: history } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    const priorMessages = (history ?? []).slice(0, -1);

    log.info({
      event: "persona.chat.request",
      requestId,
      userId: user.id,
      projectId: project.id,
      chatId,
      isNewChat,
      personaId: persona.id,
      historyCount: priorMessages.length,
      userMessageChars: message.length,
    });

    const promptInput = buildPromptInput({
      systemInstructions: persona.systemPrompt,
      conversationHistory: priorMessages,
      userMessage: message,
      retrievedContext: [],
    });

    // SSE streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const streamStart = Date.now();
        try {
          controller.enqueue(encodeSSE("meta", { chatId, isNewChat }));

          const response = await createStreamingResponse({ messages: promptInput });

          let fullContent = "";

          for await (const event of response) {
            if (event.type === "response.output_text.delta") {
              fullContent += event.delta;
              controller.enqueue(encodeSSE("delta", { content: event.delta }));
            }

            if (event.type === "response.completed") {
              const resp = event.response;
              await appendMessage(supabase, chatId!, "assistant", fullContent, {
                response_id: resp.id,
                usage: resp.usage,
              });

              const usage = resp.usage as Record<string, unknown> | undefined;
              log.info({
                event: "persona.chat.completed",
                requestId,
                chatId,
                personaId: persona.id,
                responseId: resp.id,
                durationMs: Date.now() - streamStart,
                inputTokens: usage?.input_tokens,
                outputTokens: usage?.output_tokens,
                totalTokens: usage?.total_tokens,
                outputChars: fullContent.length,
              });

              controller.enqueue(encodeSSE("done", { responseId: resp.id }));
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Stream failed";
          log.error({
            event: "persona.chat.stream_error",
            requestId,
            chatId,
            stage: "openai",
            errorName: err instanceof Error ? err.name : "Unknown",
            errorMessage,
            durationMs: Date.now() - streamStart,
          });
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
    const errorMessage = err instanceof Error ? err.message : "Internal error";
    log.error({
      event: "persona.chat.fatal",
      requestId,
      errorName: err instanceof Error ? err.name : "Unknown",
      errorMessage,
      durationMs: Date.now() - startTime,
    });
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
