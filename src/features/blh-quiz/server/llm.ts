import Anthropic from "@anthropic-ai/sdk";
import {
  followupJsonSchema,
  makeFollowupSchema,
  type FollowupPayload,
} from "../engine/llm-schema";
import type { ScoringConfig } from "../engine/types";
import scoringConfig from "../config/scoring.json";

const scoring = scoringConfig as unknown as ScoringConfig;

const MODEL = process.env.BLH_LLM_MODEL || "claude-sonnet-4-6";

export function llmAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

const VOICE = `You write for Blue Light Health's "What's your tech loop?" quiz. Voice: calm, precise, a little literary. Warm but never gushing. Never clinical-cold, never influencer-chirpy, never alarmist.

Hard rules — these are safety requirements, not style preferences:
- NEVER use diagnosis language (no "addiction", "disorder", "symptoms", "condition", "clinical").
- NEVER make treatment claims or mention medication.
- NEVER use fear-mongering or shaming language. The sexual-content territory in particular must be entirely non-shaming.
- Speak in second person, mirroring the user's own words back where possible.
- This is a "draft reflection", not a verdict.`;

export interface QuizContext {
  anchorLabel: string;
  topPhenotypes: { id: string; name: string; score: number }[];
  topJobs: string[];
  timing: string[];
  stage: string;
  control: number;
  costs: string[];
  severityBand?: string;
  safety?: boolean;
  answers: { question: string; answer: string }[];
  classification?: {
    primaryName: string | null;
    primaryRead: string | null;
    secondaryName: string | null;
    confidence: string;
  };
  mirrorResponse?: string | null;
}

function answersDigest(ctx: QuizContext): string {
  return ctx.answers
    .map((a) => `Q: ${a.question}\nThey answered: "${a.answer}"`)
    .join("\n\n");
}

export async function generateFollowups(
  ctx: QuizContext,
): Promise<FollowupPayload> {
  const phenotypeGuide = `Phenotype tags you may weight (0–${scoring.llm.maxOptionWeight} each):
regulator (late-night soothing), spiral (social comparison), gamer (achievement-escape), drifter (frictionless autopilot), checker (reassurance/FOMO), socializer (online belonging), shame (private relief + shame cycle), confidant (AI/parasocial intimacy), outrage (anger-as-stimulation).
Job tags: escape, soothe, compare, validate, reassure, achieve, connect, stimulate, avoid, sexreg, understood.`;

  const prompt = `${VOICE}

A user is mid-quiz. Their hardest-to-put-down space is: ${ctx.anchorLabel}.
Current working hypotheses (deterministic engine, strongest first): ${ctx.topPhenotypes.map((p) => `${p.id} (${p.score})`).join(", ") || "none yet"}.

Their actual answers so far:
${answersDigest(ctx)}

${phenotypeGuide}

Write ${scoring.llm.maxFollowups === 1 ? "1 follow-up question" : `1–${scoring.llm.maxFollowups} follow-up questions`} that go one layer deeper than the scripted questions could. Requirements:
- Each question must visibly reference something specific the user actually said — quote a fragment of their own answer back at them.
- Questions are scene-specific second-person mirrors, not survey items. The user should think "oh, that is exactly how I use it."
- 3–5 answer options per question, written in the user's inner voice (first person, the honest version not the comfortable version). If an option could appear in a generic wellness survey, rewrite it.
- Each option carries phenotype weights and job tags that an analyst would assign to that answer. Weight 2–3 = strong signal, 1 = mild, {} = neutral.
- Do NOT add an "I'm not sure" option — the product appends one automatically.
- Choose the question that would best separate the top two hypotheses, or sharpen the top one if it's far ahead.`;

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
    output_config: {
      format: {
        type: "json_schema",
        schema: followupJsonSchema(),
      },
    },
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return makeFollowupSchema(scoring).parse(JSON.parse(text));
}

export function streamMirror(ctx: QuizContext) {
  const prompt = `${VOICE}

You are the quiz's mid-point "mirror moment". The user has answered most of the questions; before the last section, the quiz says back what it's seeing.

Their hardest-to-put-down space: ${ctx.anchorLabel}.
Engine hypotheses (strongest first): ${ctx.topPhenotypes.map((p) => `${p.name} (${p.score})`).join(", ") || "no strong pattern"}.
The emotional jobs their use seems to serve: ${ctx.topJobs.join("; ") || "unclear"}.
When it gets away from them: ${ctx.timing.join(", ") || "no clear timing"}.
Stage: ${ctx.stage} (compensation = relief rather than fun).
Their own words:
${answersDigest(ctx)}

Write the mirror: 2–3 sentences, warm plain language, that reflects the PATTERN you see — the job the screen is doing and when it clocks in. Quote or closely echo at least one fragment of their own answers. Do not name the phenotype, do not give advice, do not praise. End with exactly: "Does that track?"

Write only the mirror text, nothing else.`;

  return client().messages.stream({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });
}

export function streamNarrative(ctx: QuizContext) {
  const cls = ctx.classification;
  const safetyBlock = ctx.safety
    ? `
SAFETY MODE IS ON for this user (heavy load + self-image costs + vulnerable context). Requirements:
- Open by acknowledging, gently, that they're carrying a lot right now — without drama.
- Zero playful or clever copy. Calm, steady, on their side.
- Make clear that loops like this respond to real support, and that talking to someone is a strength move, not a failure.
- Do NOT mention crisis lines or phone numbers — the page already displays resources.`
    : "";

  const prompt = `${VOICE}

The deterministic engine has classified this user. YOUR JOB IS PROSE ONLY — you must not change, hedge, or re-diagnose the classification.

Classification (fixed): ${cls?.primaryName ?? "No dominant loop"}${cls?.secondaryName ? `, with a secondary thread of ${cls.secondaryName}` : ""}. Read confidence: ${cls?.confidence}.
Canonical description of this pattern: ${cls?.primaryRead ?? "Their answers don't point to one strong pattern — and that's a legitimate result, not a failure of the quiz."}

Their hardest-to-put-down space: ${ctx.anchorLabel || "n/a"}.
Jobs their use serves: ${ctx.topJobs.join("; ") || "unclear"}.
Timing: ${ctx.timing.join(", ") || "n/a"}. Stage: ${ctx.stage}. Costs: ${ctx.costs.join(", ") || "none reported"}.
They rated the mid-quiz mirror: ${ctx.mirrorResponse ?? "n/a"}.
Their own words during the quiz:
${answersDigest(ctx)}
${safetyBlock}

Write "your loop, as best we can read it": 2–3 short paragraphs of second-person prose that
- tells the story of THEIR loop specifically, quoting at least two fragments of their actual answers back to them (in quotation marks),
- explains the mechanism — the job the screen does, when it clocks in, and what it costs — in plain language,
- ends with one grounded, non-prescriptive observation about where the loop is most changeable (no advice lists, no "you should").

${cls?.primaryName ? "" : "This user has NO dominant loop: be genuinely affirming that their use looks mostly intentional, zero pathologizing, and keep it to 2 short paragraphs."}

Write only the narrative prose, nothing else.`;

  return client().messages.stream({
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });
}
