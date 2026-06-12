import type { Metadata } from "next";
import "@/features/blh-quiz/quiz-theme.css";

export const metadata: Metadata = {
  title: "What's Your Tech Loop? — Blue Light Health",
  description:
    "A 10-minute reflection on how you use your devices — and what that use is doing for you. Anonymous, no account required.",
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="blh-quiz-shell">{children}</div>;
}
