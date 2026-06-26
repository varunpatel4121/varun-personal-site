"use client";

/**
 * The quiz flow machine. Builds a QuizResponse + an audit log of AnswerLogEntry
 * as the user advances, inserts a sub-feature cognition question per selected
 * sub-feature, offers a disambiguation step only when the top two phenotypes
 * are close, then scores deterministically and (optionally) warms the copy.
 */

import { useCallback, useMemo, useRef, useState } from "react";
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
  PhenotypeId,
  QuizResponse,
  ScoreResult,
  SubfeatureSelection,
  TieBreakerTag,
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
  | "disambiguation"
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

const FRAME_STEPS: Step[] = [
  { kind: "intro" },
  { kind: "reporter" },
  { kind: "identity" },
  { kind: "lifeStage" },
  { kind: "baseline" },
  { kind: "platforms" },
];

const LOOP_STEPS: Step[] = [
  { kind: "entry" },
  { kind: "pattern" },
  { kind: "control" },
  { kind: "severity" },
  { kind: "aftertaste" },
  { kind: "cost" },
];

export interface DisambiguationChoice {
  phenotype: PhenotypeId;
  name: string;
  recognitionLine: string;
  tieBreaker: TieBreakerTag;
}

export interface UseTechLoopQuizOptions {
  persistence?: QuizPersistence;
  narrator?: AINarrator;
  onComplete?: (result: ScoreResult) => void;
}

