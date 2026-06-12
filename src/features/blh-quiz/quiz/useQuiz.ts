"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import quizConfigJson from "../config/quiz.json";
import scoringConfigJson from "../config/scoring.json";
import phenotypesJson from "../config/phenotypes.json";
import type {
  AnswerRecord,
  JobTag,
  OptionEffects,
  PhenotypeId,
  QuizOption,
  QuizQuestion,
  ScoringConfig,
  ScoringState,
  SpaceId,
} from "../engine/types";
import {
  classify,
  computeState,
  safetyGate,
  severity,
  topJobs,
  topPhenotypes,
} from "../engine/scoring";
import { jobLabel } from "../engine/narrative";
import { fetchFollowups, type FollowupsResult, type LlmContext } from "../llm/client";

export const scoring = scoringConfigJson as unknown as ScoringConfig;
export const quizConfig = quizConfigJson as unknown as {
  version: string;
  intro: {
    kicker: string;
    title: string;
    paragraphs: string[];
    cta: string;
    privacy: string;
  };
  spaces: { id: SpaceId; label: string; sub: string }[];
  adultConsent: {
    kicker: string;
    title: string;
    body: string;
    continueLabel: string;
    skipLabel: string;
  };
  core: QuizQuestion[];
  branches: Record<string, QuizQuestion[]>;
  loop: QuizQuestion[];
  jobCostGround: QuizQuestion[];
  fallbackFollowup: QuizQuestion;
};

const phenotypes = phenotypesJson as unknown as {
  phenotypes: Record<
    PhenotypeId,
    { name: string; quote: string; read: string; pull: string; job: string; advice: string }
  >;
};

export type Step =
  | { kind: "intro" }
  | { kind: "question"; q: QuizQuestion }
  | { kind: "consent" }
  | { kind: "followups-wait" }
  | { kind: "mirror" }
  | { kind: "result" };

export interface LlmUsage {
  followups: boolean;
  mirror: boolean;
  narrative: boolean;
}

function effectsOf(option: QuizOption): OptionEffects {
  const { id: _i, text: _t, sub: _s, exclusive: _e, ...fx } = option;
  return fx;
}

function spacesQuestion(): QuizQuestion {
  const base = quizConfig.core.find((q) => q.id === "spaces")!;
  return {
    ...base,
    options: [
      ...quizConfig.spaces.map((s) => ({ id: s.id, text: s.label, sub: s.sub })),
      {
        id: "none",
        text: "None of these, really",
        exclusive: true,
        unsure: true,
      },
    ],
  };
}

function anchorQuestion(selectedSpaces: SpaceId[]): QuizQuestion {
  const base = quizConfig.core.find((q) => q.id === "anchor")!;
  const pool =
    selectedSpaces.length > 0
      ? quizConfig.spaces.filter((s) => selectedSpaces.includes(s.id))
      : quizConfig.spaces;
  return {
    ...base,
    options: [
      ...pool.map((s) => ({ id: s.id, text: s.label, sub: s.sub })),
      { id: "none", text: "Honestly, none of them really grip me", unsure: true },
    ],
  };
}

function clarifierQuestion(state: ScoringState): QuizQuestion | null {
  const top = topPhenotypes(state, 3);
  if (top.length === 0) return null;
  return {
    id: "clarifier",
    type: "single",
    kicker: "Fair — let me re-aim",
    question: "Which of these is closest to the truth, even if none is exact?",
    source: "config",
    options: [
      ...top.map((p) => ({
        id: p,
        text: `"${phenotypes.phenotypes[p].quote}"`,
        ph: { [p]: scoring.mirror.clarifierBoost } as QuizOption["ph"],
      })),
      { id: "none", text: "None of these, honestly", unsure: true },
    ],
  };
}

const tailSteps = (): Step[] => [
  ...quizConfig.loop.map((q): Step => ({ kind: "question", q })),
  { kind: "mirror" },
  ...quizConfig.jobCostGround.map((q): Step => ({ kind: "question", q })),
  { kind: "result" },
];

