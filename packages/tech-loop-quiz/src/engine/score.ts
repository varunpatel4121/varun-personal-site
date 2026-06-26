/**
 * The deterministic scoring pipeline (Scoring Rules · "Pseudocode"):
 *   normalize → low-concern check → score fit → eligibility gates →
 *   hard rules → rank → tie-breakers → severity → confidence → output contract.
 *
 * `runPipeline` operates on a NormalizedInput so acceptance cases can feed
 * signals directly. `score` is the full entry point from a QuizResponse.
 */

import type {
  Confidence,
  HookTag,
  JobTag,
  NormalizedInput,
  OutputContract,
  PhenotypeId,
  PhenotypeScore,
  Platform,
  QuizResponse,
  ScoreResult,
  ScoringConfig,
  SeverityResult,
  Signal,
} from "../types";
import { PHENOTYPES } from "../types";
import {
  PHENOTYPE_NAME,
  PLATFORMS,
  scoringConfig as defaultConfig,
} from "../config";
import { normalize } from "./normalize";
import { gateOutcome } from "./gates";
import { evaluateHardRules, evaluateSafety, hasLowConcern } from "./hard-rules";
import {
  applySeverityCap,
  applySeverityFloor,
  calculateSeverity,
} from "./severity";
import { resolveTopPair } from "./tie-breakers";
import { tagsOfType } from "./signals";
import { bandLabel, buildFormulation, noDominantFormulation } from "./formulation";

const PH_INDEX = new Map(PHENOTYPES.map((p, i) => [p, i]));

type WeightIndex = Map<string, number>;

function buildWeightIndex(config: ScoringConfig): WeightIndex {
  const idx: WeightIndex = new Map();
  for (const r of config.ruleWeights) idx.set(`${r.phenotype}|${r.type}|${r.tag}`, r.weight);
  return idx;
}

