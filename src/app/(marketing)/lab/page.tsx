import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Experiments, demos, and explorations by Varun Patel — AI tools, prototypes, and ideas in progress.",
};

const experiments = [
  {
    title: "Persona Engine",
    description:
      "Chat with configurable AI personalities. Testing memory, tone calibration, and conversational coherence.",
    status: "work in progress" as const,
    href: "/apps/persona",
  },
  {
    title: "RAG Playground",
    description:
      "Upload a document and ask questions against it. Exploring chunking strategies, embedding models, and retrieval quality.",
    status: "work in progress" as const,
  },
  {
    title: "Prompt Observatory",
    description:
      "A structured workspace for testing, versioning, and comparing prompt strategies across models.",
    status: "idea" as const,
  },
];

const statusStyles: Record<string, string> = {
  "work in progress": "bg-amber-950 text-amber-400",
  idea: "bg-surface text-subtle",
  live: "bg-emerald-950 text-emerald-400",
};

export default function LabPage() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <PageHeader
        title="Lab"
        description="Experiments, prototypes, and works-in-progress. This is where ideas get tested before they become products."
      />

      <div className="animate-in-delayed space-y-4 pb-20">
        {experiments.map((exp) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium tracking-tight">{exp.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs ${statusStyles[exp.status] ?? "bg-surface text-muted"}`}
                >
                  {exp.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {exp.description}
              </p>
            </>
          );

          if (exp.href) {
            return (
              <Link
                key={exp.title}
                href={exp.href}
                className="block rounded-lg border border-border-subtle p-5 transition-colors hover:border-border hover:bg-surface/50"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={exp.title}
              className="rounded-lg border border-border-subtle p-5 transition-colors hover:border-border"
            >
              {inner}
            </div>
          );
        })}

        <div className="!mt-12 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-subtle">
            More experiments on the way. This space will grow as I ship new
            prototypes and AI tools.
          </p>
        </div>
      </div>
    </div>
  );
}