export function buildLlmContext(
  answers: AnswerRecord[],
  extra?: Partial<LlmContext>,
): LlmContext {
  const state = computeState(answers, scoring);
  const digest = answers
    .filter((a) => !["sev", "spaces", "anchor", "mirror"].includes(a.questionId))
    .map((a) => ({
      question: a.questionText,
      answer:
        a.scale !== undefined
          ? `${a.scale + 1} out of 5`
          : a.optionTexts.join("; "),
    }));
  return {
    anchorLabel: state.anchorLabel,
    topPhenotypes: topPhenotypes(state, 3).map((p) => ({
      id: p,
      name: phenotypes.phenotypes[p].name,
      score: state.scores[p],
    })),
    topJobs: topJobs(state, 2).map((j) => jobLabel(j as JobTag)),
    timing: state.timing,
    stage: state.stage,
    control: state.control,
    costs: state.costs,
    answers: digest,
    mirrorResponse: state.mirrorResponse,
    ...extra,
  };
}

export function useQuiz() {
  const [steps, setSteps] = useState<Step[]>([{ kind: "intro" }]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [llmUsed, setLlmUsed] = useState<LlmUsage>({
    followups: false,
    mirror: false,
    narrative: false,
  });

  const sessionId = useRef(crypto.randomUUID());
  const startedAt = useRef(new Date().toISOString());
  const followupsPromise = useRef<Promise<FollowupsResult> | null>(null);

  const step = steps[pos];

  const progress = useMemo(() => {
    const expectedTotal = Math.max(steps.length, 15);
    return step.kind === "result"
      ? 1
      : Math.min(0.96, pos / expectedTotal);
  }, [pos, steps.length, step.kind]);

  const state = useMemo(() => computeState(answers, scoring), [answers]);

  const advance = useCallback(
    (record: AnswerRecord | null, insert: Step[] = []) => {
      const nextAnswers = record ? [...answers, record] : answers;
      if (record) setAnswers(nextAnswers);
      setSteps((prev) => {
        const next = [...prev];
        next.splice(pos + 1, 0, ...insert);
        return next;
      });
      setPos((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return nextAnswers;
    },
    [answers, pos],
  );

  const begin = useCallback(() => {
    setSteps([
      { kind: "intro" },
      ...quizConfig.core
        .filter((q) => q.id === "sev")
        .map((q): Step => ({ kind: "question", q })),
      { kind: "question", q: spacesQuestion() },
    ]);
    setPos(1);
  }, []);

  const prefetchFollowups = useCallback((currentAnswers: AnswerRecord[]) => {
    if (followupsPromise.current) return;
    followupsPromise.current = fetchFollowups(buildLlmContext(currentAnswers));
  }, []);

  const answerQuestion = useCallback(
    (q: QuizQuestion, optionIds: string[], scale?: number) => {
      const options = optionIds.map(
        (oid) =>
          q.options.find((o) => o.id === oid) ??
          ({ id: oid, text: "I'm not sure", unsure: true } as QuizOption),
      );
      const record: AnswerRecord = {
        questionId: q.id,
        questionText: q.question,
        source: q.source,
        optionIds,
        optionTexts: options.map((o) => o.text),
        ...(scale !== undefined ? { scale } : {}),
        effects:
          scale !== undefined && optionIds.length === 0
            ? []
            : options.map(effectsOf),
      };

      if (q.id === "spaces") {
        const chosen = optionIds.filter((id) => id !== "none") as SpaceId[];
        if (chosen.length === 0) {
          const anchorRecord: AnswerRecord = {
            questionId: "anchor",
            questionText: "anchor (skipped — no spaces selected)",
            source: "config",
            optionIds: ["none"],
            optionTexts: ["None of them really grip me"],
            effects: [{ unsure: true }],
          };
          setAnswers((prev) => [...prev, record, anchorRecord]);
          setSteps((prev) => {
            const next = [...prev];
            next.splice(pos + 1, 0, ...tailSteps());
            return next;
          });
          setPos((p) => p + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        advance(record, [{ kind: "question", q: anchorQuestion(chosen) }]);
        return;
      }

      if (q.id === "anchor") {
        const anchor = optionIds[0];
        if (anchor === "none") {
          advance(record, tailSteps());
          return;
        }
        if (anchor === "adult") {
          advance(record, [{ kind: "consent" }]);
          return;
        }
        const branch = quizConfig.branches[anchor] ?? [];
        advance(record, [
          ...branch.map((bq): Step => ({ kind: "question", q: bq })),
          { kind: "followups-wait" },
          ...tailSteps(),
        ]);
        return;
      }

      const isBranch = Object.values(quizConfig.branches).some((bank) =>
        bank.some((bq) => bq.id === q.id),
      );
      if (isBranch) {
        const branchAnswered = answers.filter((a) =>
          Object.values(quizConfig.branches).some((bank) =>
            bank.some((bq) => bq.id === a.questionId),
          ),
        ).length;
        if (branchAnswered >= 1) {
          prefetchFollowups([...answers, record]);
        }
      }

      advance(record);
    },
    [advance, answers, pos, prefetchFollowups],
  );

  const consent = useCallback(
    (agreed: boolean) => {
      if (agreed) {
        const branch = quizConfig.branches.adult ?? [];
        advance(null, [
          ...branch.map((bq): Step => ({ kind: "question", q: bq })),
          { kind: "followups-wait" },
          ...tailSteps(),
        ]);
      } else {
        advance(null, tailSteps());
      }
    },
    [advance],
  );

  const resolveFollowups = useCallback(async () => {
    if (!followupsPromise.current) {
      followupsPromise.current = fetchFollowups(buildLlmContext(answers));
    }
    const budget = new Promise<FollowupsResult>((resolve) =>
      setTimeout(() => resolve({ status: "unavailable" }), 9000),
    );
    const result = await Promise.race([followupsPromise.current, budget]);

    let insert: Step[] = [];
    if (result.status === "ok") {
      setLlmUsed((u) => ({ ...u, followups: true }));
      insert = result.questions
        .slice(0, scoring.llm.maxFollowups)
        .map((q): Step => ({ kind: "question", q }));
    } else if (result.status === "invalid") {
      insert = [{ kind: "question", q: quizConfig.fallbackFollowup }];
    }
    advance(null, insert);
  }, [advance, answers]);

  const answerMirror = useCallback(
    (response: "exactly" | "partly" | "not_me", usedLlm: boolean) => {
      if (usedLlm) setLlmUsed((u) => ({ ...u, mirror: true }));
      const record: AnswerRecord = {
        questionId: "mirror",
        questionText: "Before we finish — does this track?",
        source: "config",
        optionIds: [response],
        optionTexts: [response],
        effects: [],
      };
      if (response === "not_me") {
        const after = computeState([...answers, record], scoring);
        const clarifier = clarifierQuestion(after);
        advance(record, clarifier ? [{ kind: "question", q: clarifier }] : []);
      } else {
        advance(record);
      }
    },
    [advance, answers],
  );

  const markNarrativeUsed = useCallback(
    () => setLlmUsed((u) => ({ ...u, narrative: true })),
    [],
  );

  const restart = useCallback(() => window.location.reload(), []);

  const result = useMemo(() => {
    if (step.kind !== "result") return null;
    const cls = classify(state, scoring);
    const sev = severity(state, scoring);
    return {
      state,
      classification: cls,
      severity: sev,
      safety: safetyGate(state, sev.band, scoring),
    };
  }, [state, step.kind]);

  return {
    step,
    progress,
    answers,
    state,
    result,
    llmUsed,
    sessionId: sessionId.current,
    startedAt: startedAt.current,
    begin,
    answerQuestion,
    consent,
    resolveFollowups,
    answerMirror,
    markNarrativeUsed,
    restart,
  };
}
