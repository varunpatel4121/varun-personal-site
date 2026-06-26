/**
 * Parent-quiz persistence — thin wrapper over the shared core builder, stamped
 * with this quiz's id + versions. The host route fans the SessionRecord across
 * the structured pq.* schema (see schema/0001_parent_quiz.sql).
 */

import {
  buildSessionRecord,
  type AnswerLogEntry,
  type Identity,
  type SessionRecord,
} from "@blh/quiz-core";
import { CONTENT, QUESTIONS_VERSION, scoringConfig } from "../config";
import { SCHEMA_VERSION } from "../version";
import type { ParentOutput, ParentResponse } from "../types";

export const QUIZ_ID = "parent_quiz";

export interface BuildParentSessionArgs {
  sessionId: string;
  startedAt: string;
  completedAt: string;
  response: ParentResponse;
  result: ParentOutput;
  answers: AnswerLogEntry[];
  identity: Identity;
  fitRating: number | null;
  fitText: string | null;
  ai: { narrative_used: boolean; model?: string };
}

export function buildParentSessionRecord(
  a: BuildParentSessionArgs,
): SessionRecord<ParentResponse, ParentOutput> {
  return buildSessionRecord<ParentResponse, ParentOutput>({
    quizId: QUIZ_ID,
    sessionId: a.sessionId,
    startedAt: a.startedAt,
    completedAt: a.completedAt,
    schemaVersion: SCHEMA_VERSION,
    configVersion: `${scoringConfig.version}+q${QUESTIONS_VERSION}`,
    contentVersion: CONTENT.version,
    response: a.response,
    result: a.result,
    answers: a.answers,
    identity: a.identity,
    fitRating: a.fitRating,
    fitText: a.fitText,
    ai: a.ai,
  });
}
