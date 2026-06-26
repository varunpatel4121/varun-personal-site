"use client";

/**
 * <ParentQuiz/> — the warm, soul-reading parent funnel. Built on @blh/quiz-core
 * primitives with a distinct light/editorial theme. The result leads with the
 * recognition moment, stays scannable, and flows into a configurable CARES
 * booking CTA. Email-gated; safety results bypass the marketing flow.
 */

import { useEffect, useState } from "react";
import { QuizFrame, SingleChoice, MultiChoice, Button } from "@blh/quiz-core/ui";
import type { QuizPersistence, Narrator } from "@blh/quiz-core";
import { CONTENT, QUESTION_BY_ID } from "../config";
import type { CostDomain, SupportLevel } from "../types";
import { useParentQuiz, type ParentResultView } from "./flow";
import "./theme.css";

export interface ParentQuizProps {
  persistence?: QuizPersistence;
  narrator?: Narrator;
  /** CARES booking/consult URL. Defaults to content.defaultBookingUrl. */
  bookingUrl?: string;
}

const COST_LABEL: Record<CostDomain, string> = {
  sleep: "sleep",
  school: "school & responsibilities",
  mood: "mood",
  conflict: "family conflict",
  offline_life: "offline life",
  self_image: "self-image",
  money: "money",
  trust: "trust & secrecy",
  parent_burnout: "your own energy",
};

const SUPPORT_CHIP: Record<SupportLevel, string> = {
  normal_tension: "Normal tech tension",
  pattern_forming: "A pattern forming",
  family_impact_loop: "A family-impact loop",
  support_recommended: "Support recommended",
  safety_route: "",
};

function Loading() {
  return <div className="q-center"><p className="q-lead">Reading your family’s pattern…</p></div>;
}

function Intro({ onStart }: { onStart: () => void }) {
  const c = CONTENT.intro;
  return (
    <div className="q-center">
      <div className="q-kicker">{c.kicker}</div>
      <h1 className="q-title">{c.title}</h1>
      <p className="q-lead">{c.subtitle}</p>
      <Button onClick={onStart}>{c.cta}</Button>
      <p className="q-hint" style={{ marginTop: 20 }}>{c.disclaimer}</p>
    </div>
  );
}

function Safety({ onRestart }: { onRestart?: () => void }) {
  return (
    <div>
      <div className="q-kicker">Please read this first</div>
      <h2 className="q-q">{CONTENT.cta.safetyTitle}</h2>
      <div className="q-safety" style={{ marginTop: 12 }}>{CONTENT.cta.safetyBody}</div>
      {onRestart && (
        <div className="q-actions"><Button variant="ghost" onClick={onRestart}>Start over</Button></div>
      )}
    </div>
  );
}

