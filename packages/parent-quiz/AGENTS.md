# AGENTS.md — `@blh/parent-quiz`

Context for AI agents / future maintainers. Read this, then `SCORING.md` and
`config/source/SOURCES.md`.

## What this is
Blue Light Health's parent-facing marketing funnel quiz. Facebook ad → quiz →
the parent feels seen → a configurable **CARES** booking CTA. A sibling of the
adult `@blh/tech-loop-quiz`, built on the shared `@blh/quiz-core`. Portable to
bluelighthealth.com.

## Source of truth
The two docs in the Drive **AI Quiz / Parent Quiz** folder
(<https://drive.google.com/drive/u/0/folders/1aouYdVqSbrQgGjASTnfruDSqvI-7kg-4>).
Mapping in `config/source/SOURCES.md`. **Do not invent quiz content or weights** —
change the docs and update the JSON, then run `npm test`.

## Invariants
1. **Deterministic** — same answers → same result + support level. The LLM warms
   prose only (`src/ai/`).
2. **No infra in the package** — Supabase/Anthropic are injected adapters
   (from `@blh/quiz-core`). Keep it that way for portability.
3. **Voice guardrails** (Strategy & Voice doc): no diagnosis, no child-blame, no
   addiction language, no moral panic. Therapy as relief, not threat. Careful
   uncertainty (may/can/often). A low-support branch must exist.
4. **Safety first** — a safety answer (`PR_SAFETY`) bypasses the marketing result
   and shows crisis guidance. Never gate safety behind the email step.
5. **Config is the tuning surface** — weights/results/copy live in `config/*.json`.

## Architecture
`engine/` (pure scorer + hard rules) · `config/` (the 2 docs as JSON) · `ai/`
(narrative composer + prompt) · `persistence/` (record builder on core) ·
`ui/` (`<ParentQuiz/>` + warm `theme.css` over core primitives). Headless root
export (`@blh/parent-quiz`) + UI subpath (`/ui`).

## Runbooks
- **Change a question / result / weight:** edit `config/questions.json` /
  `results.json` / `content.json` to match the doc, add a test case, `npm test`.
- **Change the CARES CTA:** pass `bookingUrl` to `<ParentQuiz>` (the app sets it
  from `NEXT_PUBLIC_CARES_BOOKING_URL`); default in `content.defaultBookingUrl`.
- **Connect the backend:** run `schema/0001_parent_quiz.sql` (the `pq.*` tables);
  the app route `src/app/api/quiz/parent-sessions/route.ts` writes the
  `SessionRecord`. `parent_email` is the lead (in `pq.respondents`).
- **Transfer to another app:** copy the package + `@blh/quiz-core`, add
  `transpilePackages`, provide the two routes. See `../tech-loop-quiz/AGENTS.md`.

## Tests
`src/engine/score.test.ts` — 10-loop reachability, every hard rule, support
banding, the 70% secondary rule, determinism. `npm test`.
