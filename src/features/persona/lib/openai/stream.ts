import { getOpenAIClient } from "./client";

type InputMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface StreamOptions {
  messages: InputMessage[];
  model?: string;
  previousResponseId?: string | null;
}

export async function createStreamingResponse(opts: StreamOptions) {
  const client = getOpenAIClient();
  const model = opts.model ?? process.env.PERSONA_CHAT_MODEL ?? "gpt-5.4";

  const response = await client.responses.create({
    model,
    input: opts.messages,
    stream: true,
    ...(opts.previousResponseId
      ? { previous_response_id: opts.previousResponseId }
      : {}),
  });

  return response;
}

export function encodeSSE(
  event: string,
  data: Record<string, unknown>,
): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
