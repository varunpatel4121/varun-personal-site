"use client";

import { useState } from "react";
import type { QuizQuestion } from "../engine/types";
import { quizConfig } from "./useQuiz";

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-blh-accent">
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
        "w-full rounded-2xl border px-4.5 py-3.5 text-left text-[15.5px] leading-relaxed transition-all duration-150",
        "hover:-translate-y-px hover:border-line2 hover:bg-card2",
        ghost
          ? "border-dashed border-line bg-transparent text-dim"
          : "border-line bg-card text-ink",
        selected
          ? "border-blh-accent bg-blh-accent/10 shadow-[0_0_0_1px_var(--color-blh-accent)]"
          : "",
      ].join(" ")}
    >
      {text}
      {sub && <span className="mt-0.5 block text-[13px] text-dim">{sub}</span>}
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
      className="rounded-xl bg-gradient-to-br from-blh-accent2 to-blh-accent px-6 py-3.5 text-[15.5px] font-bold text-[#07121f] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(94,234,212,0.25)] disabled:cursor-default disabled:opacity-35 disabled:shadow-none disabled:hover:translate-y-0"
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
      className="rounded-xl border border-line bg-transparent px-6 py-3.5 text-[15px] font-semibold text-dim transition-colors hover:text-ink"
    >
      {children}
    </button>
  );
}

export function IntroScreen({ onBegin }: { onBegin: () => void }) {
  const intro = quizConfig.intro;
  return (
    <div className="animate-screen-in">
      <Kicker>{intro.kicker}</Kicker>
      <h1 className="text-[clamp(26px,5vw,38px)] font-extrabold leading-[1.15] tracking-tight">
        {intro.title}
      </h1>
      {intro.paragraphs.map((p, i) => (
        <p key={i} className="mt-3.5 text-[15.5px] leading-[1.65] text-dim">
          {p}
        </p>
      ))}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <PrimaryButton onClick={onBegin}>{intro.cta}</PrimaryButton>
        <span className="text-[13px] text-faint">{intro.privacy}</span>
      </div>
    </div>
  );
}

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

function Header({ q }: { q: QuizQuestion }) {
  return (
    <>
      {q.kicker && <Kicker>{q.kicker}</Kicker>}
      <h2 className="text-[clamp(20px,4vw,26px)] font-bold leading-[1.3] tracking-tight">
        {q.question}
      </h2>
      {q.hint && <div className="mt-2.5 text-[13px] text-faint">{q.hint}</div>}
    </>
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
    <div className="animate-screen-in" key={q.id}>
      <Header q={q} />
      <div className="mt-5 flex flex-col gap-2.5">
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
    <div className="animate-screen-in" key={q.id}>
      <Header q={q} />
      <div className="mt-5 flex flex-col gap-2.5">
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
      <div className="mt-2.5 text-[12.5px] text-faint">
        {q.max ? `${selected.size} of ${q.max} selected` : ""}
      </div>
      <div className="mt-5 flex gap-2.5">
        <PrimaryButton
          disabled={selected.size === 0}
          onClick={() => onAnswer([...selected])}
        >
          Continue
        </PrimaryButton>
        {q.skippable && (
          <GhostButton onClick={() => onAnswer([])}>Skip this one</GhostButton>
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
    <div className="animate-screen-in" key={q.id}>
      <Header q={q} />
      <div className="mt-6 flex gap-2">
        {[0, 1, 2, 3, 4].map((v) => (
          <button
            key={v}
            onClick={() => onAnswer([], v)}
            className="flex-1 rounded-2xl border border-line bg-card px-1.5 py-4 text-[17px] font-bold transition-all duration-150 hover:-translate-y-px hover:border-line2 hover:bg-card2"
          >
            {v + 1}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12.5px] text-faint">
        <span>{q.scaleLabels?.[0]}</span>
        <span>{q.scaleLabels?.[1]}</span>
      </div>
      <div className="mt-5">
        <button
          onClick={() => onAnswer(["unsure"])}
          className="text-[13.5px] text-faint transition-colors hover:text-dim"
        >
          I'm not sure
        </button>
      </div>
    </div>
  );
}

export function ConsentScreen({
  onDecide,
}: {
  onDecide: (agreed: boolean) => void;
}) {
  const c = quizConfig.adultConsent;
  return (
    <div className="animate-screen-in">
      <Kicker>{c.kicker}</Kicker>
      <h2 className="text-[clamp(20px,4vw,26px)] font-bold leading-[1.3] tracking-tight">
        {c.title}
      </h2>
      <p className="mt-3.5 text-[15.5px] leading-[1.65] text-dim">{c.body}</p>
      <div className="mt-6 flex flex-wrap gap-2.5">
        <PrimaryButton onClick={() => onDecide(true)}>
          {c.continueLabel}
        </PrimaryButton>
        <GhostButton onClick={() => onDecide(false)}>{c.skipLabel}</GhostButton>
      </div>
    </div>
  );
}

export function FollowupsWait() {
  return (
    <div className="animate-screen-in pt-10 text-center">
      <div className="animate-pulse-soft text-[15px] text-dim">
        Reading your answers back…
      </div>
    </div>
  );
}
