import Link from "next/link";
import type { Project } from "@/data/projects";

export function ProjectCard({ project }: { project: Project }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium tracking-tight">{project.title}</h3>
        {project.href && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 mt-0.5 text-subtle transition-colors group-hover:text-foreground"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {project.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-surface px-2.5 py-0.5 font-mono text-xs text-subtle"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );

  if (project.href) {
    return (
      <Link
        href={project.href}
        className="group block rounded-lg border border-border-subtle p-5 transition-colors hover:border-border hover:bg-surface/50"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group rounded-lg border border-border-subtle p-5 transition-colors hover:border-border">
      {content}
    </div>
  );
}
