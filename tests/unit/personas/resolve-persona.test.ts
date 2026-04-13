import { describe, it, expect } from "vitest";
import { resolvePersonaForChat } from "@/features/persona/lib/personas/resolve-persona";
import { DEFAULT_PERSONA_ID, getDefaultPersona } from "@/features/persona/lib/personas";

describe("resolvePersonaForChat", () => {
  const defaultPersona = getDefaultPersona();

  it("returns the default persona when metadata is null", () => {
    expect(resolvePersonaForChat(null)).toBe(defaultPersona);
  });

  it("returns the default persona when metadata is undefined", () => {
    expect(resolvePersonaForChat(undefined)).toBe(defaultPersona);
  });

  it("returns the default persona when metadata has no persona_id", () => {
    expect(resolvePersonaForChat({})).toBe(defaultPersona);
  });

  it("returns the default persona when persona_id is not a string", () => {
    expect(resolvePersonaForChat({ persona_id: 42 })).toBe(defaultPersona);
    expect(resolvePersonaForChat({ persona_id: true })).toBe(defaultPersona);
    expect(resolvePersonaForChat({ persona_id: null })).toBe(defaultPersona);
  });

  it("returns the matching persona when persona_id is valid", () => {
    const result = resolvePersonaForChat({ persona_id: DEFAULT_PERSONA_ID });
    expect(result.id).toBe(DEFAULT_PERSONA_ID);
  });

  it("falls back to default for unrecognized persona_id", () => {
    const result = resolvePersonaForChat({ persona_id: "unknown-persona-xyz" });
    expect(result).toBe(defaultPersona);
  });

  it("ignores extra metadata fields", () => {
    const result = resolvePersonaForChat({
      persona_id: DEFAULT_PERSONA_ID,
      someOtherKey: "value",
    });
    expect(result.id).toBe(DEFAULT_PERSONA_ID);
  });
});
