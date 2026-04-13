import { describe, it, expect, vi, beforeEach } from "vitest";
import { log, createRequestId } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("log.info writes a JSON string to console.log", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log.info({ event: "test.event", extra: 42 });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("test.event");
    expect(parsed.extra).toBe(42);
    expect(parsed.ts).toBeDefined();
  });

  it("log.error writes to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    log.error({ event: "test.error" });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("error");
  });

  it("log.warn writes to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    log.warn({ event: "test.warn" });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("warn");
  });

  it("log.debug writes to console.log in development", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log.debug({ event: "debug.check" });

    expect(spy).toHaveBeenCalledOnce();
  });

  it("each entry has an ISO timestamp", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log.info({ event: "ts.check" });

    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(() => new Date(parsed.ts)).not.toThrow();
    expect(new Date(parsed.ts).toISOString()).toBe(parsed.ts);
  });
});

describe("createRequestId", () => {
  it("returns a string starting with req_", () => {
    const id = createRequestId();
    expect(id).toMatch(/^req_\d+_\d+$/);
  });

  it("generates unique ids on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createRequestId()));
    expect(ids.size).toBe(100);
  });
});
