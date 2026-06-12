"use client";

import {
  followupsToQuestions,
  makeFollowupSchema,
} from "../engine/llm-schema";
import type { QuizQuestion, ScoringConfig } from "../engine/types";
import scoringConfig from "../config/scoring.json";

const scoring = scoringConfig as unknown as ScoringConfig;

export interface LlmContext {
  anchorLabel: string;
  topPhenotypes: { id: string; name: string; score: number }[];
  topJobs: string[];
  timing: string[];
  stage: string;
  control: number;
  costs: string[];
  severityBand?: string;
  safety?: boolean;
  answers: { question: string; answer: string }[];
  classification?: {
    primaryName: string | null;
    primaryRead: string | null;
    secondaryName: string | null;
    confidence: string;
  };
  mirrorResponse?: string | null;
}

export type FollowupsResult =
  | { status: "ok"; questions: QuizQuestion[] }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function fetchFollowups(ctx: LlmContext): Promise<FollowupsResult> {
  try {
    const res = await fetch("/api/quiz/llm/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 422) return { status: "invalid" };
    if (!res.ok) return { status: "unavailable" };
    const json = await res.json();
    const payload = makeFollowupSchema(scoring).safeParse(json);
    if (!payload.success) return { status: "invalid" };
    return { status: "ok", questions: followupsToQuestions(payload.data) };
  } catch {
    return { status: "unavailable" };
  }
}

export async function streamProse(
  path: "/api/quiz/llm/mirror" | "/api/quiz/llm/narrative",
  ctx: LlmContext,
  onDelta: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const timeout = AbortSignal.timeout(30000);
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ctx),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!res.ok || !res.body) throw new Error(`llm ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onDelta(text);
  }
  text += decoder.decode();
  if (text.trim().length < 20) throw new Error("llm stream too short");
  return text;
}
