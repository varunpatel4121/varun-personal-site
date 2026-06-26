/**
 * Canonical tag taxonomy for the Tech Loop & Phenotype Formulation Quiz.
 *
 * This is a 1:1 transcription of the tag dictionary in the authoritative
 * "Phenotype Scoring Rules" sheet (Blue Light Health · AI Quiz folder).
 * Every tag is a stable machine id; user-facing display strings live in the
 * config layer, never here. Arrays are `as const` so the union types are
 * derived from them — there is one source of truth for both runtime and types.
 *
 * Signal categories (9): hook, job, entry_point, loop_shape, aftertaste,
 * cost_domain, severity_marker, tie_breaker, platform_feature.
 */

// ── The Pull → which affordance grips them (14) ────────────────────────────
export const HOOKS = [
  "endless_feed",
  "tethered_check",
  "tethered_social",
  "mirror",
  "climb",
  "belonging",
  "parasocial_bond",
  "rabbit_hole",
  "activation",
  "companion",
  "reward_chase",
  "zone_out",
  "arousal_pull",
  "second_self",
] as const;
export type HookTag = (typeof HOOKS)[number];

// ── The Job → the emotional function the use serves (7) ────────────────────
export const JOBS = [
  "stimulate",
  "soothe",
  "reassure",
  "validate",
  "compare",
  "connect",
  "empower",
] as const;
export type JobTag = (typeof JOBS)[number];

// ── The Loop · entry point → when/where the loop fires (9) ──────────────────
export const ENTRY_POINTS = [
  "night_regulation",
  "morning_check_in",
  "gap_filling",
  "task_avoidance",
  "stress_relief",
  "alone_disconnected",
  "under_stimulated",
  "anytime_no_pattern",
  "not_problem",
] as const;
export type EntryPointTag = (typeof ENTRY_POINTS)[number];

// ── The Loop · shape → what the behavior looks like (8) ─────────────────────
export const LOOP_SHAPES = [
  "quick_check",
  "time_sink_binge",
  "autopilot",
  "waiting_refresh",
  "completion",
  "background",
  "social_participation",
  "not_sure",
] as const;
export type LoopShapeTag = (typeof LOOP_SHAPES)[number];

// ── The Cost · aftertaste → how it feels afterward (11) ─────────────────────
export const AFTERTASTES = [
  "calmer_regulated",
  "connected",
  "entertained",
  "numb",
  "guilty_ashamed",
  "worse_self_body",
  "more_anxious",
  "more_lonely",
  "tired",
  "behind_panicked",
  "no_different",
] as const;
export type AftertasteTag = (typeof AFTERTASTES)[number];

// ── The Cost · domain → where life is breaking (9) ──────────────────────────
export const COST_DOMAINS = [
  "sleep",
  "work_school_responsibilities",
  "focus_attention",
  "mood_anxiety",
  "self_body_image",
  "friendships_dating_social",
  "home_family_conflict",
  "money",
  "none_meaningful",
] as const;
export type CostDomainTag = (typeof COST_DOMAINS)[number];

// ── Severity markers → control + cost signals (9) ───────────────────────────
export const SEVERITY_MARKERS = [
  "loss_control",
  "failed_cutback",
  "time_creep",
  "withdrawal_restlessness",
  "mental_pull",
  "concealment",
  "interference_harm",
  "compensation_stage",
  "none",
] as const;
export type SeverityMarkerTag = (typeof SEVERITY_MARKERS)[number];

// ── Tie-breakers → one signature recognition line per phenotype (17) ────────
export const TIE_BREAKERS = [
  "night_avoid_head",
  "night_only_time_mine",
  "hand_went_there",
  "effort_turns_progress",
  "preparing_becomes_thing",
  "see_if_changed",
  "read_enough_safe",
  "checking_reaction_to_me",
  "see_where_i_stand",
  "failing_someone",
  "these_are_my_people",
  "always_answers",
  "voice_part_of_day",
  "angry_feels_awake",
  "next_one_could_be_one",
  "private_changes_channel",
  "real_life_no_room",
] as const;
export type TieBreakerTag = (typeof TIE_BREAKERS)[number];

// ── Platform features → higher-urgency / disambiguating context (9) ─────────
export const PLATFORM_FEATURES = [
  "betting_trading_gambling",
  "adult_or_intimacy_content",
  "ai_chatbot_support",
  "gaming_ranked_progress",
  "creator_streamer_media",
  "community_server_group",
  "posting_metrics",
  "news_health_search",
  "shopping_deals_marketplace",
] as const;
export type PlatformFeatureTag = (typeof PLATFORM_FEATURES)[number];

// ── The 17 phenotypes ───────────────────────────────────────────────────────
export const PHENOTYPES = [
  "night_regulator",
  "time_reclaimer",
  "autopilot_drifter",
  "competence_refuge",
  "optimizer_spiral",
  "reassurance_checker",
  "vigilant_scanner",
  "validation_monitor",
  "comparison_spiral",
  "always_on_responder",
  "online_home",
  "always_there_confidant",
  "creator_anchor",
  "activation_loop",
  "reward_chaser",
  "arousal_regulator",
  "second_self",
] as const;
export type PhenotypeId = (typeof PHENOTYPES)[number];

// ── Severity & confidence bands ─────────────────────────────────────────────
export const SEVERITY_BANDS = [
  "light_grip",
  "steady_pull",
  "deep_loop",
  "high_impact_loop",
] as const;
export type SeverityBand = (typeof SEVERITY_BANDS)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low", "mixed"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

// ── Signal categories ───────────────────────────────────────────────────────
export const SIGNAL_TYPES = [
  "hook",
  "job",
  "entry_point",
  "loop_shape",
  "aftertaste",
  "cost_domain",
  "severity_marker",
  "tie_breaker",
  "platform_feature",
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

/** Union of every tag id across all categories (the scored vocabulary). */
export type AnyTag =
  | HookTag
  | JobTag
  | EntryPointTag
  | LoopShapeTag
  | AftertasteTag
  | CostDomainTag
  | SeverityMarkerTag
  | TieBreakerTag
  | PlatformFeatureTag;

/** Maps each signal type to the union of tag ids valid within it. */
export interface TagBySignal {
  hook: HookTag;
  job: JobTag;
  entry_point: EntryPointTag;
  loop_shape: LoopShapeTag;
  aftertaste: AftertasteTag;
  cost_domain: CostDomainTag;
  severity_marker: SeverityMarkerTag;
  tie_breaker: TieBreakerTag;
  platform_feature: PlatformFeatureTag;
}
