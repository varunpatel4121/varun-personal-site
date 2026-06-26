/**
 * Persistence is an injected adapter, never a hard dependency — that is what
 * keeps the package portable. The package defines the `QuizPersistence`
 * interface and a couple of generic adapters; the consuming app provides the
 * concrete Supabase implementation (so no Supabase/secret coupling lives here).
 *
 * `buildSessionRecord` assembles the full, structured `SessionRecord` from the
 * response, the scored result, the answer log, and identity — the exact shape
 * the SQL schema in `schema/` mirrors.
 */

import type {
  AnswerLogEntry,
  Identity,
  QuizResponse,
  ScoreResult,
  SessionRecord,
  SessionResult,
} from "../types";
import { SCHEMA_VERSION } from "../types/version";

export interface SaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface QuizPersistence {
  saveSession(record: SessionRecord): Promise<SaveResult>;
}

/** Discards records — the default when no backend is configured. */
export const noopPersistence: QuizPersistence = {
  async saveSession() {
    return { ok: true };
  },
};

/**
 * POSTs the record as JSON to an endpoint (typically an app API route that
 * holds the service-role key and writes to Supabase). Never throws — a failed
 * analytics write must not break the user's result page.
 */
export function httpPersistence(endpoint: string): QuizPersistence {
  return {
    async saveSession(record) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(record),
        });
        if (!res.ok) return { ok: false, error: `http_${res.status}` };
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "network_error" };
      }
    },
  };
}

export interface BuildSessionArgs {
  sessionId: string;
  startedAt: string;
  completedAt: string;
  configVersion: string;
  contentVersion: string;
  response: QuizResponse;
  result: ScoreResult;
  answers: AnswerLogEntry[];
  identity: Identity;
  fitRating: number | null;
  fitText: string | null;
  ai: { narrative_used: boolean; model?: string };
}

export function buildSessionRecord(a: BuildSessionArgs): SessionRecord {
  const resultRecord: SessionResult = { ...a.result.output, spectrum: a.result.spectrum };
  return {
    session_id: a.sessionId,
    schema_version: SCHEMA_VERSION,
    config_version: a.configVersion,
    content_version: a.contentVersion,
    reporter: a.response.reporter,
    life_stage: a.response.lifeStage,
    started_at: a.startedAt,
    completed_at: a.completedAt,
    duration_ms: Math.max(0, Date.parse(a.completedAt) - Date.parse(a.startedAt)) || undefined,
    identity: a.identity,
    response: a.response,
    answers: a.answers,
    result: resultRecord,
    fit_rating: a.fitRating,
    fit_text: a.fitText,
    ai: a.ai,
  };
}
