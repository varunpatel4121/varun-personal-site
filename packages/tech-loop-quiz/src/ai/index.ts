/**
 * Optional AI narrative layer — provider-agnostic.
 *
 * The deterministic engine assigns the phenotype and severity; this layer only
 * produces the *prose read*. The package ships `composeDeterministicNarrative`
 * (the basis AND the offline fallback) and `buildNarratorMessages` (a prompt
 * that asks an LLM to warm the tone of that deterministic draft — never to add
 * claims, diagnose, or change the assignment). The consuming app injects a
 * generic `complete()` so no provider/SDK is bundled here.
 */

import type { OutputContract, PhenotypeProfile, SeverityBand } from "../types";
import { tagLabel } from "../config";

export interface NarrativeInput {
  output: OutputContract;
  /** Primary phenotype's library entry (null for no_dominant_loop). */
  profile: PhenotypeProfile | null;
  secondaryProfile: PhenotypeProfile | null;
}

export const CRISIS_MESSAGE =
  "Some of what you shared sounds heavy. If you're thinking about harming yourself or you're in danger, you deserve support right now — in the US you can call or text 988 (Suicide & Crisis Lifeline), available 24/7. You can still see your result below, but please reach out.";

const BAND_PHRASE: Record<SeverityBand, string> = {
  light_grip: "a light grip — a real pattern, but one that still looks mostly in your control",
  steady_pull: "a steady pull — there's a clear draw here, with some cost showing up",
  deep_loop: "a deep loop — this is taking a real, repeated toll",
  high_impact_loop: "a high-impact loop — this is carrying a lot of weight right now",
};

function costPhrase(costs: string[]): string {
  const labels = costs.map((c) => tagLabel("cost_domain", c).toLowerCase());
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/**
 * Deterministic, warm result read assembled from the approved library copy.
 * This is what ships when AI is off, and the draft the AI is asked to warm.
 */
export function composeDeterministicNarrative(input: NarrativeInput): string {
  const { output, profile } = input;
  if (!profile || output.primary_phenotype_id === "no_dominant_loop") {
    return [
      "From what you shared, there isn't one dominant loop running the show right now.",
      "Your use looks mostly like something you're steering, not something steering you. That's worth noticing — and worth protecting.",
    ].join("\n\n");
  }

  const band = BAND_PHRASE[output.severity_label];
  const costs = costPhrase(output.cost_domains);

  const opening = output.primary_adaptive
    ? `What I'm hearing sounds like ${profile.name} — and in your case, it reads as mostly adaptive. ${profile.recognitionLine}`
    : `What I'm hearing sounds like ${profile.name}. ${profile.recognitionLine}`;

  const middle = output.primary_adaptive
    ? profile.whenAdaptive
    : `${profile.whatItsDoing} ${costs ? `Where it's showing up lately: ${costs}.` : ""}`.trim();

  const closing = output.primary_adaptive
    ? `${profile.whatHelps} A small place to start: ${profile.firstTinyStep.toLowerCase()}`
    : `Right now this reads as ${band}. ${profile.whatHelps} One small place to start: ${profile.firstTinyStep.toLowerCase()}`;

  const secondary = input.secondaryProfile
    ? `\n\nThere's also a thread of ${input.secondaryProfile.name} here — ${input.secondaryProfile.recognitionLine.toLowerCase()}`
    : "";

  return `${opening}\n\n${middle}${secondary}\n\n${closing}`;
}

export interface NarratorMessages {
  system: string;
  user: string;
}

/** Builds the prompt that asks an LLM to warm the deterministic draft. */
export function buildNarratorMessages(input: NarrativeInput): NarratorMessages {
  const draft = composeDeterministicNarrative(input);
  const avoid = input.profile?.avoidSaying ?? "Avoid diagnosis or addiction language.";
  const system = [
    "You are the warm, precise voice of Blue Light Health's Tech Loop reflection.",
    "You are given a DETERMINISTIC draft read produced by a scoring engine, plus approved clinical copy.",
    "Your only job is to lightly warm and personalize the tone of the draft so it feels like a person was truly seen.",
    "Hard rules: do NOT change the phenotype, severity, or any factual claim. Do NOT add new advice or content not in the draft.",
    "Do NOT diagnose, label, pathologize, or use addiction language. Use motivational-interviewing voice: open, non-judgmental, autonomy-supporting.",
    `Phenotype-specific guardrail: ${avoid}`,
    "Keep it to 2–3 short paragraphs. Return prose only, no preamble.",
  ].join(" ");
  const user = [
    `STRUCTURED RESULT: ${JSON.stringify({
      primary: input.output.primary_phenotype_name,
      adaptive: input.output.primary_adaptive,
      severity: input.output.severity_label,
      confidence: input.output.primary_confidence,
      costs: input.output.cost_domains,
      secondary: input.output.secondary_phenotype_name,
    })}`,
    "",
    "DETERMINISTIC DRAFT (warm this, do not contradict it):",
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
