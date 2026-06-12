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
  light_grip: "bg-blh-accent/10 text-blh-accent",
  steady_pull: "bg-warn/10 text-warn",
  deep_loop: "bg-rose/15 text-rose",
};

function postSession(record: SessionRecord) {
  fetch("/api/quiz/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    keepalive: true,
  }).catch(() => {
    /* anonymous analytics must never break the user's result */
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
    <div className="animate-screen-in">
      {safety && <SafetyBlock />}

      <Kicker>
        {safety ? "Your reflection" : "Your loop, as best we can read it"}
      </Kicker>

      {primary ? (
        <>
          <div className="bg-gradient-to-r from-blh-accent2 to-blh-accent bg-clip-text text-[clamp(24px,5vw,32px)] font-extrabold tracking-tight text-transparent">
            {primary.name}
          </div>
          <div className="mt-1 text-[15.5px] italic leading-relaxed text-dim">
            &ldquo;{primary.quote}&rdquo;
          </div>
          {secondary && (
            <div className="mt-3 text-[14px] text-dim">
              with a secondary thread of{" "}
              <b className="text-ink">{secondary.name}</b>
            </div>
          )}
        </>
      ) : (
        <h1 className="text-[clamp(24px,5vw,32px)] font-extrabold tracking-tight">
          {content.noDominantLoop.title}
        </h1>
      )}

      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <div className="min-h-[72px] whitespace-pre-wrap text-[15.5px] leading-[1.75]">
          {narrative || (
            <span className="animate-pulse-soft text-dim">
              Writing your read…
            </span>
          )}
        </div>

        {primary && (
          <div className="mt-5 space-y-3">
            <PillarRow name="The pull" text={primary.pull} />
            <PillarRow
              name="The job"
              text={jobs.length ? jobs.join("; ") : primary.job}
            />
            <PillarRow name="The loop" text={loopLine(state)} />
            <PillarRow
              name="The cost"
              text={`It's currently taxing ${costPhrase(state)}.`}
            />
          </div>
        )}

        <div className="mt-4.5">
          <span
            className={`inline-block rounded-full px-3 py-1 text-[12.5px] font-bold tracking-wide ${SEV_STYLES[severity.band]}`}
          >
            {sevCopy.label}
          </span>
        </div>
        <p className="mt-2 text-[14px] leading-[1.65] text-dim">
          {sevCopy.text}
        </p>
      </div>

      {primary && (
        <div className="mt-4 rounded-2xl border border-line bg-blh-accent2/5 px-5 py-4.5 text-[15px] leading-[1.75]">
          <span className="font-semibold text-blh-accent">
            If you change one thing:
          </span>{" "}
          {primary.advice}
        </div>
      )}

      <p className="mt-6 text-[12.5px] leading-[1.6] text-faint">
        Read confidence: {classification.confidence}. This is a draft
        reflection built from {answers.length} answers — a starting point for
        understanding your pattern, not a verdict and not a diagnosis. A
        clinician who knows this territory can tell you whether it actually
        fits.
      </p>

      {narrativeDone && (
        <FeedbackBlock onSubmit={(fit, text) => postSession(buildRecord(fit, text))} onRestart={onRestart} />
      )}
    </div>
  );
}

function PillarRow({ name, text }: { name: string; text: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-3 max-[520px]:grid-cols-[74px_1fr]">
      <div className="text-xs font-bold uppercase tracking-wider text-blh-accent2">
        {name}
      </div>
      <div className="text-[14px] leading-normal">{text}</div>
    </div>
  );
}

function SafetyBlock() {
  return (
    <div className="mb-6 rounded-2xl border border-blh-accent/30 bg-blh-accent/5 p-6">
      <h2 className="text-[18px] font-bold">
        First — the part that matters more than any quiz.
      </h2>
      <p className="mt-2.5 text-[15px] leading-[1.7] text-dim">
        Your answers suggest you&apos;re carrying a lot right now, and that the
        loop you&apos;re in is tangled up with how you feel about yourself. That&apos;s
        heavy, and it&apos;s not something anyone should white-knuckle alone.
        Loops like this genuinely respond to support — reaching out is a
        strength move, not an admission of anything.
      </p>
      <div className="mt-4 rounded-xl border border-line bg-card px-4 py-3.5 text-[14.5px] leading-[1.7]">
        <b className="text-ink">If things ever feel like too much:</b>
        <span className="text-dim">
          {" "}
          call or text <b className="text-blh-accent">988</b> (U.S. Suicide &amp;
          Crisis Lifeline — free, 24/7, confidential), or text{" "}
          <b className="text-blh-accent">HOME</b> to <b className="text-blh-accent">741741</b>{" "}
          (Crisis Text Line). Outside the U.S., your local emergency number or
          a trusted adult is the right first call.
        </span>
      </div>
    </div>
  );
}

const FIT_OPTIONS: { id: FitRating; label: string }[] = [
  { id: "all_me", label: "This is 100% me" },
  { id: "mostly", label: "Mostly me" },
  { id: "partly", label: "Partly" },
  { id: "not_me", label: "Not me at all" },
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
    <div className="mt-6 rounded-2xl border border-line bg-card p-6">
      <h2 className="text-[18px] font-bold">
        Last question — and it&apos;s about us, not you
      </h2>
      <p className="mt-1.5 text-[14px] text-dim">
        How well did this actually read you?
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {FIT_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setFit(o.id)}
            className={[
              "min-w-[120px] flex-1 rounded-xl border px-3 py-3 text-center text-[14.5px] transition-all duration-150",
              fit === o.id
                ? "border-blh-accent bg-blh-accent/10 shadow-[0_0_0_1px_var(--color-blh-accent)]"
                : "border-line bg-card2 hover:border-line2",
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
        className="mt-3.5 min-h-[74px] w-full resize-y rounded-xl border border-line bg-card2 px-4 py-3 text-[14.5px] text-ink placeholder:text-faint focus:border-line2 focus:outline-none"
      />
      <div className="mt-4 flex items-center gap-2.5">
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
        <div className="mt-3.5 text-[15px] font-semibold text-blh-accent">
          Thank you — this is exactly how the quiz gets sharper.
        </div>
      )}
    </div>
  );
}
