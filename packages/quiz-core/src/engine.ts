/**
 * Small deterministic scoring helpers shared across quizzes. Intentionally
 * minimal — each quiz owns its own engine; these just remove boilerplate and
 * keep ranking/banding deterministic.
 */

import type { Confidence } from "./types";

export interface Band {
  id: string;
  /** Inclusive lower bound; bands listed ascending. */
  min: number;
}

/** Highest band whose min <= score. */
export function bandFor(score: number, bands: Band[]): string {
  let id = bands[0]?.id ?? "";
  for (const b of bands) if (score >= b.min) id = b.id;
  return id;
}

export function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Rank scored keys descending, dropping zeros. Ties break by `order` (a
 * canonical id list) when provided, else by key — so results are deterministic.
 */
export function rankDesc<K extends string>(
  scores: Record<K, number>,
  order?: readonly K[],
): [K, number][] {
  const idx = (k: K) => (order ? order.indexOf(k) : 0);
  return (Object.entries(scores) as [K, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || idx(a[0]) - idx(b[0]) || a[0].localeCompare(b[0]));
}

export interface ConfidenceConfig {
  highMinScore: number;
  highMinMargin: number;
  mediumMinScore: number;
  mediumMinMargin: number;
  mixedMargin: number;
}

/** Confidence from the top score + its margin over the runner-up. */
export function marginConfidence(
  topScore: number,
  secondScore: number,
  cfg: ConfidenceConfig,
): Confidence {
  const margin = topScore - secondScore;
  if (secondScore >= cfg.mediumMinScore && topScore >= cfg.mediumMinScore && margin < cfg.mixedMargin) {
    return "mixed";
  }
  if (topScore >= cfg.highMinScore && margin >= cfg.highMinMargin) return "high";
  if (topScore >= cfg.mediumMinScore && margin >= cfg.mediumMinMargin) return "medium";
  return "low";
}
