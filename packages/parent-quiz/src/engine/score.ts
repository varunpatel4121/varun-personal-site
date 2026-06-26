/**
 * Parent-quiz deterministic scorer (Scoring System doc). Pipeline:
 *   accumulate per-pattern points + severity deltas + flags + signals
 *   → conditional rule (one-more + sleep ⇒ BMS)
 *   → selectPatterns() applies the hard rules + primary/secondary selection
 *   → severity band (impact / control strain / risk) ⇒ support urgency
 *   → structured output payload.
 * The AI only warms the result copy afterward; assignment is rule-based.
 */

import { marginConfidence, round } from "@blh/quiz-core";
import {
  PARENT_PATTERNS,
  PROBLEM_PATTERNS,
  URGENCY_FOR_BAND,
  SEVERITY_BANDS,
  type ParentOutput,
  type ParentPattern,
  type ParentResponse,
  type SeverityBand,
} from "../types";
import { getOption, RESULT_BY_ID, scoringConfig, type ParentScoringConfig } from "../config";
import { selectPatterns } from "./hard-rules";

function zero<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

const bandRank = (b: SeverityBand) => SEVERITY_BANDS.indexOf(b);
const maxBand = (a: SeverityBand, b: SeverityBand): SeverityBand => (bandRank(a) >= bandRank(b) ? a : b);

export function score(
  response: ParentResponse,
  config: ParentScoringConfig = scoringConfig,
): ParentOutput {
  const scores = zero(PARENT_PATTERNS);
  const flags = new Set<string>();
  const signals = new Set<string>();
  const selected = new Set<string>();
  let severityScore = 0;
  let primaryConcern: string | null = null;

  for (const [qid, values] of Object.entries(response.answers)) {
    values.forEach((v, idx) => {
      const o = getOption(qid, v);
      if (!o) return;
      selected.add(v);
      if (o.patterns) for (const [k, w] of Object.entries(o.patterns)) scores[k as ParentPattern] += w;
      if (o.severity) severityScore += o.severity;
      o.flags?.forEach((f) => flags.add(f));
      o.signals?.forEach((s) => signals.add(s));
      if (qid === "q1_concern" && idx === 0) primaryConcern = v;
    });
  }

  // Conditional (doc): "one more round" + any sleep signal ⇒ Bedtime/Morning +1.
  if (selected.has("q2_one_more") && signals.has("sleep")) scores.BMS += 1;

  const sel = selectPatterns({ scores, selected, signals, config });

  // ── Severity band ──────────────────────────────────────────────────────────
  // Base from impact (cost domains, aftermath) minus low-signal answers.
  let band: SeverityBand =
    severityScore >= config.severityThresholds.high_support_need
      ? "high_support_need"
      : severityScore >= config.severityThresholds.moderate
        ? "moderate"
        : "light";
  // Hard-rule floor: safety ⇒ safety_urgent, money/secrecy ⇒ high_support_need.
  if (sel.safety) band = "safety_urgent";
  else if (sel.urgencyFloor === "high") band = maxBand(band, "high_support_need");
  // A collaborative/monitoring result never reads above moderate.
  if (sel.primary === "LOW" && bandRank(band) > bandRank("moderate")) band = "moderate";

  const support_urgency = URGENCY_FOR_BAND[band];

  // Confidence from the top two problem-pattern scores.
  const problemDesc = PROBLEM_PATTERNS.map((p) => scores[p]).sort((a, b) => b - a);

  const primaryResult = RESULT_BY_ID[sel.primary];

  return {
    primary_pattern: sel.primary,
    primary_result_name: primaryResult.name,
    secondary_patterns: sel.secondaries,
    severity_band: band,
    support_urgency,
    safety_flag: sel.safety,
    evidence_signals: [...signals].sort(),
    result_copy_key: primaryResult.copyKey,
    primary_concern: primaryConcern,
    age_band: response.ageBand ?? null,
    confidence: marginConfidence(problemDesc[0] ?? 0, problemDesc[1] ?? 0, config.confidence),
    hard_rules_triggered: sel.triggered,
    copy_generation_mode: "deterministic",
    spectrum: Object.fromEntries(
      PARENT_PATTERNS.map((k) => [k, round(scores[k])]),
    ) as Record<ParentPattern, number>,
  };
}
