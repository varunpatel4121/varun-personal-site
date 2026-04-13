import { describe, it, expect } from "vitest";
import { encodeSSE } from "@/features/persona/lib/openai/stream";

describe("encodeSSE", () => {
  const decoder = new TextDecoder();

  it("encodes an event with JSON data", () => {
    const bytes = encodeSSE("delta", { content: "hello" });
    const text = decoder.decode(bytes);

    expect(text).toBe('event: delta\ndata: {"content":"hello"}\n\n');
  });

  it("encodes the meta event with chatId and isNewChat", () => {
    const bytes = encodeSSE("meta", { chatId: "abc-123", isNewChat: true });
    const text = decoder.decode(bytes);

    expect(text).toContain("event: meta\n");
    const dataLine = text.split("\n")[1];
    const parsed = JSON.parse(dataLine.replace("data: ", ""));
    expect(parsed.chatId).toBe("abc-123");
    expect(parsed.isNewChat).toBe(true);
  });

  it("handles empty data objects", () => {
    const bytes = encodeSSE("done", {});
    const text = decoder.decode(bytes);
    expect(text).toBe("event: done\ndata: {}\n\n");
  });

  it("returns a typed byte array", () => {
    const result = encodeSSE("test", {});
    expect(result.constructor.name).toBe("Uint8Array");
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("escapes special characters in data", () => {
    const bytes = encodeSSE("delta", { content: 'line1\n"quoted"' });
    const text = decoder.decode(bytes);
    const dataLine = text.split("\n")[1];
    const parsed = JSON.parse(dataLine.replace("data: ", ""));
    expect(parsed.content).toBe('line1\n"quoted"');
  });
});
