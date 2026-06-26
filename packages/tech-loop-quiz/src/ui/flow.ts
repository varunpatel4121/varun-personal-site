"use client";

/**
 * The quiz flow machine.
 *
 * `response` is state, so the step list is DERIVED from it (buildSteps) and
 * editing an earlier answer rebuilds the downstream steps automatically.
 * Progress is persisted to sessionStorage, so a reload resumes where you were.
 * Back navigation is supported and screens pre-fill from the saved answer.
 * Scoring is deterministic; the result is recomputed on demand (the AI, if
 * provided, only warms copy). answers/identity are refs — only read in effects
 * and handlers, never during render.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PHENOTYPE_PROFILE,
  QUIZ_CONTENT,
  SUBFEATURE_QUESTION_MAP,
  scoringConfig,
} from "../config";
import { score } from "../engine";
import { buildSessionRecord, type QuizPersistence } from "../persistence";
import { composeDeterministicNarrative, type AINarrator } from "../ai";
import type {
  AnswerLogEntry,
  Identity,
  QuizResponse,
  ScoreResult,
  SubfeatureSelection,
} from "../types";

export type StepKind =
  | "intro"
  | "reporter"
  | "identity"
  | "lifeStage"
  | "baseline"
  | "platforms"
  | "subfeatures"
  | "hookq"
  | "entry"
  | "pattern"
  | "control"
  | "severity"
  | "aftertaste"
  | "cost"
  | "result";

export interface Step {
  kind: StepKind;
  /** For "hookq": index into response.subfeatures. */
  subIndex?: number;
}

function emptyResponse(): QuizResponse {
  return {
    reporter: "self",
    lifeStage: "other",
    baselineSelfRating: 0,
    platforms: [],
    subfeatures: [],
    hookAnswers: [],
    entryPoints: [],
    loopShapes: [],
    controlFrequency: 0,
    severityMarkers: [],
    aftertastes: [],
    costDomains: [],
    tieBreaker: null,
    freeText: [],
  };
}

/** The step sequence is a pure function of the response so far. */
function buildSteps(r: QuizResponse): Step[] {
  // Reporter ("who is this for?") is omitted — /quiz is already the adult
  // self-report path (parents have /parent-quiz).
  const steps: Step[] = [
    { kind: "intro" },
    { kind: "lifeStage" },
    { kind: "baseline" },
    { kind: "platforms" },
  ];
  if (r.platforms.length > 0) steps.push({ kind: "subfeatures" });
  if (r.subfeatures.length > 0) {
    r.subfeatures.forEach((_, i) => steps.push({ kind: "hookq", subIndex: i }));
    steps.push(
      { kind: "entry" },
      { kind: "pattern" },
      { kind: "control" },
      { kind: "severity" },
      { kind: "aftertaste" },
      { kind: "cost" },
      // Identity is the last step before the result — an optional "save your
      // result" gate the user can skip.
      { kind: "identity" },
      { kind: "result" },
    );
  }
  return steps;
}

