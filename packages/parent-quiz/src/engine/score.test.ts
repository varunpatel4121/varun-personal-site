import { describe, expect, it } from "vitest";
import { score } from "./score";
import { CHILD_LOOPS, type ChildLoop } from "../types";
import type { ParentResponse } from "../types";

const resp = (answers: Record<string, string[]>): ParentResponse => ({ answers });

describe("parent-quiz reachability", () => {
  const reach: Record<ChildLoop, Record<string, string[]>> = {
    night_off_switch: { q1_concern: ["bedtime"], q4_giving: ["calm"] },
    quiet_pull_away: { q1_concern: ["withdrawn"], q4_giving: ["better_self"] },
    social_mirror: { q1_concern: ["social"], q4_giving: ["included"] },
    always_checking: { q1_concern: ["unsure"], q3_hardest: ["morning"], q4_giving: ["included"] },
    online_belonging: { q1_concern: ["gaming"], q4_giving: ["their_people"] },
    competence_refuge: { q1_concern: ["gaming"], q4_giving: ["good_at"] },
    reward_chase: { q1_concern: ["spending"], q4_giving: ["win"] },
    intensity_loop: { q1_concern: ["intense"], q4_giving: ["intensity"] },
    autopilot_zone_out: { q1_concern: ["unsure"], q3_hardest: ["bored"], q4_giving: ["calm"] },
    daily_battle: { q1_concern: ["battle"], q2_limit: ["fight"] },
  };
  for (const loop of CHILD_LOOPS) {
    it(`${loop} is reachable as primary`, () => {
      expect(score(resp(reach[loop])).primary_child_loop).toBe(loop);
    });
  }
});

describe("parent-quiz hard rules", () => {
  it("safety concern routes to safety_route + flag", () => {
    const r = score(resp({ q1_concern: ["bedtime"], q8_month: ["safety"] }));
    expect(r.support_level).toBe("safety_route");
    expect(r.safety_flag).toBe(true);
    expect(r.hard_rules_triggered).toContain("PR_SAFETY");
  });

  it("reward+money forces reward_chase as secondary and raises support", () => {
    const r = score(resp({ q1_concern: ["bedtime"], q6_cost: ["money", "sleep"], q8_month: ["money"] }));
    expect(r.primary_child_loop).toBe("night_off_switch");
    expect(r.secondary_child_loop).toBe("reward_chase");
    expect(r.hard_rules_triggered).toContain("PR_REWARD_MONEY");
  });

  it("night + sleep + failed limits raises a band", () => {
    const r = score(resp({ q1_concern: ["bedtime"], q4_giving: ["calm"], q6_cost: ["sleep"], q8_month: ["failed_limits"] }));
    expect(r.hard_rules_triggered).toContain("PR_NIGHT_SLEEP");
  });

  it("low concern + collaborative caps at normal tension", () => {
    const r = score(resp({ q1_concern: ["unsure"], q2_limit: ["works"], q6_cost: ["nowhere"], q7_role: ["collaborator"] }));
    expect(r.support_level).toBe("normal_tension");
    expect(r.hard_rules_triggered).toContain("PR_LOW_CONCERN");
  });
});

describe("parent-quiz support banding", () => {
  it("a light pattern reads as pattern_forming", () => {
    const r = score(resp({ q1_concern: ["bedtime"], q6_cost: ["sleep", "mood"] }));
    expect(["normal_tension", "pattern_forming"]).toContain(r.support_level);
  });

  it("many costs + urgency markers reads as support_recommended", () => {
    const r = score(resp({
      q1_concern: ["spending"],
      q6_cost: ["sleep", "mood", "conflict", "money"],
      q8_month: ["failed_limits", "keep_going", "restless", "function"],
    }));
    expect(r.support_level).toBe("support_recommended");
  });
});

describe("parent-quiz structure", () => {
  it("applies the 70% secondary rule", () => {
    // gaming → competence 2 + online 1; good_at → competence 3  => competence 5, online 1 (<70%) → no secondary
    expect(score(resp({ q1_concern: ["gaming"], q4_giving: ["good_at"] })).secondary_child_loop).toBeNull();
    // their_people → online 3; gaming → competence 2 online 1 => online 4 competence 2 (>=70%? 2/4=50% no)
    const r = score(resp({ q1_concern: ["social"], q4_giving: ["included"], q3_hardest: ["morning"] }));
    // social 4, always 3 (3/4 = 75% >= 70%) → secondary always_checking
    expect(r.primary_child_loop).toBe("social_mirror");
    expect(r.secondary_child_loop).toBe("always_checking");
  });

  it("is deterministic + returns a 10-loop spectrum", () => {
    const a = score(resp({ q1_concern: ["bedtime"], q4_giving: ["calm"] }));
    const b = score(resp({ q1_concern: ["bedtime"], q4_giving: ["calm"] }));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(Object.keys(a.spectrum).sort()).toEqual([...CHILD_LOOPS].sort());
  });
});
