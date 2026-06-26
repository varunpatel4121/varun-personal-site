/**
 * normalize(): QuizResponse -> NormalizedInput (deduped signals + scalars).
 *
 * Rules (see SCORING.md "Answer → signal mapping"):
 *  - A hook is present once; its factor is the max anchor-rank multiplier among
 *    the sub-features that produced it.
 *  - Jobs are DERIVED from present hooks via hookJobMap (each present once,
 *    factor = max over implying hooks). Section D captures hooks; the hook
 *    carries the cognitive "job", per the Tech Loop Quiz doc.
 *  - Entry points, loop shapes, aftertastes, cost domains, and severity markers
 *    map 1:1 from selections (factor 1).
 *  - Platform features are derived from the selected platforms + sub-features.
 *  - The tie-breaker (if any) comes from the optional disambiguation step.
 */

import type {
  HookTag,
  JobTag,
  NormalizedInput,
  Platform,
  QuizResponse,
  ScoringConfig,
  Signal,
} from "../types";

function anchorMultiplier(rank: number, multipliers: number[]): number {
  return multipliers[rank - 1] ?? 1;
}

export function normalize(
  response: QuizResponse,
  config: ScoringConfig,
  platforms: Platform[],
): NormalizedInput {
  const signals: Signal[] = [];

  // ── Hooks (deduped, max anchor factor) ────────────────────────────────────
  const hookFactor = new Map<HookTag, number>();
  const hookSource = new Map<HookTag, Signal["source"]>();
  for (const a of response.hookAnswers) {
    if (!a.hook) continue;
    const factor = anchorMultiplier(a.rank, config.anchorRankMultipliers);
    if (factor > (hookFactor.get(a.hook) ?? -Infinity)) {
      hookFactor.set(a.hook, factor);
      hookSource.set(a.hook, {
        platform: a.platform,
        subfeature: a.subfeature,
        rank: a.rank,
      });
    } else if (!hookFactor.has(a.hook)) {
      hookFactor.set(a.hook, factor);
    }
  }
  for (const [hook, factor] of hookFactor) {
    signals.push({ type: "hook", tag: hook, factor, source: hookSource.get(hook) });
  }

  // ── Jobs derived from hooks (deduped, max factor) ─────────────────────────
  const jobFactor = new Map<JobTag, number>();
  for (const [hook, factor] of hookFactor) {
    for (const job of config.hookJobMap[hook] ?? []) {
      jobFactor.set(job, Math.max(jobFactor.get(job) ?? 0, factor));
    }
  }
  for (const [job, factor] of jobFactor) {
    signals.push({ type: "job", tag: job, factor });
  }

  // ── 1:1 selection signals ─────────────────────────────────────────────────
  const pushUnique = (type: Signal["type"], tags: string[]) => {
    for (const tag of [...new Set(tags)]) signals.push({ type, tag, factor: 1 });
  };
  pushUnique("entry_point", response.entryPoints);
  pushUnique("loop_shape", response.loopShapes);
  pushUnique("aftertaste", response.aftertastes);
  pushUnique("cost_domain", response.costDomains);
  pushUnique("severity_marker", response.severityMarkers);

  // ── Platform features derived from selections ─────────────────────────────
  const byId = new Map(platforms.map((p) => [p.id, p]));
  const features = new Set<string>();
  for (const pid of response.platforms) {
    const p = byId.get(pid);
    if (p?.platformFeature) features.add(p.platformFeature);
  }
  for (const sel of response.subfeatures) {
    const sf = byId.get(sel.platform)?.subfeatures.find((s) => s.id === sel.subfeature);
    if (sf?.platformFeature) features.add(sf.platformFeature);
  }
  for (const f of features) signals.push({ type: "platform_feature", tag: f, factor: 1 });

  // ── Tie-breaker (optional disambiguation) ─────────────────────────────────
  if (response.tieBreaker) {
    signals.push({ type: "tie_breaker", tag: response.tieBreaker, factor: 1 });
  }

  return {
    signals,
    baselineSelfRating: response.baselineSelfRating,
    controlFrequency: response.controlFrequency,
    freeText: (response.freeText ?? []).map((f) => f.text).filter(Boolean),
  };
}
