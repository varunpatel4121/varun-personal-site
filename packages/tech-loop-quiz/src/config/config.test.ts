/**
 * Config-integrity tests. The config IS the data instrument — these guard
 * against drift between the generated tables, the hand-authored judgement
 * tables, and the taxonomy.
 */

import { describe, expect, it } from "vitest";
import {
  PHENOTYPE_LIBRARY,
  PHENOTYPE_META,
  PLATFORMS,
  SUBFEATURE_QUESTIONS,
  scoringConfig,
} from "./index";
import {
  COST_DOMAINS,
  ENTRY_POINTS,
  HOOKS,
  JOBS,
  LOOP_SHAPES,
  PHENOTYPES,
  TIE_BREAKERS,
} from "../types";

const HOOK_SET = new Set<string>(HOOKS);
const PH_SET = new Set<string>(PHENOTYPES);

describe("config integrity", () => {
  it("has exactly the 17 canonical phenotypes in meta and library", () => {
    expect(PHENOTYPE_META.map((p) => p.id).sort()).toEqual([...PHENOTYPES].sort());
    expect(PHENOTYPE_LIBRARY.map((p) => p.id).sort()).toEqual([...PHENOTYPES].sort());
  });

  it("every phenotype's signature tie-breaker is a valid tag", () => {
    const tbSet = new Set<string>(TIE_BREAKERS);
    for (const p of PHENOTYPE_LIBRARY) expect(tbSet.has(p.signatureTieBreaker)).toBe(true);
  });

  it("every rule-weight row references a known phenotype and positive weight", () => {
    for (const r of scoringConfig.ruleWeights) {
      expect(PH_SET.has(r.phenotype)).toBe(true);
      expect(r.weight).toBeGreaterThan(0);
    }
  });

  it("every gate targets a known phenotype", () => {
    for (const g of scoringConfig.gates) expect(PH_SET.has(g.phenotype)).toBe(true);
    // all 17 phenotypes have exactly one gate
    expect(scoringConfig.gates.map((g) => g.phenotype).sort()).toEqual([...PHENOTYPES].sort());
  });

  it("hookJobMap covers all 14 hooks with valid jobs", () => {
    const jobSet = new Set<string>(JOBS);
    for (const h of HOOKS) {
      const jobs = scoringConfig.hookJobMap[h];
      expect(jobs, `missing hookJobMap for ${h}`).toBeDefined();
      for (const j of jobs) expect(jobSet.has(j)).toBe(true);
    }
  });

  it("every sub-feature question option maps to a valid hook", () => {
    for (const q of SUBFEATURE_QUESTIONS) {
      expect(q.options.length).toBeGreaterThan(0);
      for (const o of q.options) expect(HOOK_SET.has(o.hook)).toBe(true);
    }
  });

  it("every platform sub-feature has a question, and potentialHooks are valid", () => {
    const qKeys = new Set(SUBFEATURE_QUESTIONS.map((q) => `${q.platform}.${q.subfeature}`));
    for (const p of PLATFORMS) {
      for (const s of p.subfeatures) {
        expect(qKeys.has(`${p.id}.${s.id}`), `no question for ${p.id}.${s.id}`).toBe(true);
        for (const h of s.potentialHooks) expect(HOOK_SET.has(h)).toBe(true);
      }
    }
  });

  it("tie-breaker pairs reference known phenotypes and tags", () => {
    const tbSet = new Set<string>(TIE_BREAKERS);
    for (const t of scoringConfig.tieBreakers) {
      expect(PH_SET.has(t.a) && PH_SET.has(t.b)).toBe(true);
      expect(tbSet.has(t.tagA) && tbSet.has(t.tagB)).toBe(true);
    }
  });

  it("entry/loop/cost taxonomy used in content stays within the canonical sets", () => {
    expect(ENTRY_POINTS.length).toBe(9);
    expect(LOOP_SHAPES.length).toBe(8);
    expect(COST_DOMAINS.length).toBe(9);
  });
});
