export interface Project {
  title: string;
  description: string;
  tags: string[];
  href?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    title: "AI Research Assistant",
    description:
      "A RAG-powered research tool that ingests documents and surfaces relevant insights through natural conversation. Built with vector search and structured retrieval.",
    tags: ["AI/ML", "RAG", "Python", "Next.js"],
    featured: true,
  },
  {
    title: "Realtime Data Platform",
    description:
      "Event-driven pipeline processing millions of records with sub-second latency. Designed for observability and horizontal scale.",
    tags: ["Systems", "Streaming", "TypeScript"],
    featured: true,
  },
  {
    title: "Design System",
    description:
      "A composable component library with strict accessibility standards, built for rapid product iteration across multiple applications.",
    tags: ["React", "Design", "TypeScript"],
    featured: true,
  },
  {
    title: "Persona Chat Engine",
    description:
      "Conversational AI with configurable personality layers and memory. Exploring what it means to build products that feel genuinely intelligent.",
    tags: ["AI/ML", "LLMs", "Product"],
    href: "/apps/persona",
    featured: false,
  },
];

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}
