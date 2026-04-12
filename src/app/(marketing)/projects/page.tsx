import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected projects and work by Varun Patel — software, AI, and systems.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <PageHeader
        title="Projects"
        description="A selection of things I've built, shipped, and explored. Some are production systems, some are experiments, all are things I learned from."
      />

      <div className="animate-in-delayed grid gap-4 pb-20 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>
    </div>
  );
}
