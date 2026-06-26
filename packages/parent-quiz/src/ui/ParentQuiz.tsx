"use client";

/**
 * <ParentQuiz/> — the parent funnel. Shares the Blue Light Health blue UI with
 * the adult quiz (via @blh/quiz-core), so the two read as one product. The
 * result leads with a "this is my family" recognition moment, stays scannable,
 * and flows into the CARES booking CTA. Email-gated; safety bypasses the funnel.
 */

import { useEffect, useState } from "react";
import { QuizFrame, SingleChoice, MultiChoice, Button, Logo } from "@blh/quiz-core/ui";
import type { QuizPersistence, Narrator } from "@blh/quiz-core";
import { CONTENT, QUESTION_BY_ID } from "../config";
import { useParentQuiz, type ParentResultView } from "./flow";
import "./theme.css";

export interface ParentQuizProps {
  persistence?: QuizPersistence;
  narrator?: Narrator;
  /** CARES booking/consult URL. Defaults to content.defaultBookingUrl. */
  bookingUrl?: string;
}

const KICKER: Record<string, string> = {
  frame: "A little context",
  concern: "What brings you here",
  limits: "When you set a limit",
  timing: "When it's hardest",
  aftermath: "Afterward",
  cost: "The impact",
  role: "Your role",
};

function Loading() {
  return <div className="q-center"><p className="q-lead">Reading your family&apos;s pattern…</p></div>;
}

function Intro({ onStart }: { onStart: () => void }) {
  const c = CONTENT.intro;
  return (
    <div className="q-center">
      <div className="q-brand q-intro-logo"><Logo size={26} /></div>
      <h1 className="q-title">{c.title}</h1>
      <Button onClick={onStart}>{c.cta}</Button>
    </div>
  );
}

function Safety({ onRestart }: { onRestart?: () => void }) {
  return (
    <div>
      <div className="q-kicker">Please read this first</div>
      <h2 className="q-q">{CONTENT.cta.safetyTitle}</h2>
      <div className="q-safety" style={{ marginTop: 12 }}>{CONTENT.cta.safetyBody}</div>
      {onRestart && <div className="q-actions"><Button variant="ghost" onClick={onRestart}>Start over</Button></div>}
    </div>
  );
}

function EmailGate({ view, onSubmit }: { view: ParentResultView; onSubmit: (name: string, email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  if (view.output.safety_flag) return <Safety />;
  const c = CONTENT.emailGate;
  const valid = name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email.trim());
  const submit = () => valid && onSubmit(name.trim(), email.trim());
  return (
    <div className="q-center">
      <div className="q-kicker">{c.kicker}</div>
      <div className="q-result-name">{view.primary.name}</div>
      <p className="q-recognition">“{view.primary.recognitionLine}”</p>
      <p className="q-lead" style={{ margin: "14px auto 0" }}>{c.body}</p>
      <input className="q-input" style={{ maxWidth: 360, margin: "18px auto 0", textAlign: "center" }}
        placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="q-input" style={{ maxWidth: 360, margin: "10px auto 0", textAlign: "center" }} type="email"
        placeholder={c.placeholder} value={email} onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()} />
      <div style={{ marginTop: 18 }}><Button disabled={!valid} onClick={submit}>{c.cta}</Button></div>
    </div>
  );
}

function Fit({ onFit }: { onFit: (rating: number) => void }) {
  const [done, setDone] = useState(false);
  if (done) return <p className="q-fit-thanks">Thank you — that helps us read families like yours.</p>;
  return (
    <div className="q-fit">
      <p className="q-fit-q">{CONTENT.result.fitQuestion}</p>
      <div className="q-fit-opts">
        {CONTENT.result.fitOptions.map((f) => (
          <button key={f.value} className="q-fit-opt" onClick={() => { onFit(f.value); setDone(true); }}>{f.label}</button>
        ))}
      </div>
    </div>
  );
}

