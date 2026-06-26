"use client";

import { ParentQuiz } from "@blh/parent-quiz/ui";
import { httpPersistence, makeNarrator } from "@blh/parent-quiz";

// Adapters are injected here (the only place the app touches quiz infra).
const persistence = httpPersistence("/api/quiz/parent-sessions");

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

// Configurable CARES booking link (swap via NEXT_PUBLIC_CARES_BOOKING_URL).
const bookingUrl = process.env.NEXT_PUBLIC_CARES_BOOKING_URL;

export default function ParentQuizClient() {
  return <ParentQuiz persistence={persistence} narrator={narrator} bookingUrl={bookingUrl} />;
}
