/**
 * Parent-quiz AI narrative — the warm "this is us" opening of the result. The
 * deterministic engine picks the pattern; this composes the read from the
 * approved library copy (the "This Is Us" column) and is what an LLM is asked to
 * warm, never replace. The structured sections (observe / cost / helps /
 * support) render verbatim from the result library, so the AI only touches the
 * opening read.
 */

import type { NarratorMessages } from "@blh/quiz-core";
import { CONTENT } from "../config";
import type { ParentOutput, ParentResult } from "../types";

export interface ParentNarrativeInput {
  output: ParentOutput;
  result: ParentResult;
  secondaryResults: ParentResult[];
}

const stripThe = (name: string) => name.replace(/^The /, "");

export function composeParentNarrative(input: ParentNarrativeInput): string {
  const { output, result, secondaryResults } = input;
  if (output.safety_flag) return CONTENT.cta.safetyBody;

  const opening = `${result.recognitionLine} If that landed, you're not imagining it — and it doesn't mean your child is broken or that you're failing as a parent.`;
  const read = result.thisIsUs;
  const secondary = secondaryResults.length
    ? ` ${CONTENT.result.secondaryPrefix} ${secondaryResults.map((r) => stripThe(r.name).toLowerCase()).join(" and ")} woven through it.`
    : "";
  const support = CONTENT.severityCopy[output.severity_band];

  return `${opening}\n\n${read}${secondary}\n\n${support}`;
}

export function buildParentNarratorMessages(input: ParentNarrativeInput): NarratorMessages {
  const draft = composeParentNarrative(input);
  const system = [
    "You are the warm, grounded voice of Blue Light Health's parent screen-pattern reflection.",
    "You are given a DETERMINISTIC draft built from approved clinical copy. Lightly warm and personalize the tone so a parent feels seen and understood.",
    "Hard rules: do NOT change the result, the pattern, the severity, or any claim. Do NOT add advice that is not in the draft. Do NOT diagnose the child or use addiction/blame language.",
    "Speak to the parent's exhaustion, worry, and love. Frame support as relief, not a threat. Use careful uncertainty (may, can, often). Keep it to 2-3 short paragraphs, prose only.",
  ].join(" ");
  const user = [
    `STRUCTURED RESULT: ${JSON.stringify({
      pattern: input.result.name,
      secondary: input.secondaryResults.map((r) => r.name),
      severity_band: input.output.severity_band,
      support_urgency: input.output.support_urgency,
      evidence: input.output.evidence_signals,
    })}`,
    "",
    "DETERMINISTIC DRAFT (warm this, do not contradict it):",
    draft,
  ].join("\n");
  return { system, user };
}
