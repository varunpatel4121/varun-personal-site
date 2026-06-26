/**
 * Parent-quiz hard rules + primary/secondary selection (Scoring System doc →
 * "Hard Rules" and "Primary And Secondary Selection"). Deterministic and pure.
 *
 * Rules, in order:
 *  1. q5_safety  → primary SRS, supportUrgency safety_urgent.
 *  2. ≥2 of {q1_money, q5_money, q2_sneak_hide, q4_secretive, q5_secrecy}
 *     → prioritize SRS, supportUrgency high.
 *  3. low-signal answers dominate → LOW (collaborative monitoring), no forced
 *     problem pattern (handled by the ≥5 primary threshold).
 *  4. BMS ≥ 6 and any sleep impact → BMS wins ties over OLS and LB.
 *  5. EP vs LB tie → EP only with q2_avoid_limit / q6_peacekeeper, else LB.
 *  6. SWL vs QPA tie → SWL on social signals, QPA on distance/withdrawal.
 */

import {
  PROBLEM_PATTERNS,
  SUPPORT_URGENCY,
  type ParentPattern,
  type ProblemPattern,
  type SupportUrgency,
} from "../types";
import type { ParentScoringConfig } from "../config";

/** Answers that, in pairs, escalate to the Secrecy & Risk Spiral (rule 2). */
export const RISK_IDS = ["q1_money", "q5_money", "q2_sneak_hide", "q4_secretive", "q5_secrecy"] as const;
/** Single-answer high-urgency flags (money / secrecy). */
const HIGH_URGENCY_IDS = ["q1_money", "q5_money", "q5_secrecy"] as const;

/** Generic tie order for patterns with no governing rule (rule-paired patterns kept adjacent). */
const PRIORITY: ProblemPattern[] = ["SRS", "BMS", "SWL", "QPA", "OLS", "LB", "EP"];

export interface SelectionInput {
  scores: Record<ParentPattern, number>;
  selected: Set<string>;
  signals: Set<string>;
  config: ParentScoringConfig;
}

export interface SelectionResult {
  primary: ParentPattern;
  secondaries: ProblemPattern[];
  triggered: string[];
  safety: boolean;
  /** Floor the support urgency from money/secrecy/safety rules (null = no floor). */
  urgencyFloor: SupportUrgency | null;
}

const urgencyRank = (u: SupportUrgency) => SUPPORT_URGENCY.indexOf(u);
const maxUrgency = (a: SupportUrgency | null, b: SupportUrgency): SupportUrgency =>
  a && urgencyRank(a) >= urgencyRank(b) ? a : b;

/** Resolve the winner among patterns tied at the top score (hard rules 4–6). */
function resolveTie(tied: ProblemPattern[], topScore: number, input: SelectionInput): ProblemPattern {
  if (tied.length === 1) return tied[0]!;
  const { selected, signals, config } = input;
  const has = (p: ProblemPattern) => tied.includes(p);
  const sleepImpact = signals.has("sleep");
  const socialSignal = signals.has("social_fallout") || signals.has("self_image");
  const distanceSignal = signals.has("withdrawal");
  const epOverLb = selected.has("q2_avoid_limit") || selected.has("q6_peacekeeper");

  const weight = (p: ProblemPattern): number => {
    let w = 0;
    // Rule 4 — BMS over OLS/LB when gated by score + a sleep impact.
    if (p === "BMS" && topScore >= config.bmsTieMinScore && sleepImpact && (has("OLS") || has("LB"))) w += 4;
    // Rule 6 — SWL vs QPA.
    if (has("SWL") && has("QPA")) {
      if (p === "SWL") w += socialSignal && !distanceSignal ? 3 : distanceSignal && !socialSignal ? -3 : 0;
      if (p === "QPA") w += distanceSignal && !socialSignal ? 3 : socialSignal && !distanceSignal ? -3 : 0;
    }
    // Rule 5 — EP vs LB.
    if (has("EP") && has("LB")) {
      if (p === "EP") w += epOverLb ? 2 : -2;
      if (p === "LB") w += epOverLb ? -2 : 2;
    }
    return w;
  };

  return [...tied].sort((a, b) => {
    const dw = weight(b) - weight(a);
    if (dw !== 0) return dw;
    return PRIORITY.indexOf(a) - PRIORITY.indexOf(b);
  })[0]!;
}

export function selectPatterns(input: SelectionInput): SelectionResult {
  const { scores, selected, config } = input;
  const triggered: string[] = [];
  let safety = false;
  let urgencyFloor: SupportUrgency | null = null;
  let forcedPrimary: ProblemPattern | null = null;

  // Rule 1 — safety overrides everything.
  if (selected.has("q5_safety")) {
    safety = true;
    forcedPrimary = "SRS";
    urgencyFloor = "safety_urgent";
    triggered.push("PR_SAFETY");
  }

  // Rule 2 — two or more risk answers cluster into the Secrecy & Risk Spiral.
  const riskCount = RISK_IDS.filter((id) => selected.has(id)).length;
  if (riskCount >= 2) {
    forcedPrimary = forcedPrimary ?? "SRS";
    urgencyFloor = maxUrgency(urgencyFloor, "high");
    triggered.push("PR_RISK_CLUSTER");
  } else if (HIGH_URGENCY_IDS.some((id) => selected.has(id))) {
    // A single money/secrecy answer still raises urgency.
    urgencyFloor = maxUrgency(urgencyFloor, "high");
    if (!safety) triggered.push("PR_MONEY_SECRECY");
  }

  // Rank problem patterns by score (desc).
  const ranked = PROBLEM_PATTERNS.map((p) => [p, scores[p]] as [ProblemPattern, number]).sort(
    (a, b) => b[1] - a[1] || PRIORITY.indexOf(a[0]) - PRIORITY.indexOf(b[0]),
  );

  // Primary selection.
  let primary: ParentPattern;
  if (forcedPrimary) {
    primary = forcedPrimary;
  } else {
    const topScore = ranked[0]?.[1] ?? 0;
    const tied = ranked.filter(([, s]) => s === topScore).map(([p]) => p);
    if (topScore >= config.primaryMinScore) {
      primary = resolveTie(tied, topScore, input);
    } else {
      primary = "LOW";
      triggered.push("PR_LOW_MONITORING");
    }
  }

  // Secondaries — non-primary problem patterns ≥ threshold and within range.
  let secondaries: ProblemPattern[] = [];
  if (primary !== "LOW") {
    const primaryScore = scores[primary as ProblemPattern];
    secondaries = ranked
      .filter(([p, s]) => p !== primary && s >= config.secondaryMinScore && primaryScore - s <= config.secondaryWithin)
      .slice(0, config.maxSecondary)
      .map(([p]) => p);
  }

  return { primary, secondaries, triggered, safety, urgencyFloor };
}
