/**
 * Pairwise tie-breaker resolution for the top two phenotypes.
 *
 * An explicit tie-breaker tag (set by the disambiguation step) is honored
 * regardless of margin. Otherwise, when the top two are close, an aftertaste
 * fallback may decide. Only the top pair is ever reordered.
 */

import type { PhenotypeId, ScoringConfig, Signal } from "../types";
import { has } from "./signals";

export function resolveTopPair(
  ranked: PhenotypeId[],
  scores: Record<PhenotypeId, number>,
  signals: Signal[],
  config: ScoringConfig,
): { ranked: PhenotypeId[]; applied: string | null } {
  if (ranked.length < 2) return { ranked, applied: null };
  const a = ranked[0]!;
  const b = ranked[1]!;
  const pair = config.tieBreakers.find(
    (p) => (p.a === a && p.b === b) || (p.a === b && p.b === a),
  );
  if (!pair) return { ranked, applied: null };

  let winner: PhenotypeId | null = null;
  if (has(signals, "tie_breaker", pair.tagA)) winner = pair.a;
  else if (has(signals, "tie_breaker", pair.tagB)) winner = pair.b;
  else if (pair.fallback && (scores[a]! - scores[b]!) < config.confidence.mixedMargin) {
    if (pair.fallback.preferA.some((c) => has(signals, c.type, c.tag))) winner = pair.a;
    else if (pair.fallback.preferB.some((c) => has(signals, c.type, c.tag))) winner = pair.b;
  }

  if (winner && winner !== a) {
    return { ranked: [winner, winner === b ? a : b, ...ranked.slice(2)], applied: `${pair.a}|${pair.b}` };
  }
  return { ranked, applied: winner ? `${pair.a}|${pair.b}` : null };
}
