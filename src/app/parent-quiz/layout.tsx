import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's really going on with screens at home? — Blue Light Health",
  description:
    "A 3-minute mirror for the screen pattern showing up in your family — the loop, what it may be costing, and what helps. Not a diagnosis.",
};

// The parent-quiz package renders its own full-screen, themed UI.
export default function ParentQuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
