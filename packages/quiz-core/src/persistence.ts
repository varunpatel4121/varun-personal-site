/**
 * Persistence is an injected adapter, never a hard dependency — that is what
 * keeps every quiz portable. Core defines the interface + generic adapters +
 * the record builder; each consuming app provides the concrete (Supabase) write.
 */

import type { AnswerLogEntry, Identity, SessionRecord } from "./types";

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

/** POSTs the record as JSON to an endpoint. Never throws. */
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

export interface BuildSessionArgs<TResponse, TResult> {
  quizId: string;
  sessionId: string;
  startedAt: string;
  completedAt: string;
  schemaVersion: string;
  configVersion: string;
  contentVersion: string;
  response: TResponse;
  result: TResult;
  answers: AnswerLogEntry[];
  identity: Identity;
  fitRating: number | null;
  fitText: string | null;
  ai: { narrative_used: boolean; model?: string };
}

export function buildSessionRecord<TResponse, TResult>(
  a: BuildSessionArgs<TResponse, TResult>,
): SessionRecord<TResponse, TResult> {
  return {
    quiz_id: a.quizId,
    session_id: a.sessionId,
    schema_version: a.schemaVersion,
    config_version: a.configVersion,
    content_version: a.contentVersion,
    started_at: a.startedAt,
    completed_at: a.completedAt,
    duration_ms:
      Math.max(0, Date.parse(a.completedAt) - Date.parse(a.startedAt)) || undefined,
    identity: a.identity,
    response: a.response,
    answers: a.answers,
    result: a.result,
    fit_rating: a.fitRating,
    fit_text: a.fitText,
    ai: a.ai,
  };
}
