/**
 * Parent Quiz config. Source of truth = the three docs in the Drive "AI Quiz /
 * Parent Quiz" folder (Taxonomy & Question Bank, Scoring System, Phenotype
 * Library — see config/source/SOURCES.md). Engine reads ids only; all prose
 * lives here as data the clinical/marketing team owns.
 */

import type { ConfidenceConfig } from "@blh/quiz-core";
import type {
  ParentPattern,
  POption,
  PQuestion,
  ParentResult,
  SeverityBand,
} from "../types";

import questionsJson from "./questions.json";
import resultsJson from "./results.json";
import scoringJson from "./scoring.json";
import contentJson from "./content.json";

export interface ParentScoringConfig {
  version: string;
  /** Minimum points for a pattern to be eligible as primary (unless a hard rule fires). */
  primaryMinScore: number;
  /** Minimum points for a pattern to qualify as a secondary. */
  secondaryMinScore: number;
  /** A secondary must be within this many points of the primary. */
  secondaryWithin: number;
  /** Cap on how many secondary patterns to surface. */
  maxSecondary: number;
  /** BMS only wins ties over OLS/LB at or above this score (with a sleep impact). */
  bmsTieMinScore: number;
  severityThresholds: { moderate: number; high_support_need: number };
  confidence: ConfidenceConfig;
}

export interface ParentContent {
  version: string;
  intro: { kicker: string; title: string; subtitle: string; disclaimer: string; cta: string };
  emailGate: { kicker: string; title: string; body: string; placeholder: string; cta: string; skip: string };
  result: {
    headlinePrefix: string;
    sections: Record<"observe" | "family" | "cost" | "helps" | "support" | "whenNormal" | "whenProblem", string>;
    secondaryPrefix: string;
    fitQuestion: string;
    fitOptions: { value: number; label: string }[];
    missedQuestion: string;
  };
  severityCopy: Record<SeverityBand, string>;
  severityChip: Record<SeverityBand, string>;
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
  defaultBookingUrl: string;
}

export const QUESTIONS = questionsJson.questions as PQuestion[];
export const QUESTIONS_VERSION = questionsJson.version;
export const RESULTS = resultsJson as ParentResult[];
export const scoringConfig = scoringJson as ParentScoringConfig;
export const CONTENT = contentJson as unknown as ParentContent;

export const RESULT_BY_ID = Object.fromEntries(RESULTS.map((r) => [r.id, r])) as Record<
  ParentPattern,
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
