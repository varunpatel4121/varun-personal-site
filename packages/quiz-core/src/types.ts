/**
 * Shared, quiz-agnostic types. Each BLH quiz (tech-loop, parent, …) defines its
 * own taxonomy and result shape, but they all share this persistence envelope,
 * the identity/answer-log shapes, and the confidence enum.
 */

export type Confidence = "high" | "medium" | "low" | "mixed";

/** Optional contact info captured for the waitlist / lead. PII. */
export interface Identity {
  name?: string;
  email?: string;
  consentedToContact?: boolean;
}

/** One persisted answer — the auditable response record. */
export interface AnswerLogEntry {
  question_id: string;
  section: string;
  question_text: string;
  /** Selected machine values (tag ids / option ids / scale-as-string). */
  values: string[];
  /** Selected human labels, parallel to values. */
  labels: string[];
  scale?: number;
  /** Raw free text, preserved verbatim. */
  free_text?: string;
  /** Normalized signals this answer contributed. */
  signals?: { type: string; tag: string }[];
  /** Order recorded in. */
  position?: number;
}

export interface QuizMeta {
  quizId: string;
  schemaVersion: string;
  configVersion: string;
  contentVersion: string;
}

/**
 * The unit of persistence. Generic over the quiz's response + result shapes;
 * a structured adapter fans it across that quiz's tables and also keeps the
 * whole record as JSONB so nothing is lost.
 */
export interface SessionRecord<TResponse = unknown, TResult = unknown> {
  quiz_id: string;
  session_id: string;
  schema_version: string;
  config_version: string;
  content_version: string;
  started_at: string;
  completed_at: string;
  duration_ms?: number;
  /** PII — route to an access-controlled table, never public. */
  identity: Identity;
  response: TResponse;
  answers: AnswerLogEntry[];
  result: TResult;
  fit_rating: number | null;
  fit_text: string | null;
  ai: { narrative_used: boolean; model?: string };
}
