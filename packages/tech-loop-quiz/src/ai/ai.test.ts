/**
 * AI narrative — guarantees the LLM is genuinely optional. The deterministic
 * composer must produce real copy for every phenotype, the prompt must carry
 * the guardrails, and a failing model must fall back silently.
 */

import { describe, expect, it } from "vitest";
import {
  buildNarratorMessages,
  composeDeterministicNarrative,
  deterministicNarrator,
  makeNarrator,
  type NarrativeInput,
} from "./index";
import { PHENOTYPE_PROFILE } from "../config";
import { PHENOTYPES } from "../types";
import type { OutputContract, PhenotypeId } from "../types";

function output(id: PhenotypeId, over: Partial<OutputContract> = {}): OutputContract {
  return {
    primary_phenotype_id: id,
    primary_phenotype_name: PHENOTYPE_PROFILE[id].name,
    primary_score: 12,
    primary_confidence: "high",
    primary_adaptive: false,
    secondary_phenotype_id: null,
    secondary_phenotype_name: null,
    severity_score: 7,
    severity_label: "steady_pull",
    top_hook_tags: [],
    top_job_tags: [],
    top_entry_points: [],
    top_loop_shapes: [],
    cost_domains: ["sleep"],
    platform_features: [],
    hard_rules_triggered: [],
    formulation_sentence: "x",
    copy_generation_mode: "deterministic",
    safety_triggered: false,
    ...over,
  };
}

const input = (id: PhenotypeId, over?: Partial<OutputContract>): NarrativeInput => ({
  output: output(id, over),
  profile: PHENOTYPE_PROFILE[id],
  secondaryProfile: null,
});

describe("deterministic narrative", () => {
  it("produces a second-person read for all 17 (no phenotype label in prose)", () => {
    for (const id of PHENOTYPES) {
      const text = composeDeterministicNarrative(input(id));
      expect(text.length).toBeGreaterThan(80);
      // The read itself is the basis of the narrative.
      expect(text).toContain(PHENOTYPE_PROFILE[id].read);
      // Second person, never the clinical label.
      expect(text).not.toContain(PHENOTYPE_PROFILE[id].name);
    }
  });

  it("handles no_dominant_loop", () => {
    const text = composeDeterministicNarrative({
      output: output("night_regulator", { primary_phenotype_id: "no_dominant_loop", primary_phenotype_name: "No Dominant Loop" }),
      profile: null,
      secondaryProfile: null,
    });
    expect(text.toLowerCase()).toContain("running the show");
    expect(text.length).toBeGreaterThan(60);
  });

  it("omits the cost line when primary_adaptive is set", () => {
    const id: PhenotypeId = "second_self";
    const text = composeDeterministicNarrative(input(id, { primary_adaptive: true }));
    expect(text).toContain(PHENOTYPE_PROFILE[id].read);
    expect(text).not.toContain("shown up most in"); // adaptive results don't pile on cost
  });
});

describe("narrator prompt", () => {
  it("carries the no-diagnosis guardrail and the deterministic draft", () => {
    const { system, user } = buildNarratorMessages(input("comparison_spiral"));
    expect(system).toMatch(/diagnos/i);
    expect(system).toContain(PHENOTYPE_PROFILE.comparison_spiral.avoidSaying);
    expect(system).toMatch(/second person/i);
    expect(user).toContain("SECOND-PERSON DRAFT");
  });
});

describe("makeNarrator fallback", () => {
  it("falls back to deterministic copy when the model throws", async () => {
    const n = makeNarrator(async () => {
      throw new Error("model down");
    });
    const out = await n.narrate(input("night_regulator"));
    expect(out.aiUsed).toBe(false);
    expect(out.text).toBe(composeDeterministicNarrative(input("night_regulator")));
  });

  it("uses the model's text when it succeeds", async () => {
    const n = makeNarrator(async () => "a warmer read");
    const out = await n.narrate(input("night_regulator"));
    expect(out.aiUsed).toBe(true);
    expect(out.text).toBe("a warmer read");
  });

  it("deterministicNarrator never reports aiUsed", async () => {
    const out = await deterministicNarrator.narrate(input("reward_chaser"));
    expect(out.aiUsed).toBe(false);
  });
});
