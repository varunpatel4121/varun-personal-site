# Config sources — Blue Light Health "AI Quiz / Parent Quiz" folder

Every value in `src/config/` traces back to **three documents** in the Blue Light
Health Google Drive, in **AI Quiz → Parent Quiz**:

📁 **Drive folder:** <https://drive.google.com/drive/u/0/folders/1aouYdVqSbrQgGjASTnfruDSqvI-7kg-4> → `Parent Quiz/`

| Doc | Produces |
|-----|----------|
| **Parent Quiz Taxonomy & Question Bank (v1)** | the 7 patterns; the age + Q1–Q6 question bank → `questions.json` (labels, ids, `max`); the result-feedback question → `content.json` |
| **Parent Quiz Scoring System** | the canonical answer-id → pattern points / severity / flags map → `questions.json`; the hard rules, primary/secondary selection, and severity bands → `scoring.json` + `src/engine/hard-rules.ts` + `src/engine/score.ts`; the output payload shape → `ParentOutput` |
| **Parent Phenotype Library** (Google Sheet) | the parent-facing result copy for the 7 patterns (name, short label, recognition line, "this is us" read, observe / loop / cost / when-normal / when-problem / what-helps / support bridge) → `results.json` |

The canonical backend **answer ids** (e.g. `q1_limits_fight`, `q5_safety`) come
straight from the Scoring System doc's *Answer ID Scoring Map* and are used as the
option `value`s, so config ⇄ doc map 1:1 and the persisted data is doc-aligned.

## Generated vs hand-authored

All parent-quiz config is **hand-authored** from these three docs (no generator —
they're short enough to transcribe directly). When a doc changes, edit the JSON to
match and run `npm test`.

## Reconciliations / doc improvements

The docs are the source of truth and were followed closely. Small reconciliations
(detailed in `../../SCORING.md`):

- **Age** is a copy modifier only (`ageNote`), never scored — per the doc.
- The doc's qualitative **severity** definitions are made concrete as numeric
  `severityScore` thresholds (`scoring.json`).
- **Generic ties** with no governing hard rule resolve by a fixed clinical
  priority order; the three rule-paired patterns stay adjacent so the documented
  tie-breaks (rules 4–6) hold.
- A **`LOW`** (collaborative monitoring) result is authored locally — the
  Phenotype Library covers only the seven problem patterns.
