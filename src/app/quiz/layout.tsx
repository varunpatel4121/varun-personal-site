import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's Your Tech Loop? — Blue Light Health",
  description:
    "A 5-minute reflection on your relationship with technology — the pull, the job it does for you, the loop, and the cost. Not a diagnosis. Anonymous by default.",
};

// The quiz package renders its own full-screen, scoped UI (it ships its own
// styles), so this layout is intentionally a passthrough.
export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
