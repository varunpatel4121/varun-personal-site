/**
 * Signal-presence helpers shared by gates, hard rules, and tie-breakers.
 */

import type { Signal, SignalType } from "../types";

/**
 * "Negative"/opt-out tags. They are kept as explicit signals (hard rules read
 * them) but never count as positive evidence and never satisfy a wildcard `*`.
 */
export const NEGATIVE_TAGS = new Set<string>([
  "entry_point:not_problem",
  "loop_shape:not_sure",
  "severity_marker:none",
  "cost_domain:none_meaningful",
]);

export function has(signals: Signal[], type: SignalType, tag: string): boolean {
  if (tag === "*") {
    return signals.some(
      (s) => s.type === type && !NEGATIVE_TAGS.has(`${s.type}:${s.tag}`),
    );
  }
  return signals.some((s) => s.type === type && s.tag === tag);
}

export function tagsOfType(signals: Signal[], type: SignalType): string[] {
  return signals
    .filter((s) => s.type === type && !NEGATIVE_TAGS.has(`${s.type}:${s.tag}`))
    .map((s) => s.tag);
}

/** Distinct presence key for de-duping. */
export function key(type: SignalType, tag: string): string {
  return `${type}:${tag}`;
}
