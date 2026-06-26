# Tech Loop Quiz — Scoring Engine

This is the implemented, authoritative spec for the deterministic scoring
engine. It is a faithful translation of the **Phenotype Scoring Rules** sheet
(Blue Light Health · `AI Quiz/` folder), with a handful of reconciliations and
implementation decisions documented below.

> **Principle:** the deterministic engine classifies; the LLM only narrates.
> Phenotype assignment and severity are rule-based and auditable. No live AI is
> required to produce a result.

## Pipeline

`normalize → low-concern check → score fit → eligibility gates → hard rules →
rank → tie-breakers → severity (separate) → confidence → output contract`

Implemented across `src/engine/`:

| Step | File | What it does |
|------|------|--------------|
| Normalize | `normalize.ts` | `QuizResponse` → deduped `Signal[]` + scalars |
| Score fit | `score.ts` (`scoreFit`) | sum `weight × anchorFactor` over matching rule-weight rows |
| Gates | `gates.ts` | cap / block phenotypes whose required signals are missing |
| Hard rules | `hard-rules.ts` | 12 priority-ordered overrides (force, boost, floor, adaptive, safety) |
| Tie-breakers | `tie-breakers.ts` | reorder the top pair using signature/aftertaste signals |
| Severity | `severity.ts` | scored separately from fit; floors/caps from hard rules |
| Output | `score.ts` (`buildResult`) | the deterministic Output Contract + formulation sentence |

All weights, gates, tie-breakers, and severity rules live in `src/config/*.json`
so clinical can tune them **without touching code**.

## Tag taxonomy (9 signal types)

`hook` (14) · `job` (7) · `entry_point` (9) · `loop_shape` (8) · `aftertaste`
(11) · `cost_domain` (9) · `severity_marker` (9) · `tie_breaker` (17) ·
`platform_feature` (9). Canonical ids in `src/types/taxonomy.ts`; display labels
in `src/config/tags.json`.

## Answer → signal mapping (implementation decisions)

The sheet lists *signals*; these are how the quiz answers actually produce them.

1. **Jobs are derived from hooks.** Section D captures *hooks* via the
   sub-feature questions; the rule weights also score *job* tags. Per the Tech
   Loop Quiz doc ("the hook represents the underlying job"), each selected hook
   contributes its `hookJobMap` jobs (deduped, max anchor factor). This matches
   the acceptance cases, which carry both hook and job signals.
2. **Anchor-rank multiplier.** The 3 sub-features are ranked by selection order;
   their hook signals are weighted `×1.25 / 1.0 / 0.85` (`params.json →
   anchorRankMultipliers`). A repeated hook keeps the max factor.
3. **Platform features are derived** from the selected platforms/sub-features
   (`platforms.json → platformFeature`), not asked directly.
4. **Tie-breakers via disambiguation.** Each phenotype's recognition line *is*
   its `tie_breaker` tag (weight 4). With no live AI deciding, the UI shows a
   single disambiguation step **only when the top two are within
   `mixedMargin`**; the user's pick sets the tie-breaker. Skipped when there's a
   clear leader.

## Severity (separate from fit)

`baselineSelfRating + controlFrequency + Σ markerPoints + min(4, costCount) +
modifiers`, then hard-rule floors/caps. Bands: `light_grip 0–4`, `steady_pull
5–9`, `deep_loop 10–15`, `high_impact_loop 16+`. Modifiers: money+reward,
sleep+night, self/body+comparison (+1 each). Only-`none_meaningful` cost caps at
4 unless a hard rule floors it.

## Reconciliations (conflicts resolved)

Sources sometimes disagreed; the **Scoring Rules sheet is the scoring
authority**. Decisions:

- **Severity bands = 4** (`…/high_impact_loop`), per Scoring Rules, over the Tech
  Loop Quiz doc's "3 bands".
- **Compensation Stage = +2**, labelled "Compensation Stage" (non-diagnostic),
  over the taxonomy sheet's "Addiction Stage +3" (addiction language violates
  `HR_LANGUAGE_001`).
- **Gap Filling / Task Avoidance labels** use the taxonomy sheet's
  semantically-correct mapping (Gap Filling = *between things*; Task Avoidance =
  *right before a hard task*); the quiz doc had these swapped.
- **`HR_LOW_001` is a severity cap + adaptive framing, not a hard override.** A
  clear benign pattern (e.g. Second Self) still surfaces at light grip;
  `no_dominant_loop` only emerges when nothing scored. (This fixed acceptance
  case `EX_SECOND_ADAPT_01`.)
- **Out of scope** (per product direction — these came from documents *outside*
  the `AI Quiz/` folder and were intentionally excluded): validated screeners
  (IAT/SAS/PMUM), the parent flow, the "Ground" block, and the "0–100 fit per
  phenotype" idea. The engine emits raw fit scores + confidence + a full
  spectrum instead.

## Output Contract

`primary_phenotype_id` (or `no_dominant_loop`), `primary_phenotype_name`,
`primary_score`, `primary_confidence` (high|medium|low|mixed), `primary_adaptive`,
`secondary_phenotype_id/name`, `severity_score`, `severity_label`,
`top_hook_tags`, `top_job_tags`, `top_entry_points`, `top_loop_shapes`,
`cost_domains`, `platform_features`, `hard_rules_triggered`,
`formulation_sentence`, `copy_generation_mode`, `safety_triggered`. The engine
also returns the full 17-phenotype `spectrum` and per-phenotype audit detail.

## Tests

`src/engine/acceptance.test.ts` ports all 13 `EX_*` cases from the sheet;
`severity.test.ts`, `normalize.test.ts`, and `config/config.test.ts` cover the
formula, the answer→signal mapping, gate blocking, determinism, and config
integrity. **36 tests.** Run: `npm test` (in the package) or
`vitest run`.

## Regenerating mechanical config

`tags.json`, `phenotype-meta.json`, `rule-weights.json`, `platforms.json`, and
`subfeature-questions.json` are generated from the committed source sheets in
`config/source/` by `scripts/generate-config.py`. Re-run after editing the
source: `python3 scripts/generate-config.py`.
