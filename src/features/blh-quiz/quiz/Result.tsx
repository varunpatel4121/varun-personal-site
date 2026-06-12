"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AnswerRecord,
  Classification,
  FitRating,
  JobTag,
  PhenotypeId,
  ScoringState,
  SessionRecord,
  SeverityResult,
} from "../engine/types";
import { SCHEMA_VERSION } from "../engine/types";
import { buildSessionRecord, topJobs } from "../engine/scoring";
import { costPhrase, jobLabel, loopLine } from "../engine/narrative";
import { streamProse } from "../llm/client";
import phenotypesJson from "../config/phenotypes.json";
import { buildLlmContext, scoring, type LlmUsage } from "./useQuiz";
import { GhostButton, Kicker, PrimaryButton } from "./screens";

const content = phenotypesJson as unknown as {
  phenotypes: Record<
    PhenotypeId,
    {
      name: string;
      quote: string;
      read: string;
      pull: string;
      job: string;
      advice: string;
    }
  >;
  severityCopy: Record<string, { label: string; text: string }>;
  noDominantLoop: { title: string; read: string };
};

const SEV_STYLES: Record<string, string> = {
  light_grip: "bg-blh-accent/10 text-blh-accent border border-blh-accent/20",
  steady_pull: "bg-warn/10 text-warn border border-warn/20",
  deep_loop: "bg-rose/10 text-rose border border-rose/20",
};

function postSession(record: SessionRecord) {
  fetch("/api/quiz/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    keepalive: true,
  }).catch(() => {
    /* analytics must never break the result page */
  });
}

