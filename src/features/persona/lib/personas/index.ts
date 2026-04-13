import type { PersonaDefinition } from "../../types";
import drAlokKanojia from "./dr-alok-kanojia";

const personas: Record<string, PersonaDefinition> = {
  [drAlokKanojia.id]: drAlokKanojia,
};

export const DEFAULT_PERSONA_ID = drAlokKanojia.id;

export function getPersona(id: string): PersonaDefinition | undefined {
  return personas[id];
}

export function getDefaultPersona(): PersonaDefinition {
  return drAlokKanojia;
}

export function listPersonas(): PersonaDefinition[] {
  return Object.values(personas);
}
