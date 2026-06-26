# Config sources — Blue Light Health "AI Quiz / Parent Quiz" folder

Every value in `src/config/` traces back to **two documents** in the Blue Light
Health Google Drive, in **AI Quiz → Parent Quiz**:

📁 **Drive folder:** <https://drive.google.com/drive/u/0/folders/1aouYdVqSbrQgGjASTnfruDSqvI-7kg-4> → `Parent Quiz/`

| Doc | Produces |
|-----|----------|
| **Parent Quiz Strategy & Voice (v1)** | the voice, the funnel shape, the result-page formula, ad/ethical guardrails → `content.json` + the result framing |
| **Parent Quiz Taxonomy & Question Bank (v1)** | tags, the 9 questions + answer→tag mapping → `questions.json`; the 10-entry result library → `results.json`; the scoring sketch + hard rules + support bands → `scoring.json` + `src/engine/hard-rules.ts` |

Local text exports of both docs are committed here for provenance
(`strategy_voice_v1.txt`, `taxonomy_question_bank_v1.txt`).

## Generated vs hand-authored
All parent-quiz config is **hand-authored** from these two docs (there is no
generator — the doc is short enough to transcribe directly). When the docs
change, edit the JSON to match and run `npm test`.

## Reconciliations / doc improvements
The docs are excellent and were followed closely. Two small reconciliations
(documented in `../../SCORING.md`):
- **`DAILY_BATTLE`** is listed as a "child tech loop" tag but is really a
  *family* pattern. We keep it as a scorable loop (so "The Daily Battle Loop"
  result is reachable) **and** map it to the `battle` family pattern.
- **Answer weights** (1–3 points) weren't fully specified per option; we assigned
  defensible weights (strong single-select "concern" + "job" questions = 3;
  multi-selects = 1–2) — see `questions.json` and SCORING.md.
