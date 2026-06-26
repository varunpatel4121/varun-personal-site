/**
 * Parent-quiz deterministic scorer.
 *   accumulate tags → rank child loops → family pattern → support score
 *   (urgency + cost breadth) → hard rules (band raises / caps / safety) →
 *   primary + secondary (70% rule) → output contract.
 * AI only warms the copy afterward; assignment is rule-based.
 */

import { bandFor, marginConfidence, rankDesc, round } from "@blh/quiz-core";
import {
  CHILD_LOOPS,
  FAMILY_PATTERNS,
  SUPPORT_LEVELS,
  type ChildLoop,
  type CostDomain,
  type CtaReadiness,
  type FamilyPattern,
  type ParentOutput,
  type ParentResponse,
  type ParentRole,
  type SupportLevel,
  type UrgencyMarker,
} from "../types";
import { getOption, RESULT_BY_ID, scoringConfig, type ParentScoringConfig } from "../config";
import { evaluateParentHardRules } from "./hard-rules";

/** Gentle catch-all if a parent's answers score no loop at all. */
const FALLBACK_LOOP: ChildLoop = "autopilot_zone_out";

function zero<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

export function score(
  response: ParentResponse,
  config: ParentScoringConfig = scoringConfig,
): ParentOutput {
  const loopScores = zero(CHILD_LOOPS);
  const familyScores = zero(FAMILY_PATTERNS);
  const costs = new Set<CostDomain>();
  const markers = new Set<UrgencyMarker>();
  const hardRuleFlags = new Set<string>();
  let urgency = 0;
  let parentRole: ParentRole | null = null;
  let cta: CtaReadiness | null = null;
  let lowConcern = false;
  let primaryConcern: string | null = null;

  for (const [qid, values] of Object.entries(response.answers)) {
    for (const v of values) {
      const o = getOption(qid, v);
      if (!o) continue;
      if (o.loops) for (const [k, w] of Object.entries(o.loops)) loopScores[k as ChildLoop] += w;
      if (o.family) for (const [k, w] of Object.entries(o.family)) familyScores[k as FamilyPattern] += w;
      o.costs?.forEach((c) => costs.add(c));
      if (o.urgency) urgency += o.urgency;
      o.markers?.forEach((m) => markers.add(m));
      o.hardRules?.forEach((h) => hardRuleFlags.add(h));
      if (o.parentRole) parentRole = o.parentRole;
      if (o.cta) cta = o.cta;
      if (o.lowConcern) lowConcern = true;
    }
    if (qid === "q1_concern" && values[0]) primaryConcern = values[0];
  }

  // ── Child loop ranking ────────────────────────────────────────────────────
  const loopRanked = rankDesc(loopScores, CHILD_LOOPS);
  const primary: ChildLoop = loopRanked[0]?.[0] ?? FALLBACK_LOOP;
  const primaryScore = loopRanked[0]?.[1] ?? 0;
  const secondScore = loopRanked[1]?.[1] ?? 0;
  let secondary: ChildLoop | null =
    loopRanked[1] && secondScore >= config.secondaryRatio * primaryScore ? loopRanked[1][0] : null;

  // ── Family pattern ────────────────────────────────────────────────────────
  const familyRanked = rankDesc(familyScores, FAMILY_PATTERNS);
  const familyTop: FamilyPattern | null = familyRanked[0]?.[0] ?? null;

  // ── Support urgency ───────────────────────────────────────────────────────
  const supportScore = urgency + Math.min(config.costCap, costs.size);

  const { effects, triggered } = evaluateParentHardRules({
    loopScores,
    familyTop,
    costs,
    markers,
    hardRuleFlags,
    lowConcern,
    supportScore,
  });

  let safety = false;
  let bandIndex = SUPPORT_LEVELS.indexOf(bandFor(supportScore, config.supportBands) as SupportLevel);
  for (const e of effects) {
    if (e.safety) safety = true;
    if (e.bandDelta) bandIndex += e.bandDelta;
    if (e.forceSecondary && primary !== e.forceSecondary) secondary = e.forceSecondary;
    if (e.capBand) bandIndex = Math.min(bandIndex, SUPPORT_LEVELS.indexOf(e.capBand));
  }
  bandIndex = Math.max(0, Math.min(bandIndex, 3)); // clamp to the four scored bands
  const support_level: SupportLevel = safety ? "safety_route" : (SUPPORT_LEVELS[bandIndex] as SupportLevel);

  return {
    primary_child_loop: primary,
    primary_result_name: RESULT_BY_ID[primary].name,
    secondary_child_loop: secondary,
    family_pattern: familyTop,
    parent_role: parentRole,
    support_level,
    cost_domains: [...costs],
    urgency_markers: [...markers],
    urgency_score: supportScore,
    safety_flag: safety,
    cta_readiness: cta,
    primary_concern: primaryConcern,
    confidence: marginConfidence(primaryScore, secondScore, config.confidence),
    hard_rules_triggered: triggered,
    copy_generation_mode: "deterministic",
    spectrum: Object.fromEntries(
      CHILD_LOOPS.map((k) => [k, round(loopScores[k])]),
    ) as Record<ChildLoop, number>,
  };
}
