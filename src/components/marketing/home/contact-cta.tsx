import Link from "next/link";
import { AnimateIn } from "./animate-in";

export function ContactCTA() {
  return (
    <section className="border-t border-border-subtle py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <AnimateIn>
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Let&apos;s build something that matters.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted">
            Always interested in conversations about interesting problems, AI,
            product thinking, and what&apos;s next.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="mailto:varun4@wharton.upenn.edu"
              className="rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              varun4@wharton.upenn.edu
            </Link>
            <Link
              href="https://linkedin.com/in/varun-p"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-6 py-3 text-sm text-muted transition-colors hover:border-muted hover:text-foreground"
            >
              LinkedIn
            </Link>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
