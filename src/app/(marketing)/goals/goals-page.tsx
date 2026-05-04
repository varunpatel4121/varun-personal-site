"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";

const CODE = "8000";
const STORAGE_KEY = "vp_goals_auth";

// ─── Entry point ─────────────────────────────────────────────────────────────

export function GoalsPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    // Reading localStorage after hydration is the correct pattern here —
    // null state renders nothing so there's no cascading render issue.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (unlocked === null) return null;
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;
  return <GoalsContent />;
}

// ─── PIN Gate ────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const submit = useCallback(
    (pin: string) => {
      if (pin === CODE) {
        localStorage.setItem(STORAGE_KEY, "1");
        onUnlock();
      } else {
        setShaking(true);
        setError(true);
        setTimeout(() => {
          setDigits([]);
          setShaking(false);
          setTimeout(() => setError(false), 600);
        }, 350);
      }
    },
    [onUnlock]
  );

  const addDigit = useCallback(
    (d: string) => {
      setDigits((prev) => {
        if (prev.length >= 4) return prev;
        const next = [...prev, d];
        if (next.length === 4) setTimeout(() => submit(next.join("")), 80);
        return next;
      });
    },
    [submit]
  );

  const deleteDigit = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") addDigit(e.key);
      else if (e.key === "Backspace") deleteDigit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addDigit, deleteDigit]);

  const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="flex flex-col items-center">
        <p className="mb-10 font-mono text-[10px] uppercase tracking-[0.3em] text-subtle">
          goals
        </p>

        {/* PIN dots */}
        <div className={clsx("mb-2 flex gap-4", shaking && "animate-shake")}>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={clsx(
                "h-2.5 w-2.5 rounded-full border transition-all duration-100",
                i < digits.length
                  ? error
                    ? "scale-100 border-red-400/80 bg-red-400/80"
                    : "scale-110 border-foreground bg-foreground"
                  : "scale-100 border-border bg-transparent"
              )}
            />
          ))}
        </div>

        <div className="mb-8 h-5 flex items-center justify-center">
          <p
            className={clsx(
              "font-mono text-[10px] tracking-widest transition-opacity duration-500",
              error ? "text-red-400/60 opacity-100" : "opacity-0"
            )}
          >
            incorrect
          </p>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {PAD.map((key, i) => {
            if (!key) return <div key={i} />;
            const isDel = key === "del";
            return (
              <button
                key={i}
                onClick={() => (isDel ? deleteDigit() : addDigit(key))}
                className={clsx(
                  "flex h-[62px] w-[62px] items-center justify-center rounded-2xl border font-mono transition-all duration-100 active:scale-95",
                  isDel
                    ? "border-border-subtle text-subtle hover:border-border hover:text-foreground"
                    : "border-border-subtle text-base text-foreground hover:border-border hover:bg-surface"
                )}
              >
                {isDel ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

type Tab = "summer" | "odyssey";

const TABS: { id: Tab; label: string }[] = [
  { id: "summer", label: "Summer 2026" },
  { id: "odyssey", label: "Five Years" },
];

function GoalsContent() {
  const [tab, setTab] = useState<Tab>("summer");

  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="animate-in pb-10 pt-16 sm:pt-20">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Goals</h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">
          Summer 2026 and a map of the next five years.
        </p>
      </div>

      <div className="animate-in-delayed">
        {/* Tab bar */}
        <div className="mb-8 flex border-b border-border-subtle">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                "-mb-px pb-3 pr-8 text-sm font-medium transition-colors",
                tab === id
                  ? "border-b-2 border-accent text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div key={tab} className="animate-in pb-20">
          {tab === "summer" ? <SummerTab /> : <OdysseyTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Summer Tab ──────────────────────────────────────────────────────────────

const GOAL_CARDS = [
  {
    emoji: "🏃",
    title: "Health & Body",
    subtitle: "Build the physical foundation",
    accent: "#34d399",
    items: [
      "Meditate 5x per week",
      "Gym 3x per week",
      "Try running — sign up for a race",
      "Yoga and Surya Namaskar morning routine",
      "Dopamine break — 4 weeks in May",
      "Build sustainable food systems in June",
      "Get outside every day",
    ],
  },
  {
    emoji: "🧠",
    title: "Mental & Inner Work",
    subtitle: "The work that makes everything else possible",
    accent: "#a78bfa",
    items: [
      "Continue building self-trust",
      "Journal consistently",
      "Continue therapy",
      "Address technology addiction systems in June",
      "Weekly learning: 1hr Guru, 1hr mhealth, 1hr therapist",
    ],
  },
  {
    emoji: "❤️",
    title: "Family & Relationships",
    subtitle: "The foundation everything else is built on",
    accent: "#fbbf24",
    items: [
      "Diva — listen with more presence, cultivate her intuition and growth. More dates.",
      "Jes — be a good mentor. Weekly chats. Connect over sports and his world.",
      "Parents — find the right connection points: mom (seva, BYPS), dad (hiking and walking).",
      "Family and bro call once a week",
    ],
  },
  {
    emoji: "🎙️",
    title: "Passion Projects",
    subtitle: "Building your voice and brand",
    accent: "#60a5fa",
    items: [
      "Podcast with Diva — launch it. Mental health, EQ, growth, relationships.",
      "Brand identity: authenticity, playfulness, depth, equanimity, compassion.",
      "Build AI systems — get hands-on, expose yourself to building in this space.",
      "ETA with Ray — biweekly thesis sessions to keep this path warm.",
    ],
  },
];

function SummerTab() {
  return (
    <div className="space-y-4">
      <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.25em] text-accent-foreground/60">
        May — August 2026
      </p>

      {/* 2×2 goal cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {GOAL_CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-border-subtle bg-surface/30 p-5 transition-colors hover:border-border"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 text-xl leading-none">{card.emoji}</span>
              <div>
                <h3 className="text-sm font-medium tracking-tight">{card.title}</h3>
                <p className="mt-0.5 text-xs text-subtle">{card.subtitle}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {card.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full opacity-70"
                    style={{ backgroundColor: card.accent }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Startup card — full width */}
      <div className="rounded-xl border border-border-subtle bg-surface/30 p-6 transition-colors hover:border-border">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-base leading-none">
            🚀
          </span>
          <div>
            <h3 className="text-sm font-medium tracking-tight">
              Startup & Career — Mental Health Space
            </h3>
            <p className="text-xs text-subtle">The most active track this summer</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-subtle">
              Research — Build the Map
            </p>
            <ul className="space-y-2">
              {[
                "Types of therapy and the full landscape",
                "How people struggle and stay blind to it",
                "How people cope today — faith, tech, community",
                "How people heal and what actually works",
                "Business models: therapy-direct vs. consumer",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-subtle">
              20 Conversations
            </p>
            <ul className="space-y-2">
              {[
                "Normal people: how they struggle, cope, think about healing",
                "Communities: Gujarati, Telugu, Wharton, law, sports, students",
                "Business leaders: strategy, mission, EQ challenges",
                "Ask everyone: awareness? action? tech? community?",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-subtle">
              Hypothesize & Build
            </p>
            <ul className="space-y-2">
              {[
                "Try different ideas — don't commit too early",
                "Market tests, surveys, business models",
                "Get familiar with the startup process — do the reps",
                "Build a real MVP — test it with actual users",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent/40" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-subtle">
              Feelings to Embody
            </p>
            <ul className="space-y-1.5">
              {[
                "Pressure-less curiosity",
                "Willingness to learn",
                "Action-oriented — do the scary things",
              ].map((f, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-emerald-400/50" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Odyssey Tab ─────────────────────────────────────────────────────────────

const PATHS = [
  {
    index: "01",
    badge: "Default Path",
    title: "Mental Health Startup Founder",
    tagline: "Do it the right way — learn deep, build with intention.",
    body: [
      "Build a company in the mental health space from the ground up. Use Wharton resources fully. Become a genuine expert before building — talk to everyone, understand the landscape, hypothesize and validate.",
      "Do the things that scare you: networking, committing, taking visible action. The feelings to embody are pressure-less curiosity and a hunger to learn. Not hustle — intention.",
    ],
    feelings: ["Expert builder", "Mission-first founder", "Action-oriented", "Growth without fear"],
    accent: "#6366f1",
    badgeClass: "bg-accent/10 text-accent-foreground",
  },
  {
    index: "02",
    badge: "Path 1",
    title: "The ETA Route",
    tagline: "Acquire businesses. Build financial security. Bring people with you.",
    body: [
      "Pursue Entrepreneurship Through Acquisition — buy and operate businesses, build long-term financial security for yourself and your family. Work alongside people you trust.",
      "This path is about legacy and stability as much as returns. Explore biweekly ETA theses to keep this option alive and sharp.",
    ],
    feelings: ["Provider", "Financially free", "Community builder", "Long-game thinker"],
    accent: "#f59e0b",
    badgeClass: "bg-amber-500/10 text-amber-400",
  },
  {
    index: "03",
    badge: "Path 2",
    title: "Join a Mental Health Startup",
    tagline: "Find the mission that's personal. Go all-in on the team.",
    body: [
      "Don't found — join. Find a mental health startup whose mission genuinely moves you, and become indispensable. Contribute in ways the founders didn't see coming — board-style thinking, EQ, connecting dots.",
      "Money isn't the goal here. Team camaraderie and shared mission are. The right team would make you say: I'd go to war for these people.",
    ],
    feelings: ["Deep collaboration", "Mission over money", "Trusted thought partner", "In it together"],
    accent: "#3b82f6",
    badgeClass: "bg-blue-500/10 text-blue-400",
  },
  {
    index: "04",
    badge: "Path 3",
    title: "Mentor / Coach / Therapist",
    tagline: "Help people heal. Build a community worth belonging to.",
    body: [
      "Lean into being someone who deeply understands people — their struggles, their blind spots, their potential. You've been through it. That's your superpower.",
      "Help your family and friends with EQ and trauma. Build a strong, secure community for yourself, your kids, and the people you love. This isn't a fallback — it's a calling.",
    ],
    feelings: ["Deep understanding", "Healed healer", "Community anchor", "Safe space for others"],
    accent: "#8b5cf6",
    badgeClass: "bg-violet-500/10 text-violet-400",
  },
];

const NORTH_STAR = [
  "Good father & husband",
  "Community builder",
  "Mentor & teacher",
  "Lifting people up",
  "Self-confident",
  "Secure masculinity",
  "Leader",
  "Thoughtful",
  "Family-first",
  "Creating space for others",
  "Free",
];

const COMMON_THREADS = [
  { label: "Community", cls: "bg-teal-400/10 text-teal-400 border-teal-400/20" },
  { label: "Team", cls: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  { label: "Mental Health", cls: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  { label: "Emotional Intelligence", cls: "bg-violet-400/10 text-violet-400 border-violet-400/20" },
  { label: "Give Back", cls: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  { label: "Mission-Oriented", cls: "bg-orange-400/10 text-orange-400 border-orange-400/20" },
];

function OdysseyTab() {
  return (
    <div className="space-y-6">
      {/* Path cards */}
      <div className="space-y-3">
        {PATHS.map((path) => (
          <div
            key={path.index}
            className="group relative overflow-hidden rounded-xl border border-border-subtle bg-surface/30 p-6 transition-colors hover:bg-surface/50"
            style={{ borderLeftWidth: "3px", borderLeftColor: path.accent }}
          >
            {/* Faint background index number */}
            <span
              className="pointer-events-none absolute right-5 top-2 select-none font-mono text-[72px] font-bold leading-none"
              style={{ color: `${path.accent}12` }}
            >
              {path.index}
            </span>

            <div className="relative flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div className="shrink-0 sm:w-44">
                <span
                  className={clsx(
                    "mb-2 inline-flex rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-wide",
                    path.badgeClass
                  )}
                >
                  {path.badge}
                </span>
                <h3 className="text-sm font-medium leading-snug tracking-tight">
                  {path.title}
                </h3>
                <p className="mt-1.5 text-xs italic leading-relaxed text-subtle">
                  {path.tagline}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="space-y-2 text-sm leading-relaxed text-muted">
                  {path.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {path.feelings.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-surface px-2.5 py-0.5 font-mono text-[10px] text-subtle"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* North Star */}
      <div className="rounded-xl border border-accent/15 bg-accent/5 p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="text-accent-foreground/50 text-sm">✦</span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-foreground/70">
              North Star
            </p>
            <p className="mt-0.5 text-xs text-subtle">Who you want to be in five years</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {NORTH_STAR.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-accent/15 bg-accent/8 px-3 py-1 text-sm text-accent-foreground/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Common Threads */}
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
          Common Threads
        </p>
        <div className="flex flex-wrap gap-2">
          {COMMON_THREADS.map((t) => (
            <span
              key={t.label}
              className={clsx("rounded-full border px-3 py-1 text-sm font-medium", t.cls)}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Inner Work */}
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
          What You&rsquo;re Working Through
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className="rounded-xl border border-border-subtle bg-surface/30 p-5"
            style={{ borderLeftWidth: "3px", borderLeftColor: "rgba(248,113,113,0.45)" }}
          >
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-red-400/70">
              Blockers to name & move through
            </p>
            <ul className="space-y-2">
              {[
                "Fear and doubt",
                "Addictions: tech, ambiguity, inaction",
                "Un-intentionality",
                "Inaction — getting addicted to the sadness and drift",
                "Lack of clarity from too many choices",
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-xl border border-border-subtle bg-surface/30 p-5"
            style={{ borderLeftWidth: "3px", borderLeftColor: "rgba(52,211,153,0.45)" }}
          >
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-400/70">
              The antidotes you already know
            </p>
            <ul className="space-y-2">
              {[
                "Trust with yourself — the antidote to fear and anxiety",
                "Curiosity over pressure",
                "Action — even small, even imperfect",
                "Experimentation — treat life as a lab",
                "Being with authenticity and learning",
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Closing quote */}
      <p className="pt-4 text-center text-sm italic text-subtle">
        &ldquo;Zoom out, ask bigger questions, imagine other routes. Intentionality.&rdquo;
      </p>
    </div>
  );
}
