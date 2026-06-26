/**
 * Hard rules (Scoring Rules · "Hard Rules"), priority-ordered. These run after
 * point scoring + gates and can force a phenotype, boost it, floor/cap severity,
 * mark a pattern adaptive, flag a low-concern result, or trigger safety routing.
 * They are code (not JSON) because they read scalars, free text, and ranking.
 *
 * HR_LOW_001 (priority 1) is checked separately and early (see hasLowConcern).
 * HR_LANGUAGE_001 (priority 12) is a copy rule enforced in the copy/AI layer.
 */

import type { HardRuleEffect, PhenotypeId, Signal } from "../types";
import { has, tagsOfType } from "./signals";

const IMPAIRED_CONTROL_MARKERS = [
  "loss_control",
  "failed_cutback",
  "concealment",
  "interference_harm",
];
const DISTRESS_AFTERTASTES = [
  "guilty_ashamed",
  "worse_self_body",
  "more_anxious",
  "more_lonely",
];

const SAFETY_PATTERNS: RegExp[] = [
  /\b(kill|hurt|harm|cut)(ing)?\s+myself\b/i,
  /\bsuicid/i,
  /\bend(ing)?\s+(it|my life)\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bself[-\s]?harm/i,
  /\babus(e|ed|ing)\b/i,
  /\b(unsafe|texting|drunk)\s+driv/i,
];

/** HR_LOW_001 — checked before scoring; benign, low-cost use is not a loop. */
export function hasLowConcern(
  signals: Signal[],
  baselineSelfRating: number,
  controlFrequency: number,
): boolean {
  return (
    baselineSelfRating <= 1 &&
    controlFrequency <= 1 &&
    tagsOfType(signals, "severity_marker").length === 0 &&
    tagsOfType(signals, "cost_domain").length === 0 &&
    has(signals, "cost_domain", "none_meaningful")
  );
}

export interface HardRuleContext {
  signals: Signal[];
  baselineSelfRating: number;
  controlFrequency: number;
  freeText: string[];
  /** Eligible phenotypes ranked by score, descending. */
  ranked: PhenotypeId[];
}

export interface HardRuleResult {
  effects: HardRuleEffect[];
  triggered: string[];
}

export function evaluateSafety(freeText: string[]): boolean {
  return freeText.some((t) => SAFETY_PATTERNS.some((re) => re.test(t)));
}

export function evaluateHardRules(ctx: HardRuleContext): HardRuleResult {
  const { signals } = ctx;
  const effects: HardRuleEffect[] = [];
  const triggered: string[] = [];
  const top3 = new Set(ctx.ranked.slice(0, 3));
  const top2 = new Set(ctx.ranked.slice(0, 2));
  const scoredCosts = tagsOfType(signals, "cost_domain").length;
  const markers = tagsOfType(signals, "severity_marker").length;

  const fire = (e: HardRuleEffect) => {
    effects.push(e);
    triggered.push(e.ruleId);
  };

  // HR_REWARD_001 (priority 2)
  if (
    (has(signals, "hook", "reward_chase") ||
      has(signals, "platform_feature", "betting_trading_gambling")) &&
    has(signals, "cost_domain", "money") &&
    IMPAIRED_CONTROL_MARKERS.some((m) => has(signals, "severity_marker", m))
  ) {
    fire({
      ruleId: "HR_REWARD_001",
      forcePrimary: "reward_chaser",
      severityFloor: "high_impact_loop",
    });
  }

  // HR_REWARD_002 (priority 3)
  if (
    has(signals, "hook", "reward_chase") &&
    has(signals, "tie_breaker", "next_one_could_be_one") &&
    has(signals, "aftertaste", "behind_panicked")
  ) {
    fire({ ruleId: "HR_REWARD_002", boost: { phenotype: "reward_chaser", amount: 4 } });
  }

  // HR_AROUSAL_001 (priority 4)
  if (
    has(signals, "hook", "arousal_pull") &&
    scoredCosts === 0 &&
    markers === 0 &&
    !DISTRESS_AFTERTASTES.some((a) => has(signals, "aftertaste", a))
  ) {
    fire({ ruleId: "HR_AROUSAL_001", adaptiveNote: "arousal_regulator", severityFloor: "light_grip" });
  }

  // HR_SECOND_001 (priority 5)
  if (
    has(signals, "hook", "second_self") &&
    scoredCosts === 0 &&
    ctx.controlFrequency <= 1
  ) {
    fire({ ruleId: "HR_SECOND_001", adaptiveNote: "second_self", severityFloor: "light_grip" });
  }

  // HR_HOME_001 (priority 6)
  if (
    has(signals, "hook", "belonging") &&
    has(signals, "aftertaste", "connected") &&
    !has(signals, "cost_domain", "friendships_dating_social") &&
    ctx.controlFrequency <= 1
  ) {
    fire({ ruleId: "HR_HOME_001", adaptiveNote: "online_home", severityFloor: "light_grip" });
  }

  // HR_NIGHT_001 (priority 7)
  if (
    has(signals, "entry_point", "night_regulation") &&
    has(signals, "cost_domain", "sleep") &&
    ctx.controlFrequency >= 3
  ) {
    const deeper =
      has(signals, "severity_marker", "loss_control") ||
      has(signals, "severity_marker", "interference_harm");
    fire({ ruleId: "HR_NIGHT_001", severityFloor: deeper ? "deep_loop" : "steady_pull" });
  }

  // HR_AWARENESS_001 (priority 8)
  if (
    has(signals, "severity_marker", "interference_harm") &&
    has(signals, "severity_marker", "failed_cutback") &&
    has(signals, "severity_marker", "loss_control")
  ) {
    fire({ ruleId: "HR_AWARENESS_001", severityFloor: "high_impact_loop" });
  }

  // HR_TIE_001 (priority 9) — money outranks anger when both are top
  if (
    top2.has("reward_chaser") &&
    top2.has("activation_loop") &&
    has(signals, "cost_domain", "money")
  ) {
    fire({ ruleId: "HR_TIE_001", forcePrimary: "reward_chaser" });
  }

  // HR_SAFETY_001 (priority 11)
  if (evaluateSafety(ctx.freeText)) {
    fire({ ruleId: "HR_SAFETY_001", safety: true, severityFloor: "high_impact_loop" });
  }

  // top3 referenced for parity with severity modifiers / future rules
  void top3;
  return { effects, triggered };
}
