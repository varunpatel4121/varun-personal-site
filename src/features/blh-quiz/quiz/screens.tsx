"use client";

import { useState } from "react";
import type { QuizQuestion } from "../engine/types";
import { quizConfig } from "./useQuiz";

/* ── Shared atoms ─────────────────────────────────────────────────────── */

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blh-accent/20 bg-blh-accent/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blh-accent">
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
      className={[
        "group w-full rounded-2xl border px-5 py-4 text-left text-[15px] leading-snug transition-all duration-150",
        ghost
          ? "border-white/8 bg-transparent text-dim hover:border-white/15 hover:bg-white/4"
          : "border-white/10 bg-white/4 text-ink hover:border-blh-accent/30 hover:bg-white/7",
        selected
          ? "!border-blh-accent !bg-blh-accent/12 !text-ink shadow-[0_0_0_1px_var(--color-blh-accent)]"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="block">{text}</span>
      {sub && (
        <span className="mt-1 block text-[12.5px] leading-relaxed text-dim">
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
      className="rounded-xl bg-gradient-to-br from-blh-accent2 to-blh-accent px-7 py-3.5 text-[15px] font-bold tracking-tight text-[#07121f] shadow-[0_4px_20px_rgba(94,234,212,0.2)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(94,234,212,0.3)] disabled:cursor-default disabled:opacity-30 disabled:shadow-none disabled:hover:translate-y-0"
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
      className="rounded-xl border border-white/10 bg-transparent px-6 py-3.5 text-[14.5px] font-medium text-dim transition-colors hover:border-white/20 hover:text-ink"
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
      {/* Top: Brand mark */}
      <div className="flex items-center gap-3 pt-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blh-accent2 to-blh-accent text-[14px] font-black text-[#08121f]">
          B
        </div>
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.15em] text-dim">
          Blue Light Health
        </span>
      </div>

      {/* Center: Content */}
      <div className="mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-center py-10">
        <div className="animate-screen-in">
          <Kicker>{intro.kicker}</Kicker>

          <h1 className="text-[clamp(32px,6vw,48px)] font-extrabold leading-[1.1] tracking-tight text-ink">
            {intro.title}
          </h1>

          <p className="mt-5 max-w-[460px] text-[16px] leading-[1.7] text-dim">
            {intro.paragraphs[0]}
          </p>
        </div>

        {/* CTA — always visible */}
        <div className="animate-screen-in mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <PrimaryButton onClick={onBegin}>{intro.cta} →</PrimaryButton>
          <span className="text-[12px] leading-relaxed text-faint">
            ~10 min · anonymous · no account
          </span>
        </div>
      </div>

      {/* Bottom: Disclaimer */}
      <p className="mx-auto w-full max-w-[540px] pb-6 text-[11px] leading-relaxed text-faint">
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
      <h2 className="text-[clamp(20px,4vw,26px)] font-bold leading-[1.3] tracking-tight text-ink">
        {q.question}
      </h2>
      {q.hint && (
        <p className="mt-2 text-[13px] leading-relaxed text-faint">{q.hint}</p>
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
        <p className="mt-3 text-[12px] text-faint">
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
            className="flex-1 rounded-2xl border border-white/10 bg-white/4 py-5 text-[18px] font-bold text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-blh-accent/30 hover:bg-white/7"
          >
            {v + 1}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex justify-between text-[12px] text-faint">
        <span>{q.scaleLabels?.[0]}</span>
        <span>{q.scaleLabels?.[1]}</span>
      </div>
      <button
        onClick={() => onAnswer(["unsure"])}
        className="mt-6 text-[13px] text-faint transition-colors hover:text-dim"
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
      <h2 className="text-[clamp(20px,4vw,26px)] font-bold leading-[1.3] tracking-tight text-ink">
        {c.title}
      </h2>
      <p className="mt-4 text-[15px] leading-[1.7] text-dim">{c.body}</p>
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
      <div className="animate-pulse-soft text-[14px] tracking-wide text-dim">
        Reading your answers…
      </div>
    </div>
  );
}