function scoreFit(signals: Signal[], idx: WeightIndex): Record<PhenotypeId, number> {
  const scores = Object.fromEntries(PHENOTYPES.map((p) => [p, 0])) as Record<PhenotypeId, number>;
  for (const sig of signals) {
    for (const ph of PHENOTYPES) {
      const w = idx.get(`${ph}|${sig.type}|${sig.tag}`);
      if (w !== undefined) scores[ph] += w * sig.factor;
    }
  }
  return scores;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Present hook/job tags sorted by contribution to a phenotype (desc). */
function topTagsFor(
  signals: Signal[],
  type: "hook" | "job",
  primary: PhenotypeId | null,
  idx: WeightIndex,
  n: number,
): string[] {
  const present = signals.filter((s) => s.type === type);
  const weightOf = (s: Signal) =>
    primary ? (idx.get(`${primary}|${type}|${s.tag}`) ?? 0) * s.factor : s.factor;
  return [...present]
    .sort((a, b) => weightOf(b) - weightOf(a) || a.tag.localeCompare(b.tag))
    .slice(0, n)
    .map((s) => s.tag);
}

function rankEligible(
  scores: Record<PhenotypeId, number>,
  eligible: Record<PhenotypeId, boolean>,
): PhenotypeId[] {
  return PHENOTYPES.filter((p) => eligible[p] && scores[p] > 0).sort(
    (a, b) => scores[b] - scores[a] || (PH_INDEX.get(a)! - PH_INDEX.get(b)!),
  );
}

function computeConfidence(
  primaryScore: number,
  secondaryScore: number,
  config: ScoringConfig,
): Confidence {
  const margin = primaryScore - secondaryScore;
  const c = config.confidence;
  if (
    secondaryScore >= c.mediumMinScore &&
    primaryScore >= c.mediumMinScore &&
    margin < c.mixedMargin
  ) {
    return "mixed";
  }
  if (primaryScore >= c.highMinScore && margin >= c.highMinMargin) return "high";
  if (primaryScore >= c.mediumMinScore && margin >= c.mediumMinMargin) return "medium";
  return "low";
}

export function runPipeline(
  normalized: NormalizedInput,
  config: ScoringConfig = defaultConfig,
): ScoreResult {
  const { signals, baselineSelfRating, controlFrequency, freeText } = normalized;
  const idx = buildWeightIndex(config);
  const raw = scoreFit(signals, idx);
  const safety = evaluateSafety(freeText);

  const spectrumOf = (s: Record<PhenotypeId, number>) =>
    Object.fromEntries(PHENOTYPES.map((p) => [p, round(s[p])])) as Record<PhenotypeId, number>;

  const presentEntries = tagsOfType(signals, "entry_point");
  const presentLoops = tagsOfType(signals, "loop_shape");
  const presentCosts = tagsOfType(signals, "cost_domain");
  const presentFeatures = signals
    .filter((s) => s.type === "platform_feature")
    .map((s) => s.tag);

  // ── Score fit → working state ─────────────────────────────────────────────
  const scores = { ...raw };
  const eligible = Object.fromEntries(PHENOTYPES.map((p) => [p, true])) as Record<PhenotypeId, boolean>;
  const adaptive = Object.fromEntries(PHENOTYPES.map((p) => [p, false])) as Record<PhenotypeId, boolean>;
  const adjustments: Record<string, string[]> = {};
  const addAdj = (p: PhenotypeId, a: string) => (adjustments[p] = [...(adjustments[p] ?? []), a]);

  // ── Eligibility gates ─────────────────────────────────────────────────────
  for (const gate of config.gates) {
    const outcome = gateOutcome(gate, signals);
    if (outcome.kind === "cap" && scores[gate.phenotype] > outcome.cap) {
      scores[gate.phenotype] = outcome.cap;
      addAdj(gate.phenotype, `${gate.id}:cap`);
    } else if (outcome.kind === "block") {
      eligible[gate.phenotype] = false;
      addAdj(gate.phenotype, `${gate.id}:block`);
    } else if (outcome.kind === "block_adaptive") {
      eligible[gate.phenotype] = false;
      adaptive[gate.phenotype] = true;
      addAdj(gate.phenotype, `${gate.id}:block_adaptive`);
    }
  }

  // ── Hard rules (priorities 2–11) ──────────────────────────────────────────
  const provisional = rankEligible(scores, eligible);
  const { effects, triggered } = evaluateHardRules({
    signals,
    baselineSelfRating,
    controlFrequency,
    freeText,
    ranked: provisional,
  });

  let forcedPrimary: PhenotypeId | null = null;
  const severityFloors: { band: import("../types").SeverityBand; ruleId: string }[] = [];
  const severityCaps: { band: import("../types").SeverityBand; ruleId: string }[] = [];
  for (const e of effects) {
    if (e.boost) {
      scores[e.boost.phenotype] += e.boost.amount;
      addAdj(e.boost.phenotype, `${e.ruleId}:boost`);
    }
    if (e.adaptiveNote) {
      adaptive[e.adaptiveNote] = true;
      addAdj(e.adaptiveNote, `${e.ruleId}:adaptive`);
    }
    if (e.forcePrimary && e.forcePrimary !== "no_dominant_loop" && !forcedPrimary) {
      forcedPrimary = e.forcePrimary;
    }
    if (e.severityFloor) severityFloors.push({ band: e.severityFloor, ruleId: e.ruleId });
    if (e.severityCap) severityCaps.push({ band: e.severityCap, ruleId: e.ruleId });
  }

  // ── Rank + tie-breakers + forced primary ──────────────────────────────────
  let ranked = rankEligible(scores, eligible);
  const tie = resolveTopPair(ranked, scores, signals, config);
  ranked = tie.ranked;
  if (tie.applied) triggered.push(`TIE:${tie.applied}`);
  if (forcedPrimary && eligible[forcedPrimary]) {
    ranked = [forcedPrimary, ...ranked.filter((p) => p !== forcedPrimary)];
  }

  const primary: PhenotypeId | "no_dominant_loop" =
    ranked.length > 0 ? ranked[0]! : "no_dominant_loop";
  const primaryScore = primary === "no_dominant_loop" ? 0 : scores[primary];
  const secondaryId = ranked[1];
  const secondaryScore = secondaryId ? scores[secondaryId] : 0;
  const secondary =
    secondaryId && secondaryScore >= config.classification.secondaryMinScore ? secondaryId : null;

  // ── Severity (separate) ───────────────────────────────────────────────────
  const top3 = new Set(ranked.slice(0, 3));
  let severity = calculateSeverity(
    { baselineSelfRating, controlFrequency, signals, top3 },
    config,
  );
  for (const f of severityFloors) severity = applySeverityFloor(severity, f.band, f.ruleId, config);
  for (const c of severityCaps) severity = applySeverityCap(severity, c.band, c.ruleId, config);

  let primaryAdaptive = primary !== "no_dominant_loop" && adaptive[primary];

  // HR_LOW_001 — benign, low-cost use. Cap severity to light grip and frame the
  // result as adaptive. A clear pattern (e.g. second_self) still surfaces, just
  // gently; no_dominant_loop only emerges when nothing scored. Safety overrides.
  if (hasLowConcern(signals, baselineSelfRating, controlFrequency) && !safety) {
    if (!triggered.includes("HR_LOW_001")) triggered.push("HR_LOW_001");
    severity = applySeverityCap(severity, "light_grip", "HR_LOW_001", config);
    if (primary !== "no_dominant_loop") primaryAdaptive = true;
  }

  const confidence =
    primary === "no_dominant_loop"
      ? "low"
      : computeConfidence(primaryScore, secondaryScore, config);

  return buildResult({
    config,
    normalized,
    raw,
    finalScores: scores,
    eligible,
    adjustments,
    primary,
    secondary,
    primaryAdaptive,
    confidence,
    severity,
    triggered,
    safety,
    idx,
    spectrum: spectrumOf(scores),
    present: { entries: presentEntries, loops: presentLoops, costs: presentCosts, features: presentFeatures },
  });
}

interface BuildArgs {
  config: ScoringConfig;
  normalized: NormalizedInput;
  raw: Record<PhenotypeId, number>;
  finalScores: Record<PhenotypeId, number>;
  eligible: Record<PhenotypeId, boolean>;
  adjustments: Record<string, string[]>;
  primary: PhenotypeId | "no_dominant_loop";
  secondary: PhenotypeId | null;
  primaryAdaptive: boolean;
  confidence: Confidence;
  severity: SeverityResult;
  triggered: string[];
  safety: boolean;
  idx: WeightIndex;
  spectrum: Record<PhenotypeId, number>;
  present: { entries: string[]; loops: string[]; costs: string[]; features: string[] };
}

function buildResult(a: BuildArgs): ScoreResult {
  const primaryPh = a.primary === "no_dominant_loop" ? null : a.primary;
  const topHooks = topTagsFor(a.normalized.signals, "hook", primaryPh, a.idx, 3) as HookTag[];
  const topJobs = topTagsFor(a.normalized.signals, "job", primaryPh, a.idx, 2) as JobTag[];

  const triggered = a.safety && !a.triggered.includes("HR_SAFETY_001")
    ? [...a.triggered, "HR_SAFETY_001"]
    : a.triggered;

  const formulation = primaryPh
    ? buildFormulation({
        primaryName: PHENOTYPE_NAME[primaryPh],
        band: a.severity.band,
        hooks: topHooks,
        jobs: topJobs,
        loops: a.present.loops,
        costs: a.present.costs,
      })
    : noDominantFormulation();

  const output: OutputContract = {
    primary_phenotype_id: a.primary,
    primary_phenotype_name: primaryPh ? PHENOTYPE_NAME[primaryPh] : "No Dominant Loop",
    primary_score: round(primaryPh ? a.finalScores[primaryPh] : 0),
    primary_confidence: a.confidence,
    primary_adaptive: a.primaryAdaptive,
    secondary_phenotype_id: a.secondary,
    secondary_phenotype_name: a.secondary ? PHENOTYPE_NAME[a.secondary] : null,
    severity_score: a.severity.score,
    severity_label: a.severity.band,
    top_hook_tags: topHooks,
    top_job_tags: topJobs,
    top_entry_points: a.present.entries as OutputContract["top_entry_points"],
    top_loop_shapes: a.present.loops as OutputContract["top_loop_shapes"],
    cost_domains: a.present.costs as OutputContract["cost_domains"],
    platform_features: a.present.features as OutputContract["platform_features"],
    hard_rules_triggered: triggered,
    formulation_sentence: formulation,
    copy_generation_mode: "deterministic",
    safety_triggered: a.safety,
  };

  const scoresDetail: PhenotypeScore[] = PHENOTYPES.map((p) => ({
    id: p,
    raw: round(a.raw[p]),
    score: round(a.finalScores[p]),
    eligible: a.eligible[p],
    adjustments: a.adjustments[p] ?? [],
  }));

  void bandLabel; // exported for UI; referenced to satisfy lint in some configs
  return {
    output,
    scores: scoresDetail,
    severity: a.severity,
    normalized: a.normalized,
    spectrum: a.spectrum,
  };
}

export interface ScoreOptions {
  config?: ScoringConfig;
  platforms?: Platform[];
}

/** Full entry point: QuizResponse → ScoreResult. */
export function score(response: QuizResponse, opts: ScoreOptions = {}): ScoreResult {
  const config = opts.config ?? defaultConfig;
  const platforms = opts.platforms ?? PLATFORMS;
  const normalized = normalize(response, config, platforms);
  return runPipeline(normalized, config);
}
