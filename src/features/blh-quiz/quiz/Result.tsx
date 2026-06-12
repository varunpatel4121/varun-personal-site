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

const TEAL = "#5eead4";
const SKY = "#7dd3fc";

const content = phenotypesJson as unknown as {
  phenotypes: Record<
    PhenotypeId,
    { name: string; quote: string; read: string; pull: string; job: string; advice: string }
  >;
  severityCopy: Record<string, { label: string; text: string }>;
  noDominantLoop: { title: string; read: string };
};

const SEV_STYLES: Record<string, React.CSSProperties> = {
  light_grip: { color: TEAL, backgroundColor: "rgba(94,234,212,0.1)", border: "1px solid rgba(94,234,212,0.25)" },
  steady_pull: { color: "#fbbf24", backgroundColor: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" },
  deep_loop:   { color: "#fda4af", backgroundColor: "rgba(253,164,175,0.1)", border: "1px solid rgba(253,164,175,0.25)" },
};

function postSession(record: SessionRecord) {
  fetch("/api/quiz/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    keepalive: true,
  }).catch(() => {});
}

export function ResultScreen({
  answers, state, classification, severity, safety,
  llmUsed, sessionId, startedAt, onNarrativeUsed, onRestart,
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
  const primary = classification.primary !== "none"
    ? content.phenotypes[classification.primary] : null;
  const secondary = classification.secondary
    ? content.phenotypes[classification.secondary] : null;
  const sevCopy = content.severityCopy[severity.band];
  const jobs = topJobs(state, 2).map((j) => jobLabel(j as JobTag));

  const [narrative, setNarrative] = useState("");
  const [narrativeDone, setNarrativeDone] = useState(false);
  const narrativeUsedLlm = useRef(false);
  const started = useRef(false);

  const buildRecord = (fit: FitRating | null, fitText: string | null) =>
    buildSessionRecord(answers, scoring, {
      sessionId, startedAt,
      completedAt: new Date().toISOString(),
      configVersion: scoring.version,
      schemaVersion: SCHEMA_VERSION,
      llmUsed: { ...llmUsed, narrative: narrativeUsedLlm.current },
      fitRating: fit, fitText,
    });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const fallback = primary ? primary.read : content.noDominantLoop.read;
    const ctx = buildLlmContext(answers, {
      severityBand: severity.band, safety,
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

      {primary ? (
        <div>
          <div
            style={{ background: `linear-gradient(90deg, ${SKY}, ${TEAL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            className="text-[clamp(26px,5vw,36px)] font-extrabold tracking-tight"
          >
            {primary.name}
          </div>
          <div className="mt-1.5 text-[15px] italic leading-relaxed text-white/50">
            &ldquo;{primary.quote}&rdquo;
          </div>
          {secondary && (
            <div className="mt-2 text-[13.5px] text-white/50">
              with a secondary thread of <b className="text-white/80">{secondary.name}</b>
            </div>
          )}
        </div>
      ) : (
        <h1 className="text-[clamp(24px,5vw,32px)] font-extrabold tracking-tight text-white">
          {content.noDominantLoop.title}
        </h1>
      )}

      {/* Narrative card */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-6">
        <div className="min-h-[80px] whitespace-pre-wrap text-[15px] leading-[1.8] text-white/90">
          {narrative || (
            <span className="animate-pulse-soft text-white/35">Writing your read…</span>
          )}
        </div>

        {primary && narrative && (
          <div className="mt-6 space-y-3 border-t border-white/8 pt-5">
            <PillarRow name="The pull" text={primary.pull} />
            <PillarRow name="The job" text={jobs.length ? jobs.join("; ") : primary.job} />
            <PillarRow name="The loop" text={loopLine(state)} />
            <PillarRow name="The cost" text={`Taxing ${costPhrase(state)}.`} />
          </div>
        )}

        <div className="mt-5">
          <span
            style={SEV_STYLES[severity.band]}
            className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide"
          >
            {sevCopy.label}
          </span>
          <p className="mt-2.5 text-[13.5px] leading-[1.65] text-white/50">{sevCopy.text}</p>
        </div>
      </div>

      {/* Advice callout */}
      {primary && (
        <div
          style={{ borderColor: "rgba(94,234,212,0.2)", backgroundColor: "rgba(94,234,212,0.06)" }}
          className="rounded-2xl border px-5 py-4.5 text-[14.5px] leading-[1.75] text-white/80"
        >
          <span style={{ color: TEAL }} className="font-semibold">One thing: </span>
          {primary.advice}
        </div>
      )}

      <p className="text-[12px] leading-[1.6] text-white/30">
        Read confidence: {classification.confidence} · built from {answers.length} answers · a starting point, not a verdict.
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
      <div style={{ color: SKY }} className="pt-0.5 text-[11px] font-bold uppercase tracking-wider">
        {name}
      </div>
      <div className="text-[13.5px] leading-snug text-white/55">{text}</div>
    </div>
  );
}

function SafetyBlock() {
  return (
    <div
      style={{ borderColor: "rgba(94,234,212,0.25)", backgroundColor: "rgba(94,234,212,0.06)" }}
      className="rounded-2xl border p-5"
    >
      <h2 className="text-[17px] font-bold text-white">
        First — the part that matters more than any quiz.
      </h2>
      <p className="mt-2.5 text-[14.5px] leading-[1.7] text-white/55">
        Your answers suggest you&apos;re carrying a lot right now. Loops like this genuinely respond to support — reaching out is a strength move.
      </p>
      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3.5 text-[13.5px] leading-[1.7] text-white/55">
        <b className="text-white/90">If things feel like too much:</b> call or text{" "}
        <b style={{ color: TEAL }}>988</b> (U.S. Suicide &amp; Crisis Lifeline — free, 24/7), or text{" "}
        <b style={{ color: TEAL }}>HOME</b> to <b style={{ color: TEAL }}>741741</b>.
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

function FeedbackBlock({ onSubmit, onRestart }: {
  onSubmit: (fit: FitRating, text: string | null) => void;
  onRestart: () => void;
}) {
  const [fit, setFit] = useState<FitRating | null>(null);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-6">
      <h2 className="text-[17px] font-bold text-white">
        Last one — how well did we read you?
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FIT_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setFit(o.id)}
            style={fit === o.id
              ? { borderColor: TEAL, backgroundColor: "rgba(94,234,212,0.12)", boxShadow: `0 0 0 1px ${TEAL}` }
              : undefined}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center text-[13.5px] font-medium text-white/60 transition-all duration-150 hover:border-white/20 hover:text-white/90"
          >
            {o.label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What did we get right? What did we miss? (optional)"
        className="mt-3.5 min-h-[70px] w-full resize-y rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-[14px] text-white/80 placeholder:text-white/25 focus:outline-none"
        style={{ outlineColor: TEAL }}
      />
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton
          disabled={fit === null || done}
          onClick={() => { if (fit) { onSubmit(fit, text.trim() || null); setDone(true); } }}
        >
          Done
        </PrimaryButton>
        <GhostButton onClick={onRestart}>Retake</GhostButton>
      </div>
      {done && (
        <p style={{ color: TEAL }} className="mt-3 text-[14px] font-semibold">
          Thank you — this is how the quiz gets sharper.
        </p>
      )}
    </div>
  );
}