export function useTechLoopQuiz(opts: UseTechLoopQuizOptions = {}) {
  const [steps, setSteps] = useState<Step[]>(FRAME_STEPS);
  const [pos, setPos] = useState(0);
  const responseRef = useRef<QuizResponse>(emptyResponse());
  const answersRef = useRef<AnswerLogEntry[]>([]);
  const sessionId = useRef(typeof crypto !== "undefined" ? crypto.randomUUID() : `s_${Date.now()}`);
  const startedAt = useRef(new Date().toISOString());
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [narrative, setNarrative] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const step = steps[pos]!;
  const total = steps.length;
  const progress = step.kind === "result" ? 1 : Math.min(0.97, pos / Math.max(total, 14));

  const log = useCallback((entry: AnswerLogEntry) => {
    answersRef.current = [
      ...answersRef.current.filter((a) => a.question_id !== entry.question_id),
      { ...entry, position: answersRef.current.length },
    ] as AnswerLogEntry[];
  }, []);

  const goNext = useCallback((insert: Step[] = []) => {
    setSteps((prev) => {
      const next = [...prev];
      next.splice(pos + 1, 0, ...insert);
      return next;
    });
    setPos((p) => p + 1);
  }, [pos]);

  const goBack = useCallback(() => setPos((p) => Math.max(0, p - 1)), []);

  /** Compute the result and (optionally) the narrative, then persist. */
  const finalize = useCallback(async () => {
    const r = score(responseRef.current);
    setResult(r);
    const profile = r.output.primary_phenotype_id === "no_dominant_loop"
      ? null
      : PHENOTYPE_PROFILE[r.output.primary_phenotype_id];
    const secondaryProfile = r.output.secondary_phenotype_id
      ? PHENOTYPE_PROFILE[r.output.secondary_phenotype_id]
      : null;
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

    // Persist (best-effort; never blocks the result).
    if (opts.persistence) {
      setSaving(true);
      const record = buildSessionRecord({
        sessionId: sessionId.current,
        startedAt: startedAt.current,
        completedAt: new Date().toISOString(),
        configVersion: scoringConfig.version,
        contentVersion: QUIZ_CONTENT.version,
        response: responseRef.current,
        result: r,
        answers: answersRef.current,
        identity: responseRef.current.freeText ? extractIdentity() : {},
        fitRating: null,
        fitText: null,
        ai: { narrative_used: aiUsed },
      });
      void opts.persistence.saveSession(record).finally(() => setSaving(false));
    }
    return r;
  }, [opts]);

  const identityRef = useRef<Identity>({});
  function extractIdentity(): Identity {
    return identityRef.current;
  }

  /** Decide whether to insert a disambiguation step before the result. */
  const tailAfterCost = useCallback((): Step[] => {
    const provisional = score(responseRef.current);
    const top = provisional.scores
      .filter((s) => s.eligible && s.score > 0)
      .sort((a, b) => b.score - a.score);
    const close =
      top.length >= 2 &&
      top[0]!.score - top[1]!.score < scoringConfig.confidence.mixedMargin &&
      provisional.output.primary_phenotype_id !== "no_dominant_loop";
    return close ? [{ kind: "disambiguation" }, { kind: "result" }] : [{ kind: "result" }];
  }, []);

  const disambiguationChoices = useMemo((): DisambiguationChoice[] => {
    if (step.kind !== "disambiguation") return [];
    const provisional = score(responseRef.current);
    return provisional.scores
      .filter((s) => s.eligible && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((s) => {
        const p = PHENOTYPE_PROFILE[s.id];
        return { phenotype: s.id, name: p.name, recognitionLine: p.recognitionLine, tieBreaker: p.signatureTieBreaker };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.kind, pos]);

  // ── Submit handlers (one per step) ────────────────────────────────────────
  const r = responseRef.current;

  const submitReporter = (v: QuizResponse["reporter"]) => {
    r.reporter = v;
    log({ question_id: "frame.reporter", section: "frame", question_text: QUIZ_CONTENT.frame.reporterQuestion, values: [v], labels: [v], position: 0 });
    goNext();
  };
  const submitIdentity = (name: string, email: string, consent: boolean) => {
    identityRef.current = { name: name || undefined, email: email || undefined, consentedToContact: consent };
    log({ question_id: "frame.identity", section: "frame", question_text: QUIZ_CONTENT.frame.identityQuestion, values: [], labels: [name ? "name" : "", email ? "email" : ""].filter(Boolean), position: 0 });
    goNext();
  };
  const submitLifeStage = (v: QuizResponse["lifeStage"], label: string) => {
    r.lifeStage = v;
    log({ question_id: "frame.lifeStage", section: "frame", question_text: QUIZ_CONTENT.frame.lifeStageQuestion, values: [v], labels: [label], position: 0 });
    goNext();
  };
  const submitBaseline = (v: number, label: string) => {
    r.baselineSelfRating = v;
    log({ question_id: "baseline", section: "baseline", question_text: QUIZ_CONTENT.baseline.question, values: [String(v)], labels: [label], scale: v, position: 0 });
    goNext();
  };
  const submitPlatforms = (ids: string[], labels: string[]) => {
    r.platforms = ids;
    log({ question_id: "pull.platforms", section: "pull", question_text: QUIZ_CONTENT.pull.platformQuestion, values: ids, labels, position: 0 });
    goNext([{ kind: "subfeatures" }]);
  };
  const submitSubfeatures = (sel: SubfeatureSelection[], labels: string[]) => {
    r.subfeatures = sel;
    r.hookAnswers = [];
    log({ question_id: "pull.subfeatures", section: "pull", question_text: QUIZ_CONTENT.pull.subfeatureQuestion, values: sel.map((s) => `${s.platform}.${s.subfeature}`), labels, position: 0 });
    const hookSteps: Step[] = sel.map((_, i) => ({ kind: "hookq", subIndex: i }));
    goNext([...hookSteps, ...LOOP_STEPS]);
  };
  const submitHook = (subIndex: number, optionId: string, hook: QuizResponse["hookAnswers"][number]["hook"], label: string, freeText?: string) => {
    const sel = r.subfeatures[subIndex]!;
    r.hookAnswers = [
      ...r.hookAnswers.filter((h) => !(h.platform === sel.platform && h.subfeature === sel.subfeature)),
      { platform: sel.platform, subfeature: sel.subfeature, rank: sel.rank, optionId, hook },
    ];
    const q = SUBFEATURE_QUESTION_MAP.get(`${sel.platform}.${sel.subfeature}`);
    if (freeText) r.freeText = [...(r.freeText ?? []), { questionId: `job.${sel.platform}.${sel.subfeature}`, text: freeText }];
    log({
      question_id: `job.${sel.platform}.${sel.subfeature}`,
      section: "job",
      question_text: q?.question ?? "",
      values: [optionId],
      labels: [label],
      free_text: freeText,
      signals: hook ? [{ type: "hook", tag: hook }] : [],
      position: 0,
    });
    goNext();
  };
  const submitMulti = (
    kind: "entry" | "pattern" | "severity" | "aftertaste" | "cost",
    field: keyof QuizResponse,
    values: string[],
    labels: string[],
    questionId: string,
    questionText: string,
    section: AnswerLogEntry["section"],
  ) => {
    // @ts-expect-error indexed assignment of string[] fields
    r[field] = values;
    log({ question_id: questionId, section, question_text: questionText, values, labels, signals: values.map((v) => ({ type: signalTypeFor(kind), tag: v })), position: 0 });
    if (kind === "cost") goNext(tailAfterCost());
    else goNext();
  };
  const submitControl = (v: number, label: string) => {
    r.controlFrequency = v;
    log({ question_id: "loop.control", section: "loop", question_text: QUIZ_CONTENT.loop.controlQuestion, values: [String(v)], labels: [label], scale: v, position: 0 });
    goNext();
  };
  const submitDisambiguation = (choice: DisambiguationChoice | null) => {
    r.tieBreaker = choice?.tieBreaker ?? null;
    log({ question_id: "disambiguation", section: "disambiguation", question_text: QUIZ_CONTENT.disambiguation.prompt, values: choice ? [choice.phenotype] : ["none"], labels: [choice?.name ?? QUIZ_CONTENT.disambiguation.noneLabel], signals: choice ? [{ type: "tie_breaker", tag: choice.tieBreaker }] : [], position: 0 });
    goNext();
  };
  const submitFit = (rating: number | null, text: string) => {
    const last = answersRef.current;
    log({ question_id: "result.fit", section: "result", question_text: QUIZ_CONTENT.result.fitQuestion, values: rating === null ? [] : [String(rating)], labels: [], scale: rating ?? undefined, free_text: text || undefined, position: last.length });
    if (text) r.freeText = [...(r.freeText ?? []), { questionId: "result.missed", text }];
  };

  const begin = useCallback(() => setPos(1), []);
  const restart = useCallback(() => {
    responseRef.current = emptyResponse();
    answersRef.current = [];
    identityRef.current = {};
    sessionId.current = typeof crypto !== "undefined" ? crypto.randomUUID() : `s_${Date.now()}`;
    startedAt.current = new Date().toISOString();
    setResult(null);
    setNarrative("");
    setSteps(FRAME_STEPS);
    setPos(0);
  }, []);

  return {
    step, pos, progress, total, saving,
    response: responseRef.current,
    result, narrative,
    disambiguationChoices,
    begin, goBack, restart, finalize,
    submitReporter, submitIdentity, submitLifeStage, submitBaseline,
    submitPlatforms, submitSubfeatures, submitHook, submitMulti, submitControl,
    submitDisambiguation, submitFit,
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
