import { describe, expect, it } from "vitest";
import { score } from "./score";
import { selectPatterns } from "./hard-rules";
import { scoringConfig } from "../config";
import {
  PARENT_PATTERNS,
  PROBLEM_PATTERNS,
  type ParentPattern,
  type ParentResponse,
} from "../types";

const resp = (answers: Record<string, string[]>): ParentResponse => ({ answers });

const mkScores = (partial: Partial<Record<ParentPattern, number>>): Record<ParentPattern, number> =>
  Object.fromEntries(PARENT_PATTERNS.map((p) => [p, partial[p] ?? 0])) as Record<ParentPattern, number>;

const select = (
  scores: Partial<Record<ParentPattern, number>>,
  opts: { selected?: string[]; signals?: string[] } = {},
) =>
  selectPatterns({
    scores: mkScores(scores),
    selected: new Set(opts.selected ?? []),
    signals: new Set(opts.signals ?? []),
    config: scoringConfig,
  });

// ── Selection + hard-rule logic (synthetic scores) ──────────────────────────
describe("selectPatterns — primary threshold + LOW", () => {
  it("a pattern below the primary threshold falls back to LOW monitoring", () => {
    const r = select({ LB: 4 });
    expect(r.primary).toBe("LOW");
    expect(r.triggered).toContain("PR_LOW_MONITORING");
  });

  it("a pattern at or above the threshold becomes primary", () => {
    expect(select({ LB: 5 }).primary).toBe("LB");
  });
});

describe("selectPatterns — secondary selection", () => {
  it("surfaces a secondary within range and above threshold", () => {
    expect(select({ BMS: 8, LB: 6 }).secondaries).toEqual(["LB"]);
  });
  it("drops a secondary below the score threshold", () => {
    expect(select({ BMS: 8, LB: 3 }).secondaries).toEqual([]);
  });
  it("drops a secondary outside the gap window", () => {
    expect(select({ BMS: 10, LB: 6 }).secondaries).toEqual([]);
  });
  it("caps secondaries at two", () => {
    expect(select({ BMS: 8, LB: 7, OLS: 6, SWL: 6 }).secondaries.length).toBe(2);
  });
});

describe("selectPatterns — hard rules 1 & 2 (safety / risk)", () => {
  it("safety forces SRS + safety_urgent floor", () => {
    const r = select({ SRS: 8, BMS: 9 }, { selected: ["q5_safety"] });
    expect(r.primary).toBe("SRS");
    expect(r.safety).toBe(true);
    expect(r.urgencyFloor).toBe("safety_urgent");
    expect(r.triggered).toContain("PR_SAFETY");
  });

  it("two risk answers cluster into SRS at high urgency", () => {
    const r = select({ SRS: 9, BMS: 2 }, { selected: ["q1_money", "q5_secrecy"] });
    expect(r.primary).toBe("SRS");
    expect(r.urgencyFloor).toBe("high");
    expect(r.triggered).toContain("PR_RISK_CLUSTER");
  });

  it("a single money answer raises urgency without forcing SRS", () => {
    const r = select({ BMS: 7, SRS: 5 }, { selected: ["q5_money"] });
    expect(r.primary).toBe("BMS");
    expect(r.urgencyFloor).toBe("high");
    expect(r.triggered).toContain("PR_MONEY_SECRECY");
  });
});

describe("selectPatterns — tie-break rules 4, 5, 6", () => {
  it("rule 4 — BMS wins ties over LB when ≥6 with a sleep impact", () => {
    expect(select({ BMS: 6, LB: 6 }, { signals: ["sleep"] }).primary).toBe("BMS");
  });
  it("rule 5 — EP wins an EP/LB tie only with avoid-limit or peacekeeper", () => {
    expect(select({ EP: 6, LB: 6 }, { selected: ["q2_avoid_limit"] }).primary).toBe("EP");
    expect(select({ EP: 6, LB: 6 }).primary).toBe("LB");
  });
  it("rule 6 — SWL on social signals, QPA on distance signals", () => {
    expect(select({ SWL: 6, QPA: 6 }, { signals: ["self_image"] }).primary).toBe("SWL");
    expect(select({ SWL: 6, QPA: 6 }, { signals: ["withdrawal"] }).primary).toBe("QPA");
  });
});

