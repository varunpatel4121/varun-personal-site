/**
 * AI narrator transport — provider-agnostic. Each quiz composes its own
 * deterministic draft + prompt (from its engine output + approved copy) and
 * hands them here; core only relays to an injected model and falls back to the
 * deterministic draft on any failure. The LLM never changes assignment.
 */

export interface NarratorMessages {
  system: string;
  user: string;
}

/** Injected by the app: given prompts, return the model's text. */
export type CompleteFn = (messages: NarratorMessages) => Promise<string>;

export interface NarrateRequest {
  messages: NarratorMessages;
  /** Deterministic draft used verbatim if the model is unavailable. */
  fallback: string;
}

export interface Narrator {
  narrate(req: NarrateRequest): Promise<{ text: string; aiUsed: boolean }>;
}

/** Wraps an injected complete() with graceful fallback to the deterministic draft. */
export function makeNarrator(complete: CompleteFn): Narrator {
  return {
    async narrate({ messages, fallback }) {
      try {
        const text = (await complete(messages))?.trim();
        if (!text) return { text: fallback, aiUsed: false };
        return { text, aiUsed: true };
      } catch {
        return { text: fallback, aiUsed: false };
      }
    },
  };
}

/** No-AI narrator: always returns the deterministic draft. */
export const deterministicNarrator: Narrator = {
  async narrate({ fallback }) {
    return { text: fallback, aiUsed: false };
  },
};
