/**
 * Severity is scored separately from phenotype fit (Principle: "Severity is
 * separate"). It is computed from what the person tells us directly — baseline
 * self-rating, control frequency, severity markers, cost breadth — plus a few
 * contextual modifiers. Hard-rule floors/caps are applied afterward.
 */

import type {
  PhenotypeId,
  ScoringConfig,
  SeverityBand,
  SeverityResult,
  Signal,
} from "../types";
import { has, tagsOfType } from "./signals";

export function bandFor(score: number, config: ScoringConfig): SeverityBand {
  const bands = config.severity.bands;
  let band: SeverityBand = bands[0]!.id;
  for (const b of bands) if (score >= b.min) band = b.id;
  return band;
}

/** Upper bound (inclusive) of a band, for capping. */
function upperBound(band: SeverityBand, config: ScoringConfig): number {
  const bands = config.severity.bands;
  const i = bands.findIndex((b) => b.id === band);
  const next = bands[i + 1];
  return next ? next.min - 1 : Number.POSITIVE_INFINITY;
}

export interface SeverityContext {
  baselineSelfRating: number;
  controlFrequency: number;
  signals: Signal[];
  /** Phenotype ids whose fit score is in the top 3 (for modifiers). */
  top3: Set<PhenotypeId>;
}

export function calculateSeverity(
  ctx: SeverityContext,
  config: ScoringConfig,
): SeverityResult {
  const s = config.severity;
  let score = ctx.baselineSelfRating + ctx.controlFrequency;

  // Severity markers
  for (const [marker, pts] of Object.entries(s.markerPoints)) {
    if (has(ctx.signals, "severity_marker", marker)) score += pts ?? 0;
  }

  // Cost breadth (excludes none_meaningful via tagsOfType)
  const costs = tagsOfType(ctx.signals, "cost_domain");
  score += Math.min(s.costCap, costs.length * s.costPerDomain);

  // Contextual modifiers
  if (has(ctx.signals, "cost_domain", "money") && ctx.top3.has("reward_chaser")) {
    score += s.modifiers.moneyWithReward;
  }
  if (
    has(ctx.signals, "cost_domain", "sleep") &&
    has(ctx.signals, "entry_point", "night_regulation")
  ) {
    score += s.modifiers.sleepWithNight;
  }
  if (
    has(ctx.signals, "cost_domain", "self_body_image") &&
    ctx.top3.has("comparison_spiral")
  ) {
    score += s.modifiers.selfBodyWithComparison;
  }

  // No-meaningful-cost cap (a hard-rule floor can later raise this).
  const onlyNoCost =
    costs.length === 0 && has(ctx.signals, "cost_domain", "none_meaningful");
  if (onlyNoCost) score = Math.min(score, s.noMeaningfulCostCap);

  return { score, band: bandFor(score, config), floors: [], caps: [] };
}

export function applySeverityFloor(
  result: SeverityResult,
  floor: SeverityBand,
  ruleId: string,
  config: ScoringConfig,
): SeverityResult {
  const floorScore = config.classification.severityFloorScores[floor];
  if (result.score >= floorScore) return result;
  return {
    score: floorScore,
    band: bandFor(floorScore, config),
    floors: [...result.floors, ruleId],
    caps: result.caps,
  };
}

export function applySeverityCap(
  result: SeverityResult,
  cap: SeverityBand,
  ruleId: string,
  config: ScoringConfig,
): SeverityResult {
  const capScore = upperBound(cap, config);
  if (result.score <= capScore) return result;
  return {
    score: capScore,
    band: bandFor(capScore, config),
    floors: result.floors,
    caps: [...result.caps, ruleId],
  };
}
