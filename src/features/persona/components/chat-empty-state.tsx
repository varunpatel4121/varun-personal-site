"use client";

const SUGGESTED_PROMPTS = [
  {
    label: "Explain a concept",
    prompt: "Explain how neural networks learn, in simple terms.",
  },
  {
    label: "Help me write",
    prompt: "Help me write a concise project brief for a new feature.",
  },
  {
    label: "Debug my thinking",
    prompt: "I'm stuck on a decision. Can you help me think through the trade-offs?",
  },
  {
    label: "Summarize",
    prompt: "Summarize the key ideas behind retrieval-augmented generation.",
  },
];

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-md animate-in">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-foreground"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-medium tracking-tight">
          Start a conversation
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Ask anything. The conversation is saved automatically.
        </p>

        <div className="mt-8 grid gap-2">
          {SUGGESTED_PROMPTS.map((item) => (
            <button
              key={item.label}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group flex items-center gap-3 rounded-lg border border-border-subtle px-4 py-3 text-left transition-all hover:border-border hover:bg-surface/50"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground/90">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-subtle line-clamp-1">
                  {item.prompt}
                </p>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-muted"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
