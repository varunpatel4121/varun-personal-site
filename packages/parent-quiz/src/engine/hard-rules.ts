/**
 * Parent-quiz hard rules (Scoring Sketch · "Hard Rules"). Deterministic
 * overrides on the support level + safety routing. Each emits an effect the
 * scorer applies after base support scoring.
 */

import type {
  ChildLoop,
  CostDomain,
  FamilyPattern,
  SupportLevel,
  UrgencyMarker,
} from "../types";

export interface ParentHardRuleInput {
  loopScores: Record<ChildLoop, number>;
  familyTop: FamilyPattern | null;
  costs: Set<CostDomain>;
  markers: Set<UrgencyMarker>;
  hardRuleFlags: Set<string>;
  lowConcern: boolean;
  supportScore: number;
}

export interface ParentHardRuleEffect {
  ruleId: string;
  /** Raise the support band by this many steps. */
  bandDelta?: number;
  /** Cap the support band at this level. */
  capBand?: SupportLevel;
  /** Ensure this loop appears at least as the secondary result. */
  forceSecondary?: ChildLoop;
  safety?: boolean;
}

export interface ParentHardRuleResult {
  effects: ParentHardRuleEffect[];
  triggered: string[];
}

export function evaluateParentHardRules(input: ParentHardRuleInput): ParentHardRuleResult {
  const effects: ParentHardRuleEffect[] = [];
  const triggered: string[] = [];
  const fire = (e: ParentHardRuleEffect) => {
    effects.push(e);
    triggered.push(e.ruleId);
  };

  // Safety bypass — overrides everything; show urgent support, not a marketing result.
  if (input.hardRuleFlags.has("safety") || input.markers.has("safety")) {
    fire({ ruleId: "PR_SAFETY", safety: true });
  }

  // Reward + money — prioritise Reward Chase and raise urgency.
  if (input.hardRuleFlags.has("reward_money") && input.costs.has("money")) {
    fire({ ruleId: "PR_REWARD_MONEY", bandDelta: 1, forceSecondary: "reward_chase" });
  }

  // Night off-switch + sleep cost — the kid's sleep is taking the hit; raise a band.
  if (input.loopScores.night_off_switch > 0 && input.costs.has("sleep")) {
    fire({ ruleId: "PR_NIGHT_SLEEP", bandDelta: 1 });
  }

  // Concealment + functional/trust cost — raise at least one band.
  if (
    input.markers.has("concealment") &&
    (input.costs.has("school") || input.costs.has("offline_life") || input.costs.has("trust"))
  ) {
    fire({ ruleId: "PR_CONCEAL", bandDelta: 1 });
  }

  // Low concern + collaborative family — don't over-sell therapy.
  if (
    input.lowConcern &&
    input.familyTop === "collaborative" &&
    input.markers.size === 0 &&
    input.supportScore <= 2
  ) {
    fire({ ruleId: "PR_LOW_CONCERN", capBand: "normal_tension" });
  }

  return { effects, triggered };
}
