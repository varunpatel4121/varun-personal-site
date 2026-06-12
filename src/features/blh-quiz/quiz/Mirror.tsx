"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerRecord, MirrorResponse } from "../engine/types";
import { computeState } from "../engine/scoring";
import { fallbackMirrorText, hasMirrorSignal } from "../engine/narrative";
import { streamProse } from "../llm/client";
import { buildLlmContext, scoring } from "./useQuiz";
import { Kicker, OptionButton } from "./screens";

export function MirrorScreen({
  answers,
  onRespond,
}: {
  answers: AnswerRecord[];
  onRespond: (response: MirrorResponse, usedLlm: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [settled, setSettled] = useState(false);
  const usedLlm = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const state = computeState(answers, scoring);
    const fallback = hasMirrorSignal(state)
      ? fallbackMirrorText(state) + " Does that track?"
      : "So far your answers don't point at one strong pattern — your use might genuinely be lighter than most. The last few questions will tell us. Does that track?";

    streamProse("/api/quiz/llm/mirror", buildLlmContext(answers), (t) =>
      setText(t),
    )
      .then(() => {
        usedLlm.current = true;
        setSettled(true);
      })
      .catch(() => {
        usedLlm.current = false;
        setText(fallback);
        setSettled(true);
      });
  }, [answers]);

  return (
    <div className="animate-screen-in">
      <Kicker>Checking my read</Kicker>
      <h2 className="text-[clamp(20px,4vw,26px)] font-bold leading-[1.3] tracking-tight text-ink">
        Before we finish — let me say back what I think I&apos;m seeing.
      </h2>

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-blh-accent/20 bg-blh-accent/6 px-5 py-5 text-[15.5px] leading-[1.7] text-ink">
        <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-gradient-to-b from-blh-accent2 to-blh-accent" />
        {text || (
          <span className="animate-pulse-soft text-dim">Reading…</span>
        )}
      </div>

      <div
        className={`mt-6 flex flex-col gap-2.5 transition-opacity duration-400 ${
          settled ? "opacity-100" : "pointer-events-none opacity-20"
        }`}
      >
        <OptionButton
          text="Yeah. That's exactly it"
          onClick={() => onRespond("exactly", usedLlm.current)}
        />
        <OptionButton
          text="Partly — close but not quite"
          onClick={() => onRespond("partly", usedLlm.current)}
        />
        <OptionButton
          text="No, that's not me"
          ghost
          onClick={() => onRespond("not_me", usedLlm.current)}
        />
      </div>
    </div>
  );
}
