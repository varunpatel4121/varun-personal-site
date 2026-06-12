import type {
  AnswerRecord,
  Classification,
  Confidence,
  GroundTag,
  JobTag,
  LoopMarker,
  PhenotypeId,
  PullTag,
  ResultPhenotype,
  ScoringConfig,
  ScoringState,
  SessionRecord,
  SeverityBand,
  SeverityResult,
  SpaceId,
  TimingTag,
} from "./types";
import { PHENOTYPE_IDS } from "./types";

export const Q_SPACES = "spaces";
export const Q_ANCHOR = "anchor";
export const Q_CONTROL = "control";
export const Q_MIRROR = "mirror";
export const Q_CLARIFIER = "clarifier";

export function emptyState(): ScoringState {
  const scores = Object.fromEntries(
    PHENOTYPE_IDS.map((p) => [p, 0]),
  ) as Record<PhenotypeId, number>;
  return {
    scores,
    jobs: {},
    control: 0,
    costs: [],
    timing: [],
    grounds: [],
    markers: [],
    spaces: [],
    anchor: null,
    anchorLabel: "",
    stage: "unknown",
    severitySelf: 0,
    mirrorResponse: null,
    unsureCount: 0,
  };
}

function addScore(state: ScoringState, ph: PhenotypeId, w: number) {
  if (state.scores[ph] !== undefined) state.scores[ph] += w;
}

function rankedScores(state: ScoringState): [PhenotypeId, number][] {
  return PHENOTYPE_IDS.map((p) => [p, state.scores[p]] as [PhenotypeId, number])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
}

export function topPhenotype(state: ScoringState): PhenotypeId | null {
  const ranked = rankedScores(state);
  return ranked.length > 0 ? ranked[0][0] : null;
}

export function topPhenotypes(state: ScoringState, n: number): PhenotypeId[] {
  return rankedScores(state)
    .slice(0, n)
    .map(([p]) => p);
}

