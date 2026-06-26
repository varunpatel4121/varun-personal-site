/**
 * Acceptance cases — a direct port of the "Acceptance / Examples" table in the
 * Phenotype Scoring Rules sheet. These feed signals straight into the pipeline
 * (bypassing normalize) and assert the deterministic primary assignment, plus
 * secondary / severity / hard-rule effects where the sheet pins them.
 *
 * Severity bands are only asserted where the sheet forces them (hard rules or
 * zero-cost cases); bands that depend on unstated baseline/control are covered
 * exhaustively in severity.test.ts instead.
 */

import { describe, expect, it } from "vitest";
import { runPipeline } from "./score";
import { scoringConfig } from "../config";
import type { HookTag, NormalizedInput, Signal, SignalType } from "../types";

type Spec = Partial<Record<SignalType, string[]>> & {
  baseline?: number;
  control?: number;
  freeText?: string[];
};

const TYPES: SignalType[] = [
  "hook",
  "job",
  "entry_point",
  "loop_shape",
  "aftertaste",
  "cost_domain",
  "severity_marker",
  "tie_breaker",
  "platform_feature",
];

/**
 * Build a NormalizedInput from a signal spec. Jobs are DERIVED from the listed
 * hooks (merged with any explicit jobs), exactly as normalize() does — the
 * sheet's cases list only the salient job, but a hook always implies its jobs.
 */
function mk(spec: Spec): NormalizedInput {
  const jobs = new Set<string>(spec.job ?? []);
  for (const h of spec.hook ?? []) {
    for (const j of scoringConfig.hookJobMap[h as HookTag] ?? []) jobs.add(j);
  }
  const expanded: Spec = { ...spec, job: [...jobs] };

  const signals: Signal[] = [];
  for (const t of TYPES) {
    for (const tag of expanded[t] ?? []) signals.push({ type: t, tag, factor: 1 });
  }
  return {
    signals,
    baselineSelfRating: spec.baseline ?? 0,
    controlFrequency: spec.control ?? 0,
    freeText: spec.freeText ?? [],
  };
}

