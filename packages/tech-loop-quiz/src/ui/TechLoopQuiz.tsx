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
import type { HookTag, Platform, SubfeatureSelection } from "../types";
import type { QuizPersistence } from "../persistence";
import type { AINarrator } from "../ai";
import { useTechLoopQuiz } from "./flow";
import "./styles.css";

export interface TechLoopQuizProps {
  persistence?: QuizPersistence;
  narrator?: AINarrator;
}

const PLATFORM_ICON: Record<string, string> = {
  instagram: "📸", tiktok: "🎵", youtube: "▶️", twitter: "✖️", tv_and_streaming: "📺",
  reddit: "🟠", meta_facebook: "👥", twitch: "🎥", discord: "🎧",
  pc_gaming_console_gaming: "🕹️", snapchat: "👻", ai_chat_gpt_gemini_claude: "🤖",
  conversational_chatbots: "💬", adult_content: "🔞", betting_trading_gambling: "🎲",
};

const Check = ({ round = false }: { round?: boolean }) => (
  <span className="tlq-check" data-round={round}>
    <svg viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.2l2.3 2.3L9.5 3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const BackIcon = () => (
  <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

function Shell({
  progress, canGoBack, onBack, wide, children,
}: {
  progress: number; canGoBack?: boolean; onBack?: () => void; wide?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="tlq">
      <div className={`tlq-shell${wide ? " tlq-shell--wide" : ""}`}>
        <div className="tlq-topbar">
          {canGoBack ? (
            <button className="tlq-back" onClick={onBack} aria-label="Back"><BackIcon /> Back</button>
          ) : (
            <span style={{ width: 1 }} />
          )}
          <div className="tlq-progress"><div style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        </div>
        {children}
      </div>
    </div>
  );
}

function SingleChoice({
  kicker, question, hint, options, centered, onSelect,
}: {
  kicker?: string; question: string; hint?: string; centered?: boolean;
  options: { value: string; label: string; sub?: string }[];
  onSelect: (value: string, label: string) => void;
}) {
  const inner = (
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
  return centered ? <div className="tlq-mid tlq-mid--center">{inner}</div> : inner;
}

function MultiChoice({
  kicker, question, hint, options, max, allowFreeText, initial, onSubmit,
}: {
  kicker?: string; question: string; hint?: string;
  options: { value: string; label: string; exclusive?: boolean }[];
  max?: number; allowFreeText?: boolean; initial?: string[];
  onSubmit: (values: string[], labels: string[], freeText?: string) => void;
}) {
  const [sel, setSel] = useState<string[]>(initial ?? []);
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
      <p className="tlq-hint">{hint ? `${hint} · ` : ""}{max ? `pick up to ${max}` : "pick all that apply"}</p>
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

function PlatformPicker({ initial, onSubmit }: { initial: string[]; onSubmit: (ids: string[], labels: string[]) => void }) {
  const platforms = (PLATFORMS as Platform[]).filter((p) => !p.future);
  const [sel, setSel] = useState<string[]>(initial);
  const toggle = (id: string) => setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]));
  const labelOf = (id: string) => platforms.find((p) => p.id === id)?.label ?? id;

  return (
    <>
      <div className="tlq-kicker">The Pull</div>
      <h2 className="tlq-q">{QUIZ_CONTENT.pull.platformQuestion}</h2>
      <p className="tlq-hint">{QUIZ_CONTENT.pull.platformHint} · pick up to 3</p>
      <div className="tlq-grid-2">
        {platforms.map((p) => (
          <button key={p.id} className="tlq-opt tlq-chip" data-selected={sel.includes(p.id)} onClick={() => toggle(p.id)}>
            <span className="tlq-icon">{PLATFORM_ICON[p.id] ?? "📱"}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      <div className="tlq-actions">
        <button className="tlq-btn" disabled={sel.length === 0} onClick={() => onSubmit(sel, sel.map(labelOf))}>Continue</button>
      </div>
    </>
  );
}

function SubfeaturePicker({
  platformIds, initial, onSubmit,
}: {
  platformIds: string[]; initial: SubfeatureSelection[];
  onSubmit: (sel: SubfeatureSelection[], labels: string[]) => void;
}) {
  const platforms = (PLATFORMS as Platform[]).filter((p) => platformIds.includes(p.id));
  const labelFor = (pid: string, sid: string) => {
    const p = platforms.find((x) => x.id === pid);
    return `${p?.label ?? pid} · ${p?.subfeatures.find((s) => s.id === sid)?.label ?? sid}`;
  };
  const [order, setOrder] = useState<{ platform: string; subfeature: string; label: string }[]>(
    initial.map((s) => ({ platform: s.platform, subfeature: s.subfeature, label: labelFor(s.platform, s.subfeature) })),
  );
  const rankOf = (p: string, s: string) => order.findIndex((o) => o.platform === p && o.subfeature === s);
  const toggle = (p: string, s: string) => {
    setOrder((prev) => {
      const i = prev.findIndex((o) => o.platform === p && o.subfeature === s);
      if (i >= 0) return prev.filter((_, j) => j !== i);
      if (prev.length >= 3) return prev;
      return [...prev, { platform: p, subfeature: s, label: labelFor(p, s) }];
    });
  };

  return (
    <>
      <div className="tlq-kicker">The Pull</div>
      <h2 className="tlq-q">{QUIZ_CONTENT.pull.subfeatureQuestion}</h2>
      <p className="tlq-hint">{QUIZ_CONTENT.pull.subfeatureHint} · pick up to 3</p>
      {platforms.map((p) => (
        <div key={p.id}>
          <div className="tlq-group-label">{PLATFORM_ICON[p.id] ?? "📱"} {p.label}</div>
          <div className="tlq-grid-3">
            {p.subfeatures.map((s) => {
              const rank = rankOf(p.id, s.id);
              return (
                <button key={`${p.id}.${s.id}`} className="tlq-opt tlq-chip tlq-chip--mini" data-selected={rank >= 0} onClick={() => toggle(p.id, s.id)}>
                  <span>{s.label}</span>
                  {rank >= 0 && <span className="tlq-rank">{rank + 1}</span>}
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
          onClick={() => onSubmit(order.map((o, i) => ({ platform: o.platform, subfeature: o.subfeature, rank: i + 1 })), order.map((o) => o.label))}
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
  onSelect: (optionId: string, hook: HookTag | null, label: string, freeText?: string) => void;
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
            <Check round /><span>{o.text}</span>
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
        <button className="tlq-btn--ghost tlq-btn" onClick={() => onSubmit("", "", false)}>Skip</button>
        <div className="tlq-spacer" />
        <button className="tlq-btn" onClick={() => onSubmit(name.trim(), email.trim(), Boolean(email.trim()))}>Continue</button>
      </div>
    </>
  );
}

function ResultScreen({ quiz }: { quiz: ReturnType<typeof useTechLoopQuiz> }) {
  const { result, narrative, submitFit, restart } = quiz;
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!result) void quiz.finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!result) return <div className="tlq-center"><p className="tlq-lead">Reading your loop…</p></div>;

  const o = result.output;
  const profile = o.primary_phenotype_id === "no_dominant_loop" ? null : PHENOTYPE_PROFILE[o.primary_phenotype_id];
  const spectrum = Object.entries(result.spectrum).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxScore = spectrum[0]?.[1] ?? 1;

  return (
    <>
      {o.safety_triggered && <div className="tlq-safety">{CRISIS_MESSAGE}</div>}
      <div className="tlq-result-grid">
        <div>
          <div className="tlq-kicker">Your tech loop</div>
          <h1 className="tlq-result-name">{o.primary_phenotype_name}</h1>
          {profile && <div className="tlq-result-label">{profile.shortLabel}</div>}
          <p className="tlq-read">{narrative}</p>
          <div className="tlq-chips">
            <span className="tlq-chip-badge" data-tone="accent">{bandLabel(o.severity_label)}</span>
            {o.primary_adaptive && <span className="tlq-chip-badge">mostly adaptive</span>}
            {o.secondary_phenotype_name && <span className="tlq-chip-badge">also: {o.secondary_phenotype_name}</span>}
          </div>
          <p className="tlq-formulation">{o.formulation_sentence}</p>
        </div>

        <div>
          {profile && (
            <>
              <div className="tlq-card"><h4>What helps</h4><p>{profile.whatHelps}</p></div>
              <div className="tlq-card"><h4>One tiny step</h4><p>{profile.firstTinyStep}</p></div>
            </>
          )}
          <div className="tlq-card tlq-cta">
            <h4>{QUIZ_CONTENT.result.convertTitle}</h4>
            <p>{QUIZ_CONTENT.result.convertBody}</p>
          </div>
          {spectrum.length > 1 && (
            <div className="tlq-card">
              <h4>Where else you showed up</h4>
              <div className="tlq-spectrum">
                {spectrum.map(([id, v]) => (
                  <div className="tlq-spectrum-row" key={id}>
                    <span>{PHENOTYPE_PROFILE[id as keyof typeof PHENOTYPE_PROFILE]?.name ?? id}</span>
                    <span className="tlq-bar"><div style={{ width: `${Math.round((v / maxScore) * 100)}%` }} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tlq-card" style={{ marginTop: 8 }}>
        {!done ? (
          <>
            <h4>{QUIZ_CONTENT.result.fitQuestion}</h4>
            <div className="tlq-fit-opts" style={{ marginTop: 10 }}>
              {QUIZ_CONTENT.result.fitOptions.map((f) => (
                <button key={f.value} className="tlq-fit-opt" onClick={() => { submitFit(f.value, ""); setDone(true); }}>{f.label}</button>
              ))}
            </div>
          </>
        ) : (
          <p className="tlq-fit-thanks">Thank you — that helps us read this better for people like you.</p>
        )}
      </div>

      <div className="tlq-actions" style={{ justifyContent: "center" }}>
        <button className="tlq-btn--ghost tlq-btn" onClick={restart}>Start over</button>
      </div>
    </>
  );
}

export function TechLoopQuiz(props: TechLoopQuizProps) {
  const quiz = useTechLoopQuiz({ persistence: props.persistence, narrator: props.narrator });
  const { step, progress, response, canGoBack, goBack } = quiz;
  const c = QUIZ_CONTENT;
  const stepKey = `${step.kind}-${step.subIndex ?? 0}-${quiz.pos}`;

  let body: React.ReactNode = null;
  switch (step.kind) {
    case "intro":
      body = <Intro onStart={quiz.begin} />; break;
    case "reporter":
      body = <SingleChoice centered kicker="Quick start" question={c.frame.reporterQuestion} options={c.frame.reporterOptions.map((o) => ({ value: o.value, label: o.label }))} onSelect={(v) => quiz.submitReporter(v as "self" | "child")} />; break;
    case "identity":
      body = <IdentityScreen onSubmit={quiz.submitIdentity} />; break;
    case "lifeStage":
      body = <SingleChoice kicker="A little context" question={c.frame.lifeStageQuestion} options={c.frame.lifeStageOptions.map((o) => ({ value: o.value, label: o.label }))} onSelect={(v, l) => quiz.submitLifeStage(v as never, l)} />; break;
    case "baseline":
      body = <SingleChoice kicker="Baseline" question={c.baseline.question} options={c.baseline.options.map((o) => ({ value: String(o.value), label: o.label }))} onSelect={(v, l) => quiz.submitBaseline(Number(v), l)} />; break;
    case "platforms":
      body = <PlatformPicker initial={response.platforms} onSubmit={quiz.submitPlatforms} />; break;
    case "subfeatures":
      body = <SubfeaturePicker platformIds={response.platforms} initial={response.subfeatures} onSubmit={quiz.submitSubfeatures} />; break;
    case "hookq": {
      const sel = response.subfeatures[step.subIndex ?? 0]!;
      body = <HookQuestion platform={sel.platform} subfeature={sel.subfeature} onSelect={(id, hook, label, ft) => quiz.submitHook(step.subIndex ?? 0, id, hook, label, ft)} />; break;
    }
    case "entry":
      body = <MultiChoice kicker="The Loop" question={c.loop.entryQuestion} max={2} initial={response.entryPoints} options={c.loop.entryOptions} onSubmit={(v, l) => quiz.submitMulti("entry", "entryPoints", v, l, "loop.entry", c.loop.entryQuestion, "loop")} />; break;
    case "pattern":
      body = <MultiChoice kicker="The Loop" question={c.loop.patternQuestion} max={2} initial={response.loopShapes} options={c.loop.patternOptions} onSubmit={(v, l) => quiz.submitMulti("pattern", "loopShapes", v, l, "loop.pattern", c.loop.patternQuestion, "loop")} />; break;
    case "control":
      body = <SingleChoice kicker="The Loop" question={c.loop.controlQuestion} options={c.loop.controlOptions.map((o) => ({ value: String(o.value), label: o.label }))} onSelect={(v, l) => quiz.submitControl(Number(v), l)} />; break;
    case "severity":
      body = <MultiChoice kicker="The Loop" question={c.loop.severityQuestion} initial={response.severityMarkers} options={c.loop.severityOptions.map((o) => ({ value: o.value, label: o.label, exclusive: o.hint === "exclusive" }))} onSubmit={(v, l) => quiz.submitMulti("severity", "severityMarkers", v, l, "loop.severity", c.loop.severityQuestion, "loop")} />; break;
    case "aftertaste":
      body = <MultiChoice kicker="The Cost" question={c.cost.aftertasteQuestion} max={2} initial={response.aftertastes} options={c.cost.aftertasteOptions} onSubmit={(v, l) => quiz.submitMulti("aftertaste", "aftertastes", v, l, "cost.aftertaste", c.cost.aftertasteQuestion, "cost")} />; break;
    case "cost":
      body = <MultiChoice kicker="The Cost" question={c.cost.costQuestion} allowFreeText initial={response.costDomains} options={c.cost.costOptions.map((o) => ({ value: o.value, label: o.label, exclusive: o.hint === "exclusive" }))} onSubmit={(v, l) => quiz.submitMulti("cost", "costDomains", v, l, "cost.cost", c.cost.costQuestion, "cost")} />; break;
    case "result":
      return <Shell progress={1} canGoBack={canGoBack} onBack={goBack} wide><div className="tlq-step" key={stepKey}><ResultScreen quiz={quiz} /></div></Shell>;
  }

  return <Shell progress={progress} canGoBack={canGoBack} onBack={goBack}><div className="tlq-step" key={stepKey}>{body}</div></Shell>;
}
