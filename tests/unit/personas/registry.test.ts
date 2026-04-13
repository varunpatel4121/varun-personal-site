import { describe, it, expect } from "vitest";
import {
  getPersona,
  getDefaultPersona,
  listPersonas,
  DEFAULT_PERSONA_ID,
} from "@/features/persona/lib/personas";

describe("Persona registry", () => {
  it("exports a non-empty DEFAULT_PERSONA_ID", () => {
    expect(DEFAULT_PERSONA_ID).toBeTruthy();
    expect(typeof DEFAULT_PERSONA_ID).toBe("string");
  });

  it("getDefaultPersona returns a valid definition", () => {
    const persona = getDefaultPersona();
    expect(persona.id).toBe(DEFAULT_PERSONA_ID);
    expect(persona.name).toBeTruthy();
    expect(persona.systemPrompt.length).toBeGreaterThan(50);
  });

  it("getPersona resolves the default persona by id", () => {
    const persona = getPersona(DEFAULT_PERSONA_ID);
    expect(persona).toBeDefined();
    expect(persona!.id).toBe(DEFAULT_PERSONA_ID);
  });

  it("getPersona returns undefined for unknown ids", () => {
    expect(getPersona("nonexistent-persona")).toBeUndefined();
    expect(getPersona("")).toBeUndefined();
  });

  it("listPersonas returns at least one persona", () => {
    const all = listPersonas();
    expect(all.length).toBeGreaterThanOrEqual(1);
    for (const p of all) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.systemPrompt).toBeTruthy();
    }
  });

  it("every listed persona is also accessible via getPersona", () => {
    for (const p of listPersonas()) {
      expect(getPersona(p.id)).toBe(p);
    }
  });

  it("Dr. Alok Kanojia persona has required structural sections", () => {
    const drK = getPersona("dr-alok-kanojia");
    expect(drK).toBeDefined();
    expect(drK!.systemPrompt).toContain("<role>");
    expect(drK!.systemPrompt).toContain("<core_method>");
    expect(drK!.systemPrompt).toContain("<safety_and_boundaries>");
  });
});
