import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Varun Patel — engineer, builder, and explorer of intelligent systems.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <PageHeader
        title="About"
        description="A brief introduction to who I am and what I care about."
      />

      <div className="animate-in-delayed prose-custom space-y-6 pb-20 text-sm leading-relaxed text-muted">
        <p>
          I&apos;m Varun — an engineer who builds products at the intersection
          of software, design, and intelligence. I care deeply about craft: the
          kind of work where every detail is intentional and the result feels
          inevitable.
        </p>

        <p>
          My background spans full-stack engineering, systems design, and applied
          AI. I&apos;m drawn to problems that require both technical depth and
          clear product thinking — the kind of work where you have to hold the
          architecture, the user experience, and the business context in your
          head at the same time.
        </p>

        <p>
          Right now, I&apos;m especially focused on AI-native products:
          retrieval-augmented generation, agentic systems, and the tools that
          make complex information genuinely accessible. I believe we&apos;re in
          the early innings of a fundamental shift in how software works, and I
          want to build at that frontier.
        </p>

        <p>
          I approach work with a bias toward simplicity, strong opinions loosely
          held, and a deep respect for the people who will use what I build. Good
          software should feel calm, capable, and trustworthy.
        </p>

        <h2 className="!mt-12 !text-base font-medium text-foreground">
          What I value
        </h2>

        <ul className="list-inside list-disc space-y-2">
          <li>
            <span className="text-foreground">Clarity over cleverness.</span>{" "}
            The best code reads like well-edited prose.
          </li>
          <li>
            <span className="text-foreground">Ownership over tasks.</span> I
            think about the outcome, not just the ticket.
          </li>
          <li>
            <span className="text-foreground">Curiosity as a practice.</span>{" "}
            The best engineers never stop being students.
          </li>
          <li>
            <span className="text-foreground">Taste as a skill.</span> It can be
            developed, and it matters more than most people think.
          </li>
        </ul>

        <div className="!mt-12 rounded-lg border border-border-subtle p-5">
          <p className="text-sm text-foreground">
            Want to connect?
          </p>
          <p className="mt-2 text-sm text-muted">
            I&apos;m always open to conversations about interesting problems,
            potential collaborations, or just exchanging ideas.
          </p>
          <Link
            href="mailto:hello@varunpatel.me"
            className="mt-4 inline-block text-sm text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            hello@varunpatel.me
          </Link>
        </div>
      </div>
    </div>
  );
}
