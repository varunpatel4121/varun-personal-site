/**
 * Parent-quiz AI narrative — the warm "soul-read" opening of the result. The
 * deterministic engine picks the result; this composes the read from the
 * approved library copy (and is what an LLM is asked to warm, never replace).
 * The structured sections (seeing / costing / helps / support) are rendered
 * verbatim from the result library, so the AI only touches the opening read.
 */

import type { NarratorMessages } from "@blh/quiz-core";
import { CONTENT } from "../config";
import type { ParentOutput, ParentResult } from "../types";

export interface ParentNarrativeInput {
  output: ParentOutput;
  result: ParentResult;
  secondaryResult: ParentResult | null;
}

export function composeParentNarrative(input: ParentNarrativeInput): string {
  const { output, result, secondaryResult } = input;
  if (output.safety_flag) return CONTENT.cta.safetyBody;

  const opening = `${result.recognitionLine} If that sentence landed, you're not imagining it — and it doesn't mean your child is broken.`;
  const doing = result.whatScreensMayBeDoing;
  const secondary = secondaryResult
    ? ` There's also a thread of ${secondaryResult.name.replace(/^The /, "").toLowerCase()} here.`
    : "";
  const support = CONTENT.supportCopy[output.support_level];

  return `${opening}\n\n${doing}${secondary}\n\n${support}`;
}

export function buildParentNarratorMessages(input: ParentNarrativeInput): NarratorMessages {
  const draft = composeParentNarrative(input);
  const system = [
    "You are the warm, grounded voice of Blue Light Health's parent screen-pattern reflection.",
    "You are given a DETERMINISTIC draft built from approved clinical copy. Lightly warm and personalize the tone so a parent feels seen and understood.",
    "Hard rules: do NOT change the result, support level, or any claim. Do NOT add advice not in the draft. Do NOT diagnose the child or use addiction/blame language.",
    "Speak to the parent's exhaustion, worry, and love. Frame support as relief, not a threat. Use careful uncertainty (may, can, often). Keep it to 2-3 short paragraphs, prose only.",
  ].join(" ");
  const user = [
    `STRUCTURED RESULT: ${JSON.stringify({
      result: input.result.name,
      secondary: input.secondaryResult?.name ?? null,
      family_pattern: input.output.family_pattern,
      support_level: input.output.support_level,
      costs: input.output.cost_domains,
    })}`,
    "",
    "DETERMINISTIC DRAFT (warm this, do not contradict it):",
    draft,
  ].join("\n");
  return { system, user };
}
