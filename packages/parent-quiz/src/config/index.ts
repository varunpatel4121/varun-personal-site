/**
 * Parent Quiz config. Source of truth = the two docs in the Drive "AI Quiz /
 * Parent Quiz" folder (see config/source/SOURCES.md). Engine reads ids only;
 * all prose lives here as data the clinical/marketing team owns.
 */

import type { Band, ConfidenceConfig } from "@blh/quiz-core";
import type {
  ChildLoop,
  CtaReadiness,
  FamilyPattern,
  POption,
  PQuestion,
  ParentResult,
  SupportLevel,
} from "../types";

import questionsJson from "./questions.json";
import resultsJson from "./results.json";
import scoringJson from "./scoring.json";
import contentJson from "./content.json";

export interface ParentScoringConfig {
  version: string;
  secondaryRatio: number;
  costCap: number;
  supportBands: Band[];
  confidence: ConfidenceConfig;
}

export interface ParentContent {
  version: string;
  intro: { kicker: string; title: string; subtitle: string; disclaimer: string; cta: string };
  emailGate: { kicker: string; title: string; body: string; placeholder: string; cta: string; skip: string };
  result: {
    headlinePrefix: string;
    sections: Record<"seeing" | "doing" | "family" | "cost" | "helps" | "support", string>;
    secondaryPrefix: string;
    fitQuestion: string;
    fitOptions: { value: number; label: string }[];
    missedQuestion: string;
  };
  supportCopy: Record<SupportLevel, string>;
  cta: {
    title: string;
    body: string;
    reassure: string;
    bookLabel: string;
    lowReadyTitle: string;
    lowReadyBody: string;
    safetyTitle: string;
    safetyBody: string;
  };
  familyPatternLabels: Record<FamilyPattern, string>;
  defaultBookingUrl: string;
}

export const QUESTIONS = questionsJson.questions as PQuestion[];
export const QUESTIONS_VERSION = questionsJson.version;
export const RESULTS = resultsJson as ParentResult[];
export const scoringConfig = scoringJson as ParentScoringConfig;
export const CONTENT = contentJson as unknown as ParentContent;

export const RESULT_BY_ID = Object.fromEntries(RESULTS.map((r) => [r.id, r])) as Record<
  ChildLoop,
  ParentResult
>;

const OPTION_INDEX = new Map<string, POption>();
for (const q of QUESTIONS) {
  for (const o of q.options) OPTION_INDEX.set(`${q.id}:${o.value}`, o);
}

/** Look up an option's tags by question id + selected value. */
export function getOption(questionId: string, value: string): POption | undefined {
  return OPTION_INDEX.get(`${questionId}:${value}`);
}

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

/** Human label for a CTA-readiness id (used in the result + persistence). */
export const CTA_LABELS: Record<CtaReadiness, string> = {
  parent_plan: "Wants a plan",
  conversation: "Wants help talking",
  therapy_child: "Wants a therapist",
  parent_support: "Wants parent support",
  education: "Wants to understand first",
  low_ready: "Not ready yet",
};
