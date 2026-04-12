import Link from "next/link";
import { Section } from "@/components/section";
import { ProjectCard } from "@/components/project-card";
import { getFeaturedProjects } from "@/data/projects";

export default function Home() {
  const featured = getFeaturedProjects();

  return (
    <>
      {/* Hero */}
      <section className="pb-16 pt-20 sm:pb-20 sm:pt-28">
        <div className="animate-in">
          <p className="font-mono text-sm text-subtle">Varun Patel</p>
          <h1 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Building software at the intersection
            <br className="hidden sm:block" /> of craft and intelligence.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            Engineer and builder focused on thoughtful products, intelligent
            systems, and the kind of software that earns trust through quality.
            Currently exploring what happens when you give AI real tools and real
            context.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/projects"
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              View Projects
            </Link>
            <Link
              href="/about"
              className="rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              About Me
            </Link>
          </div>
        </div>
      </section>

      {/* Current Focus */}
      <Section>
        <div className="animate-in-delayed">
          <p className="font-mono text-xs uppercase tracking-widest text-subtle">
            Current Focus
          </p>
          <h2 className="mt-3 text-xl font-medium tracking-tight">
            AI-native products & developer tools
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Deeply interested in how retrieval-augmented generation, agentic
            workflows, and well-designed interfaces can make complex information
            accessible. Working at the boundary of systems engineering and
            applied AI.
          </p>
        </div>
      </Section>

      {/* Featured Projects */}
      <Section>
        <div className="animate-in-delayed-2">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-subtle">
                Selected Work
              </p>
              <h2 className="mt-3 text-xl font-medium tracking-tight">
                Featured Projects
              </h2>
            </div>
            <Link
              href="/projects"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {featured.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>
      </Section>

      {/* Philosophy */}
      <Section className="border-t border-border-subtle">
        <p className="font-mono text-xs uppercase tracking-widest text-subtle">
          Approach
        </p>
        <h2 className="mt-3 text-xl font-medium tracking-tight">
          How I think about building
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium">Substance over style</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Good design is the result of clear thinking. I start with the
              problem, not the aesthetic.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Systems thinking</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Every decision compounds. I build for the second and third order
              effects, not just the immediate feature.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Ship and iterate</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Taste is refined through contact with reality. I bias toward
              putting work in front of people early.
            </p>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="border-t border-border-subtle">
        <div className="text-center">
          <h2 className="text-xl font-medium tracking-tight">
            Want to build something together?
          </h2>
          <p className="mt-3 text-sm text-muted">
            I&apos;m open to collaborations, interesting problems, and good
            conversations.
          </p>
          <Link
            href="mailto:hello@varunpatel.me"
            className="mt-6 inline-block rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Get in Touch
          </Link>
        </div>
      </Section>
    </>
  );
}
