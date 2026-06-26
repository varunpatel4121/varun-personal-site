/**
 * Reachability: every one of the 17 phenotypes must be obtainable as the
 * primary result. We feed each phenotype its own full set of rule-weight tags
 * (which includes its signature tie-breaker and satisfies its own gate) and
 * assert it wins. A failure here means a phenotype can never surface — a real
 * defect, not a flaky test.
 */

import { describe, expect, it } from "vitest";
import { runPipeline } from "./score";
import { scoringConfig } from "../config";
import { PHENOTYPES } from "../types";
import type { NormalizedInput, Signal } from "../types";

describe("phenotype reachability", () => {
  for (const p of PHENOTYPES) {
    it(`${p} is reachable as primary`, () => {
      const signals: Signal[] = scoringConfig.ruleWeights
        .filter((r) => r.phenotype === p)
        .map((r) => ({ type: r.type, tag: r.tag, factor: 1 }));
      const input: NormalizedInput = {
        signals,
        baselineSelfRating: 2,
        controlFrequency: 2,
        freeText: [],
      };
      expect(runPipeline(input).output.primary_phenotype_id).toBe(p);
    });
  }

  it("no_dominant_loop is reachable (benign, no signals)", () => {
    const input: NormalizedInput = {
      signals: [
        { type: "entry_point", tag: "not_problem", factor: 1 },
        { type: "cost_domain", tag: "none_meaningful", factor: 1 },
        { type: "severity_marker", tag: "none", factor: 1 },
      ],
      baselineSelfRating: 0,
      controlFrequency: 0,
      freeText: [],
    };
    expect(runPipeline(input).output.primary_phenotype_id).toBe("no_dominant_loop");
  });
});
