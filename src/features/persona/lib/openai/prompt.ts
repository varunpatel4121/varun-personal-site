import type { PersonaMessage } from "../../types";
import { getDefaultPersona } from "../personas";

export interface PromptContext {
  systemInstructions?: string;
  retrievedContext?: Array<{ content: string; source?: string }>;
  conversationHistory: PersonaMessage[];
  userMessage: string;
}

type InputMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function buildPromptInput(ctx: PromptContext): InputMessage[] {
  const messages: InputMessage[] = [];

  // Layer 1: System instructions (resolved from persona, with a safe fallback)
  let systemBlock =
    ctx.systemInstructions ?? getDefaultPersona().systemPrompt;

  // Layer 2: Retrieved context (RAG slot — empty in V1)
  if (ctx.retrievedContext && ctx.retrievedContext.length > 0) {
    const contextBlock = ctx.retrievedContext
      .map((c, i) => {
        const sourceLabel = c.source ? ` [Source: ${c.source}]` : "";
        return `[${i + 1}]${sourceLabel}\n${c.content}`;
      })
      .join("\n\n");

    systemBlock += `\n\nUse the following reference material to inform your response. Cite sources when relevant:\n\n${contextBlock}`;
  }

  messages.push({ role: "system", content: systemBlock });

  // Layer 3: Conversation history
  for (const msg of ctx.conversationHistory) {
    if (msg.role === "system") continue;
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  // Layer 4: Current user message
  messages.push({ role: "user", content: ctx.userMessage });

  return messages;
}
