/**
 * Optional AI narrative layer — provider-agnostic.
 *
 * The deterministic engine assigns the phenotype and severity; this layer only
 * produces the *prose read*. Each phenotype ships a warm, second-person "read"
 * ("You're someone who…") in the library; `composeDeterministicNarrative`
 * returns that (lightly contextualized by cost) as the basis AND the offline
 * fallback. `buildNarratorMessages` asks an LLM to warm its tone only — never to
 * add claims, diagnose, change the assignment, or slip into first person.
 */

import type { OutputContract, PhenotypeProfile } from "../types";
import { tagLabel } from "../config";

export interface NarrativeInput {
  output: OutputContract;
  /** Primary phenotype's library entry (null for no_dominant_loop). */
  profile: PhenotypeProfile | null;
  secondaryProfile: PhenotypeProfile | null;
}

export const CRISIS_MESSAGE =
  "Some of what you shared sounds heavy. If you're thinking about harming yourself or you're in danger, you deserve support right now — in the US you can call or text 988 (Suicide & Crisis Lifeline), available 24/7. You can still see your result below, but please reach out.";

const NO_DOMINANT_READ =
  "From what you shared, there isn't one loop running the show right now. Your use looks mostly like something you steer, not something steering you — and that's worth noticing, and protecting.";

function costPhrase(costs: string[]): string {
  const labels = costs.map((c) => tagLabel("cost_domain", c).toLowerCase());
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/**
 * The warm, second-person result read assembled from the approved library copy.
 * This is what ships when AI is off, and the draft the AI is asked to warm.
 */
export function composeDeterministicNarrative(input: NarrativeInput): string {
  const { output, profile } = input;
  if (!profile || output.primary_phenotype_id === "no_dominant_loop") {
    return NO_DOMINANT_READ;
  }

  const parts: string[] = [profile.read];

  const costs = costPhrase(output.cost_domains);
  if (!output.primary_adaptive && costs) {
    parts.push(`Lately it's shown up most in ${costs}.`);
  }
  if (input.secondaryProfile) {
    parts.push(`There's a thread of ${input.secondaryProfile.name} running alongside it, too.`);
  }
  return parts.join("\n\n");
}

export interface NarratorMessages {
  system: string;
  user: string;
}

/** Builds the prompt that asks an LLM to warm the deterministic second-person read. */
export function buildNarratorMessages(input: NarrativeInput): NarratorMessages {
  const draft = composeDeterministicNarrative(input);
  const avoid = input.profile?.avoidSaying ?? "Avoid diagnosis or addiction language.";
  const system = [
    "You are the warm, perceptive voice of Blue Light Health's Tech Loop reflection.",
    "You are given a DETERMINISTIC, second-person draft read produced by a scoring engine, plus approved clinical guardrails.",
    "Your only job is to lightly warm and tighten the draft so the person feels genuinely seen.",
    "Stay in SECOND person ('you', 'you're someone who'). Never use first person ('I', 'what I'm hearing'). Never name the phenotype label inside the prose.",
    "Do NOT change the pattern, severity, or any claim. Do NOT add advice or content not in the draft. Do NOT diagnose, pathologize, or use addiction language.",
    "Voice: plain, warm, a little literary, non-judgmental, autonomy-respecting. 2–3 short paragraphs. Return prose only, no preamble.",
    `Guardrail for this pattern: ${avoid}`,
  ].join(" ");
  const user = [
    `STRUCTURED RESULT: ${JSON.stringify({
      adaptive: input.output.primary_adaptive,
      severity: input.output.severity_label,
      confidence: input.output.primary_confidence,
      costs: input.output.cost_domains,
      secondary: input.output.secondary_phenotype_name,
    })}`,
    "",
    "SECOND-PERSON DRAFT (warm this; keep its meaning, keep second person):",
    draft,
  ].join("\n");
  return { system, user };
}

/** A function the app injects: given system+user prompts, return the model's text. */
export type CompleteFn = (messages: NarratorMessages) => Promise<string>;

export interface AINarrator {
  narrate(input: NarrativeInput): Promise<{ text: string; aiUsed: boolean }>;
}

/**
 * Wraps an injected `complete()` into a narrator with graceful fallback: if the
 * model errors or returns nothing, the deterministic draft is used instead.
 */
export function makeNarrator(complete: CompleteFn): AINarrator {
  return {
    async narrate(input) {
      const fallback = composeDeterministicNarrative(input);
      try {
        const text = (await complete(buildNarratorMessages(input)))?.trim();
        if (!text) return { text: fallback, aiUsed: false };
        return { text, aiUsed: true };
      } catch {
        return { text: fallback, aiUsed: false };
      }
    },
  };
}

/** Deterministic-only narrator (no AI). */
export const deterministicNarrator: AINarrator = {
  async narrate(input) {
    return { text: composeDeterministicNarrative(input), aiUsed: false };
  },
};