export function topJobs(state: ScoringState, n = 2): JobTag[] {
  return (Object.entries(state.jobs) as [JobTag, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => t);
}

export function computeState(
  answers: AnswerRecord[],
  config: ScoringConfig,
): ScoringState {
  const state = emptyState();

  for (const answer of answers) {
    if (answer.questionId === Q_SPACES) {
      state.spaces = answer.optionIds.filter(
        (id) => id !== "none",
      ) as SpaceId[];
    }

    if (answer.questionId === Q_ANCHOR) {
      const anchor = answer.optionIds[0];
      state.anchor = (anchor as SpaceId | "none") ?? null;
      state.anchorLabel = answer.optionTexts[0] ?? "";
      const weights = config.anchorWeights[anchor];
      if (weights) {
        for (const [ph, w] of Object.entries(weights)) {
          addScore(state, ph as PhenotypeId, w as number);
        }
      }
    }

    if (answer.questionId === Q_CONTROL && answer.scale !== undefined) {
      state.control += answer.scale;
    }

    if (answer.questionId === Q_MIRROR) {
      const response = answer.optionIds[0];
      const leader = topPhenotype(state);
      if (response === "exactly") {
        state.mirrorResponse = "exactly";
        if (leader) addScore(state, leader, config.mirror.exactBoost);
      } else if (response === "partly") {
        state.mirrorResponse = "partly";
      } else if (response === "not_me") {
        state.mirrorResponse = "not_me";
        if (leader) state.scores[leader] *= config.mirror.notMeMultiplier;
      }
    }

    for (const fx of answer.effects) {
      if (fx.ph) {
        for (const [ph, w] of Object.entries(fx.ph)) {
          addScore(state, ph as PhenotypeId, w as number);
        }
      }
      if (fx.jobs) {
        for (const [tag, w] of Object.entries(fx.jobs)) {
          state.jobs[tag as JobTag] =
            (state.jobs[tag as JobTag] ?? 0) + (w as number);
        }
      }
      if (fx.control) state.control += fx.control;
      if (fx.costs) {
        for (const c of fx.costs) {
          if (!state.costs.includes(c)) state.costs.push(c);
        }
      }
      if (fx.stage && state.stage === "unknown") state.stage = fx.stage;
      if (fx.markers) {
        for (const m of fx.markers) {
          if (!state.markers.includes(m)) state.markers.push(m);
        }
      }
      if (fx.severity !== undefined) state.severitySelf = fx.severity;
      if (fx.grounds) {
        for (const g of fx.grounds) {
          if (!state.grounds.includes(g)) state.grounds.push(g);
        }
      }
      if (fx.timing) {
        for (const t of fx.timing) {
          if (!state.timing.includes(t)) state.timing.push(t);
        }
      }
      if (fx.unsure) state.unsureCount += 1;
    }
  }

  for (const rule of config.conditionalRules) {
    const timingOk =
      !rule.if.timingIncludes || state.timing.includes(rule.if.timingIncludes);
    const anchorOk = !rule.if.anchor || state.anchor === rule.if.anchor;
    if (timingOk && anchorOk) {
      for (const [ph, w] of Object.entries(rule.add)) {
        addScore(state, ph as PhenotypeId, w as number);
      }
    }
  }

  if (
    state.control >= config.controlMarkerThreshold &&
    !state.markers.includes("loss_of_control")
  ) {
    state.markers.push("loss_of_control");
  }

  return state;
}

export function classify(
  state: ScoringState,
  config: ScoringConfig,
): Classification {
  const ranked = rankedScores(state);
  const { primaryMin, secondaryMin, secondaryRatio } = config.classification;

  const primary: ResultPhenotype =
    ranked.length > 0 && ranked[0][1] >= primaryMin ? ranked[0][0] : "none";

  const secondary: PhenotypeId | null =
    primary !== "none" &&
    ranked.length > 1 &&
    ranked[1][1] >= secondaryMin &&
    ranked[1][1] >= ranked[0][1] * secondaryRatio
      ? ranked[1][0]
      : null;

  return { primary, secondary, confidence: confidence(state, config, primary) };
}

const CONFIDENCE_LEVELS: Confidence[] = ["low", "moderate", "high"];

function confidence(
  state: ScoringState,
  config: ScoringConfig,
  primary: ResultPhenotype,
): Confidence {
  let level: number;
  if (state.mirrorResponse === "exactly") level = 2;
  else if (state.mirrorResponse === "partly") level = 1;
  else if (state.mirrorResponse === "not_me") level = 0;
  else level = 1;

  if (state.unsureCount >= config.confidence.unsurePenaltyThreshold) {
    level = Math.max(0, level - 1);
  }
  if (primary === "none") level = Math.min(level, 1);

  return CONFIDENCE_LEVELS[level];
}

export function severity(
  state: ScoringState,
  config: ScoringConfig,
): SeverityResult {
  const score =
    state.severitySelf +
    Math.min(config.severity.controlCap, state.control) +
    Math.min(config.severity.costCap, state.costs.length);
  const band: SeverityBand =
    config.severity.bands.find((b) => score <= b.max)?.id ?? "deep_loop";
  return { score, band };
}

export function safetyGate(
  state: ScoringState,
  band: SeverityBand,
  config: ScoringConfig,
): boolean {
  if (band !== config.safety.requireBand) return false;
  const costHit = config.safety.costAny.some((c) => state.costs.includes(c));
  const groundHit = config.safety.groundAny.some((g) =>
    state.grounds.includes(g as GroundTag),
  );
  return costHit && groundHit;
}

export function pullTags(
  state: ScoringState,
  config: ScoringConfig,
): { pull_tags: PullTag[]; anchor_pull: PullTag | null } {
  const tags: PullTag[] = [];
  for (const space of state.spaces) {
    const tag = config.pullMap[space];
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  const anchor_pull =
    state.anchor && state.anchor !== "none"
      ? (config.pullMap[state.anchor] ?? null)
      : null;
  return { pull_tags: tags, anchor_pull };
}

export interface SessionMeta {
  sessionId: string;
  startedAt: string;
  completedAt: string;
  configVersion: string;
  schemaVersion: string;
  llmUsed: { followups: boolean; mirror: boolean; narrative: boolean };
  fitRating: SessionRecord["fit_rating"];
  fitText: string | null;
}

export function buildSessionRecord(
  answers: AnswerRecord[],
  config: ScoringConfig,
  meta: SessionMeta,
): SessionRecord {
  const state = computeState(answers, config);
  const cls = classify(state, config);
  const sev = severity(state, config);
  const pulls = pullTags(state, config);

  return {
    session_id: meta.sessionId,
    schema_version: meta.schemaVersion,
    config_version: meta.configVersion,
    started_at: meta.startedAt,
    completed_at: meta.completedAt,
    pull_tags: pulls.pull_tags,
    anchor_pull: pulls.anchor_pull,
    job_tags: state.jobs,
    loop_markers: state.markers as LoopMarker[],
    timing: state.timing as TimingTag[],
    stage: state.stage,
    cost_domains: state.costs,
    ground_tags: state.grounds,
    severity_score: sev.score,
    severity_band: sev.band,
    primary: cls.primary,
    secondary: cls.secondary,
    confidence: cls.confidence,
    scores: state.scores,
    mirror_response: state.mirrorResponse,
    fit_rating: meta.fitRating,
    fit_text: meta.fitText,
    safety_triggered: safetyGate(state, sev.band, config),
    unsure_count: state.unsureCount,
    llm_used: meta.llmUsed,
    answers: answers.map((a) => ({
      question_id: a.questionId,
      question_text: a.questionText,
      source: a.source,
      option_ids: a.optionIds,
      option_texts: a.optionTexts,
      ...(a.scale !== undefined ? { scale: a.scale } : {}),
    })),
  };
}
