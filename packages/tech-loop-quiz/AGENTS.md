# AGENTS.md — `@blh/tech-loop-quiz`

Context for AI agents / future maintainers working on this package. **Read this
first.** If you only read one other file, read [`SCORING.md`](./SCORING.md).

## What this is

Blue Light Health's **Tech Loop & Phenotype Formulation Quiz**: a 5-minute
reflection that classifies a person's relationship with technology into one of
**17 phenotypes** across the model **Pull × Job × Loop × Cost**, plus a separate
severity read. It is a **portable package** built to move from this repo
(`varun-personal-site`) into **bluelighthealth.com**.

The golden rule: **the deterministic engine classifies; the LLM only narrates.**
Results are reproducible and auditable. The quiz works with no AI and no backend.

## Source of truth — the Drive "AI Quiz" folder

All content and scoring come from **five Google docs** in:
<https://drive.google.com/drive/u/0/folders/1aouYdVqSbrQgGjASTnfruDSqvI-7kg-4>

The mapping of each doc → which config it produces is in
[`config/source/SOURCES.md`](./config/source/SOURCES.md). **Do not invent quiz
content or weights** — change them in the sheets and re-derive (see "Change the
questions or scoring" below). Ignore the older `Blue Light Health/Phenotypes/`
docx set; it is stale and out of scope (no validated screeners, no parent flow,
no "Ground" block).

## Architecture (what lives where)

```
src/
├── engine/       deterministic pipeline (pure TS, no deps). SCORING.md is its spec.
├── config/       the 5 sheets as versioned JSON (clinical tunes this, not code)
│   └── source/   committed sheet exports + SOURCES.md + provenance
├── types/        all shared types (taxonomy ids, engine I/O, output contract, record)
├── persistence/  QuizPersistence INTERFACE + adapters + buildSessionRecord (no Supabase dep)
├── ai/           AINarrator INTERFACE + deterministic composer (no provider dep)
└── ui/           "use client" React components + scoped CSS (no host Tailwind)
schema/           structured Postgres/Supabase migration (the tlq.* tables)
scripts/          generate-config.py — rebuilds mechanical config from source/
```

Two entry points: `@blh/tech-loop-quiz` is **headless** (engine + config + types
+ persistence + ai — importable from a backend with no React);
`@blh/tech-loop-quiz/ui` is the React UI.

## Invariants — do not break these

1. **Determinism.** Same `QuizResponse` → identical phenotype + severity, always.
   The LLM changes prose only. (`acceptance.test.ts` enforces this.)
2. **No infra in the package.** No `@supabase/*`, no `@anthropic-ai/*`, no Next
   imports inside `src/`. Infra is injected via the persistence/ai adapter
   interfaces. This is what keeps it portable — keep it that way.
3. **No diagnosis language** in user-facing copy (hard rule `HR_LANGUAGE_001`).
   Each phenotype's `avoidSaying` lists banned phrasing.
4. **Config is the tuning surface.** Weights/gates/rules live in `config/*.json`
   so clinicians can change scoring without code. Don't hardcode weights.
5. **Tests gate behaviour.** The 13 sheet acceptance cases + reachability +
   config-integrity must stay green.

## Runbook: transfer this to another app (e.g. bluelighthealth.com)

The package has no coupling to this repo, so a move is mechanical:

1. Copy `packages/tech-loop-quiz/` into the target repo (or publish it privately
   and `npm i @blh/tech-loop-quiz`).
2. In the host app: add the dep and set
   `transpilePackages: ["@blh/tech-loop-quiz"]` in `next.config.ts` (the package
   ships TS + CSS source, not a build).
3. Render it (client component):
   ```tsx
   import { TechLoopQuiz } from "@blh/tech-loop-quiz/ui";
   import { httpPersistence, makeNarrator } from "@blh/tech-loop-quiz";
   ```
   See the reference wiring copied below in "Reference host integration".
4. Provide two API routes (sessions + narrative) — reference implementations are
   in this repo at `src/app/api/quiz/{sessions,narrative}/route.ts`.
5. `npm test` in the package to confirm it still passes in the new home.

Nothing in the package needs editing to move — only the host app's wiring.

## Runbook: connect a backend (Supabase)

Persistence is deferred by default (sessions are discarded but the quiz works).
To turn it on:

1. Run `schema/0001_tech_loop_quiz.sql` against your Supabase project. It creates
   the `tlq` schema: `sessions`, `respondents` (PII, isolated), `answers` (one
   row per answer + normalized tags), `results` (the formulation), and a
   versioned `question_bank`. Expose the `tlq` schema in Supabase API settings.
2. Ensure the host route at `/api/quiz/sessions` has
   `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` and writes the posted
   `SessionRecord` (it already fans it across the tables — see
   `src/app/api/quiz/sessions/route.ts`).
3. The client adapter is `httpPersistence("/api/quiz/sessions")`. Writes are
   best-effort and never block the result page.

The unit of persistence is `SessionRecord` (see `src/types/session.ts`):
full answers, normalized signals, identity, the scored formulation, and fit
feedback. `buildSessionRecord()` assembles it; `persistence.test.ts` documents
its shape.

## Runbook: enable / change the AI narrative

- Set `ANTHROPIC_API_KEY` (+ optional `QUIZ_NARRATIVE_MODEL`) and inject
  `makeNarrator(complete)` where `complete` calls your `/api/quiz/narrative`
  route. With no key, the route 503s and the client uses the deterministic copy.
- The package builds the prompt (`buildNarratorMessages`) from the engine output
  + approved library copy and instructs the model to **warm tone only**. To
  change the voice, edit `src/ai/index.ts`. Never let AI change assignment.

## Runbook: change the questions or scoring

- **Questions / copy:** edit the sheet (doc #1/#4/#5), re-export the relevant
  `config/source/*.md`, run `python3 scripts/generate-config.py`, then update any
  hand-authored JSON (`quiz-content.json`, `phenotypes.json`). See SOURCES.md.
- **Weights / gates / severity:** edit `config/*.json` (or `scoring-rules.md` +
  regenerate for `rule-weights.json`). Keep `params.json.version` bumped.
- **Hard-rule logic:** `src/engine/hard-rules.ts` (it's code because rules read
  scalars + free text). Add a matching case to `acceptance.test.ts`.
- Always run `npm test` after — the suite is the contract.

## Tests (what guards what)

| File | Guards |
|------|--------|
| `src/engine/acceptance.test.ts` | the 13 sheet `EX_*` cases + determinism |
| `src/engine/reachability.test.ts` | every one of the 17 phenotypes is reachable as primary |
| `src/engine/severity.test.ts` | the severity formula + bands |
| `src/engine/normalize.test.ts` | answer→signal mapping, jobs-from-hooks, gate blocking, end-to-end `score()` |
| `src/config/config.test.ts` | config integrity (no drift between tables/taxonomy) |
| `src/persistence/persistence.test.ts` | `SessionRecord` shape (backend safety) |
| `src/ai/ai.test.ts` | deterministic narrative for every phenotype + fallback |

Run: `npm test` (or `vitest run`) from the package. `npm run typecheck` for types.

## Reference host integration (this repo)

- Route page: `src/app/quiz/page.tsx` → `src/app/quiz/QuizClient.tsx` (injects adapters)
- Persistence route: `src/app/api/quiz/sessions/route.ts`
- AI route: `src/app/api/quiz/narrative/route.ts`
- Monorepo wiring: root `package.json` (`workspaces`), `next.config.ts` (`transpilePackages`)
