# Config sources — Blue Light Health "AI Quiz" folder

**Every value in `src/config/` traces back to one of five authoritative
documents** in the Blue Light Health Google Drive **"AI Quiz"** folder. That
folder is the single source of truth for this quiz.

📁 **Drive folder:** <https://drive.google.com/drive/u/0/folders/1aouYdVqSbrQgGjASTnfruDSqvI-7kg-4>

> ⚠️ Do **not** use the older `Blue Light Health/Phenotypes/` docx set (product
> brief, taxonomy v1, TUFM, prototype HTML). It is stale and explicitly out of
> scope. Only the five docs below are authoritative.

## The five source docs → which config they produce

| # | AI Quiz doc | Link | Produces |
|---|-------------|------|----------|
| 1 | **Tech Loop Quiz** (Doc) | [open](https://docs.google.com/document/d/1LKdkaKbW7_xfM-k4IphB0hN_FDncA23W6FUdem9bZi8/edit) | `quiz-content.json` (flow, copy, option labels); the overall section order Frame→Baseline→Pull→Job→Loop→Cost→Result |
| 2 | **Phenotype Scoring Rules** (Sheet) | [open](https://docs.google.com/spreadsheets/d/1Odr2P4IapJCsLYw_3ICz7gZXkewgDfDpzzn3HZLa7vg/edit) | `tags.json`, `phenotype-meta.json`, `rule-weights.json` (generated); `gates.json`, `tie-breakers.json`, `severity.json`, `params.json`, and the hard rules in `src/engine/hard-rules.ts` (hand-authored from its tables) |
| 3 | **Phenotype Library v2** (Sheet) | [open](https://docs.google.com/spreadsheets/d/1FAu_mIhZDlyMPOVR3mqIIBwNoFDUQU4t4HzudXYyvUM/edit) | `phenotypes.json` (result copy + clinician metadata + AI corpus) |
| 4 | **Phenotypes Quiz Taxonomy** (Sheet) | [open](https://docs.google.com/spreadsheets/d/1ZSHLkYj3a50e-hXFBCpD3l-_IsfqKdYLv2iRM-QGllE/edit) | `hook-job-map.json` (Hook Dictionary "Cognition" column); dictionary option labels in `quiz-content.json` |
| 5 | **[Sub-feature, Hook] Questions & Answer Options** (Sheet) | [open](https://docs.google.com/spreadsheets/d/1TVObvnZPQKmk01y1IQu6Iudb0dExbDGnluCIUWjKQHM/edit) | `platforms.json`, `subfeature-questions.json` (generated) |

## Local exports in this folder (provenance)

Two docs are exported here as text and parsed by the generator:

- `scoring-rules.md` — text export of doc #2 (Phenotype Scoring Rules)
- `subfeature-questions.md` — text export of doc #5 (Sub-feature/Hook Q&A)

## Generated vs hand-authored

| Config file | How it's produced | When to regenerate |
|-------------|-------------------|--------------------|
| `tags.json`, `phenotype-meta.json`, `rule-weights.json` | **generated** from `scoring-rules.md` | re-export doc #2 → run generator |
| `platforms.json`, `subfeature-questions.json` | **generated** from `subfeature-questions.md` | re-export doc #5 → run generator |
| `gates.json`, `tie-breakers.json`, `severity.json`, `params.json`, `hook-job-map.json` | **hand-authored** from docs #2 & #4 | edit by hand when those tables change |
| `phenotypes.json` | **hand-authored** from doc #3 | edit by hand when the library changes |
| `quiz-content.json` | **hand-authored** from docs #1 & #4 | edit by hand when copy changes |
| hard rules (`src/engine/hard-rules.ts`) | **code** (logic) from doc #2 | edit code when rule logic changes |

## Refreshing config after a sheet changes

1. Re-export the changed sheet to its `.md` here (doc #2 → `scoring-rules.md`,
   doc #5 → `subfeature-questions.md`). Keep the markdown-table format.
2. Run `python3 scripts/generate-config.py` from the package root.
3. For hand-authored files, edit the JSON directly to match the sheet.
4. Run `npm test` — `config/config.test.ts` guards against drift, and the
   acceptance tests guard the scoring behaviour.

Reconciliations (where the docs disagreed) are documented in
[`../../SCORING.md`](../../SCORING.md) → "Reconciliations".