// ── End-to-end scoring ──────────────────────────────────────────────────────
describe("score — every pattern is reachable as primary", () => {
  const reach: Record<ParentPattern, Record<string, string[]>> = {
    LB: { q1_concern: ["q1_limits_fight"], q2_limit: ["q2_fight"] },
    EP: { q2_limit: ["q2_avoid_limit"], q6_role: ["q6_peacekeeper"] },
    BMS: { q1_concern: ["q1_sleep"], q3_hardest: ["q3_late_night"] },
    QPA: { q1_concern: ["q1_pulling_away"], q6_role: ["q6_worried_observer"] },
    SWL: { q1_concern: ["q1_social_mood"], q4_aftermath: ["q4_self_conscious"] },
    OLS: { q1_concern: ["q1_online_worlds"], q3_hardest: ["q3_bored_waiting"], q5_cost: ["q5_responsibilities"] },
    SRS: { q5_cost: ["q5_money"] },
    LOW: { q2_limit: ["q2_limits_work"], q5_cost: ["q5_nowhere"], q6_role: ["q6_collaborator"] },
  };
  for (const pattern of PARENT_PATTERNS) {
    it(`${pattern} is reachable`, () => {
      expect(score(resp(reach[pattern])).primary_pattern).toBe(pattern);
    });
  }
});

describe("score — hard rules end-to-end", () => {
  it("safety routes to the safety_urgent band + flag", () => {
    const r = score(resp({ q1_concern: ["q1_sleep"], q5_cost: ["q5_safety"] }));
    expect(r.primary_pattern).toBe("SRS");
    expect(r.safety_flag).toBe(true);
    expect(r.severity_band).toBe("safety_urgent");
    expect(r.support_urgency).toBe("safety_urgent");
    expect(r.hard_rules_triggered).toContain("PR_SAFETY");
  });

  it("a single money cost reads high urgency", () => {
    const r = score(resp({ q1_concern: ["q1_sleep"], q5_cost: ["q5_money"] }));
    expect(r.primary_pattern).toBe("SRS");
    expect(r.support_urgency).toBe("high");
    expect(r.severity_band).toBe("high_support_need");
    expect(r.hard_rules_triggered).toContain("PR_MONEY_SECRECY");
  });

  it("the collaborative / low-signal set reads as a light LOW result", () => {
    const r = score(resp({
      q1_concern: ["q1_not_sure"],
      q2_limit: ["q2_limits_work"],
      q5_cost: ["q5_nowhere"],
      q6_role: ["q6_collaborator"],
    }));
    expect(r.primary_pattern).toBe("LOW");
    expect(r.severity_band).toBe("light");
    expect(r.support_urgency).toBe("low");
    expect(r.hard_rules_triggered).toContain("PR_LOW_MONITORING");
  });

  it("'one more round' + a sleep signal adds the BMS bonus point", () => {
    expect(score(resp({ q1_concern: ["q1_sleep"], q2_limit: ["q2_one_more"] })).spectrum.BMS).toBe(4);
    expect(score(resp({ q2_limit: ["q2_one_more"] })).spectrum.BMS).toBe(0);
  });
});

describe("score — severity banding", () => {
  it("a clear pattern with no stated cost reads light", () => {
    expect(score(resp({ q1_concern: ["q1_sleep"], q3_hardest: ["q3_late_night"] })).severity_band).toBe("light");
  });
  it("one cost domain reads moderate", () => {
    expect(score(resp({ q1_concern: ["q1_sleep"], q5_cost: ["q5_sleep"] })).severity_band).toBe("moderate");
  });
  it("several cost domains read as high support need", () => {
    const r = score(resp({ q1_concern: ["q1_sleep"], q5_cost: ["q5_sleep", "q5_mood", "q5_family_conflict"] }));
    expect(r.severity_band).toBe("high_support_need");
  });
});

describe("score — structure", () => {
  it("surfaces a secondary when two patterns are close", () => {
    const r = score(resp({
      q1_concern: ["q1_sleep", "q1_limits_fight"],
      q4_aftermath: ["q4_exhausted"],
      q2_limit: ["q2_fight"],
    }));
    expect(r.primary_pattern).toBe("BMS");
    expect(r.secondary_patterns).toContain("LB");
  });

  it("is deterministic + returns the full pattern spectrum", () => {
    const a = score(resp({ q1_concern: ["q1_sleep"] }));
    const b = score(resp({ q1_concern: ["q1_sleep"] }));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(Object.keys(a.spectrum).sort()).toEqual([...PARENT_PATTERNS].sort());
  });

  it("no problem pattern means no secondaries", () => {
    expect(score(resp({ q2_limit: ["q2_limits_work"] })).secondary_patterns).toEqual([]);
  });

  it("PROBLEM_PATTERNS excludes LOW", () => {
    expect((PROBLEM_PATTERNS as readonly string[]).includes("LOW")).toBe(false);
  });
});
