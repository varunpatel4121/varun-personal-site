/**
 * Optional AI narrative layer — provider-agnostic.
 *
 * The deterministic engine assigns the phenotype + severity; this layer only
 * writes the prose read. Each phenotype ships a warm second-person "read"
 * ("You're someone who…"); the composer opens with it, then weaves the user's
 * OWN signals (when it fires, what it looks like, the job it's doing, where it
 * quietly costs) into a flowing, recognizable, "this is so me" read — never a
 * terse "shown up most in X" tack-on. `buildNarratorMessages` asks an LLM to
 * warm the tone of that draft; it never changes the assignment or facts.
 */

import type { OutputContract, PhenotypeProfile, SeverityBand } from "../types";

export interface NarrativeInput {
  output: OutputContract;
  profile: PhenotypeProfile | null;
  secondaryProfile: PhenotypeProfile | null;
}

export const CRISIS_MESSAGE =
  "Some of what you shared sounds heavy. If you're thinking about harming yourself or you're in danger, you deserve support right now — in the US you can call or text 988 (Suicide & Crisis Lifeline), available 24/7. You can still see your result below, but please reach out.";

const NO_DOMINANT_READ =
  "From what you shared, there isn't one loop running the show right now. Your use looks mostly like something you steer, not something steering you — and that's worth noticing, and protecting.";

// ── Natural-language fragments for the personalized paragraph ───────────────
const JOB: Record<string, string> = {
  stimulate: "chasing a little hit of something — novelty, energy, a spark",
  soothe: "turning down the volume on a feeling you didn't have time for",
  reassure: "buying a second of certainty, a quick “okay, everything's fine”",
  validate: "checking that you landed, that you matter, that you were seen",
  compare: "measuring where you stand against everyone else's highlight reel",
  connect: "reaching for closeness — company, presence, the feeling of being with people",
  empower: "going where effort turns into progress and you get to feel capable",
};
const ENTRY: Record<string, string> = {
  night_regulation: "late at night, once the day finally goes quiet",
  morning_check_in: "first thing, before you're even fully awake",
  gap_filling: "in the small gaps — waiting, walking, the in-between moments",
  task_avoidance: "right as something hard is about to start",
  stress_relief: "after a day that's drained you",
  alone_disconnected: "when you're on your own and a little disconnected",
  under_stimulated: "when you're restless or bored and need somewhere to put it",
  anytime_no_pattern: "at no particular time — it's just always within reach",
};
const LOOP: Record<string, string> = {
  quick_check: "a quick check you keep coming back to",
  time_sink_binge: "a “just a few minutes” that quietly becomes an hour",
  autopilot: "something your hand does before you've even decided to",
  waiting_refresh: "a refresh-and-wait, watching for something to change",
  completion: "a need to finish, clear, or complete just one more thing",
  background: "a low hum running underneath everything else",
  social_participation: "staying in the thread — the chat, the back-and-forth",
};
const COST: Record<string, string> = {
  sleep: "the sleep you keep trading away",
  work_school_responsibilities: "the things you meant to get to",
  focus_attention: "how scattered your attention feels",
  mood_anxiety: "your mood the next day",
  self_body_image: "the way you end up feeling about yourself",
  friendships_dating_social: "the closeness with people who are actually in the room",
  home_family_conflict: "the peace at home",
  money: "your money",
};

const BAND_DESC: Record<SeverityBand, string> = {
  light_grip: "A light grip — a real pattern, but one that still looks mostly in your control.",
  steady_pull: "A steady pull — there's a clear draw here, and it's started to cost you a little.",
  deep_loop: "A deep loop — this is taking a real, repeated toll, and it's worth taking seriously.",
  high_impact_loop: "A high-impact loop — this is carrying a lot of weight right now, and you don't have to white-knuckle it alone.",
};

/** One-line, plain-English description of the severity band (shown on the result). */
export function severityDescription(band: SeverityBand): string {
  return BAND_DESC[band];
}

function joinAnd(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]}, and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/**
 * The warm, personalized second-person read. Opens with the phenotype's read,
 * then a paragraph built from the user's own signals, then a gentle cost reframe.
 */
export function composeDeterministicNarrative(input: NarrativeInput): string {
  const { output, profile } = input;
  if (!profile || output.primary_phenotype_id === "no_dominant_loop") return NO_DOMINANT_READ;

  const parts: string[] = [profile.read];

  // Paragraph 2 — how it actually shows up for *you*.
  const entry = ENTRY[output.top_entry_points?.[0] ?? ""];
  const loop = LOOP[output.top_loop_shapes?.[0] ?? ""];
  const job = JOB[output.top_job_tags?.[0] ?? ""];
  const shape: string[] = [];
  if (entry) shape.push(`it tends to surface ${entry}`);
  if (loop) shape.push(`from the outside it looks like ${loop}`);
  let p2 = shape.length ? `For you, ${joinAnd(shape)}.` : "";
  if (job) p2 += `${p2 ? " " : ""}Underneath, it's doing something real: ${job}.`;
  if (p2) parts.push(p2);

  // Paragraph 3 — a gentle, non-pathologizing cost reframe (skip if adaptive).
  if (!output.primary_adaptive) {
    const costs = (output.cost_domains ?? []).map((c) => COST[c]).filter(Boolean) as string[];
    if (costs.length) {
      parts.push(
        `Where it quietly costs you is ${joinAnd(costs.slice(0, 2))}. That isn't a character flaw — it's the bill for a shortcut that mostly works, right up until it doesn't.`,
      );
    }
  }
  return parts.join("\n\n");
}

export interface NarratorMessages { system: string; user: string; }

export function buildNarratorMessages(input: NarrativeInput): NarratorMessages {
  const draft = composeDeterministicNarrative(input);
  const avoid = input.profile?.avoidSaying ?? "Avoid diagnosis or addiction language.";
  const system = [
    "You are the warm, perceptive voice of Blue Light Health's Tech Loop reflection.",
    "You are given a DETERMINISTIC, second-person draft read produced by a scoring engine, plus approved clinical guardrails.",
    "Warm and tighten the draft so the person feels genuinely, specifically seen — the way a good horoscope makes you nod, but grounded in what they actually told us.",
    "Stay in SECOND person ('you', 'you're someone who'). Never first person ('I', 'what I'm hearing'). Never name the phenotype label inside the prose.",
    "Keep every concrete detail from the draft (when it fires, what it looks like, the job it does, the costs). Do NOT add new facts, advice, diagnosis, or addiction language.",
    "Voice: plain, warm, a little literary, non-judgmental. 2–3 short paragraphs. Return prose only, no preamble.",
    `Guardrail for this pattern: ${avoid}`,
  ].join(" ");
  const user = [
    `STRUCTURED RESULT: ${JSON.stringify({
      adaptive: input.output.primary_adaptive,
      severity: input.output.severity_label,
      hooks: input.output.top_hook_tags,
      jobs: input.output.top_job_tags,
      whenItFires: input.output.top_entry_points,
      shape: input.output.top_loop_shapes,
      costs: input.output.cost_domains,
    })}`,
    "",
    "SECOND-PERSON DRAFT (warm this; keep its meaning and every detail; keep second person):",
    draft,
  ].join("\n");
  return { system, user };
}

export type CompleteFn = (messages: NarratorMessages) => Promise<string>;

export interface AINarrator {
  narrate(input: NarrativeInput): Promise<{ text: string; aiUsed: boolean }>;
}

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

export const deterministicNarrator: AINarrator = {
  async narrate(input) {
    return { text: composeDeterministicNarrative(input), aiUsed: false };
  },
};
