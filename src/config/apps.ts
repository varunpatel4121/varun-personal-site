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
  {
    slug: "blh-quiz",
    name: "Tech Loop Quiz",
    description:
      "A 10-minute reflection on how you use your devices and what that use is doing for you. No account required.",
    href: "/quiz",
    status: "active",
  },
];

export function getApp(slug: string): AppConfig | undefined {
  return apps.find((app) => app.slug === slug);
}