describe("acceptance cases (Scoring Rules sheet)", () => {
  it("EX_NIGHT_01 → night_regulator", () => {
    const r = runPipeline(mk({
      hook: ["zone_out"], job: ["soothe"], entry_point: ["night_regulation"],
      loop_shape: ["time_sink_binge"], cost_domain: ["sleep"], aftertaste: ["tired"],
      tie_breaker: ["night_avoid_head"],
    }));
    expect(r.output.primary_phenotype_id).toBe("night_regulator");
  });

  it("EX_TIME_01 → time_reclaimer, secondary night_regulator", () => {
    const r = runPipeline(mk({
      hook: ["endless_feed"], job: ["stimulate"], entry_point: ["night_regulation"],
      loop_shape: ["time_sink_binge"], cost_domain: ["sleep"], tie_breaker: ["night_only_time_mine"],
    }));
    expect(r.output.primary_phenotype_id).toBe("time_reclaimer");
    expect(r.output.secondary_phenotype_id).toBe("night_regulator");
  });

  it("EX_REASSURE_01 → reassurance_checker", () => {
    const r = runPipeline(mk({
      hook: ["tethered_check"], job: ["reassure"], loop_shape: ["quick_check"],
      entry_point: ["morning_check_in"], cost_domain: ["focus_attention"], tie_breaker: ["see_if_changed"],
    }));
    expect(r.output.primary_phenotype_id).toBe("reassurance_checker");
  });

  it("EX_SCAN_01 → vigilant_scanner", () => {
    const r = runPipeline(mk({
      hook: ["rabbit_hole"], job: ["reassure"], loop_shape: ["completion"],
      platform_feature: ["news_health_search"], aftertaste: ["more_anxious"], tie_breaker: ["read_enough_safe"],
    }));
    expect(r.output.primary_phenotype_id).toBe("vigilant_scanner");
  });

  it("EX_OPT_01 → optimizer_spiral, secondary vigilant_scanner", () => {
    const r = runPipeline(mk({
      hook: ["rabbit_hole", "companion"], job: ["empower"], entry_point: ["task_avoidance"],
      loop_shape: ["completion"], aftertaste: ["behind_panicked"], tie_breaker: ["preparing_becomes_thing"],
    }));
    expect(r.output.primary_phenotype_id).toBe("optimizer_spiral");
    expect(r.output.secondary_phenotype_id).toBe("vigilant_scanner");
  });

  it("EX_VALIDATE_01 → validation_monitor, secondary reassurance_checker", () => {
    const r = runPipeline(mk({
      hook: ["tethered_check"], job: ["validate"], loop_shape: ["waiting_refresh"],
      platform_feature: ["posting_metrics"], aftertaste: ["more_anxious"], tie_breaker: ["checking_reaction_to_me"],
    }));
    expect(r.output.primary_phenotype_id).toBe("validation_monitor");
    expect(r.output.secondary_phenotype_id).toBe("reassurance_checker");
  });

  it("EX_COMPARE_01 → comparison_spiral", () => {
    const r = runPipeline(mk({
      hook: ["mirror"], job: ["compare"], aftertaste: ["worse_self_body"],
      cost_domain: ["self_body_image"], tie_breaker: ["see_where_i_stand"],
    }));
    expect(r.output.primary_phenotype_id).toBe("comparison_spiral");
  });

  it("EX_HOME_01 → online_home", () => {
    const r = runPipeline(mk({
      hook: ["belonging"], job: ["connect"], loop_shape: ["social_participation"],
      platform_feature: ["community_server_group"], aftertaste: ["connected"],
      cost_domain: ["friendships_dating_social"], tie_breaker: ["these_are_my_people"],
    }));
    expect(r.output.primary_phenotype_id).toBe("online_home");
  });

  it("EX_CONFIDANT_01 → always_there_confidant, light_grip", () => {
    const r = runPipeline(mk({
      hook: ["companion"], job: ["connect"], entry_point: ["alone_disconnected"],
      platform_feature: ["ai_chatbot_support"], aftertaste: ["connected"], tie_breaker: ["always_answers"],
    }));
    expect(r.output.primary_phenotype_id).toBe("always_there_confidant");
    expect(r.output.severity_label).toBe("light_grip");
  });

  it("EX_REWARD_01 → reward_chaser, high_impact_loop, HR_REWARD_001", () => {
    const r = runPipeline(mk({
      hook: ["reward_chase"], platform_feature: ["betting_trading_gambling"], cost_domain: ["money"],
      severity_marker: ["loss_control", "concealment"], tie_breaker: ["next_one_could_be_one"],
    }));
    expect(r.output.primary_phenotype_id).toBe("reward_chaser");
    expect(r.output.severity_label).toBe("high_impact_loop");
    expect(r.output.hard_rules_triggered).toContain("HR_REWARD_001");
  });

  it("EX_AROUSAL_01 → arousal_regulator (cost + distress present)", () => {
    const r = runPipeline(mk({
      hook: ["arousal_pull"], job: ["soothe"], aftertaste: ["guilty_ashamed"],
      severity_marker: ["time_creep"], cost_domain: ["mood_anxiety"], tie_breaker: ["private_changes_channel"],
    }));
    expect(r.output.primary_phenotype_id).toBe("arousal_regulator");
    expect(r.output.primary_adaptive).toBe(false);
  });

  it("EX_SECOND_ADAPT_01 → second_self, adaptive, HR_SECOND_001, light_grip", () => {
    const r = runPipeline(mk({
      hook: ["second_self"], job: ["empower"], aftertaste: ["connected"],
      cost_domain: ["none_meaningful"], tie_breaker: ["real_life_no_room"], control: 0,
    }));
    expect(r.output.primary_phenotype_id).toBe("second_self");
    expect(r.output.primary_adaptive).toBe(true);
    expect(r.output.hard_rules_triggered).toContain("HR_SECOND_001");
    expect(r.output.severity_label).toBe("light_grip");
  });

  it("EX_LOW_01 → no_dominant_loop, HR_LOW_001, light_grip", () => {
    const r = runPipeline(mk({
      entry_point: ["not_problem"], cost_domain: ["none_meaningful"],
      severity_marker: ["none"], baseline: 0, control: 0,
    }));
    expect(r.output.primary_phenotype_id).toBe("no_dominant_loop");
    expect(r.output.hard_rules_triggered).toContain("HR_LOW_001");
    expect(r.output.severity_label).toBe("light_grip");
  });

  it("is deterministic — identical input yields identical output", () => {
    const spec: Spec = {
      hook: ["zone_out"], job: ["soothe"], entry_point: ["night_regulation"],
      loop_shape: ["time_sink_binge"], cost_domain: ["sleep"], tie_breaker: ["night_avoid_head"],
    };
    const a = runPipeline(mk(spec));
    const b = runPipeline(mk(spec));
    expect(JSON.stringify(a.output)).toBe(JSON.stringify(b.output));
  });
});
