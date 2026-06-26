# Parent Quiz — Scoring

Deterministic engine for the parent funnel. Source of truth = the two docs in
the Drive **AI Quiz / Parent Quiz** folder (see `config/source/SOURCES.md`).
The engine classifies; the LLM only warms the result copy.

## Formulation

`Child Tech Loop × Family Screen Pattern × Cost × Support Urgency`

## Pipeline (`src/engine/score.ts`)

1. **Accumulate** tags from selected options (`config/questions.json`): child-loop
   weights, family-pattern weights, cost domains, urgency points, urgency
   markers, hard-rule flags, parent role, CTA readiness.
2. **Rank child loops** (`rankDesc`, canonical-order tiebreak). Primary = top;
   **secondary** = runner-up if ≥ 70% of the primary (`secondaryRatio`).
3. **Family pattern** = top family tag (from Q2 + Q7).
4. **Support urgency** = `urgency points + min(costCap, distinct cost domains)` →
   band via `supportBands` (`normal_tension / pattern_forming /
   family_impact_loop / support_recommended`).
5. **Hard rules** (`hard-rules.ts`) adjust the band / route to safety:
   - `PR_SAFETY` — any safety concern → **safety_route** (bypasses the marketing
     result; UI shows 988/emergency guidance).
   - `PR_REWARD_MONEY` — reward flag + money cost → force Reward Chase as
     secondary + raise a band.
   - `PR_NIGHT_SLEEP` — night off-switch + sleep cost + failed limits → +1 band.
   - `PR_CONCEAL` — concealment + functional/trust cost → +1 band.
   - `PR_LOW_CONCERN` — low-concern + collaborative family + no markers → cap at
     `normal_tension` (don't over-sell therapy).
6. **Confidence** from the top score + margin (`marginConfidence`, shared core).
7. **Output contract** — primary/secondary loop, family pattern, parent role,
   support level, cost domains, urgency markers, safety flag, CTA readiness,
   primary concern, hard rules, and the 10-loop spectrum.

## Weights

Strong single-select signals (Q1 "what brings you here", Q4 "what is the screen
giving them") add **3** to the loop; multi-selects (Q3, Q5) add **1–2**; Q2/Q7
feed family patterns + urgency; Q6/Q8 feed costs + urgency markers + hard-rule
flags. All weights live in `config/questions.json` so they're tunable without
code. Full per-option mapping is in that file.

## Reconciliations / doc improvements

- **`daily_battle`** is scored as a child loop (so "The Daily Battle Loop" is
  reachable) *and* mapped to the `battle` family pattern — the doc lists it as a
  loop tag though it's relational.
- The doc's "each answer adds 1–3 points" was made concrete (above); see
  `config/questions.json`.
- A gentle fallback (`autopilot_zone_out` + `normal_tension`) covers the rare
  case where a parent's answers score no loop at all.

## Tests (`src/engine/score.test.ts`)

All 10 child loops reachable as primary; each hard rule (safety, reward+money,
night+sleep, low-concern); support banding; the 70% secondary rule; determinism.
`npm test` (18 cases).
