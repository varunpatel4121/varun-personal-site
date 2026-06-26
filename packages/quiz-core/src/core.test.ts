import { describe, expect, it } from "vitest";
import { bandFor, marginConfidence, rankDesc, round } from "./engine";
import { buildSessionRecord, noopPersistence } from "./persistence";
import { makeNarrator, deterministicNarrator } from "./ai";

describe("engine helpers", () => {
  const bands = [
    { id: "low", min: 0 },
    { id: "mid", min: 5 },
    { id: "high", min: 10 },
  ];
  it("bandFor picks the highest band whose min <= score", () => {
    expect(bandFor(0, bands)).toBe("low");
    expect(bandFor(7, bands)).toBe("mid");
    expect(bandFor(99, bands)).toBe("high");
  });

  it("rankDesc drops zeros and is deterministic via canonical order", () => {
    const order = ["a", "b", "c"] as const;
    expect(rankDesc({ a: 0, b: 3, c: 3 }, order)).toEqual([["b", 3], ["c", 3]]);
  });

  it("marginConfidence covers high / medium / low / mixed", () => {
    const cfg = { highMinScore: 8, highMinMargin: 2.5, mediumMinScore: 6, mediumMinMargin: 1, mixedMargin: 1.5 };
    expect(marginConfidence(12, 4, cfg)).toBe("high");
    expect(marginConfidence(7, 5, cfg)).toBe("medium");
    expect(marginConfidence(3, 0, cfg)).toBe("low");
    expect(marginConfidence(9, 8, cfg)).toBe("mixed");
  });

  it("round", () => expect(round(1.239, 2)).toBe(1.24));
});

describe("persistence", () => {
  it("buildSessionRecord computes duration and stamps ids", () => {
    const r = buildSessionRecord({
      quizId: "demo", sessionId: "s1",
      startedAt: "2026-06-25T00:00:00.000Z", completedAt: "2026-06-25T00:01:00.000Z",
      schemaVersion: "1", configVersion: "1", contentVersion: "1",
      response: { a: 1 }, result: { ok: true }, answers: [], identity: {},
      fitRating: null, fitText: null, ai: { narrative_used: false },
    });
    expect(r.quiz_id).toBe("demo");
    expect(r.duration_ms).toBe(60000);
  });

  it("noopPersistence accepts anything", async () => {
    expect(await noopPersistence.saveSession({} as never)).toEqual({ ok: true });
  });
});

describe("narrator", () => {
  it("falls back to the deterministic draft when the model throws", async () => {
    const n = makeNarrator(async () => { throw new Error("down"); });
    const out = await n.narrate({ messages: { system: "s", user: "u" }, fallback: "draft" });
    expect(out).toEqual({ text: "draft", aiUsed: false });
  });
  it("uses the model text on success", async () => {
    const n = makeNarrator(async () => "warm");
    expect(await n.narrate({ messages: { system: "s", user: "u" }, fallback: "draft" })).toEqual({ text: "warm", aiUsed: true });
  });
  it("deterministicNarrator returns the fallback", async () => {
    expect(await deterministicNarrator.narrate({ messages: { system: "", user: "" }, fallback: "d" })).toEqual({ text: "d", aiUsed: false });
  });
});
