# @blh/tech-loop-quiz

Blue Light Health's **Tech Loop & Phenotype Formulation Quiz** — a portable,
deterministic phenotyping engine + versioned config + React UI, with **zero
framework or infrastructure coupling**. Built to lift wholesale from this repo
into `bluelighthealth.com`.

A 5-minute reflection that classifies a person's "tech loop" across the
Technology-Use Formulation Model — **Pull × Job × Loop × Cost** — into one of
**17 phenotypes**, with a separate severity read. The deterministic engine
classifies and is fully auditable; an optional LLM only warms the prose.

> 🤖 **Working on this?** Start with [`AGENTS.md`](./AGENTS.md) (context +
> transfer/backend runbooks) and [`SCORING.md`](./SCORING.md) (engine spec).
>
> 📁 **Source of truth:** all content + scoring come from the five docs in the
> Blue Light Health **"AI Quiz"** Google Drive folder —
> <https://drive.google.com/drive/u/0/folders/1aouYdVqSbrQgGjASTnfruDSqvI-7kg-4>.
> The config → doc mapping is in
> [`config/source/SOURCES.md`](./config/source/SOURCES.md). Do not invent
> content; change the sheets and re-derive.

## What's inside

```
src/
├── engine/       pure-TS deterministic scoring pipeline (no deps) — see SCORING.md
├── config/       the 5 AI-Quiz sheets as versioned JSON (clinical tunes this)
│   └── source/   committed source sheets + generator provenance
├── types/        shared TS types (taxonomy, engine I/O, output contract, record)
├── persistence/  QuizPersistence adapter *interface* (no Supabase dependency)
├── ai/           optional AI narrator *interface* + deterministic composer
└── ui/           "use client" React components + scoped styles (no host Tailwind)
schema/           structured Postgres/Supabase migrations (tlq.*)
scripts/          generate-config.py — rebuilds mechanical config from source
```

The package root export (`@blh/tech-loop-quiz`) is **headless** (engine + config
+ types + persistence + ai) so a backend can import it with no React. The UI is
a separate subpath (`@blh/tech-loop-quiz/ui`).

## Usage

```tsx
import { TechLoopQuiz } from "@blh/tech-loop-quiz/ui";
import { httpPersistence, makeNarrator } from "@blh/tech-loop-quiz";

const persistence = httpPersistence("/api/quiz/sessions"); // your route → Supabase
const narrator = makeNarrator(async ({ system, user }) => {
  const r = await fetch("/api/quiz/narrative", { method: "POST", body: JSON.stringify({ system, user }) });
  if (!r.ok) throw new Error("ai down"); // → graceful fallback to deterministic copy
  return (await r.json()).text;
});

export default () => <TechLoopQuiz persistence={persistence} narrator={narrator} />;
```

Both adapters are optional. With neither, the quiz runs fully deterministically
and discards sessions.

### Scoring headlessly

```ts
import { score } from "@blh/tech-loop-quiz";
const result = score(quizResponse); // → OutputContract + severity + 17-way spectrum
```

## Consuming this package elsewhere (e.g. bluelighthealth.com)

It's a workspace package consumed via npm/pnpm workspaces. The host app needs:

1. The package as a dependency (`"@blh/tech-loop-quiz": "*"` in a workspace, or
   publish it privately).
2. `transpilePackages: ["@blh/tech-loop-quiz"]` in `next.config.ts` (it ships TS
   + CSS source, not a build).
3. Two thin API routes — one that writes the posted `SessionRecord` to Supabase
   (`schema/0001_tech_loop_quiz.sql`), one that relays the narrator prompt to an
   LLM. Reference implementations live in this repo under
   `src/app/api/quiz/{sessions,narrative}/route.ts`.

Secrets (Supabase service key, Anthropic key) stay in the **host app**, never in
the package — that's what makes it portable.

## Persistence

`SessionRecord` (full answers, normalized signals, identity, the scored
formulation, fit feedback) is the unit of persistence. The structured schema
(`schema/`) fans it across `tlq.sessions / respondents / answers / results` and
also keeps the whole record as JSONB. PII (name/email) is isolated in
`tlq.respondents`. Wiring is deferred — run the SQL against any Supabase and
point your route at it.

## Development

```bash
npm test        # 36 tests: acceptance cases, severity, normalize, config integrity
npm run typecheck
python3 scripts/generate-config.py   # regenerate mechanical config from source/
```

See **SCORING.md** for the full engine spec and the reconciliation decisions.
