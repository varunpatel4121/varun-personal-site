export interface AppConfig {
  slug: string;
  name: string;
  description: string;
  href: string;
  status: "active" | "beta" | "coming-soon";
}

export const apps: AppConfig[] = [
  {
    slug: "persona",
    name: "Persona",
    description:
      "Conversational AI with configurable personality layers and memory.",
    href: "/apps/persona",
    status: "beta",
  },
];

export function getApp(slug: string): AppConfig | undefined {
  return apps.find((app) => app.slug === slug);
}
