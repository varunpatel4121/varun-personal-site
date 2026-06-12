export const SCHEMA_VERSION = "1.0.0";

export type PullTag =
  | "infinite_feed"
  | "visual_social_ranking"
  | "presence_obligation"
  | "ranked_competition"
  | "persistent_community"
  | "on_demand_intimacy"
  | "sexual_content"
  | "info_rabbit_hole";

export type SpaceId =
  | "shortvideo"
  | "visualsocial"
  | "gaming"
  | "messaging"
  | "longvideo"
  | "info"
  | "ai"
  | "adult"
  | "communities";

export type JobTag =
  | "escape"
  | "soothe"
  | "compare"
  | "validate"
  | "reassure"
  | "achieve"
  | "connect"
  | "stimulate"
  | "avoid"
  | "sexreg"
  | "understood";

export type TimingTag =
  | "latenight"
  | "waking"
  | "taskstart"
  | "gaps"
  | "poststress"
  | "alone"
  | "none";

export type Stage = "gratification" | "mixed" | "compensation" | "unknown";

export type LoopMarker =
  | "loss_of_control"
  | "failed_stops"
  | "withdrawal_irritability"
  | "secrecy";

export type CostDomain =
  | "sleep"
  | "school"
  | "attention"
  | "mood"
  | "social"
  | "family"
  | "money";

export type GroundTag =
  | "anxiety"
  | "depression"
  | "adhd"
  | "sleepprob"
  | "lonely"
  | "socialanx"
  | "body"
  | "perfectionism"
  | "pnts";

export type PhenotypeId =
  | "regulator"
  | "spiral"
  | "gamer"
  | "drifter"
  | "checker"
  | "socializer"
  | "shame"
  | "confidant"
  | "outrage";

export type ResultPhenotype = PhenotypeId | "none";

export type SeverityBand = "light_grip" | "steady_pull" | "deep_loop";
export type Confidence = "low" | "moderate" | "high";
export type MirrorResponse = "exactly" | "partly" | "not_me";
export type FitRating = "all_me" | "mostly" | "partly" | "not_me";

export const PHENOTYPE_IDS: PhenotypeId[] = [
  "regulator",
  "spiral",
  "gamer",
  "drifter",
  "checker",
  "socializer",
  "shame",
  "confidant",
  "outrage",
];

export const JOB_TAGS: JobTag[] = [
  "escape",
  "soothe",
  "compare",
  "validate",
  "reassure",
  "achieve",
  "connect",
  "stimulate",
  "avoid",
  "sexreg",
  "understood",
];

export interface OptionEffects {
  ph?: Partial<Record<PhenotypeId, number>>;
  jobs?: Partial<Record<JobTag, number>>;
  control?: number;
  costs?: CostDomain[];
  stage?: Stage;
  markers?: LoopMarker[];
  severity?: number;
  grounds?: GroundTag[];
  timing?: TimingTag[];
  unsure?: boolean;
}

export interface QuizOption extends OptionEffects {
  id: string;
  text: string;
  sub?: string;
  exclusive?: boolean;
}

export type QuestionType = "single" | "multi" | "scale";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  kicker?: string;
  question: string;
  hint?: string;
  max?: number;
  skippable?: boolean;
  options: QuizOption[];
  scaleLabels?: [string, string];
  source: "config" | "llm";
}

export interface AnswerRecord {
  questionId: string;
  questionText: string;
  source: "config" | "llm";
  optionIds: string[];
  optionTexts: string[];
  scale?: number;
  effects: OptionEffects[];
}

export interface ScoringState {
  scores: Record<PhenotypeId, number>;
  jobs: Partial<Record<JobTag, number>>;
  control: number;
  costs: CostDomain[];
  timing: TimingTag[];
  grounds: GroundTag[];
  markers: LoopMarker[];
  spaces: SpaceId[];
  anchor: SpaceId | "none" | null;
  anchorLabel: string;
  stage: Stage;
  severitySelf: number;
  mirrorResponse: MirrorResponse | null;
  unsureCount: number;
}

export interface Classification {
  primary: ResultPhenotype;
  secondary: PhenotypeId | null;
  confidence: Confidence;
}

export interface SeverityResult {
  score: number;
  band: SeverityBand;
}

export interface AnswerLogEntry {
  question_id: string;
  question_text: string;
  source: "config" | "llm";
  option_ids: string[];
  option_texts: string[];
  scale?: number;
}

export interface SessionRecord {
  session_id: string;
  schema_version: string;
  config_version: string;
  started_at: string;
  completed_at: string;
  pull_tags: PullTag[];
  anchor_pull: PullTag | null;
  job_tags: Partial<Record<JobTag, number>>;
  loop_markers: LoopMarker[];
  timing: TimingTag[];
  stage: Stage;
  cost_domains: CostDomain[];
  ground_tags: GroundTag[];
  severity_score: number;
  severity_band: SeverityBand;
  primary: ResultPhenotype;
  secondary: PhenotypeId | null;
  confidence: Confidence;
  scores: Record<PhenotypeId, number>;
  mirror_response: MirrorResponse | null;
  fit_rating: FitRating | null;
  fit_text: string | null;
  safety_triggered: boolean;
  unsure_count: number;
  llm_used: { followups: boolean; mirror: boolean; narrative: boolean };
  answers: AnswerLogEntry[];
}

export interface ScoringConfig {
  version: string;
  classification: {
    primaryMin: number;
    secondaryMin: number;
    secondaryRatio: number;
  };
  mirror: {
    exactBoost: number;
    notMeMultiplier: number;
    clarifierBoost: number;
  };
  severity: {
    controlCap: number;
    costCap: number;
    bands: { id: SeverityBand; max: number }[];
  };
  confidence: {
    unsurePenaltyThreshold: number;
  };
  controlMarkerThreshold: number;
  anchorWeights: Record<string, Partial<Record<PhenotypeId, number>>>;
  pullMap: Record<string, PullTag>;
  conditionalRules: {
    if: { timingIncludes?: TimingTag; anchor?: SpaceId };
    add: Partial<Record<PhenotypeId, number>>;
  }[];
  safety: {
    requireBand: SeverityBand;
    costAny: CostDomain[];
    groundAny: GroundTag[];
  };
  llm: {
    maxFollowups: number;
    maxOptionWeight: number;
  };
}
