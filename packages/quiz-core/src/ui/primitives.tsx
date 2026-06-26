"use client";

/**
 * Themeable, presentational quiz primitives shared by every BLH quiz. Markup
 * is fixed; appearance comes entirely from --q-* CSS variables, so a quiz sets
 * `theme` on <QuizFrame> and ships a small theme.css overriding the variables.
 */

import { useMemo, useState } from "react";
import "./quiz.css";

export interface Option {
  value: string;
  label: string;
  sub?: string;
  exclusive?: boolean;
}

export function Check({ round = false }: { round?: boolean }) {
  return (
    <span className="q-check" data-round={round}>
      <svg viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.2l2.3 2.3L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QuizFrame({
  theme,
  progress,
  canGoBack,
  onBack,
  wide,
  children,
}: {
  theme: string;
  progress: number;
  canGoBack?: boolean;
  onBack?: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="q" data-theme={theme}>
      <div className={wide ? "q-shell q-shell--wide" : "q-shell"}>
        <div className="q-topbar">
          {canGoBack ? (
            <button className="q-back" onClick={onBack} aria-label="Back"><BackIcon /> Back</button>
          ) : (
            <span style={{ width: 1 }} />
          )}
          <div className="q-progress">
            <div style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "solid",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "ghost";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={variant === "ghost" ? "q-btn q-btn--ghost" : "q-btn"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/** Single-select; auto-advances on choice. */
export function SingleChoice({
  kicker,
  question,
  hint,
  options,
  onSelect,
}: {
  kicker?: string;
  question: string;
  hint?: string;
  options: Option[];
  onSelect: (value: string, label: string) => void;
}) {
  return (
    <>
      {kicker && <div className="q-kicker">{kicker}</div>}
      <h2 className="q-q">{question}</h2>
      {hint && <p className="q-hint">{hint}</p>}
      <div className="q-options">
        {options.map((o) => (
          <button key={o.value} className="q-opt" onClick={() => onSelect(o.value, o.label)}>
            <Check round />
            <span>
              {o.label}
              {o.sub && <span className="q-sub">{o.sub}</span>}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/** Multi-select with optional max, exclusive options, free text, and Continue. */
export function MultiChoice({
  kicker,
  question,
  hint,
  options,
  max,
  allowFreeText,
  freeTextPlaceholder,
  continueLabel = "Continue",
  onSubmit,
}: {
  kicker?: string;
  question: string;
  hint?: string;
  options: Option[];
  max?: number;
  allowFreeText?: boolean;
  freeTextPlaceholder?: string;
  continueLabel?: string;
  onSubmit: (values: string[], labels: string[], freeText?: string) => void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const [text, setText] = useState("");
  const exclusive = useMemo(
    () => new Set(options.filter((o) => o.exclusive).map((o) => o.value)),
    [options],
  );

  const toggle = (v: string) => {
    setSel((prev) => {
      if (exclusive.has(v)) return prev.includes(v) ? [] : [v];
      const cleaned = prev.filter((x) => !exclusive.has(x));
      if (cleaned.includes(v)) return cleaned.filter((x) => x !== v);
      if (max && cleaned.length >= max) return cleaned;
      return [...cleaned, v];
    });
  };
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <>
      {kicker && <div className="q-kicker">{kicker}</div>}
      <h2 className="q-q">{question}</h2>
      {(hint || max) && (
        <p className="q-hint">
          {hint}
          {max ? `${hint ? " · " : ""}up to ${max}` : ""}
        </p>
      )}
      <div className="q-options">
        {options.map((o) => (
          <button key={o.value} className="q-opt" data-selected={sel.includes(o.value)} onClick={() => toggle(o.value)}>
            <Check />
            <span>{o.label}</span>
          </button>
        ))}
      </div>
      {allowFreeText && (
        <textarea
          className="q-textarea"
          rows={2}
          placeholder={freeTextPlaceholder ?? "Something else…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <div className="q-actions">
        <Button disabled={sel.length === 0 && !text.trim()} onClick={() => onSubmit(sel, sel.map(labelOf), text.trim() || undefined)}>
          {continueLabel}
        </Button>
      </div>
    </>
  );
}