export function ResultScreen({
  answers,
  state,
  classification,
  severity,
  safety,
  llmUsed,
  sessionId,
  startedAt,
  onNarrativeUsed,
  onRestart,
}: {
  answers: AnswerRecord[];
  state: ScoringState;
  classification: Classification;
  severity: SeverityResult;
  safety: boolean;
  llmUsed: LlmUsage;
  sessionId: string;
  startedAt: string;
  onNarrativeUsed: () => void;
  onRestart: () => void;
}) {
  const primary =
    classification.primary !== "none"
      ? content.phenotypes[classification.primary]
      : null;
  const secondary = classification.secondary
    ? content.phenotypes[classification.secondary]
    : null;
  const sevCopy = content.severityCopy[severity.band];
  const jobs = topJobs(state, 2).map((j) => jobLabel(j as JobTag));

  const [narrative, setNarrative] = useState("");
  const [narrativeDone, setNarrativeDone] = useState(false);
  const narrativeUsedLlm = useRef(false);
  const started = useRef(false);

  const buildRecord = (fit: FitRating | null, fitText: string | null) =>
    buildSessionRecord(answers, scoring, {
      sessionId,
      startedAt,
      completedAt: new Date().toISOString(),
      configVersion: scoring.version,
      schemaVersion: SCHEMA_VERSION,
      llmUsed: { ...llmUsed, narrative: narrativeUsedLlm.current },
      fitRating: fit,
      fitText,
    });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const fallback = primary ? primary.read : content.noDominantLoop.read;
    const ctx = buildLlmContext(answers, {
      severityBand: severity.band,
      safety,
      classification: {
        primaryName: primary?.name ?? null,
        primaryRead: primary?.read ?? null,
        secondaryName: secondary?.name ?? null,
        confidence: classification.confidence,
      },
    });

    streamProse("/api/quiz/llm/narrative", ctx, (t) => setNarrative(t))
      .then(() => {
        narrativeUsedLlm.current = true;
        onNarrativeUsed();
        setNarrativeDone(true);
        postSession(buildRecord(null, null));
      })
      .catch(() => {
        setNarrative(fallback);
        setNarrativeDone(true);
        postSession(buildRecord(null, null));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-screen-in space-y-5">
      {safety && <SafetyBlock />}

      <Kicker>
        {safety ? "Your reflection" : "Your loop, as best we can read it"}
      </Kicker>

      {/* Phenotype header */}
      {primary ? (
        <div>
          <div className="bg-gradient-to-r from-blh-accent2 to-blh-accent bg-clip-text text-[clamp(26px,5vw,36px)] font-extrabold tracking-tight text-transparent">
            {primary.name}
          </div>
          <div className="mt-1.5 text-[15px] italic leading-relaxed text-dim">
            &ldquo;{primary.quote}&rdquo;
          </div>
          {secondary && (
            <div className="mt-2 text-[13.5px] text-dim">
              with a secondary thread of{" "}
              <b className="text-ink">{secondary.name}</b>
            </div>
          )}
        </div>
      ) : (
        <h1 className="text-[clamp(24px,5vw,32px)] font-extrabold tracking-tight text-ink">
          {content.noDominantLoop.title}
        </h1>
      )}

      {/* Narrative card */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-6">
        <div className="min-h-[80px] whitespace-pre-wrap text-[15px] leading-[1.8] text-ink">
          {narrative || (
            <span className="animate-pulse-soft text-dim">
              Writing your read…
            </span>
          )}
        </div>

        {primary && narrative && (
          <div className="mt-6 space-y-3 border-t border-white/6 pt-5">
            <PillarRow name="The pull" text={primary.pull} />
            <PillarRow
              name="The job"
              text={jobs.length ? jobs.join("; ") : primary.job}
            />
            <PillarRow name="The loop" text={loopLine(state)} />
            <PillarRow
              name="The cost"
              text={`Taxing ${costPhrase(state)}.`}
            />
          </div>
        )}

        <div className="mt-5">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide ${SEV_STYLES[severity.band]}`}
          >
            {sevCopy.label}
          </span>
          <p className="mt-2.5 text-[13.5px] leading-[1.65] text-dim">
            {sevCopy.text}
          </p>
        </div>
      </div>

      {/* Advice callout */}
      {primary && (
        <div className="rounded-2xl border border-blh-accent/15 bg-blh-accent/6 px-5 py-4.5 text-[14.5px] leading-[1.75] text-ink">
          <span className="font-semibold text-blh-accent">One thing: </span>
          {primary.advice}
        </div>
      )}

      {/* Confidence note */}
      <p className="text-[12px] leading-[1.6] text-faint">
        Read confidence: {classification.confidence} · built from{" "}
        {answers.length} answers · a starting point, not a verdict.
      </p>

      {narrativeDone && (
        <FeedbackBlock
          onSubmit={(fit, text) => postSession(buildRecord(fit, text))}
          onRestart={onRestart}
        />
      )}
    </div>
  );
}

function PillarRow({ name, text }: { name: string; text: string }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-3">
      <div className="pt-0.5 text-[11px] font-bold uppercase tracking-wider text-blh-accent2">
        {name}
      </div>
      <div className="text-[13.5px] leading-snug text-dim">{text}</div>
    </div>
  );
}

function SafetyBlock() {
  return (
    <div className="rounded-2xl border border-blh-accent/20 bg-blh-accent/6 p-5">
      <h2 className="text-[17px] font-bold text-ink">
        First — the part that matters more than any quiz.
      </h2>
      <p className="mt-2.5 text-[14.5px] leading-[1.7] text-dim">
        Your answers suggest you&apos;re carrying a lot right now. Loops like
        this genuinely respond to support — reaching out is a strength move.
      </p>
      <div className="mt-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3.5 text-[13.5px] leading-[1.7] text-dim">
        <b className="text-ink">If things feel like too much:</b> call or text{" "}
        <b className="text-blh-accent">988</b> (U.S. Suicide &amp; Crisis
        Lifeline — free, 24/7), or text{" "}
        <b className="text-blh-accent">HOME</b> to{" "}
        <b className="text-blh-accent">741741</b>.
      </div>
    </div>
  );
}

const FIT_OPTIONS: { id: FitRating; label: string }[] = [
  { id: "all_me", label: "100% me" },
  { id: "mostly", label: "Mostly me" },
  { id: "partly", label: "Partly" },
  { id: "not_me", label: "Not me" },
];

function FeedbackBlock({
  onSubmit,
  onRestart,
}: {
  onSubmit: (fit: FitRating, text: string | null) => void;
  onRestart: () => void;
}) {
  const [fit, setFit] = useState<FitRating | null>(null);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-6">
      <h2 className="text-[17px] font-bold text-ink">
        Last one — how well did we read you?
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FIT_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setFit(o.id)}
            className={[
              "rounded-xl border px-3 py-3 text-center text-[13.5px] font-medium transition-all duration-150",
              fit === o.id
                ? "border-blh-accent bg-blh-accent/12 text-ink shadow-[0_0_0_1px_var(--color-blh-accent)]"
                : "border-white/8 bg-white/3 text-dim hover:border-white/15 hover:text-ink",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What did we get right? What did we miss? (optional)"
        className="mt-3.5 min-h-[70px] w-full resize-y rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-[14px] text-ink placeholder:text-faint focus:border-blh-accent/30 focus:outline-none"
      />
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton
          disabled={fit === null || done}
          onClick={() => {
            if (fit) {
              onSubmit(fit, text.trim() || null);
              setDone(true);
            }
          }}
        >
          Done
        </PrimaryButton>
        <GhostButton onClick={onRestart}>Retake</GhostButton>
      </div>
      {done && (
        <p className="mt-3 text-[14px] font-semibold text-blh-accent">
          Thank you — this is how the quiz gets sharper.
        </p>
      )}
    </div>
  );
}
