import type { Project } from "@/data/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group rounded-lg border border-border-subtle p-5 transition-colors hover:border-border">
      <h3 className="font-medium tracking-tight">{project.title}</h3>
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
    </div>
  );
}
