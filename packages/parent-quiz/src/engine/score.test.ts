import { describe, expect, it } from "vitest";
import { score } from "./score";
import { CHILD_LOOPS, type ChildLoop } from "../types";
import type { ParentResponse } from "../types";

const resp = (answers: Record<string, string[]>): ParentResponse => ({ answers });

describe("parent-quiz reachability", () => {
  // Inputs built from the live question set (q4_giving / q8_month were removed).
  const reach: Record<ChildLoop, Record<string, string[]>> = {
    night_off_switch: { q1_concern: ["bedtime"] },
    quiet_pull_away: { q1_concern: ["withdrawn"] },
    social_mirror: { q1_concern: ["social"], q5_aftermath: ["smaller"] },
    always_checking: { q1_concern: ["unsure"], q3_hardest: ["morning", "group_event"] },
    online_belonging: { q1_concern: ["gaming"], q3_hardest: ["alone", "group_event"] },
    competence_refuge: { q1_concern: ["gaming"], q3_hardest: ["before_hard"] },
    reward_chase: { q1_concern: ["money"] },
    intensity_loop: { q1_concern: ["intense"] },
    autopilot_zone_out: { q2_limit: ["one_more"], q3_hardest: ["bored"] },
    daily_battle: { q1_concern: ["battle"], q2_limit: ["fight"] },
  };
  for (const loop of CHILD_LOOPS) {
    it(`${loop} is reachable as primary`, () => {
      expect(score(resp(reach[loop])).primary_child_loop).toBe(loop);
    });
  }
});

describe("parent-quiz hard rules", () => {
  it("safety concern (now in q6) routes to safety_route + flag", () => {
    const r = score(resp({ q1_concern: ["bedtime"], q6_cost: ["safety"] }));
    expect(r.support_level).toBe("safety_route");
    expect(r.safety_flag).toBe(true);
    expect(r.hard_rules_triggered).toContain("PR_SAFETY");
  });

  it("reward+money forces reward_chase as secondary and raises support", () => {
    const r = score(resp({ q1_concern: ["bedtime"], q6_cost: ["money", "sleep"] }));
    expect(r.primary_child_loop).toBe("night_off_switch");
    expect(r.secondary_child_loop).toBe("reward_chase");
    expect(r.hard_rules_triggered).toContain("PR_REWARD_MONEY");
  });

  it("night + sleep cost raises a band", () => {
    const r = score(resp({ q1_concern: ["bedtime"], q6_cost: ["sleep"] }));
    expect(r.hard_rules_triggered).toContain("PR_NIGHT_SLEEP");
  });

  it("low concern + collaborative caps at normal tension", () => {
    const r = score(resp({ q1_concern: ["unsure"], q2_limit: ["works"], q6_cost: ["nowhere"], q7_role: ["collaborator"] }));
    expect(r.support_level).toBe("normal_tension");
    expect(r.hard_rules_triggered).toContain("PR_LOW_CONCERN");
  });
});

describe("parent-quiz support banding", () => {
  it("a light pattern reads low", () => {
    const r = score(resp({ q1_concern: ["bedtime"], q6_cost: ["mood"] }));
    expect(["normal_tension", "pattern_forming"]).toContain(r.support_level);
  });

  it("many costs + concealment + reward reads as support_recommended", () => {
    const r = score(resp({
      q1_concern: ["money"],
      q2_limit: ["fight", "sneak"],
      q5_aftermath: ["defensive"],
      q6_cost: ["sleep", "mood", "conflict", "money", "secrecy"],
    }));
    expect(r.support_level).toBe("support_recommended");
  });
});

describe("parent-quiz structure", () => {
  it("no second loop → null secondary", () => {
    expect(score(resp({ q1_concern: ["bedtime"] })).secondary_child_loop).toBeNull();
  });

  it("two close loops surface a secondary (70% rule)", () => {
    const r = score(resp({ q1_concern: ["social", "gaming"] }));
    expect(r.secondary_child_loop).not.toBeNull();
  });

  it("is deterministic + returns the full loop spectrum", () => {
    const a = score(resp({ q1_concern: ["bedtime"] }));
    const b = score(resp({ q1_concern: ["bedtime"] }));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(Object.keys(a.spectrum).sort()).toEqual([...CHILD_LOOPS].sort());
  });
});
