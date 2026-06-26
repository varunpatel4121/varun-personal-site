# @blh/parent-quiz

Blue Light Health's **Parent Tech Loop Quiz** — a marketing-funnel, soul-reading
parent-report quiz. Facebook ads → quiz → the parent feels *seen* ("oh, this is
my family") → a configurable **CARES** booking CTA. Portable, deterministic,
built on [`@blh/quiz-core`](../quiz-core).

> 🤖 **Working on this?** Read [`AGENTS.md`](./AGENTS.md), [`SCORING.md`](./SCORING.md),
> and [`config/source/SOURCES.md`](./config/source/SOURCES.md).
>
> 📁 **Source of truth:** the two docs in the Drive **AI Quiz / Parent Quiz**
> folder. Don't invent content — change the docs and update the JSON.

A 3-minute quiz that classifies the **child tech loop** (10 results) + **family
screen pattern** + **support level**, and bridges to therapy/CARES without
blame, addiction language, or moral panic (per the Strategy & Voice doc).

## What's inside
```
src/
├── engine/      deterministic scorer (tag-sum → hard rules → support band) + tests
├── config/      the 2 docs as JSON (questions, results, scoring, content) + source/
├── ai/          parent narrative composer + prompt (warms the read; LLM optional)
├── persistence/ buildParentSessionRecord (on @blh/quiz-core)
├── types.ts     taxonomy + I/O
└── ui/          <ParentQuiz/> warm/editorial theme on core primitives
schema/          structured pq.* Supabase migration
```

## Usage
```tsx
import { ParentQuiz } from "@blh/parent-quiz/ui";
import { httpPersistence, makeNarrator } from "@blh/parent-quiz";

<ParentQuiz
  persistence={httpPersistence("/api/quiz/parent-sessions")}
  narrator={makeNarrator(complete)}      // optional — falls back to deterministic copy
  bookingUrl="https://bluelighthealth.com/cares"  // the CARES CTA (configurable)
/>
```
All three props are optional; with none, the quiz runs deterministically, the
CTA uses `content.defaultBookingUrl`, and sessions are discarded.

## Funnel + flow
intro → (child age) → Q1–Q8 → (Q9 next-step) → **email gate** (shows the
recognition line as a teaser, unlocks the full read) → result (recognition line,
warm narrative, what-you're-seeing / child-job / family-pattern / cost / what-helps
/ why-support-helps, **CARES booking CTA**, "did we get it right?"). A safety
answer routes to crisis guidance instead of the marketing result.

## Transfer / backend
Same pattern as the adult quiz (see `../tech-loop-quiz/AGENTS.md`): copy the
package, add `transpilePackages`, provide a sessions route + an optional
narrative route. Reference wiring in this repo: `src/app/parent-quiz/*` and
`src/app/api/quiz/{parent-sessions,narrative}/route.ts`. Run
`schema/0001_parent_quiz.sql` against Supabase to enable structured persistence
(the `pq.*` tables; `parent_email` is the lead, isolated in `pq.respondents`).

## Dev
`npm test` (18 cases), `npm run typecheck`. See SCORING.md for the engine spec.
