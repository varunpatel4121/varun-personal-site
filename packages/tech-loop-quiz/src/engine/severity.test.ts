import { describe, expect, it } from "vitest";
import { calculateSeverity } from "./severity";
import { scoringConfig as config } from "../config";
import type { PhenotypeId, Signal } from "../types";

const sig = (type: Signal["type"], ...tags: string[]): Signal[] =>
  tags.map((tag) => ({ type, tag, factor: 1 }));

const ctx = (o: {
  baseline?: number;
  control?: number;
  signals?: Signal[];
  top3?: PhenotypeId[];
}) => ({
  baselineSelfRating: o.baseline ?? 0,
  controlFrequency: o.control ?? 0,
  signals: o.signals ?? [],
  top3: new Set(o.top3 ?? []),
});

describe("severity banding", () => {
  it("baseline + control only → light_grip", () => {
    const r = calculateSeverity(ctx({ baseline: 2, control: 2 }), config);
    expect(r.score).toBe(4);
    expect(r.band).toBe("light_grip");
  });

  it("interference_harm pushes into steady_pull", () => {
    const r = calculateSeverity(
      ctx({ baseline: 2, control: 2, signals: sig("severity_marker", "interference_harm") }),
      config,
    );
    expect(r.score).toBe(7); // 4 + 3
    expect(r.band).toBe("steady_pull");
  });

  it("classic high-impairment pattern → high_impact_loop", () => {
    const r = calculateSeverity(
      ctx({
        baseline: 3,
        control: 4,
        signals: [
          ...sig("severity_marker", "loss_control", "failed_cutback", "interference_harm"),
          ...sig("cost_domain", "sleep", "mood_anxiety"),
        ],
      }),
      config,
    );
    // 3 + 4 + (2+2+3) + min(4, 2) = 16
    expect(r.score).toBe(16);
    expect(r.band).toBe("high_impact_loop");
  });

  it("cost breadth is capped at +4", () => {
    const r = calculateSeverity(
      ctx({
        signals: sig(
          "cost_domain",
          "sleep",
          "mood_anxiety",
          "focus_attention",
          "money",
          "friendships_dating_social",
        ),
      }),
      config,
    );
    expect(r.score).toBe(4); // five costs, capped at 4
  });

  it("only none_meaningful cost caps total at 4", () => {
    const r = calculateSeverity(
      ctx({ baseline: 4, control: 4, signals: sig("cost_domain", "none_meaningful") }),
      config,
    );
    expect(r.score).toBe(4); // 8 capped to 4
    expect(r.band).toBe("light_grip");
  });

  it("sleep+night modifier adds 1", () => {
    const base = calculateSeverity(ctx({ signals: sig("cost_domain", "sleep") }), config);
    const withNight = calculateSeverity(
      ctx({ signals: [...sig("cost_domain", "sleep"), ...sig("entry_point", "night_regulation")] }),
      config,
    );
    expect(withNight.score - base.score).toBe(1);
  });

  it("money+reward_chaser-in-top3 modifier adds 1", () => {
    const r = calculateSeverity(
      ctx({ signals: sig("cost_domain", "money"), top3: ["reward_chaser"] }),
      config,
    );
    // 0 + cost(1) + moneyWithReward(1)
    expect(r.score).toBe(2);
  });
});
