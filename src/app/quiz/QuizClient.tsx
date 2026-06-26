"use client";

import { TechLoopQuiz } from "@blh/tech-loop-quiz/ui";
import { httpPersistence, makeNarrator } from "@blh/tech-loop-quiz";

// Persistence + AI are injected adapters that point at this app's API routes.
// The package itself has no Supabase/Anthropic coupling — this is the only
// place the personal site touches the quiz infra.
const persistence = httpPersistence("/api/quiz/sessions");

const narrator = makeNarrator(async ({ system, user }) => {
  const res = await fetch("/api/quiz/narrative", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  if (!res.ok) throw new Error("narrative_unavailable");
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
});

export default function QuizClient() {
  return <TechLoopQuiz persistence={persistence} narrator={narrator} />;
}