function Result({
  view, bookingUrl, onFit, onRestart,
}: {
  view: ParentResultView; bookingUrl: string;
  onFit: (rating: number | null, text: string) => void; onRestart: () => void;
}) {
  const { output, primary, secondaries, narrative } = view;
  if (output.safety_flag) return <Safety onRestart={onRestart} />;

  const s = CONTENT.result.sections;
  const severityChip = CONTENT.severityChip[output.severity_band];

  return (
    <>
      <div className="q-result-grid">
        <div>
          <div className="q-kicker">{CONTENT.result.headlinePrefix}</div>
          <h1 className="q-result-name">{primary.name}</h1>
          <div className="q-result-label">{primary.shortLabel}</div>
          <p className="q-recognition">“{primary.recognitionLine}”</p>
          <p className="q-read">{narrative}</p>
          <div className="q-chips">
            <span className="q-chip-badge" data-tone="accent">{severityChip}</span>
            {secondaries.map((sec) => (
              <span key={sec.id} className="q-chip-badge">also: {sec.name}</span>
            ))}
          </div>
        </div>

        <div>
          <div className="q-card"><h4>{s.cost}</h4><p>{primary.cost}</p></div>
          <div className="q-card"><h4>{s.helps}</h4><p>{primary.whatHelps}</p></div>
          <div className="q-card q-cta">
            <h4>{CONTENT.cta.title}</h4>
            <p>{CONTENT.severityCopy[output.severity_band]} {CONTENT.cta.body}</p>
            <a className="q-cta-book" href={bookingUrl} target="_blank" rel="noopener noreferrer">{CONTENT.cta.bookLabel}</a>
            <p className="q-reassure">{CONTENT.cta.reassure}</p>
          </div>
        </div>
      </div>

      <details className="q-card" style={{ marginTop: 6 }}>
        <summary style={{ cursor: "pointer", color: "var(--q-muted)", fontSize: 14 }}>The full picture — what you can see, the loop, and when it tips over</summary>
        <div className="q-detail-grid" style={{ marginTop: 14 }}>
          <DetailBlock title={s.observe} body={primary.observe} />
          <DetailBlock title={s.family} body={primary.familyLoop} />
          <DetailBlock title={s.whenNormal} body={primary.whenNormal} />
          <DetailBlock title={s.whenProblem} body={primary.whenProblem} />
          <DetailBlock title={s.support} body={primary.supportBridge} />
        </div>
      </details>

      <Fit onFit={(rating) => onFit(rating, "")} />
      <div className="q-actions" style={{ justifyContent: "center" }}>
        <Button variant="ghost" onClick={onRestart}>Start over</Button>
      </div>
      <p className="q-disclaimer">{CONTENT.intro.disclaimer}</p>
    </>
  );
}

function DetailBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--q-accent)", margin: "0 0 6px" }}>{title}</h4>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

export function ParentQuiz(props: ParentQuizProps) {
  const quiz = useParentQuiz({ persistence: props.persistence, narrator: props.narrator, bookingUrl: props.bookingUrl });
  const { step } = quiz;

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
    const skip = q.optional ? <div className="q-actions"><div className="q-spacer" /><Button variant="ghost" onClick={quiz.skip}>Skip</Button></div> : null;
    body = q.type === "single" ? (
      <>
        <SingleChoice kicker={KICKER[q.section]} question={q.question} hint={q.hint}
          options={q.options.map((o) => ({ value: o.value, label: o.label }))}
          onSelect={(v, l) => quiz.answer(q.id, [v], [l])} />
        {skip}
      </>
    ) : (
      <>
        <MultiChoice kicker={KICKER[q.section]} question={q.question} hint={q.hint} max={q.max}
          initial={quiz.saved[q.id]}
          options={q.options.map((o) => ({ value: o.value, label: o.label, exclusive: o.exclusive }))}
          onSubmit={(vals, labels) => quiz.answer(q.id, vals, labels)} />
        {skip}
      </>
    );
  } else if (step.kind === "email") {
    body = quiz.view ? <EmailGate view={quiz.view} onSubmit={quiz.submitEmail} /> : <Loading />;
  } else {
    body = quiz.view ? <Result view={quiz.view} bookingUrl={quiz.bookingUrl} onFit={quiz.submitFit} onRestart={quiz.restart} /> : <Loading />;
  }

  return (
    <QuizFrame theme="parent" progress={quiz.progress} canGoBack={quiz.canGoBack} onBack={quiz.goBack} wide={step.kind === "result"} brand={step.kind !== "intro"}>
      <div className="q-step" key={stepKey}>{body}</div>
    </QuizFrame>
  );
}
