"use client";

import { useState } from "react";
import type { QuizQuestion } from "../engine/types";
import { quizConfig } from "./useQuiz";

const TEAL = "#5eead4";
const SKY = "#7dd3fc";
const TEAL_BG = "rgba(94,234,212,0.12)";
const TEAL_BORDER = "rgba(94,234,212,0.35)";
const TEAL_GLOW = "0 0 0 1.5px #5eead4";

/* ── Shared atoms ─────────────────────────────────────────────────────── */

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ color: TEAL, borderColor: "rgba(94,234,212,0.25)", backgroundColor: "rgba(94,234,212,0.08)" }}
      className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"
    >
      {children}
    </div>
  );
}

export function OptionButton({
  text,
  sub,
  ghost,
  selected,
  onClick,
}: {
  text: string;
  sub?: string;
  ghost?: boolean;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={
        selected
          ? { borderColor: TEAL, backgroundColor: TEAL_BG, boxShadow: TEAL_GLOW }
          : undefined
      }
      className={[
        "w-full rounded-2xl border px-5 py-4 text-left text-[15px] leading-snug transition-all duration-150",
        ghost
          ? "border-white/10 bg-transparent text-white/50 hover:border-white/20 hover:bg-white/4"
          : "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.07]",
      ].join(" ")}
    >
      <span className="block">{text}</span>
      {sub && (
        <span className="mt-1 block text-[12.5px] leading-relaxed text-white/40">
          {sub}
        </span>
      )}
    </button>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: `linear-gradient(135deg, ${SKY} 0%, ${TEAL} 100%)` }}
      className="rounded-xl px-7 py-3.5 text-[15px] font-bold tracking-tight text-[#07121f] shadow-[0_4px_20px_rgba(94,234,212,0.25)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(94,234,212,0.38)] disabled:cursor-default disabled:opacity-30 disabled:shadow-none disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-transparent px-6 py-3.5 text-[14.5px] font-medium text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
    >
      {children}
    </button>
  );
}

/* ── Intro ────────────────────────────────────────────────────────────── */

export function IntroScreen({ onBegin }: { onBegin: () => void }) {
  const intro = quizConfig.intro;
  return (
    <div className="flex min-h-dvh flex-col px-5 sm:px-8">
      {/* Brand */}
      <div className="flex items-center gap-3 pt-6">
        <div
          style={{ background: `linear-gradient(135deg, ${SKY} 0%, ${TEAL} 100%)` }}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-[13px] font-black text-[#08121f]"
        >
          B
        </div>
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.15em] text-white/40">
          Blue Light Health
        </span>
      </div>

      {/* Content — vertically centered */}
      <div className="mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-center py-10">
        <div className="animate-screen-in">
          <Kicker>{intro.kicker}</Kicker>

          <h1 className="text-[clamp(32px,6vw,48px)] font-extrabold leading-[1.1] tracking-tight text-white">
            {intro.title}
          </h1>

          <p className="mt-5 max-w-[460px] text-[16px] leading-[1.7] text-white/55">
            {intro.paragraphs[0]}
          </p>
        </div>

        {/* CTA — always visible */}
        <div className="animate-screen-in mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <PrimaryButton onClick={onBegin}>{intro.cta} →</PrimaryButton>
          <span className="text-[12px] text-white/35">
            ~10 min · anonymous · no account
          </span>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <p className="mx-auto w-full max-w-[540px] pb-6 text-[11px] leading-relaxed text-white/25">
        Not a diagnosis or medical advice. If anything brings up urgent safety
        concerns, call or text 988 (U.S.).
      </p>
    </div>
  );
}

/* ── Question screens ─────────────────────────────────────────────────── */

export function QuestionScreen({
  q,
  onAnswer,
}: {
  q: QuizQuestion;
  onAnswer: (optionIds: string[], scale?: number) => void;
}) {
  if (q.type === "single") return <SingleQuestion q={q} onAnswer={onAnswer} />;
  if (q.type === "multi") return <MultiQuestion q={q} onAnswer={onAnswer} />;
  return <ScaleQuestion q={q} onAnswer={onAnswer} />;
}

