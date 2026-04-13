import type { Metadata } from "next";
import Link from "next/link";
import { apps } from "@/config/apps";

export const metadata: Metadata = {
  title: "Apps",
  description: "AI-powered tools and applications by Varun Patel.",
};

const statusLabel: Record<string, string> = {
  active: "Live",
  beta: "Beta",
  "coming-soon": "Coming Soon",
};

const statusStyle: Record<string, string> = {
  active: "bg-emerald-950 text-emerald-400",
  beta: "bg-accent/10 text-accent-foreground",
  "coming-soon": "bg-surface text-muted",
};

export default function AppsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-20">
      <div className="pb-12">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Apps
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
          AI-powered tools and experiments. Pick one to get started.
        </p>
      </div>

      <div className="space-y-4">
        {apps.map((app) => (
          <Link
            key={app.slug}
            href={app.href}
            className="group flex items-center justify-between rounded-lg border border-border-subtle p-5 transition-colors hover:border-border hover:bg-surface/50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="font-medium tracking-tight">{app.name}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] ${statusStyle[app.status] ?? statusStyle["coming-soon"]}`}
                >
                  {statusLabel[app.status] ?? app.status}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {app.description}
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-subtle transition-colors group-hover:text-foreground ml-4"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
