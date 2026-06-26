/**
 * Eligibility gate evaluation.
 *
 * A gate is satisfied iff every clause is satisfied; a clause is satisfied iff
 * at least one of its AND-groups is fully present (the `|` / `+` operators from
 * the sheet). When a gate is NOT satisfied, its action fires ("Action If
 * Missing"): cap the score, block the phenotype, or block-with-adaptive-note.
 */

import type { Clause, Gate, Signal } from "../types";
import { has } from "./signals";

function clauseSatisfied(clause: Clause, signals: Signal[]): boolean {
  return clause.some((andGroup) =>
    andGroup.every((cond) => has(signals, cond.type, cond.tag)),
  );
}

export function gateSatisfied(gate: Gate, signals: Signal[]): boolean {
  return gate.requires.every((clause) => clauseSatisfied(clause, signals));
}

export type GateOutcome =
  | { kind: "ok" }
  | { kind: "cap"; cap: number }
  | { kind: "block" }
  | { kind: "block_adaptive" };

export function gateOutcome(gate: Gate, signals: Signal[]): GateOutcome {
  if (gateSatisfied(gate, signals)) return { kind: "ok" };
  switch (gate.action) {
    case "cap_score":
      return { kind: "cap", cap: gate.cap ?? 0 };
    case "block":
      return { kind: "block" };
    case "block_or_adaptive_note":
      return { kind: "block_adaptive" };
  }
}