// ── sessionStorage persistence (survives reload, same tab) ───────────────────
const PERSIST_KEY = "blh.techloop.v2";
const SNAP_V = 2;
interface Snapshot {
  v: number;
  pos: number;
  response: QuizResponse;
  answers: AnswerLogEntry[];
  identity: Identity;
  sessionId: string;
  startedAt: string;
}
function loadSnapshot(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Snapshot;
    return s && s.v === SNAP_V ? s : null;
  } catch {
    return null;
  }
}
function saveSnapshot(s: Snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PERSIST_KEY, JSON.stringify(s));
  } catch {
    /* storage full / disabled — best-effort */
  }
}
function clearSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PERSIST_KEY);
  } catch {
    /* ignore */
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}`;
}

export interface UseTechLoopQuizOptions {
  persistence?: QuizPersistence;
  narrator?: AINarrator;
  onComplete?: (result: ScoreResult) => void;
}

export function useTechLoopQuiz(opts: UseTechLoopQuizOptions = {}) {
  const snap = useMemo(() => loadSnapshot(), []);
  const [response, setResponse] = useState<QuizResponse>(snap?.response ?? emptyResponse());
  const [pos, setPos] = useState(snap?.pos ?? 0);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [narrative, setNarrative] = useState("");
  const [saving, setSaving] = useState(false);

  const answersRef = useRef<AnswerLogEntry[]>(snap?.answers ?? []);
  const identityRef = useRef<Identity>(snap?.identity ?? {});
  const sessionId = useRef(snap?.sessionId ?? newId());
  const startedAt = useRef(snap?.startedAt ?? new Date().toISOString());

  const steps = useMemo(() => buildSteps(response), [response]);
  const clampedPos = Math.min(pos, steps.length - 1);
  const step = steps[clampedPos]!;
  const total = steps.length;
  const progress = step.kind === "result" ? 1 : Math.min(0.97, clampedPos / Math.max(total - 1, 13));
  const canGoBack = clampedPos > 0;

  // Tease the result name on the identity gate. Identity is the last step before
  // the result, so the full response is already scored deterministically here.
  const previewName = useMemo(() => {
    if (step.kind !== "identity") return null;
    try {
      const r = score(response);
      const id = r.output.primary_phenotype_id;
      return id === "no_dominant_loop" ? r.output.primary_phenotype_name : PHENOTYPE_PROFILE[id].name;
    } catch {
      return null;
    }
  }, [step.kind, response]);

  // Persist on every navigation / answer change.
  useEffect(() => {
    saveSnapshot({
      v: SNAP_V, pos: clampedPos, response,
      answers: answersRef.current, identity: identityRef.current,
      sessionId: sessionId.current, startedAt: startedAt.current,
    });
  }, [clampedPos, response]);

  // Scroll to the top of the page on every step change (mobile-friendly).
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [clampedPos]);

  const log = useCallback((entry: AnswerLogEntry) => {
    answersRef.current = [
      ...answersRef.current.filter((a) => a.question_id !== entry.question_id),
      { ...entry, position: answersRef.current.length },
    ];
  }, []);

  // Any navigation invalidates a computed result so it recomputes from the
  // latest answers when the result screen is reached again.
  const goNext = useCallback(() => { setResult(null); setNarrative(""); setPos((p) => p + 1); }, []);
  const goBack = useCallback(() => { setResult(null); setNarrative(""); setPos((p) => Math.max(0, p - 1)); }, []);

  const finalize = useCallback(async () => {
    const r = score(response);
    setResult(r);
    const profile = r.output.primary_phenotype_id === "no_dominant_loop" ? null : PHENOTYPE_PROFILE[r.output.primary_phenotype_id];
    const secondaryProfile = r.output.secondary_phenotype_id ? PHENOTYPE_PROFILE[r.output.secondary_phenotype_id] : null;
    const narrativeInput = { output: r.output, profile, secondaryProfile };

    let text = composeDeterministicNarrative(narrativeInput);
    let aiUsed = false;
    if (opts.narrator) {
      const out = await opts.narrator.narrate(narrativeInput);
      text = out.text;
      aiUsed = out.aiUsed;
    }
    setNarrative(text);
    opts.onComplete?.(r);

    if (opts.persistence) {
      setSaving(true);
      const record = buildSessionRecord({
        sessionId: sessionId.current, startedAt: startedAt.current, completedAt: new Date().toISOString(),
        configVersion: scoringConfig.version, contentVersion: QUIZ_CONTENT.version,
        response, result: r, answers: answersRef.current, identity: identityRef.current,
        fitRating: null, fitText: null, ai: { narrative_used: aiUsed },
      });
      void opts.persistence.saveSession(record).finally(() => setSaving(false));
    }
    return r;
  }, [response, opts]);

  // ── Submit handlers (immutable response updates) ──────────────────────────
  const submitReporter = (v: QuizResponse["reporter"]) => {
    setResponse((p) => ({ ...p, reporter: v }));
    log({ question_id: "frame.reporter", section: "frame", question_text: QUIZ_CONTENT.frame.reporterQuestion, values: [v], labels: [v] });
    goNext();
  };
  const submitIdentity = (name: string, email: string, consent: boolean) => {
    identityRef.current = { name: name || undefined, email: email || undefined, consentedToContact: consent };
    log({ question_id: "frame.identity", section: "frame", question_text: QUIZ_CONTENT.frame.identityQuestion, values: [], labels: [name ? "name" : "", email ? "email" : ""].filter(Boolean) });
    goNext();
  };
  const submitLifeStage = (v: QuizResponse["lifeStage"], label: string) => {
    setResponse((p) => ({ ...p, lifeStage: v }));
    log({ question_id: "frame.lifeStage", section: "frame", question_text: QUIZ_CONTENT.frame.lifeStageQuestion, values: [v], labels: [label] });
    goNext();
  };
  const submitBaseline = (v: number, label: string) => {
    setResponse((p) => ({ ...p, baselineSelfRating: v }));
    log({ question_id: "baseline", section: "baseline", question_text: QUIZ_CONTENT.baseline.question, values: [String(v)], labels: [label], scale: v });
    goNext();
  };
  const submitPlatforms = (ids: string[], labels: string[]) => {
    setResponse((p) => ({ ...p, platforms: ids, subfeatures: p.subfeatures.filter((s) => ids.includes(s.platform)) }));
    log({ question_id: "pull.platforms", section: "pull", question_text: QUIZ_CONTENT.pull.platformQuestion, values: ids, labels });
    goNext();
  };
  const submitSubfeatures = (sel: SubfeatureSelection[], labels: string[]) => {
    setResponse((p) => ({
      ...p, subfeatures: sel,
      hookAnswers: p.hookAnswers.filter((h) => sel.some((s) => s.platform === h.platform && s.subfeature === h.subfeature)),
    }));
    log({ question_id: "pull.subfeatures", section: "pull", question_text: QUIZ_CONTENT.pull.subfeatureQuestion, values: sel.map((s) => `${s.platform}.${s.subfeature}`), labels });
    goNext();
  };
  const submitHook = (subIndex: number, optionId: string, hook: QuizResponse["hookAnswers"][number]["hook"], label: string, freeText?: string) => {
    const sel = response.subfeatures[subIndex]!;
    setResponse((p) => {
      const s = p.subfeatures[subIndex]!;
      return {
        ...p,
        hookAnswers: [
          ...p.hookAnswers.filter((h) => !(h.platform === s.platform && h.subfeature === s.subfeature)),
          { platform: s.platform, subfeature: s.subfeature, rank: s.rank, optionId, hook },
        ],
        freeText: freeText ? [...(p.freeText ?? []), { questionId: `job.${s.platform}.${s.subfeature}`, text: freeText }] : p.freeText,
      };
    });
    const q = SUBFEATURE_QUESTION_MAP.get(`${sel.platform}.${sel.subfeature}`);
    log({ question_id: `job.${sel.platform}.${sel.subfeature}`, section: "job", question_text: q?.question ?? "", values: [optionId], labels: [label], free_text: freeText, signals: hook ? [{ type: "hook", tag: hook }] : [] });
    goNext();
  };
  const submitMulti = (
    kind: "entry" | "pattern" | "severity" | "aftertaste" | "cost",
    field: keyof QuizResponse, values: string[], labels: string[],
    questionId: string, questionText: string, section: AnswerLogEntry["section"],
  ) => {
    setResponse((p) => ({ ...p, [field]: values }) as QuizResponse);
    log({ question_id: questionId, section, question_text: questionText, values, labels, signals: values.map((v) => ({ type: signalTypeFor(kind), tag: v })) });
    goNext();
  };
  const submitControl = (v: number, label: string) => {
    setResponse((p) => ({ ...p, controlFrequency: v }));
    log({ question_id: "loop.control", section: "loop", question_text: QUIZ_CONTENT.loop.controlQuestion, values: [String(v)], labels: [label], scale: v });
    goNext();
  };
  const submitFit = (rating: number | null, text: string) => {
    log({ question_id: "result.fit", section: "result", question_text: QUIZ_CONTENT.result.fitQuestion, values: rating === null ? [] : [String(rating)], labels: [], scale: rating ?? undefined, free_text: text || undefined });
    if (text) setResponse((p) => ({ ...p, freeText: [...(p.freeText ?? []), { questionId: "result.missed", text }] }));
    saveSnapshot({ v: SNAP_V, pos: clampedPos, response, answers: answersRef.current, identity: identityRef.current, sessionId: sessionId.current, startedAt: startedAt.current });
  };

  const begin = useCallback(() => setPos(1), []);
  const restart = useCallback(() => {
    clearSnapshot();
    answersRef.current = [];
    identityRef.current = {};
    sessionId.current = newId();
    startedAt.current = new Date().toISOString();
    setResult(null);
    setNarrative("");
    setResponse(emptyResponse());
    setPos(0);
  }, []);

  return {
    step, pos: clampedPos, progress, total, saving, canGoBack, previewName,
    response, result, narrative,
    begin, goBack, restart, finalize,
    submitReporter, submitIdentity, submitLifeStage, submitBaseline,
    submitPlatforms, submitSubfeatures, submitHook, submitMulti, submitControl, submitFit,
  };
}

function signalTypeFor(kind: string): "entry_point" | "loop_shape" | "severity_marker" | "aftertaste" | "cost_domain" {
  switch (kind) {
    case "entry": return "entry_point";
    case "pattern": return "loop_shape";
    case "severity": return "severity_marker";
    case "aftertaste": return "aftertaste";
    default: return "cost_domain";
  }
}
