/**
 * Content/copy types: the phenotype library, the platform → sub-feature → hook
 * map, the sub-feature cognition questions, and the user-facing quiz copy.
 * All of this is data the clinical/content team owns; the engine never reads
 * the prose, only the ids.
 */

import type {
  AftertasteTag,
  CostDomainTag,
  EntryPointTag,
  HookTag,
  JobTag,
  LoopShapeTag,
  PhenotypeId,
  PlatformFeatureTag,
  SeverityMarkerTag,
  TieBreakerTag,
} from "./taxonomy";

/** One phenotype's full library entry (Phenotype Library v2, both tables). */
export interface PhenotypeProfile {
  id: PhenotypeId;
  name: string;
  shortLabel: string;
  /** First-person recognition line (kept for reference; not shown as the result hero). */
  recognitionLine: string;
  /** Warm, second-person "the read" shown on the result page ("You're someone who…"). */
  read: string;
  /** The phenotype's signature tie-breaker tag (worth 4 in rule weights). */
  signatureTieBreaker: TieBreakerTag;
  definition: string;
  thisIsMe: string;
  whatItsDoing: string;
  whatItsCosting: string;
  whenAdaptive: string;
  whenProblem: string;
  whatHelps: string;
  firstTinyStep: string;
  // ── second table (clinician-facing metadata) ──
  evidenceLabel: string;
  coreSignals: string;
  differentiators: string;
  deeperPattern: string;
  scoringNotes: string;
  /** Phrases never to use in user-facing copy (HR_LANGUAGE_001 guardrail). */
  avoidSaying: string;
  sourceUrls: string[];
  nameAlternatives: string[];
  // Tag-array metadata is optional; the engine derives canonical signals from
  // rule weights, so these are descriptive only.
  primaryHooks?: HookTag[];
  primaryJobs?: JobTag[];
  typicalEntryPoints?: EntryPointTag[];
  typicalLoopShapes?: LoopShapeTag[];
  keyCostDomains?: CostDomainTag[];
}

export interface Subfeature {
  id: string;
  label: string;
  /** Up to 4 candidate hooks from the Pull Taxonomy & Map. */
  potentialHooks: HookTag[];
  /** Platform-feature tag this sub-feature contributes, if any. */
  platformFeature?: PlatformFeatureTag;
}

export interface Platform {
  id: string;
  label: string;
  /** "Future" platforms are defined but hidden from the v1 picker. */
  future?: boolean;
  /** Platform-level feature tag (e.g. betting/adult), if the whole platform implies one. */
  platformFeature?: PlatformFeatureTag;
  subfeatures: Subfeature[];
}

/** One answer option in a sub-feature cognition question. */
export interface SubfeatureOption {
  id: string;
  hook: HookTag;
  text: string;
}

/** The cognition question shown for a given [platform, sub-feature]. */
export interface SubfeatureQuestion {
  platform: string;
  subfeature: string;
  question: string;
  options: SubfeatureOption[];
}

/** A user-facing labeled option whose value is a taxonomy tag. */
export interface LabeledOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
}

/** Numeric (0..4) scale option. */
export interface ScaleOption {
  value: number;
  label: string;
}

/** User-facing copy + option lists for the fixed (non-sub-feature) questions. */
export interface QuizContent {
  version: string;
  intro: {
    kicker: string;
    title: string;
    disclaimer: string;
    cta: string;
  };
  frame: {
    reporterQuestion: string;
    reporterOptions: LabeledOption<"self" | "child">[];
    identityQuestion: string;
    identityHint: string;
    lifeStageQuestion: string;
    lifeStageOptions: LabeledOption[];
  };
  baseline: {
    question: string;
    options: ScaleOption[];
  };
  pull: {
    platformQuestion: string;
    platformHint: string;
    subfeatureQuestion: string;
    subfeatureHint: string;
  };
  loop: {
    entryQuestion: string;
    entryOptions: LabeledOption<EntryPointTag>[];
    patternQuestion: string;
    patternOptions: LabeledOption<LoopShapeTag>[];
    controlQuestion: string;
    controlOptions: ScaleOption[];
    severityQuestion: string;
    severityOptions: LabeledOption<SeverityMarkerTag>[];
  };
  cost: {
    aftertasteQuestion: string;
    aftertasteOptions: LabeledOption<AftertasteTag>[];
    costQuestion: string;
    costOptions: LabeledOption<CostDomainTag>[];
  };
  disambiguation: {
    prompt: string;
    noneLabel: string;
  };
  result: {
    fitQuestion: string;
    fitOptions: ScaleOption[];
    missedQuestion: string;
    convertTitle: string;
    convertBody: string;
    convertCta: string;
  };
  /** Shared "something else" free-text affordance. */
  somethingElseLabel: string;
}
