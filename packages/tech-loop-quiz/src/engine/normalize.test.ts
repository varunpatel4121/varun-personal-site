import { describe, expect, it } from "vitest";
import { normalize } from "./normalize";
import { runPipeline, score } from "./score";
import { scoringConfig as config, PLATFORMS } from "../config";
import type { QuizResponse, Signal } from "../types";

const base: QuizResponse = {
  reporter: "self",
  lifeStage: "working",
  baselineSelfRating: 2,
  platforms: [],
  subfeatures: [],
  hookAnswers: [],
  entryPoints: [],
  loopShapes: [],
  controlFrequency: 2,
  severityMarkers: [],
  aftertastes: [],
  costDomains: [],
};

const tagsOf = (signals: Signal[], type: string) =>
  signals.filter((s) => s.type === type).map((s) => s.tag);

const factorOf = (signals: Signal[], type: string, tag: string) =>
  signals.find((s) => s.type === type && s.tag === tag)?.factor;

describe("normalize", () => {
  it("derives jobs from hooks via the hook-job map", () => {
    const r = normalize(
      { ...base, hookAnswers: [{ platform: "instagram", subfeature: "reels", rank: 1, optionId: "x", hook: "mirror" }] },
      config,
      PLATFORMS,
    );
    // mirror → [compare, validate]
    expect(tagsOf(r.signals, "job").sort()).toEqual(["compare", "validate"]);
    expect(tagsOf(r.signals, "hook")).toEqual(["mirror"]);
  });

  it("applies anchor-rank multipliers (1.25 / 1.0 / 0.85)", () => {
    const r = normalize(
      {
        ...base,
        hookAnswers: [
          { platform: "instagram", subfeature: "reels", rank: 1, optionId: "a", hook: "endless_feed" },
          { platform: "youtube", subfeature: "shorts", rank: 3, optionId: "b", hook: "zone_out" },
        ],
      },
      config,
      PLATFORMS,
    );
    expect(factorOf(r.signals, "hook", "endless_feed")).toBe(1.25);
    expect(factorOf(r.signals, "hook", "zone_out")).toBe(0.85);
  });

  it("dedupes a repeated hook, keeping the max anchor factor", () => {
    const r = normalize(
      {
        ...base,
        hookAnswers: [
          { platform: "youtube", subfeature: "shorts", rank: 3, optionId: "a", hook: "zone_out" },
          { platform: "instagram", subfeature: "reels", rank: 1, optionId: "b", hook: "zone_out" },
        ],
      },
      config,
      PLATFORMS,
    );
    expect(tagsOf(r.signals, "hook")).toEqual(["zone_out"]);
    expect(factorOf(r.signals, "hook", "zone_out")).toBe(1.25);
  });

  it("derives platform_feature tags from selected platforms/sub-features", () => {
    const r = normalize(
      {
        ...base,
        platforms: ["betting_trading_gambling"],
        subfeatures: [{ platform: "betting_trading_gambling", subfeature: "sports_betting", rank: 1 }],
      },
      config,
      PLATFORMS,
    );
    expect(tagsOf(r.signals, "platform_feature")).toContain("betting_trading_gambling");
  });
});

describe("eligibility gates via runPipeline", () => {
  it("blocks reward_chaser without a reward/betting/shopping signal", () => {
    // climb + stimulate give reward_chaser a few points, but GATE_REWARD_01 blocks it.
    const r = runPipeline({
      signals: [
        { type: "hook", tag: "climb", factor: 1 },
        { type: "job", tag: "stimulate", factor: 1 },
      ],
      baselineSelfRating: 2,
      controlFrequency: 2,
      freeText: [],
    });
    const reward = r.scores.find((s) => s.id === "reward_chaser")!;
    expect(reward.eligible).toBe(false);
    expect(r.output.primary_phenotype_id).not.toBe("reward_chaser");
  });
});

describe("score() end-to-end from a QuizResponse", () => {
  it("produces a coherent night-regulator result", () => {
    const r = score({
      ...base,
      baselineSelfRating: 3,
      platforms: ["tiktok"],
      subfeatures: [{ platform: "tiktok", subfeature: "for_you_page", rank: 1 }],
      hookAnswers: [
        { platform: "tiktok", subfeature: "for_you_page", rank: 1, optionId: "x", hook: "zone_out" },
      ],
      entryPoints: ["night_regulation"],
      loopShapes: ["time_sink_binge"],
      controlFrequency: 3,
      severityMarkers: ["time_creep"],
      aftertastes: ["tired"],
      costDomains: ["sleep", "mood_anxiety"],
      tieBreaker: "night_avoid_head",
    });
    expect(r.output.primary_phenotype_id).toBe("night_regulator");
    expect(["steady_pull", "deep_loop"]).toContain(r.output.severity_label);
    expect(r.output.formulation_sentence).toContain("The Night Regulator");
    // safety floor HR_NIGHT_001 (night + sleep + control>=3)
    expect(r.output.hard_rules_triggered).toContain("HR_NIGHT_001");
  });
});
