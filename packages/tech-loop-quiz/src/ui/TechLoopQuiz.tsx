"use client";

/**
 * <TechLoopQuiz/> — the full quiz UI. Self-contained and portable: it takes an
 * optional persistence adapter and AI narrator as props (the host app injects
 * the Supabase/Anthropic concretions), and ships its own scoped styles. No
 * personal-site or framework coupling.
 */

import { useEffect, useMemo, useState } from "react";
import {
  PHENOTYPE_PROFILE,
  PLATFORMS,
  QUIZ_CONTENT,
  SUBFEATURE_QUESTION_MAP,
} from "../config";
import { bandLabel } from "../engine";
import { CRISIS_MESSAGE } from "../ai";
import type { Platform, SubfeatureSelection } from "../types";
import type { QuizPersistence } from "../persistence";
import type { AINarrator } from "../ai";
import { useTechLoopQuiz, type DisambiguationChoice } from "./flow";
import "./styles.css";

export interface TechLoopQuizProps {
  persistence?: QuizPersistence;
  narrator?: AINarrator;
}

const Check = ({ round = false }: { round?: boolean }) => (
  <span className="tlq-check" data-round={round}>
    <svg viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.2l2.3 2.3L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

function Shell({ progress, children }: { progress: number; children: React.ReactNode }) {
  return (
    <div className="tlq">
      <div className="tlq-shell">
        <div className="tlq-progress"><div style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        {children}
      </div>
    </div>
  );
}

/** Single-select; auto-advances. */
function SingleChoice({
  kicker, question, hint, options, onSelect,
}: {
  kicker?: string; question: string; hint?: string;
  options: { value: string; label: string; sub?: string }[];
  onSelect: (value: string, label: string) => void;
}) {
  return (
    <>
      {kicker && <div className="tlq-kicker">{kicker}</div>}
      <h2 className="tlq-q">{question}</h2>
      {hint && <p className="tlq-hint">{hint}</p>}
      <div className="tlq-options">
        {options.map((o) => (
          <button key={o.value} className="tlq-opt" onClick={() => onSelect(o.value, o.label)}>
            <Check round />
            <span>{o.label}{o.sub && <span className="tlq-sub">{o.sub}</span>}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/** Multi-select with max, exclusive options, optional free text, and a Continue button. */
function MultiChoice({
  kicker, question, hint, options, max, allowFreeText, onSubmit,
}: {
  kicker?: string; question: string; hint?: string;
  options: { value: string; label: string; exclusive?: boolean }[];
  max?: number; allowFreeText?: boolean;
  onSubmit: (values: string[], labels: string[], freeText?: string) => void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const [text, setText] = useState("");
  const exclusiveSet = useMemo(() => new Set(options.filter((o) => o.exclusive).map((o) => o.value)), [options]);

  const toggle = (v: string) => {
    setSel((prev) => {
      if (exclusiveSet.has(v)) return prev.includes(v) ? [] : [v];
      const cleaned = prev.filter((x) => !exclusiveSet.has(x));
      if (cleaned.includes(v)) return cleaned.filter((x) => x !== v);
      if (max && cleaned.length >= max) return cleaned;
      return [...cleaned, v];
    });
  };
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <>
      {kicker && <div className="tlq-kicker">{kicker}</div>}
      <h2 className="tlq-q">{question}</h2>
      {hint && <p className="tlq-hint">{hint}{max ? ` · up to ${max}` : ""}</p>}
      <div className="tlq-options">
        {options.map((o) => (
          <button key={o.value} className="tlq-opt" data-selected={sel.includes(o.value)} onClick={() => toggle(o.value)}>
            <Check />
            <span>{o.label}</span>
          </button>
        ))}
      </div>
      {allowFreeText && (
        <textarea className="tlq-textarea" rows={2} placeholder={`${QUIZ_CONTENT.somethingElseLabel}…`} value={text} onChange={(e) => setText(e.target.value)} />
      )}
      <div className="tlq-actions">
        <button className="tlq-btn" disabled={sel.length === 0 && !text.trim()} onClick={() => onSubmit(sel, sel.map(labelOf), text.trim() || undefined)}>
          Continue
        </button>
      </div>
    </>
  );
}

function PlatformPicker({ onSubmit }: { onSubmit: (ids: string[], labels: string[]) => void }) {
  const platforms = (PLATFORMS as Platform[]).filter((p) => !p.future);
  return (
    <MultiChoice
      kicker="The Pull"
      question={QUIZ_CONTENT.pull.platformQuestion}
      hint={QUIZ_CONTENT.pull.platformHint}
      max={3}
      options={platforms.map((p) => ({ value: p.id, label: p.label }))}
      onSubmit={(ids, labels) => onSubmit(ids, labels)}
    />
  );
}

function SubfeaturePicker({
  platformIds, onSubmit,
}: {
  platformIds: string[];
  onSubmit: (sel: SubfeatureSelection[], labels: string[]) => void;
}) {
  const [order, setOrder] = useState<{ platform: string; subfeature: string; label: string }[]>([]);
  const platforms = (PLATFORMS as Platform[]).filter((p) => platformIds.includes(p.id));

  const keyOf = (p: string, s: string) => `${p}.${s}`;
  const rankOf = (p: string, s: string) => order.findIndex((o) => o.platform === p && o.subfeature === s);
  const toggle = (p: string, s: string, label: string) => {
    setOrder((prev) => {
      const i = prev.findIndex((o) => o.platform === p && o.subfeature === s);
      if (i >= 0) return prev.filter((_, j) => j !== i);
      if (prev.length >= 3) return prev;
      return [...prev, { platform: p, subfeature: s, label }];
    });
  };

  return (
    <>
      <div className="tlq-kicker">The Pull</div>
      <h2 className="tlq-q">{QUIZ_CONTENT.pull.subfeatureQuestion}</h2>
      <p className="tlq-hint">{QUIZ_CONTENT.pull.subfeatureHint} · up to 3</p>
      {platforms.map((p) => (
        <div key={p.id} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--tlq-muted)", margin: "10px 0 6px", fontWeight: 600 }}>{p.label}</div>
          <div className="tlq-options">
            {p.subfeatures.map((s) => {
              const r = rankOf(p.id, s.id);
              const label = `${p.label} · ${s.label}`;
              return (
                <button key={keyOf(p.id, s.id)} className="tlq-opt" data-selected={r >= 0} onClick={() => toggle(p.id, s.id, label)}>
                  <Check />
                  <span>{s.label}</span>
                  {r >= 0 && <span className="tlq-rank">{r + 1}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="tlq-actions">
        <button
          className="tlq-btn"
          disabled={order.length === 0}
          onClick={() =>
            onSubmit(
              order.map((o, i) => ({ platform: o.platform, subfeature: o.subfeature, rank: i + 1 })),
              order.map((o) => o.label),
            )
          }
        >
          Continue
        </button>
      </div>
    </>
  );
}

function HookQuestion({
  platform, subfeature, onSelect,
}: {
  platform: string; subfeature: string;
  onSelect: (optionId: string, hook: import("../types").HookTag | null, label: string, freeText?: string) => void;
}) {
  const q = SUBFEATURE_QUESTION_MAP.get(`${platform}.${subfeature}`);
  const [freeMode, setFreeMode] = useState(false);
  const [text, setText] = useState("");
  if (!q) return null;
  return (
    <>
      <div className="tlq-kicker">The Job</div>
      <h2 className="tlq-q">{q.question}</h2>
      <div className="tlq-options">
        {q.options.map((o) => (
          <button key={o.id} className="tlq-opt" onClick={() => onSelect(o.id, o.hook, o.text)}>
            <Check round />
            <span>{o.text}</span>
          </button>
        ))}
        <button className="tlq-opt" onClick={() => onSelect("normal_use", null, "This doesn't really pull me in")}>
          <Check round /><span>This doesn&apos;t really pull me in.</span>
        </button>
        <button className="tlq-opt" data-selected={freeMode} onClick={() => setFreeMode((v) => !v)}>
          <Check round /><span>{QUIZ_CONTENT.somethingElseLabel}…</span>
        </button>
      </div>
      {freeMode && (
        <>
          <textarea className="tlq-textarea" rows={2} placeholder="In your own words…" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="tlq-actions">
            <button className="tlq-btn" disabled={!text.trim()} onClick={() => onSelect("something_else", null, "Something else", text.trim())}>Continue</button>
          </div>
        </>
      )}
    </>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  const c = QUIZ_CONTENT.intro;
  return (
    <div className="tlq-center">
      <div className="tlq-kicker">{c.kicker}</div>
      <h1 className="tlq-title">{c.title}</h1>
      <p className="tlq-lead">{c.disclaimer}</p>
      <button className="tlq-btn" onClick={onStart}>{c.cta}</button>
    </div>
  );
}

function IdentityScreen({ onSubmit }: { onSubmit: (name: string, email: string, consent: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const c = QUIZ_CONTENT.frame;
  return (
    <>
      <div className="tlq-kicker">Almost there</div>
      <h2 className="tlq-q">{c.identityQuestion}</h2>
      <p className="tlq-hint">{c.identityHint}</p>
      <input className="tlq-input" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="tlq-input" type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="tlq-actions">
        <button className="tlq-btn--ghost tlq-btn" style={{ background: "transparent" }} onClick={() => onSubmit("", "", false)}>Skip</button>
        <div className="tlq-spacer" />
        <button className="tlq-btn" onClick={() => onSubmit(name.trim(), email.trim(), Boolean(email.trim()))}>Continue</button>
      </div>
    </>
  );
}

function Disambiguation({ choices, onSelect }: { choices: DisambiguationChoice[]; onSelect: (c: DisambiguationChoice | null) => void }) {
  return (
    <>
      <div className="tlq-kicker">One more read</div>
      <h2 className="tlq-q">{QUIZ_CONTENT.disambiguation.prompt}</h2>
      <div className="tlq-options">
        {choices.map((c) => (
          <button key={c.phenotype} className="tlq-opt" onClick={() => onSelect(c)}>
            <Check round /><span>{c.recognitionLine}<span className="tlq-sub">{c.name}</span></span>
          </button>
        ))}
        <button className="tlq-opt" onClick={() => onSelect(null)}>
          <Check round /><span>{QUIZ_CONTENT.disambiguation.noneLabel}</span>
        </button>
      </div>
    </>
  );
}

function ResultScreen({
  quiz,
}: {
  quiz: ReturnType<typeof useTechLoopQuiz>;
}) {
  const { result, narrative, response, submitFit, restart } = quiz;
  const [fit, setFit] = useState<number | null>(null);
  const [missed, setMissed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!result) void quiz.finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!result) {
    return <div className="tlq-center"><p className="tlq-lead">Reading your loop…</p></div>;
  }

  const o = result.output;
  const profile = o.primary_phenotype_id === "no_dominant_loop" ? null : PHENOTYPE_PROFILE[o.primary_phenotype_id];
  const spectrum = Object.entries(result.spectrum)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxScore = spectrum[0]?.[1] ?? 1;

  return (
    <>
      <div className="tlq-progress"><div style={{ width: "100%" }} /></div>
      {o.safety_triggered && <div className="tlq-safety">{CRISIS_MESSAGE}</div>}

      <div className="tlq-kicker">Your tech loop</div>
      <div className="tlq-result-name">{o.primary_phenotype_name}</div>
      {profile && <div className="tlq-result-label">{profile.shortLabel}</div>}

      <div className="tlq-badges">
        <span className="tlq-badge">{bandLabel(o.severity_label)}</span>
        <span className="tlq-badge">confidence: {o.primary_confidence}</span>
        {o.primary_adaptive && <span className="tlq-badge">mostly adaptive</span>}
        {o.secondary_phenotype_name && <span className="tlq-badge">also: {o.secondary_phenotype_name}</span>}
      </div>

      <p className="tlq-narrative">{narrative}</p>
      <p className="tlq-formulation">{o.formulation_sentence}</p>

      {profile && (
        <>
          <div className="tlq-card"><h4>What helps</h4><p>{profile.whatHelps}</p></div>
          <div className="tlq-card"><h4>One tiny step</h4><p>{profile.firstTinyStep}</p></div>
        </>
      )}

      <div className="tlq-card">
        <h4>Your full spectrum</h4>
        <div className="tlq-spectrum">
          {spectrum.map(([id, v]) => (
            <div className="tlq-spectrum-row" key={id}>
              <span>{PHENOTYPE_PROFILE[id as keyof typeof PHENOTYPE_PROFILE]?.name ?? id}</span>
              <span className="tlq-bar"><div style={{ width: `${Math.round((v / maxScore) * 100)}%` }} /></span>
            </div>
          ))}
        </div>
      </div>

      {!done ? (
        <div className="tlq-card">
          <h4>{QUIZ_CONTENT.result.fitQuestion}</h4>
          <div className="tlq-options" style={{ marginTop: 10 }}>
            {QUIZ_CONTENT.result.fitOptions.map((f) => (
              <button key={f.value} className="tlq-opt" data-selected={fit === f.value} onClick={() => setFit(f.value)}>
                <Check round /><span>{f.label}</span>
              </button>
            ))}
          </div>
          <textarea className="tlq-textarea" rows={2} placeholder={QUIZ_CONTENT.result.missedQuestion} value={missed} onChange={(e) => setMissed(e.target.value)} />
          <div className="tlq-actions">
            <button className="tlq-btn" disabled={fit === null && !missed.trim()} onClick={() => { submitFit(fit, missed.trim()); setDone(true); }}>Submit feedback</button>
          </div>
        </div>
      ) : (
        <div className="tlq-card">
          <h4>{QUIZ_CONTENT.result.convertTitle}</h4>
          <p>{QUIZ_CONTENT.result.convertBody}</p>
          {response.freeText && <div style={{ height: 8 }} />}
        </div>
      )}

      <div className="tlq-actions">
        <button className="tlq-btn--ghost tlq-btn" style={{ background: "transparent" }} onClick={restart}>Start over</button>
      </div>
    </>
  );
}

export function TechLoopQuiz(props: TechLoopQuizProps) {
  const quiz = useTechLoopQuiz({ persistence: props.persistence, narrator: props.narrator });
  const { step, progress, response } = quiz;
  const c = QUIZ_CONTENT;

  let body: React.ReactNode = null;
  switch (step.kind) {
    case "intro":
      body = <Intro onStart={quiz.begin} />; break;
    case "reporter":
      body = <SingleChoice kicker="Quick start" question={c.frame.reporterQuestion} options={c.frame.reporterOptions.map((o) => ({ value: o.value, label: o.label }))} onSelect={(v) => quiz.submitReporter(v as "self" | "child")} />; break;
    case "identity":
      body = <IdentityScreen onSubmit={quiz.submitIdentity} />; break;
    case "lifeStage":
      body = <SingleChoice kicker="A little context" question={c.frame.lifeStageQuestion} options={c.frame.lifeStageOptions.map((o) => ({ value: o.value, label: o.label }))} onSelect={(v, l) => quiz.submitLifeStage(v as never, l)} />; break;
    case "baseline":
      body = <SingleChoice kicker="Baseline" question={c.baseline.question} options={c.baseline.options.map((o) => ({ value: String(o.value), label: o.label }))} onSelect={(v, l) => quiz.submitBaseline(Number(v), l)} />; break;
    case "platforms":
      body = <PlatformPicker onSubmit={quiz.submitPlatforms} />; break;
    case "subfeatures":
      body = <SubfeaturePicker platformIds={response.platforms} onSubmit={quiz.submitSubfeatures} />; break;
    case "hookq": {
      const sel = response.subfeatures[step.subIndex ?? 0]!;
      body = <HookQuestion platform={sel.platform} subfeature={sel.subfeature} onSelect={(id, hook, label, ft) => quiz.submitHook(step.subIndex ?? 0, id, hook, label, ft)} />; break;
    }
    case "entry":
      body = <MultiChoice kicker="The Loop" question={c.loop.entryQuestion} max={2} options={c.loop.entryOptions} onSubmit={(v, l) => quiz.submitMulti("entry", "entryPoints", v, l, "loop.entry", c.loop.entryQuestion, "loop")} />; break;
    case "pattern":
      body = <MultiChoice kicker="The Loop" question={c.loop.patternQuestion} max={2} options={c.loop.patternOptions} onSubmit={(v, l) => quiz.submitMulti("pattern", "loopShapes", v, l, "loop.pattern", c.loop.patternQuestion, "loop")} />; break;
    case "control":
      body = <SingleChoice kicker="The Loop" question={c.loop.controlQuestion} options={c.loop.controlOptions.map((o) => ({ value: String(o.value), label: o.label }))} onSelect={(v, l) => quiz.submitControl(Number(v), l)} />; break;
    case "severity":
      body = <MultiChoice kicker="The Loop" question={c.loop.severityQuestion} options={c.loop.severityOptions.map((o) => ({ value: o.value, label: o.label, exclusive: o.hint === "exclusive" }))} onSubmit={(v, l) => quiz.submitMulti("severity", "severityMarkers", v, l, "loop.severity", c.loop.severityQuestion, "loop")} />; break;
    case "aftertaste":
      body = <MultiChoice kicker="The Cost" question={c.cost.aftertasteQuestion} max={2} options={c.cost.aftertasteOptions} onSubmit={(v, l) => quiz.submitMulti("aftertaste", "aftertastes", v, l, "cost.aftertaste", c.cost.aftertasteQuestion, "cost")} />; break;
    case "cost":
      body = <MultiChoice kicker="The Cost" question={c.cost.costQuestion} allowFreeText options={c.cost.costOptions.map((o) => ({ value: o.value, label: o.label, exclusive: o.hint === "exclusive" }))} onSubmit={(v, l) => quiz.submitMulti("cost", "costDomains", v, l, "cost.cost", c.cost.costQuestion, "cost")} />; break;
    case "disambiguation":
      body = <Disambiguation choices={quiz.disambiguationChoices} onSelect={quiz.submitDisambiguation} />; break;
    case "result":
      return <Shell progress={1}><ResultScreen quiz={quiz} /></Shell>;
  }

  return <Shell progress={progress}>{body}</Shell>;
}
