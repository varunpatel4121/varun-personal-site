/**
 * The persistence record. One `SessionRecord` is what the `QuizPersistence`
 * adapter receives; a structured adapter fans it out across
 * quiz_sessions / quiz_answers / quiz_results (+ an access-controlled
 * respondents table for identity). The whole record is also retained as JSONB
 * so nothing is ever lost, even if the relational columns evolve.
 */

import type { OutputContract, Identity, QuizResponse, Reporter, LifeStage } from "./engine";
import type { PhenotypeId } from "./taxonomy";

export type QuizSection =
  | "frame"
  | "baseline"
  | "pull"
  | "job"
  | "loop"
  | "cost"
  | "disambiguation"
  | "result";

/** One persisted answer (the auditable response record from the brief). */
export interface AnswerLogEntry {
  question_id: string;
  section: QuizSection;
  question_text: string;
  /** Order the answer was recorded in (maps to tlq.answers.position). */
  position?: number;
  /** Selected machine values (tag ids / option ids / scale-as-string). */
  values: string[];
  /** Selected human-readable labels, parallel to `values`. */
  labels: string[];
  /** Numeric scale answer, when the question is a 0..4 scale. */
  scale?: number;
  /** Raw free text the user typed, preserved verbatim. */
  free_text?: string;
  /** Normalized signals this answer contributed to scoring. */
  signals?: { type: string; tag: string }[];
}

/** The scored result, persisted to quiz_results. Output contract + spectrum. */
export interface SessionResult extends OutputContract {
  /** All 17 phenotype fit scores for the result spectrum / training data. */
  spectrum: Record<PhenotypeId, number>;
}

export interface SessionRecord {
  session_id: string;
  schema_version: string;
  config_version: string;
  content_version: string;
  reporter: Reporter;
  life_stage: LifeStage;
  started_at: string;
  completed_at: string;
  duration_ms?: number;
  /** PII — adapters route this to an access-controlled table, never public. */
  identity: Identity;
  /** Full structured input (retained as JSONB). */
  response: QuizResponse;
  /** Per-question audit log. */
  answers: AnswerLogEntry[];
  /** Scored output. */
  result: SessionResult;
  /** Section H Q1 — "did we get it right?" 0..4, the product's core metric. */
  fit_rating: number | null;
  /** Section H Q2 — "what did we miss?" free text. */
  fit_text: string | null;
  ai: { narrative_used: boolean; model?: string };
}
