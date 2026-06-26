# @blh/quiz-core

Shared core for every Blue Light Health quiz. Consumed by
[`@blh/tech-loop-quiz`](../tech-loop-quiz) (adult) and
[`@blh/parent-quiz`](../parent-quiz). **No framework or infrastructure
coupling** — this is the portable foundation both quizzes lift to
bluelighthealth.com.

## What it provides
- **Types** (`./`) — `Confidence`, `Identity`, `AnswerLogEntry`, and the generic
  `SessionRecord<TResponse, TResult>` persistence envelope.
- **Persistence** — the `QuizPersistence` adapter interface, `noopPersistence`,
  `httpPersistence(endpoint)`, and `buildSessionRecord` (generic). The concrete
  Supabase write lives in the host app, never here.
- **AI** — the `Narrator` transport: `makeNarrator(complete)` relays a quiz's
  composed prompt to an injected model and **falls back to the deterministic
  draft** on any failure. Each quiz composes its own draft + prompt.
- **Engine helpers** — `bandFor`, `rankDesc`, `marginConfidence`, `round`.
- **UI** (`./ui`) — themeable presentational primitives (`QuizFrame`,
  `SingleChoice`, `MultiChoice`, `Button`, `Check`). Markup is fixed; appearance
  comes from `--q-*` CSS variables, so each quiz sets `theme` on `<QuizFrame>`
  and ships a small `theme.css` overriding the variables. Structural CSS:
  `./ui/quiz.css`.

## Pattern
A quiz package owns its taxonomy, engine, config/content, result library, AI
composer, and a `theme.css`; it imports the primitives + adapters + helpers from
here. See either quiz package's `AGENTS.md`.

```ts
import { httpPersistence, makeNarrator, bandFor } from "@blh/quiz-core";
import { QuizFrame, SingleChoice } from "@blh/quiz-core/ui";
```

`npm test` · `npm run typecheck`.
