# Parent Quiz — Scoring (v2)

Deterministic engine for the parent funnel. Source of truth = the **three docs**
in the Drive **AI Quiz / Parent Quiz** folder (see `config/source/SOURCES.md`):
*Parent Quiz Taxonomy & Question Bank*, *Parent Quiz Scoring System*, and the
*Parent Phenotype Library*. The engine classifies; the LLM only warms the copy.

## Formulation

`Observable Concern(s) × Limit Response × Timing / Aftermath × Cost × Parent Role`
→ a **primary** + up to two **secondary** parent patterns, a **severity band**,
and a **support-urgency** signal.

## Parent patterns

| id | name |
|----|------|
| `LB` | The Limit Battle |
| `EP` | The Exhausted Peacekeeper |
| `BMS` | The Bedtime/Morning Spiral |
| `QPA` | The Quiet Pull-Away |
| `SWL` | The Social Weather Loop |
| `OLS` | The Offline-Life Shrink |
| `SRS` | The Secrecy and Risk Spiral |
| `LOW` | No strong problem pattern / collaborative monitoring |

## Pipeline (`src/engine/score.ts`)

1. **Accumulate** from each selected option (`config/questions.json`, keyed by the
   doc's canonical answer ids, e.g. `q1_limits_fight`): per-pattern **points**, a
   **severity** delta, **flags** (`safety` / `money` / `secrecy` / `srs_risk` /
   `high_urgency` / `activation` / `low_signal`), and **evidence signals**.
2. **Conditional rule** — `q2_one_more` + any sleep signal ⇒ `BMS +1`.
3. **Selection** (`hard-rules.ts → selectPatterns`): apply hard rules, pick the
   primary, then the secondaries.
4. **Severity band** ⇒ **support urgency** (1:1 mapping).
5. **Output payload**.

### Hard rules (`selectPatterns`)

1. `PR_SAFETY` — `q5_safety` ⇒ primary **SRS**, `supportUrgency = safety_urgent`,
   `safety_flag` (UI shows 988 / emergency guidance, bypassing the funnel).
2. `PR_RISK_CLUSTER` — **≥2** of `{q1_money, q5_money, q2_sneak_hide, q4_secretive,
   q5_secrecy}` ⇒ prioritize **SRS**, urgency floor **high**.
   (`PR_MONEY_SECRECY` — a single money/secrecy answer still floors urgency high.)
3. `PR_LOW_MONITORING` — no problem pattern reaches the primary threshold ⇒
   **LOW** (light, collaborative-monitoring result, not a pathology result).
4. **BMS tie** — BMS ≥ `bmsTieMinScore` (6) with a sleep impact wins ties over OLS/LB.
5. **EP vs LB tie** — EP wins only with `q2_avoid_limit` / `q6_peacekeeper`, else LB.
6. **SWL vs QPA tie** — SWL on social signals (`social_fallout` / `self_image`),
   QPA on distance (`withdrawal`).

### Primary / secondary selection

- **Primary** = highest-scoring non-LOW pattern after hard rules; eligible at
  `primaryMinScore` (5) or above, unless a hard rule forces it. Below that ⇒ LOW.
- **Secondary** = non-primary problem patterns with ≥ `secondaryMinScore` (4)
  points **and** within `secondaryWithin` (3) of the primary; at most `maxSecondary` (2).

### Severity → support urgency

`severityScore` = Σ per-option severity deltas (each cost domain +1, aftermath
activation +1; low-signal answers negative). Then:

| condition | band | urgency |
|-----------|------|---------|
| `q5_safety` | `safety_urgent` | `safety_urgent` |
| money/secrecy high-urgency floor | `high_support_need` | `high` |
| `severityScore ≥ 3` | `high_support_need` | `high` |
| `severityScore ≥ 1` | `moderate` | `moderate` |
| else | `light` | `low` |

A `LOW` primary is capped at `moderate` (a collaborative result never reads "high").

## Output payload (`ParentOutput`)

`primary_pattern`, `primary_result_name`, `secondary_patterns[]`, `severity_band`,
`support_urgency`, `safety_flag`, `evidence_signals[]`, `result_copy_key`,
`primary_concern`, `age_band`, `confidence`, `hard_rules_triggered[]`, and the
full 8-pattern `spectrum`. (Mirrors the Scoring System doc's example payload.)

## Tuning surface

All weights/flags/severity deltas live in `config/questions.json`; thresholds in
`config/scoring.json`; result copy in `config/results.json`. No code change is
needed to retune — edit the JSON to match the doc and run `npm test`.

## Reconciliations / doc improvements

- **Age** is a copy modifier only (`ageNote`), never a scoring input (per the doc).
- The doc's qualitative severity definitions are made concrete as the
  `severityScore` thresholds above.
- Generic ties with no governing rule resolve by a fixed clinical priority
  (`SRS > BMS > SWL > QPA > OLS > LB > EP`); the rule-paired patterns are kept
  adjacent so the documented tie-breaks stay consistent.
- A `LOW` (collaborative monitoring) result is authored locally — the Phenotype
  Library covers only the seven problem patterns.

## Tests (`src/engine/score.test.ts`)

`selectPatterns` unit tests for the primary threshold, secondary windowing, and
hard rules 1–6 (synthetic scores); end-to-end `score` tests for all 8 patterns'
reachability, safety/money routing, the BMS conditional, severity banding, and
determinism. `npm test`.
