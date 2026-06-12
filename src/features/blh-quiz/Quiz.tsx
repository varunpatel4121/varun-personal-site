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

  return (
    <div className="flex min-h-screen flex-col items-center">
      {/* progress bar */}
      <div
        className="fixed left-0 top-0 z-10 h-[3px] rounded-r-sm bg-gradient-to-r from-blh-accent to-blh-accent2 transition-[width] duration-500"
        style={{ width: `${quiz.progress * 100}%` }}
      />

      <header className="flex w-full max-w-[680px] items-center gap-2.5 px-6 pt-6">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-gradient-to-br from-blh-accent2 to-blh-accent text-[15px] font-extrabold text-[#08121f]">
          B
        </div>
        <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-dim">
          Blue Light Health
        </div>
      </header>

      <main className="w-full max-w-[680px] flex-1 px-6 pb-16 pt-5">
        {step.kind === "intro" && <IntroScreen onBegin={quiz.begin} />}

        {step.kind === "question" && (
          <QuestionScreen
            key={step.q.id}
            q={step.q}
            onAnswer={(ids, scale) => quiz.answerQuestion(step.q, ids, scale)}
          />
        )}

        {step.kind === "consent" && <ConsentScreen onDecide={quiz.consent} />}

        {step.kind === "followups-wait" && <FollowupsWait />}

        {step.kind === "mirror" && (
          <MirrorScreen answers={quiz.answers} onRespond={quiz.answerMirror} />
        )}

        {step.kind === "result" && quiz.result && (
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
        )}
      </main>

      <footer className="w-full max-w-[680px] px-6 pb-8 text-[11.5px] leading-[1.6] text-faint">
        This is a reflection tool, not a diagnosis, medical advice, or therapy.
        Your answers are anonymous — no account, no name, nothing that
        identifies you. If anything here brings up urgent concerns about your
        safety, call or text 988 (U.S.) or use local emergency resources.
      </footer>
    </div>
  );
}
