import type { PersonaDefinition } from "../../types";
import { getPersona, getDefaultPersona } from "./index";

/**
 * Resolves the persona for a chat thread.
 * Reads persona_id from chat metadata, falls back to the default persona.
 */
export function resolvePersonaForChat(
  chatMetadata: Record<string, unknown> | null | undefined,
): PersonaDefinition {
  const personaId =
    chatMetadata && typeof chatMetadata.persona_id === "string"
      ? chatMetadata.persona_id
      : null;

  if (personaId) {
    const persona = getPersona(personaId);
    if (persona) return persona;
  }

  return getDefaultPersona();
}
