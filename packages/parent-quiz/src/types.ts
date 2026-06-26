/**
 * Parent Quiz taxonomy + engine I/O.
 *
 * Formulation (Parent Quiz Taxonomy & Scoring docs, Drive "AI Quiz / Parent
 * Quiz"): Observable Concern(s) × Limit Response × Timing / Aftermath × Cost ×
 * Parent Role → a primary + up to two secondary PARENT PATTERNS, a severity
 * band, and a support-urgency signal. Parents report what they SEE at home; the
 * engine is deterministic and the LLM only warms the result copy.
 */

import type { Confidence } from "@blh/quiz-core";

// ── Parent patterns ─────────────────────────────────────────────────────────
// Seven "problem" patterns plus LOW (collaborative monitoring / no strong
// problem pattern). The backend two-letter ids match the scoring doc.
export const PROBLEM_PATTERNS = [
  "LB", // The Limit Battle
  "EP", // The Exhausted Peacekeeper
  "BMS", // The Bedtime/Morning Spiral
  "QPA", // The Quiet Pull-Away
  "SWL", // The Social Weather Loop
  "OLS", // The Offline-Life Shrink
  "SRS", // The Secrecy and Risk Spiral
] as const;
export type ProblemPattern = (typeof PROBLEM_PATTERNS)[number];

export const PARENT_PATTERNS = [...PROBLEM_PATTERNS, "LOW"] as const;
export type ParentPattern = (typeof PARENT_PATTERNS)[number];

// ── Severity + support urgency ──────────────────────────────────────────────
export const SEVERITY_BANDS = [
  "light",
  "moderate",
  "high_support_need",
  "safety_urgent",
] as const;
export type SeverityBand = (typeof SEVERITY_BANDS)[number];

export const SUPPORT_URGENCY = ["low", "moderate", "high", "safety_urgent"] as const;
export type SupportUrgency = (typeof SUPPORT_URGENCY)[number];

/** Severity band → support urgency is a 1:1 mapping (kept explicit for the payload). */
export const URGENCY_FOR_BAND: Record<SeverityBand, SupportUrgency> = {
  light: "low",
  moderate: "moderate",
  high_support_need: "high",
  safety_urgent: "safety_urgent",
};

export const AGE_BANDS = [
  "child",
  "tween",
  "young_teen",
  "older_teen",
  "launch",
  "other",
] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

// ── Config shapes ───────────────────────────────────────────────────────────
/** A single answer option and the tags it contributes to scoring. */
export interface POption {
  value: string;
  label: string;
  /** Points this answer adds to each parent pattern (scoring doc map). */
  patterns?: Partial<Record<ParentPattern, number>>;
  /** Severity delta this answer contributes (impact / control strain). */
  severity?: number;
  /**
   * Hard-rule + severity flags this answer raises. Known flags:
   * "safety" | "money" | "secrecy" | "srs_risk" | "high_urgency" |
   * "activation" | "low_signal".
   */
  flags?: string[];
  /** Evidence-signal tags collected into the structured payload. */
  signals?: string[];
  /** Opt-out / "we're fine" option — clears the rest of a multi-select. */
  exclusive?: boolean;
  ageBand?: AgeBand;
  /** Copy modifier note for the age question only (no scoring effect). */
  ageNote?: string;
}

export type QuestionType = "single" | "multi";

export interface PQuestion {
  id: string;
  section: string;
  type: QuestionType;
  question: string;
  hint?: string;
  max?: number;
  optional?: boolean;
  options: POption[];
}

// ── Engine I/O ──────────────────────────────────────────────────────────────
/** Selected option values keyed by question id, + optional free text. */
export interface ParentResponse {
  ageBand?: AgeBand;
  answers: Record<string, string[]>;
  freeText?: string;
}

export interface ParentOutput {
  primary_pattern: ParentPattern;
  primary_result_name: string;
  secondary_patterns: ProblemPattern[];
  severity_band: SeverityBand;
  support_urgency: SupportUrgency;
  safety_flag: boolean;
  evidence_signals: string[];
  result_copy_key: string;
  primary_concern: string | null;
  age_band: AgeBand | null;
  confidence: Confidence;
  hard_rules_triggered: string[];
  copy_generation_mode: "deterministic" | "ai_assisted";
  /** Raw score for every pattern (all 8), for analytics + the result spectrum. */
  spectrum: Record<ParentPattern, number>;
}

/** One entry in the result library (Parent Phenotype Library sheet, Table 1). */
export interface ParentResult {
  id: ParentPattern;
  copyKey: string;
  name: string;
  shortLabel: string;
  recognitionLine: string;
  definition: string;
  thisIsUs: string;
  observe: string;
  familyLoop: string;
  cost: string;
  whenNormal: string;
  whenProblem: string;
  whatHelps: string;
  supportBridge: string;
}