function QuestionHeader({ q }: { q: QuizQuestion }) {
  return (
    <div className="mb-6">
      {q.kicker && <Kicker>{q.kicker}</Kicker>}
      <h2 className="text-[clamp(20px,4vw,26px)] font-bold leading-[1.3] tracking-tight text-white">
        {q.question}
      </h2>
      {q.hint && (
        <p className="mt-2 text-[13px] leading-relaxed text-white/35">{q.hint}</p>
      )}
    </div>
  );
}

function SingleQuestion({
  q,
  onAnswer,
}: {
  q: QuizQuestion;
  onAnswer: (optionIds: string[]) => void;
}) {
  return (
    <div className="animate-screen-in">
      <QuestionHeader q={q} />
      <div className="flex flex-col gap-2.5">
        {q.options.map((o) => (
          <OptionButton
            key={o.id}
            text={o.text}
            sub={o.sub}
            ghost={Boolean(o.unsure)}
            onClick={() => onAnswer([o.id])}
          />
        ))}
      </div>
    </div>
  );
}

function MultiQuestion({
  q,
  onAnswer,
}: {
  q: QuizQuestion;
  onAnswer: (optionIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const option = q.options.find((o) => o.id === id)!;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (option.exclusive) return new Set([id]);
      next.delete(
        [...next].find(
          (sid) => q.options.find((o) => o.id === sid)?.exclusive,
        ) ?? "",
      );
      if (q.max && next.size >= q.max) return next;
      next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-screen-in">
      <QuestionHeader q={q} />
      <div className="flex flex-col gap-2.5">
        {q.options.map((o) => (
          <OptionButton
            key={o.id}
            text={o.text}
            sub={o.sub}
            ghost={Boolean(o.unsure)}
            selected={selected.has(o.id)}
            onClick={() => toggle(o.id)}
          />
        ))}
      </div>
      {q.max && (
        <p className="mt-3 text-[12px] text-white/35">
          {selected.size} of {q.max} selected
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <PrimaryButton
          disabled={selected.size === 0}
          onClick={() => onAnswer([...selected])}
        >
          Continue
        </PrimaryButton>
        {q.skippable && (
          <GhostButton onClick={() => onAnswer([])}>Skip</GhostButton>
        )}
      </div>
    </div>
  );
}

function ScaleQuestion({
  q,
  onAnswer,
}: {
  q: QuizQuestion;
  onAnswer: (optionIds: string[], scale?: number) => void;
}) {
  return (
    <div className="animate-screen-in">
      <QuestionHeader q={q} />
      <div className="mt-2 flex gap-2.5">
        {[0, 1, 2, 3, 4].map((v) => (
          <button
            key={v}
            onClick={() => onAnswer([], v)}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-5 text-[18px] font-bold text-white transition-all duration-150 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
          >
            {v + 1}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex justify-between text-[12px] text-white/35">
        <span>{q.scaleLabels?.[0]}</span>
        <span>{q.scaleLabels?.[1]}</span>
      </div>
      <button
        onClick={() => onAnswer(["unsure"])}
        className="mt-6 text-[13px] text-white/35 transition-colors hover:text-white/60"
      >
        Not sure
      </button>
    </div>
  );
}

/* ── Adult-content consent gate ───────────────────────────────────────── */

export function ConsentScreen({
  onDecide,
}: {
  onDecide: (agreed: boolean) => void;
}) {
  const c = quizConfig.adultConsent;
  return (
    <div className="animate-screen-in">
      <Kicker>{c.kicker}</Kicker>
      <h2 className="text-[clamp(20px,4vw,26px)] font-bold leading-[1.3] tracking-tight text-white">
        {c.title}
      </h2>
      <p className="mt-4 text-[15px] leading-[1.7] text-white/55">{c.body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <PrimaryButton onClick={() => onDecide(true)}>
          {c.continueLabel}
        </PrimaryButton>
        <GhostButton onClick={() => onDecide(false)}>{c.skipLabel}</GhostButton>
      </div>
    </div>
  );
}

/* ── Follow-ups wait state ────────────────────────────────────────────── */

export function FollowupsWait() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-pulse-soft text-[14px] tracking-wide text-white/40">
        Reading your answers…
      </div>
    </div>
  );
}

/* ── Re-export constants for sibling components ───────────────────────── */
export { TEAL, SKY, TEAL_BG, TEAL_BORDER };
