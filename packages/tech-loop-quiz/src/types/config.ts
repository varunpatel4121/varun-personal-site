/**
 * Schemas for the versioned scoring config (the JSON the clinical team tunes).
 *
 * Eligibility gates encode the sheet's `|` (OR) / `+` (AND) expressions as
 * structured clauses so there is no runtime string parsing:
 *   requires = AND over clauses; each clause = OR over alt groups;
 *   each alt group = AND over tag conditions.
 * A "_any" gate has one clause; a "_all" gate has several.
 */

import type {
  HookTag,
  JobTag,
  PhenotypeId,
  SeverityBand,
  SeverityMarkerTag,
  SignalType,
} from "./taxonomy";

export interface TagCond {
  type: SignalType;
  tag: string;
}

/** All conditions must be present (the `+` operator). */
export type AndGroup = TagCond[];

/** At least one group must be fully present (the `|` operator). */
export type Clause = AndGroup[];

export interface RuleWeight {
  phenotype: PhenotypeId;
  type: SignalType;
  tag: string;
  weight: number;
  notes?: string;
}

export type GateKind =
  | "soft_required_any"
  | "soft_required_all"
  | "hard_required_any"
  | "hard_required_all";

export type GateAction = "cap_score" | "block" | "block_or_adaptive_note";

export interface Gate {
  phenotype: PhenotypeId;
  id: string;
  kind: GateKind;
  /** AND of clauses; gate is satisfied only if every clause is satisfied. */
  requires: Clause[];
  action: GateAction;
  /** Score ceiling when action is cap_score. */
  cap?: number;
  notes?: string;
}

/** Pairwise tie-breaker: signature tag for A vs signature tag for B. */
export interface TieBreakerPair {
  a: PhenotypeId;
  b: PhenotypeId;
  tagA: string;
  tagB: string;
  /** Optional aftertaste fallback when neither signature tag is present. */
  fallback?: {
    preferA: { type: SignalType; tag: string }[];
    preferB: { type: SignalType; tag: string }[];
  };
  notes?: string;
}

export interface SeverityComponent {
  /** Scalar field added directly (0..4). */
  field: "baselineSelfRating" | "controlFrequency";
}

export interface SeverityBandRange {
  id: SeverityBand;
  /** Inclusive lower bound; bands are ordered ascending. */
  min: number;
}

export interface SeverityConfig {
  /** Direct scalar components (baseline + control). */
  components: SeverityComponent[];
  /** Per-marker point values. */
  markerPoints: Partial<Record<SeverityMarkerTag, number>>;
  /** +1 per distinct cost domain (excluding none_meaningful), capped. */
  costPerDomain: number;
  costCap: number;
  /** Contextual +1 modifiers. */
  modifiers: {
    moneyWithReward: number;
    sleepWithNight: number;
    selfBodyWithComparison: number;
  };
  /** When only none_meaningful cost is present, cap severity here (unless a hard rule floors it). */
  noMeaningfulCostCap: number;
  bands: SeverityBandRange[];
}

export interface ConfidenceConfig {
  highMinScore: number;
  highMinMargin: number;
  mediumMinScore: number;
  mediumMinMargin: number;
  /** Top-two within this margin → "mixed" (and triggers disambiguation in UI). */
  mixedMargin: number;
}

export interface ClassificationConfig {
  secondaryMinScore: number;
  /** Severity floor labels map to numeric scores for floor application. */
  severityFloorScores: Record<SeverityBand, number>;
}

/** The full scoring config document (one versioned JSON). */
export interface ScoringConfig {
  version: string;
  /** Anchor-rank multipliers indexed by (rank-1); ranks beyond the array use 1. */
  anchorRankMultipliers: number[];
  /** Hook → implied job tags (Hook Dictionary "Cognition" column). */
  hookJobMap: Record<HookTag, JobTag[]>;
  ruleWeights: RuleWeight[];
  gates: Gate[];
  tieBreakers: TieBreakerPair[];
  severity: SeverityConfig;
  confidence: ConfidenceConfig;
  classification: ClassificationConfig;
}

/** Effect object a hard rule emits (hard-rule logic lives in code, not JSON). */
export interface HardRuleEffect {
  ruleId: string;
  forcePrimary?: PhenotypeId | "no_dominant_loop";
  forceInclude?: PhenotypeId;
  boost?: { phenotype: PhenotypeId; amount: number };
  severityFloor?: SeverityBand;
  severityCap?: SeverityBand;
  adaptiveNote?: PhenotypeId;
  lowConcern?: boolean;
  safety?: boolean;
}
