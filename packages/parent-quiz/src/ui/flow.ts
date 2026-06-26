"use client";

/**
 * Parent-quiz flow — linear: intro → (age) → Q1–Q8 → (Q9 CTA) → email gate →
 * result. The result is computed when the email gate is reached so it can show
 * a teaser (the recognition line); safety results skip the marketing gate.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import type { AnswerLogEntry, Identity, Narrator, QuizPersistence } from "@blh/quiz-core";
import { CONTENT, QUESTIONS, RESULT_BY_ID, QUESTION_BY_ID } from "../config";
import { score } from "../engine";
import { buildParentSessionRecord } from "../persistence";
import { buildParentNarratorMessages, composeParentNarrative } from "../ai";
import type { AgeBand, ParentOutput, ParentResponse, ParentResult } from "../types";

export type PStep =
  | { kind: "intro" }
  | { kind: "question"; qid: string }
  | { kind: "email" }
  | { kind: "result" };

export interface UseParentQuizOptions {
  persistence?: QuizPersistence;
  narrator?: Narrator;
  bookingUrl?: string;
}

export interface ParentResultView {
  output: ParentOutput;
  primary: ParentResult;
  secondary: ParentResult | null;
  narrative: string;
}

function uuid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}`;
}

export function useParentQuiz(opts: UseParentQuizOptions = {}) {
  const steps = useMemo<PStep[]>(
    () => [
      { kind: "intro" },
      ...QUESTIONS.map((q) => ({ kind: "question", qid: q.id }) as PStep),
      { kind: "email" },
      { kind: "result" },
    ],
    [],
  );
  const [pos, setPos] = useState(0);
  const answersRef = useRef<Record<string, string[]>>({});
  const ageRef = useRef<AgeBand | undefined>(undefined);
  const logRef = useRef<AnswerLogEntry[]>([]);
  const identityRef = useRef<Identity>({});
  const sessionId = useRef(uuid());
  const startedAt = useRef(new Date().toISOString());
  const aiUsedRef = useRef(false);

  const [view, setView] = useState<ParentResultView | null>(null);
  const [fitRating, setFitRating] = useState<number | null>(null);
  // Mirror of answers for the UI, so navigating Back can pre-fill selections.
  const [saved, setSaved] = useState<Record<string, string[]>>({});

  const step = steps[pos]!;
  const progress = step.kind === "result" ? 1 : Math.min(0.97, pos / steps.length);
  const bookingUrl = opts.bookingUrl ?? CONTENT.defaultBookingUrl;

  const scrollTop = () => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const advance = useCallback(() => {
    setPos((p) => Math.min(steps.length - 1, p + 1));
    scrollTop();
  }, [steps.length]);

  const begin = useCallback(() => setPos(1), []);
  const goBack = useCallback(() => { setPos((p) => Math.max(0, p - 1)); scrollTop(); }, []);
  const canGoBack = pos > 0 && step.kind !== "result";

  /** Score the response + compose the (optionally AI-warmed) narrative. */
  const compute = useCallback(async (): Promise<ParentResultView> => {
    const response: ParentResponse = { ageBand: ageRef.current, answers: answersRef.current };
    const output = score(response);
    const primary = RESULT_BY_ID[output.primary_child_loop];
    const secondary = output.secondary_child_loop ? RESULT_BY_ID[output.secondary_child_loop] : null;
    const narrativeInput = { output, result: primary, secondaryResult: secondary };
    const fallback = composeParentNarrative(narrativeInput);
    let narrative = fallback;
    if (opts.narrator && !output.safety_flag) {
      const out = await opts.narrator.narrate({ messages: buildParentNarratorMessages(narrativeInput), fallback });
      narrative = out.text;
      aiUsedRef.current = out.aiUsed;
    }
    const v: ParentResultView = { output, primary, secondary, narrative };
    setView(v);
    return v;
  }, [opts]);

  const log = (qid: string, values: string[], labels: string[]) => {
    const q = QUESTION_BY_ID.get(qid);
    logRef.current = [
      ...logRef.current.filter((a) => a.question_id !== qid),
      {
        question_id: qid,
        section: q?.section ?? "",
        question_text: q?.question ?? "",
        values,
        labels,
        position: logRef.current.length,
      },
    ];
  };

  /** Answer a question (also captures ageBand for the age question). */
  const answer = useCallback(
    (qid: string, values: string[], labels: string[]) => {
      answersRef.current = { ...answersRef.current, [qid]: values };
      setSaved(answersRef.current);
      if (qid === "age") {
        const opt = QUESTION_BY_ID.get("age")?.options.find((o) => o.value === values[0]);
        ageRef.current = opt?.ageBand;
      }
      log(qid, values, labels);
      const next = steps[pos + 1];
      if (next?.kind === "email") void compute();
      advance();
    },
    [advance, compute, pos, steps],
  );

  const skip = useCallback(() => {
    const next = steps[pos + 1];
    if (next?.kind === "email") void compute();
    advance();
  }, [advance, compute, pos, steps]);

  const persist = useCallback(
    (v: ParentResultView, fit: number | null, fitText: string | null) => {
      if (!opts.persistence) return;
      const record = buildParentSessionRecord({
        sessionId: sessionId.current,
        startedAt: startedAt.current,
        completedAt: new Date().toISOString(),
        response: { ageBand: ageRef.current, answers: answersRef.current },
        result: v.output,
        answers: logRef.current,
        identity: identityRef.current,
        fitRating: fit,
        fitText,
        ai: { narrative_used: aiUsedRef.current },
      });
      void opts.persistence.saveSession(record);
    },
    [opts.persistence],
  );

  /** Email gate → unlock the full result. */
  const submitEmail = useCallback(
    async (name: string, email: string) => {
      identityRef.current = { name: name || undefined, email: email || undefined, consentedToContact: Boolean(email) };
      const v = view ?? (await compute());
      persist(v, null, null);
      advance();
    },
    [advance, compute, persist, view],
  );

  const submitFit = useCallback(
    (rating: number | null, text: string) => {
      setFitRating(rating);
      log("result_fit", rating === null ? [] : [String(rating)], []);
      if (view) persist(view, rating, text || null);
    },
    [persist, view],
  );

  const restart = useCallback(() => {
    answersRef.current = {};
    setSaved({});
    ageRef.current = undefined;
    logRef.current = [];
    identityRef.current = {};
    aiUsedRef.current = false;
    sessionId.current = uuid();
    startedAt.current = new Date().toISOString();
    setView(null);
    setFitRating(null);
    setPos(0);
  }, []);

  return {
    step,
    progress,
    view,
    fitRating,
    bookingUrl,
    canGoBack,
    saved,
    begin,
    goBack,
    answer,
    skip,
    submitEmail,
    submitFit,
    restart,
    compute,
  };
}
