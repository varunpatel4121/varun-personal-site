/**
 * Parent Quiz taxonomy + engine I/O.
 *
 * Formulation: Child Tech Loop × Family Screen Pattern × Cost × Support Urgency
 * (Parent Quiz Strategy & Voice doc). Parents report what they SEE at home —
 * the engine is deterministic; the LLM only warms the result copy.
 */

import type { Confidence } from "@blh/quiz-core";

// ── Child tech loops (the result names map 1:1) ─────────────────────────────
export const CHILD_LOOPS = [
  "night_off_switch",
  "quiet_pull_away",
  "social_mirror",
  "always_checking",
  "online_belonging",
  "competence_refuge",
  "reward_chase",
  "intensity_loop",
  "autopilot_zone_out",
  "daily_battle",
] as const;
export type ChildLoop = (typeof CHILD_LOOPS)[number];

// ── Family screen patterns (parent-child loop) ──────────────────────────────
export const FAMILY_PATTERNS = [
  "battle",
  "detective",
  "negotiation",
  "give_in_burnout",
  "fixer",
  "quiet_distance",
  "collaborative",
] as const;
export type FamilyPattern = (typeof FAMILY_PATTERNS)[number];

export const PARENT_ROLES = [
  "enforcer",
  "detective",
  "negotiator",
  "peacekeeper",
  "fixer",
  "worried_observer",
  "collaborator",
] as const;
export type ParentRole = (typeof PARENT_ROLES)[number];

export const COST_DOMAINS = [
  "sleep",
  "school",
  "mood",
  "conflict",
  "offline_life",
  "self_image",
  "money",
  "trust",
  "parent_burnout",
] as const;
export type CostDomain = (typeof COST_DOMAINS)[number];

export const SUPPORT_LEVELS = [
  "normal_tension",
  "pattern_forming",
  "family_impact_loop",
  "support_recommended",
  "safety_route",
] as const;
export type SupportLevel = (typeof SUPPORT_LEVELS)[number];

export const URGENCY_MARKERS = [
  "failed_limits",
  "loss_of_control",
  "withdrawal_restless",
  "concealment",
  "money_risk",
  "safety",
] as const;
export type UrgencyMarker = (typeof URGENCY_MARKERS)[number];

export const CTA_READINESS = [
  "parent_plan",
  "conversation",
  "therapy_child",
  "parent_support",
  "education",
  "low_ready",
] as const;
export type CtaReadiness = (typeof CTA_READINESS)[number];

export const AGE_BANDS = [
  "child",
  "tween",
  "young_teen",
  "older_teen",
  "launch",
  "other",
] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

// ── Config shapes ───────────────────────────────────────────────────────────
/** A single answer option and the tags it contributes to scoring. */
export interface POption {
  value: string;
  label: string;
  loops?: Partial<Record<ChildLoop, number>>;
  family?: Partial<Record<FamilyPattern, number>>;
  costs?: CostDomain[];
  /** Inline urgency points (URGENCY_1/2/3 in the doc). */
  urgency?: number;
  markers?: UrgencyMarker[];
  /** "safety" | "reward_money" — flags the hard-rule engine reads. */
  hardRules?: string[];
  parentRole?: ParentRole;
  cta?: CtaReadiness;
  lowConcern?: boolean;
  ageBand?: AgeBand;
}

export type QuestionType = "single" | "multi";

export interface PQuestion {
  id: string;
  section: string;
  type: QuestionType;
  question: string;
  hint?: string;
  max?: number;
  optional?: boolean;
  options: POption[];
}

// ── Engine I/O ──────────────────────────────────────────────────────────────
/** Selected option values keyed by question id, + optional free text. */
export interface ParentResponse {
  ageBand?: AgeBand;
  answers: Record<string, string[]>;
  freeText?: string;
}

export interface ParentOutput {
  primary_child_loop: ChildLoop;
  primary_result_name: string;
  secondary_child_loop: ChildLoop | null;
  family_pattern: FamilyPattern | null;
  parent_role: ParentRole | null;
  support_level: SupportLevel;
  cost_domains: CostDomain[];
  urgency_markers: UrgencyMarker[];
  urgency_score: number;
  safety_flag: boolean;
  cta_readiness: CtaReadiness | null;
  primary_concern: string | null;
  confidence: Confidence;
  hard_rules_triggered: string[];
  copy_generation_mode: "deterministic" | "ai_assisted";
  spectrum: Record<ChildLoop, number>;
}

/** One entry in the result library (Recommended Result Copy Formula). */
export interface ParentResult {
  id: ChildLoop;
  name: string;
  recognitionLine: string;
  whatYouMayBeSeeing: string;
  whatScreensMayBeDoing: string;
  whatItMayBeCosting: string;
  whatHelps: string;
  whySupportMayHelp: string;
}
