import { Hero } from "@/components/home/hero";
import { AnimateIn } from "@/components/home/animate-in";
import { SectionHeading } from "@/components/home/section-heading";
import { FocusCard } from "@/components/home/focus-card";
import { DirectionCard } from "@/components/home/direction-card";
import { ContactCTA } from "@/components/home/contact-cta";
import { getFeaturedProjects } from "@/data/projects";

export default function Home() {
  const featured = getFeaturedProjects();

  return (
    <>
      <Hero />

      {/* Positioning */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimateIn>
            <SectionHeading
              kicker="Who I Am"
              title="Technical depth meets product vision."
            />
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted">
              After building pricing, trust, and model-quality systems at Google,
              I went to Wharton to develop the strategic lens to build
              companies&mdash;not just features. Now I&apos;m exploring what
              happens when you combine deep technical ability with product
              instinct and a genuine interest in how people grow.
            </p>
          </AnimateIn>

          <AnimateIn delay={0.15}>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  index: "01",
                  label: "Computer Science, UVA",
                  detail: "Highest Distinction",
                },
                {
                  index: "02",
                  label: "Software Engineer",
                  detail: "Google",
                },
                {
                  index: "03",
                  label: "MBA Candidate",
                  detail: "Wharton \u2014 Merit Fellow",
                },
                {
                  index: "04",
                  label: "AI & Product",
                  detail: "Builder",
                },
              ].map((cred) => (
                <div
                  key={cred.index}
                  className="rounded-lg border border-border-subtle p-4 transition-colors hover:border-border"
                >
                  <span className="font-mono text-xs text-subtle">
                    {cred.index}
                  </span>
                  <p className="mt-2 text-sm font-medium">{cred.label}</p>
                  <p className="mt-0.5 text-sm text-muted">{cred.detail}</p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Current Focus */}
      <section className="border-t border-border-subtle py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimateIn>
            <SectionHeading
              kicker="Current Focus"
              title="Three areas I'm going deep on."
            />
          </AnimateIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <AnimateIn delay={0}>
              <FocusCard
                title="AI-Native Products"
                description="Building with RAG, agentic workflows, and retrieval systems. Exploring what happens when you give AI real tools and real context."
              />
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <FocusCard
                title="Product & Strategy"
                description="Studying operations, information, and decisions at Wharton. Developing the strategic lens to build companies, not just code."
              />
            </AnimateIn>
            <AnimateIn delay={0.15}>
              <FocusCard
                title="Human-Centered Technology"
                description="Drawn to technology that serves human growth — tools for self-improvement, reflection, and genuine clarity."
              />
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Featured Directions */}
      <section className="border-t border-border-subtle py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimateIn>
            <SectionHeading
              kicker="Selected Work"
              title="Things I've built and explored."
            />
          </AnimateIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {featured.map((project, i) => (
              <AnimateIn key={project.title} delay={i * 0.08}>
                <DirectionCard
                  index={String(i + 1).padStart(2, "0")}
                  title={project.title}
                  description={project.description}
                  tags={project.tags}
                />
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Ethos */}
      <section className="border-t border-border-subtle py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimateIn>
            <SectionHeading kicker="Ethos" />
            <blockquote className="mt-8 max-w-3xl text-xl leading-relaxed text-muted sm:text-2xl">
              &ldquo;The most meaningful technology is built by people who
              understand both the system and the human on the other side of
              it.&rdquo;
            </blockquote>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-subtle">
              I&apos;m drawn to problems where technical depth, product
              instinct, and genuine curiosity about people converge. The work I
              want to do sits at that intersection&mdash;ambitious but grounded,
              rigorous but human.
            </p>
          </AnimateIn>
        </div>
      </section>

      <ContactCTA />
    </>
  );
}
