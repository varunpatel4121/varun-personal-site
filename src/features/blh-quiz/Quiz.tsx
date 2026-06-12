"use client";

import { useEffect } from "react";
import { useQuiz } from "./quiz/useQuiz";
import {
  ConsentScreen,
  FollowupsWait,
  IntroScreen,
  QuestionScreen,
} from "./quiz/screens";
import { MirrorScreen } from "./quiz/Mirror";
import { ResultScreen } from "./quiz/Result";

export default function Quiz() {
  const quiz = useQuiz();
  const { step } = quiz;

  useEffect(() => {
    if (step.kind === "followups-wait") {
      void quiz.resolveFollowups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const isIntro = step.kind === "intro";

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Progress bar */}
      {!isIntro && (
        <div className="fixed left-0 top-0 z-20 h-[2px] w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-blh-accent to-blh-accent2 transition-[width] duration-700 ease-out"
            style={{ width: `${quiz.progress * 100}%` }}
          />
        </div>
      )}

      {/* Header — only on question/result screens */}
      {!isIntro && (
        <header className="sticky top-0 z-10 flex w-full items-center gap-3 px-6 py-4 backdrop-blur-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blh-accent2 to-blh-accent text-[13px] font-black text-[#08121f]">
            B
          </div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-dim">
            Blue Light Health
          </span>
        </header>
      )}

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        {step.kind === "intro" && <IntroScreen onBegin={quiz.begin} />}

        {step.kind === "question" && (
          <div className="mx-auto w-full max-w-[600px] flex-1 px-5 py-8 sm:px-8">
            <QuestionScreen
              key={step.q.id}
              q={step.q}
              onAnswer={(ids, scale) => quiz.answerQuestion(step.q, ids, scale)}
            />
          </div>
        )}

        {step.kind === "consent" && (
          <div className="mx-auto w-full max-w-[600px] flex-1 px-5 py-8 sm:px-8">
            <ConsentScreen onDecide={quiz.consent} />
          </div>
        )}

        {step.kind === "followups-wait" && <FollowupsWait />}

        {step.kind === "mirror" && (
          <div className="mx-auto w-full max-w-[600px] flex-1 px-5 py-8 sm:px-8">
            <MirrorScreen answers={quiz.answers} onRespond={quiz.answerMirror} />
          </div>
        )}

        {step.kind === "result" && quiz.result && (
          <div className="mx-auto w-full max-w-[600px] flex-1 px-5 py-8 sm:px-8">
            <ResultScreen
              answers={quiz.answers}
              state={quiz.result.state}
              classification={quiz.result.classification}
              severity={quiz.result.severity}
              safety={quiz.result.safety}
              llmUsed={quiz.llmUsed}
              sessionId={quiz.sessionId}
              startedAt={quiz.startedAt}
              onNarrativeUsed={quiz.markNarrativeUsed}
              onRestart={quiz.restart}
            />
          </div>
        )}
      </main>

      {/* Footer — only on question/result screens */}
      {!isIntro && (
        <footer className="mx-auto w-full max-w-[600px] px-5 pb-8 pt-4 text-[11px] leading-[1.6] text-faint sm:px-8">
          A reflection tool, not a diagnosis or medical advice. Anonymous — no
          account, no name. If anything brings up urgent safety concerns, call
          or text 988 (U.S.).
        </footer>
      )}
    </div>
  );
}
