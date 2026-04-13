import { describe, it, expect } from "vitest";
import { buildPromptInput } from "@/features/persona/lib/openai/prompt";
import type { Message } from "@/lib/supabase/types";

function makeMessage(
  role: "user" | "assistant" | "system",
  content: string,
): Message {
  return {
    id: crypto.randomUUID(),
    chat_id: "chat-1",
    role,
    content,
    metadata: {},
    created_at: new Date().toISOString(),
  };
}

describe("buildPromptInput", () => {
  it("produces system + user messages for a bare request", () => {
    const result = buildPromptInput({
      conversationHistory: [],
      userMessage: "Hello",
    });

    expect(result.length).toBe(2);
    expect(result[0].role).toBe("system");
    expect(result[1]).toEqual({ role: "user", content: "Hello" });
  });

  it("uses provided systemInstructions over default", () => {
    const custom = "You are a pirate.";
    const result = buildPromptInput({
      systemInstructions: custom,
      conversationHistory: [],
      userMessage: "Ahoy",
    });

    expect(result[0].content).toBe(custom);
  });

  it("falls back to default persona prompt when no systemInstructions given", () => {
    const result = buildPromptInput({
      conversationHistory: [],
      userMessage: "Hi",
    });

    expect(result[0].content.length).toBeGreaterThan(100);
  });

  it("includes conversation history in order, skipping system messages", () => {
    const history = [
      makeMessage("system", "should be skipped"),
      makeMessage("user", "first question"),
      makeMessage("assistant", "first answer"),
      makeMessage("user", "follow-up"),
      makeMessage("assistant", "follow-up answer"),
    ];

    const result = buildPromptInput({
      systemInstructions: "sys",
      conversationHistory: history,
      userMessage: "latest",
    });

    // system + 4 history (no system msg) + 1 current
    expect(result.length).toBe(6);
    expect(result.map((m) => m.role)).toEqual([
      "system",
      "user",
      "assistant",
      "user",
      "assistant",
      "user",
    ]);
    expect(result[1].content).toBe("first question");
    expect(result[5].content).toBe("latest");
  });

  it("appends retrieved context to the system block", () => {
    const result = buildPromptInput({
      systemInstructions: "Base instructions.",
      conversationHistory: [],
      userMessage: "Ask",
      retrievedContext: [
        { content: "Doc A body", source: "video-1" },
        { content: "Doc B body" },
      ],
    });

    const sys = result[0].content;
    expect(sys).toContain("Base instructions.");
    expect(sys).toContain("Doc A body");
    expect(sys).toContain("[Source: video-1]");
    expect(sys).toContain("Doc B body");
  });

  it("does not mutate system block when retrievedContext is empty", () => {
    const result = buildPromptInput({
      systemInstructions: "Clean.",
      conversationHistory: [],
      userMessage: "Hello",
      retrievedContext: [],
    });

    expect(result[0].content).toBe("Clean.");
  });

  it("handles very long conversation history without error", () => {
    const history: Message[] = [];
    for (let i = 0; i < 200; i++) {
      history.push(makeMessage(i % 2 === 0 ? "user" : "assistant", `msg-${i}`));
    }

    const result = buildPromptInput({
      systemInstructions: "sys",
      conversationHistory: history,
      userMessage: "final",
    });

    // system + 200 history + 1 current
    expect(result.length).toBe(202);
  });

  it("preserves message content exactly without trimming", () => {
    const content = "  spaces around  ";
    const result = buildPromptInput({
      systemInstructions: "sys",
      conversationHistory: [makeMessage("user", content)],
      userMessage: "end",
    });

    expect(result[1].content).toBe(content);
  });
});