function EmailGate({ view, onSubmit }: { view: ParentResultView; onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState("");
  if (view.output.safety_flag) return <Safety />;
  const c = CONTENT.emailGate;
  return (
    <div className="pq-gate">
      <div className="q-kicker">{c.kicker}</div>
      <div className="pq-hero-name">{view.primary.name}</div>
      <p className="pq-recognition">“{view.primary.recognitionLine}”</p>
      <p className="pq-teaser">{c.body}</p>
      <input
        className="q-input"
        type="email"
        placeholder={c.placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit(email.trim())}
      />
      <div style={{ marginTop: 18 }}>
        <Button onClick={() => onSubmit(email.trim())}>{c.cta}</Button>
      </div>
      <div className="pq-gate-skip">
        <Button variant="ghost" onClick={() => onSubmit("")}>{c.skip}</Button>
      </div>
    </div>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pq-point">
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

function Fit({ onFit }: { onFit: (rating: number) => void }) {
  const [done, setDone] = useState(false);
  if (done) return <p className="pq-fit-thanks">Thank you — that helps us read families like yours.</p>;
  return (
    <div className="pq-fit">
      <p className="pq-fit-q">{CONTENT.result.fitQuestion}</p>
      <div className="pq-fit-opts">
        {CONTENT.result.fitOptions.map((f) => (
          <button key={f.value} className="pq-fit-opt" onClick={() => { onFit(f.value); setDone(true); }}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({
  view,
  bookingUrl,
  onFit,
  onRestart,
}: {
  view: ParentResultView;
  bookingUrl: string;
  onFit: (rating: number | null, text: string) => void;
  onRestart: () => void;
}) {
  const { output, primary, secondary, narrative } = view;
  if (output.safety_flag) return <Safety onRestart={onRestart} />;

  const s = CONTENT.result.sections;
  const familyLabel = output.family_pattern ? CONTENT.familyPatternLabels[output.family_pattern] : null;
  const costs = output.cost_domains.filter((c) => c !== "parent_burnout").map((c) => COST_LABEL[c]);
  const lowReady = output.cta_readiness === "low_ready";

  const chips = [SUPPORT_CHIP[output.support_level], familyLabel, secondary ? `also ${secondary.name}` : null]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="pq-result">
      <div className="pq-hero">
        <div className="q-kicker">{CONTENT.result.headlinePrefix}</div>
        <h1 className="pq-hero-name">{primary.name}</h1>
        <p className="pq-recognition">“{primary.recognitionLine}”</p>
        {chips && <div className="pq-chips">{chips}</div>}
      </div>

      <p className="pq-narrative">{narrative}</p>

      <div className="pq-points">
        <Point title={s.seeing}>{primary.whatYouMayBeSeeing}</Point>
        <Point title={s.cost}>
          {primary.whatItMayBeCosting}
          {costs.length > 0 && <> Lately it may be showing up in <strong>{costs.join(", ")}</strong>.</>}
        </Point>
      </div>

      {!lowReady && <p className="pq-support-line">{CONTENT.supportCopy[output.support_level]}</p>}

      <div className="pq-cta">
        <h3>{lowReady ? CONTENT.cta.lowReadyTitle : CONTENT.cta.title}</h3>
        <p>{lowReady ? CONTENT.cta.lowReadyBody : CONTENT.cta.body}</p>
        {!lowReady && (
          <a className="pq-cta-book" href={bookingUrl} target="_blank" rel="noopener noreferrer">
            {CONTENT.cta.bookLabel}
          </a>
        )}
        <p className="pq-reassure">{CONTENT.cta.reassure}</p>
      </div>

      <details className="pq-detail">
        <summary>What helps at home, and what the screen may be doing</summary>
        <div className="pq-points">
          <Point title={s.doing}>{primary.whatScreensMayBeDoing}</Point>
          <Point title={s.helps}>{primary.whatHelps}</Point>
          <Point title={s.support}>{primary.whySupportMayHelp}</Point>
        </div>
      </details>

      <Fit onFit={(rating) => onFit(rating, "")} />
      <div className="q-actions" style={{ justifyContent: "center" }}>
        <Button variant="ghost" onClick={onRestart}>Start over</Button>
      </div>
    </div>
  );
}

const KICKER: Record<string, string> = {
  frame: "A little context",
  concern: "What brings you here",
  family: "Setting limits",
  loop: "When it happens",
  cost: "What you’re noticing",
  urgency: "The last month",
  cta: "One last thing",
};

export function ParentQuiz(props: ParentQuizProps) {
  const quiz = useParentQuiz({ persistence: props.persistence, narrator: props.narrator, bookingUrl: props.bookingUrl });
  const { step } = quiz;

  // Compute the result if a parent lands directly on email/result.
  useEffect(() => {
    if ((step.kind === "email" || step.kind === "result") && !quiz.view) void quiz.compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.kind]);

  let body: React.ReactNode;
  let stepKey: string = step.kind;
  if (step.kind === "intro") {
    body = <Intro onStart={quiz.begin} />;
  } else if (step.kind === "question") {
    stepKey = `q-${step.qid}`;
    const q = QUESTION_BY_ID.get(step.qid)!;
    const skip = q.optional ? (
      <div className="q-actions"><div className="q-spacer" /><Button variant="ghost" onClick={quiz.skip}>Skip</Button></div>
    ) : null;
    body =
      q.type === "single" ? (
        <>
          <SingleChoice
            kicker={KICKER[q.section]}
            question={q.question}
            hint={q.hint}
            options={q.options.map((o) => ({ value: o.value, label: o.label }))}
            onSelect={(v, l) => quiz.answer(q.id, [v], [l])}
          />
          {skip}
        </>
      ) : (
        <>
          <MultiChoice
            kicker={KICKER[q.section]}
            question={q.question}
            hint={q.hint}
            max={q.max}
            options={q.options.map((o) => ({ value: o.value, label: o.label, exclusive: o.lowConcern }))}
            onSubmit={(vals, labels) => quiz.answer(q.id, vals, labels)}
          />
          {skip}
        </>
      );
  } else if (step.kind === "email") {
    body = quiz.view ? <EmailGate view={quiz.view} onSubmit={quiz.submitEmail} /> : <Loading />;
  } else {
    body = quiz.view ? (
      <Result view={quiz.view} bookingUrl={quiz.bookingUrl} onFit={quiz.submitFit} onRestart={quiz.restart} />
    ) : (
      <Loading />
    );
  }

  return (
    <QuizFrame theme="parent" progress={quiz.progress}>
      <div className="q-step" key={stepKey}>{body}</div>
    </QuizFrame>
  );
}
