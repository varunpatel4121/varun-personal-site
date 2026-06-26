/**
 * Engine input/output types.
 *
 * `QuizResponse` is the structured set of selections the UI collects. The
 * engine `normalize()`s it into `Signal[]` + scalars, scores it, and returns a
 * `ScoreResult` whose `output` field is the deterministic Output Contract from
 * the Scoring Rules sheet. The LLM (if enabled) only ever rewrites tone from
 * this contract — it never changes assignment.
 */

import type {
  AftertasteTag,
  Confidence,
  CostDomainTag,
  EntryPointTag,
  HookTag,
  JobTag,
  LoopShapeTag,
  PhenotypeId,
  PlatformFeatureTag,
  SeverityBand,
  SeverityMarkerTag,
  SignalType,
  TieBreakerTag,
} from "./taxonomy";

/** Section A · "what's your life mostly about right now?" */
export type LifeStage =
  | "school"
  | "college"
  | "grad"
  | "working"
  | "between"
  | "other";

export type Reporter = "self" | "child";

/** One of the up-to-3 sub-features the user flags as hardest to put down. */
export interface SubfeatureSelection {
  platform: string;
  subfeature: string;
  /** 1-based selection order; drives the anchor-rank weight multiplier. */
  rank: number;
}

/** The user's answer to a single sub-feature cognition question (Section D). */
export interface HookAnswer {
  platform: string;
  subfeature: string;
  rank: number;
  /** Chosen answer-option id, or "none_fit". */
  optionId: string;
  /** Hook the chosen option maps to; null for "normal use" / "none fit". */
  hook: HookTag | null;
}

/** Any free-text the user typed ("Something else" or the final reflection). */
export interface FreeTextEntry {
  questionId: string;
  text: string;
}

/** Identity captured in Section A — kept out of the scoring path entirely. */
export interface Identity {
  name?: string;
  email?: string;
  consentedToContact?: boolean;
}

/** The complete structured input to the engine. */
export interface QuizResponse {
  reporter: Reporter;
  lifeStage: LifeStage;
  /** Section B — 0..4 self-rating. */
  baselineSelfRating: number;
  /** Section C Q1 — up to 3 platform ids. */
  platforms: string[];
  /** Section C Q2 — up to 3 ranked sub-features. */
  subfeatures: SubfeatureSelection[];
  /** Section D — one cognition answer per selected sub-feature. */
  hookAnswers: HookAnswer[];
  /** Section E Q1 — up to 2 entry points. */
  entryPoints: EntryPointTag[];
  /** Section E Q2 — up to 2 loop shapes. */
  loopShapes: LoopShapeTag[];
  /** Section E Q3 — 0..4 control frequency. */
  controlFrequency: number;
  /** Section E Q4 — severity markers (multi). */
  severityMarkers: SeverityMarkerTag[];
  /** Section F Q1 — aftertaste(s). */
  aftertastes: AftertasteTag[];
  /** Section F Q2 — cost domains (multi). */
  costDomains: CostDomainTag[];
  /** Optional disambiguation pick — sets exactly one tie-breaker. */
  tieBreaker?: TieBreakerTag | null;
  /** Anything typed in a free-text field. Never scored; preserved for audit/AI. */
  freeText?: FreeTextEntry[];
}

/** A single normalized scoring signal. */
export interface Signal {
  type: SignalType;
  tag: string;
  /**
   * Anchor weight multiplier (default 1). Only hook signals derived from a
   * ranked sub-feature carry a non-1 factor.
   */
  factor: number;
  /** Provenance for audit (which sub-feature produced a hook/job signal). */
  source?: { platform: string; subfeature: string; rank: number };
}

/** Output of the normalize step: signals plus the scalar inputs hard rules read. */
export interface NormalizedInput {
  signals: Signal[];
  baselineSelfRating: number;
  controlFrequency: number;
  freeText: string[];
}

/** Per-phenotype score detail (audit-friendly). */
export interface PhenotypeScore {
  id: PhenotypeId;
  /** Raw weighted sum before gates/hard rules. */
  raw: number;
  /** Score after eligibility gates + hard-rule score effects. */
  score: number;
  /** False if a hard `block` gate removed this phenotype from contention. */
  eligible: boolean;
  /** Ids of gates/rules that capped, blocked, or boosted this phenotype. */
  adjustments: string[];
}

export interface SeverityResult {
  score: number;
  band: SeverityBand;
  /** Severity floors/caps applied by hard rules (rule ids). */
  floors: string[];
  caps: string[];
}

/** The deterministic Output Contract (Scoring Rules · "Output Contract"). */
export interface OutputContract {
  primary_phenotype_id: PhenotypeId | "no_dominant_loop";
  primary_phenotype_name: string;
  primary_score: number;
  primary_confidence: Confidence;
  /** True when the primary is an adaptive pattern, not a problematic loop. */
  primary_adaptive: boolean;
  secondary_phenotype_id: PhenotypeId | null;
  secondary_phenotype_name: string | null;
  severity_score: number;
  severity_label: SeverityBand;
  top_hook_tags: HookTag[];
  top_job_tags: JobTag[];
  top_entry_points: EntryPointTag[];
  top_loop_shapes: LoopShapeTag[];
  cost_domains: CostDomainTag[];
  platform_features: PlatformFeatureTag[];
  hard_rules_triggered: string[];
  formulation_sentence: string;
  copy_generation_mode: "deterministic" | "ai_assisted";
  /** Set when HR_SAFETY_001 fires — UI must lead with support, not a score. */
  safety_triggered: boolean;
}

/** Everything the engine produces, including audit detail beyond the contract. */
export interface ScoreResult {
  output: OutputContract;
  scores: PhenotypeScore[];
  severity: SeverityResult;
  normalized: NormalizedInput;
  /** All 17 phenotype fit scores (id → final score), for the result spectrum. */
  spectrum: Record<PhenotypeId, number>;
}
