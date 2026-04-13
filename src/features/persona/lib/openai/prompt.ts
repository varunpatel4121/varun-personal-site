import type { PersonaMessage } from "../../types";

const DEFAULT_SYSTEM_INSTRUCTIONS = `You are a thoughtful, knowledgeable assistant. Be clear, concise, and helpful. When you're unsure about something, say so rather than guessing. Use markdown formatting when it helps readability.`;

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

  // Layer 1: System instructions
  let systemBlock = ctx.systemInstructions ?? DEFAULT_SYSTEM_INSTRUCTIONS;

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
