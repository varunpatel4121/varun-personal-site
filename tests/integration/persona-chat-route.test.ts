import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockCreateStreamingResponse } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockCreateStreamingResponse: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

vi.mock("@/features/persona/lib/openai/stream", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/persona/lib/openai/stream")>();
  return {
    ...original,
    createStreamingResponse: mockCreateStreamingResponse,
  };
});

vi.mock("@/features/persona/lib/server/project", () => ({
  getOrCreateDefaultProject: vi.fn().mockResolvedValue({
    id: "proj-1",
    user_id: "user-1",
    name: "Persona",
    slug: "default",
    app: "persona",
    description: null,
    metadata: {},
    created_at: "",
    updated_at: "",
  }),
}));

import { POST } from "@/app/api/persona/chat/route";

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/persona/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function chainableBuilder(resolvedData: unknown = null) {
  const b: Record<string, unknown> = {};
  const terminal = { data: resolvedData, error: null };
  for (const m of ["select", "insert", "update", "delete", "eq", "order", "limit"]) {
    b[m] = vi.fn().mockReturnValue(b);
  }
  b.single = vi.fn().mockResolvedValue(terminal);
  return b;
}

describe("POST /api/persona/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await POST(makeRequest({ message: "hello" }));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when message is empty", async () => {
    const res = await POST(makeRequest({ message: "" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("Message is required");
  });

  it("returns 400 when message is whitespace-only", async () => {
    const res = await POST(makeRequest({ message: "   " }));
    expect(res.status).toBe(400);
  });

  it("creates a new chat and streams response for a new conversation", async () => {
    const newChat = {
      id: "chat-new",
      project_id: "proj-1",
      user_id: "user-1",
      title: "Hello",
      metadata: { persona_id: "dr-alok-kanojia" },
      created_at: "",
      updated_at: "",
    };

    const chatBuilder = chainableBuilder(newChat);
    const messageBuilder = chainableBuilder({ id: "msg-1" });
    const historyBuilder = chainableBuilder(null);

    mockFrom.mockImplementation((table: string) => {
      if (table === "chats") return chatBuilder;
      if (table === "messages") return messageBuilder;
      return historyBuilder;
    });

    (messageBuilder.order as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        { id: "msg-1", chat_id: "chat-new", role: "user", content: "Hello", metadata: {}, created_at: "" },
      ],
      error: null,
    });

    async function* fakeStream() {
      yield {
        type: "response.output_text.delta" as const,
        delta: "Hi there",
      };
      yield {
        type: "response.completed" as const,
        response: {
          id: "resp-1",
          usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        },
      };
    }

    mockCreateStreamingResponse.mockResolvedValue(fakeStream());

    const res = await POST(makeRequest({ message: "Hello", chatId: null }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const text = await res.text();
    expect(text).toContain("event: meta");
    expect(text).toContain("event: delta");
    expect(text).toContain("event: done");
    expect(text).toContain("chat-new");
    expect(text).toContain("Hi there");
  });

  it("resolves persona from existing chat metadata", async () => {
    const existingChat = {
      id: "chat-existing",
      project_id: "proj-1",
      user_id: "user-1",
      title: "Existing",
      metadata: { persona_id: "dr-alok-kanojia" },
      created_at: "",
      updated_at: "",
    };

    const chatBuilder = chainableBuilder(existingChat);
    const messageBuilder = chainableBuilder({ id: "msg-2" });

    mockFrom.mockImplementation((table: string) => {
      if (table === "chats") return chatBuilder;
      return messageBuilder;
    });

    (messageBuilder.order as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        { id: "msg-2", chat_id: "chat-existing", role: "user", content: "Follow up", metadata: {}, created_at: "" },
      ],
      error: null,
    });

    async function* fakeStream() {
      yield { type: "response.output_text.delta" as const, delta: "reply" };
      yield {
        type: "response.completed" as const,
        response: { id: "resp-2", usage: { input_tokens: 5, output_tokens: 3, total_tokens: 8 } },
      };
    }

    mockCreateStreamingResponse.mockResolvedValue(fakeStream());

    const res = await POST(makeRequest({ message: "Follow up", chatId: "chat-existing" }));
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain("event: done");
    expect(text).toContain("resp-2");
  });

  it("emits SSE error event when OpenAI stream throws", async () => {
    const newChat = {
      id: "chat-err",
      project_id: "proj-1",
      user_id: "user-1",
      title: "Test",
      metadata: { persona_id: "dr-alok-kanojia" },
      created_at: "",
      updated_at: "",
    };

    const chatBuilder = chainableBuilder(newChat);
    const messageBuilder = chainableBuilder({ id: "msg-3" });

    mockFrom.mockImplementation((table: string) => {
      if (table === "chats") return chatBuilder;
      return messageBuilder;
    });

    (messageBuilder.order as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ id: "msg-3", chat_id: "chat-err", role: "user", content: "Fail", metadata: {}, created_at: "" }],
      error: null,
    });

    async function* failingStream() {
      yield { type: "response.output_text.delta" as const, delta: "partial" };
      throw new Error("OpenAI rate limit");
    }

    mockCreateStreamingResponse.mockResolvedValue(failingStream());

    const res = await POST(makeRequest({ message: "Fail", chatId: null }));
    const text = await res.text();

    expect(text).toContain("event: error");
    expect(text).toContain("OpenAI rate limit");
  });

  it("returns 500 for unexpected top-level errors", async () => {
    mockGetUser.mockRejectedValueOnce(new Error("Supabase down"));

    const res = await POST(makeRequest({ message: "hello" }));
    expect(res.status).toBe(500);
  });
});
