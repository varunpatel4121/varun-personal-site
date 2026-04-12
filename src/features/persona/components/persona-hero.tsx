import { personaConfig } from "../lib/config";

const upcomingFeatures = [
  {
    label: "Chat",
    description: "Natural conversation with configurable AI personalities",
    enabled: personaConfig.features.chat,
  },
  {
    label: "Persona Builder",
    description: "Design and fine-tune personality layers, tone, and memory",
    enabled: personaConfig.features.personaBuilder,
  },
  {
    label: "Memory System",
    description: "Persistent context that evolves across conversations",
    enabled: personaConfig.features.memorySystem,
  },
];

export function PersonaHero() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pt-20">
      <div className="animate-in">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {personaConfig.name}
            </h1>
            <p className="font-mono text-xs text-subtle">
              v{personaConfig.version}
            </p>
          </div>
        </div>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          {personaConfig.description} Build AI personas with distinct
          personalities, persistent memory, and conversational depth.
        </p>
      </div>

      <div className="animate-in-delayed mt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-foreground">
          Capabilities
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {upcomingFeatures.map((feature) => (
            <div
              key={feature.label}
              className="rounded-lg border border-border-subtle p-4 transition-colors hover:border-border"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{feature.label}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    feature.enabled
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-surface text-subtle"
                  }`}
                >
                  {feature.enabled ? "live" : "soon"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="animate-in-delayed-2 mt-12 rounded-lg border border-dashed border-border p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-subtle"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium">Workspace coming soon</p>
        <p className="mt-1 text-xs text-muted">
          This is where the Persona chat interface, persona builder, and memory
          dashboard will live.
        </p>
      </div>
    </div>
  );
}
