/**
 * Persistence shape — the contract a backend relies on. If these fields move,
 * the SQL schema in schema/0001_tech_loop_quiz.sql and the host route must move
 * with them.
 */

import { describe, expect, it } from "vitest";
import { buildSessionRecord, noopPersistence } from "./index";
import { score } from "../engine";
import { QUIZ_CONTENT, scoringConfig } from "../config";
import { PHENOTYPES, SCHEMA_VERSION } from "../types";
import type { AnswerLogEntry, QuizResponse } from "../types";

const response: QuizResponse = {
  reporter: "self",
  lifeStage: "working",
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
  freeText: [],
};

const answers: AnswerLogEntry[] = [
  { question_id: "baseline", section: "baseline", question_text: "…", values: ["3"], labels: ["…"], scale: 3, position: 0 },
  { question_id: "loop.control", section: "loop", question_text: "…", values: ["3"], labels: ["Often"], scale: 3, position: 1 },
];

describe("buildSessionRecord", () => {
  const result = score(response);
  const record = buildSessionRecord({
    sessionId: "sess-test-1",
    startedAt: "2026-06-25T00:00:00.000Z",
    completedAt: "2026-06-25T00:04:00.000Z",
    configVersion: scoringConfig.version,
    contentVersion: QUIZ_CONTENT.version,
    response,
    result,
    answers,
    identity: { name: "Sam", email: "sam@example.com", consentedToContact: true },
    fitRating: 3,
    fitText: "pretty close",
    ai: { narrative_used: false },
  });

  it("carries top-level session metadata", () => {
    expect(record.session_id).toBe("sess-test-1");
    expect(record.schema_version).toBe(SCHEMA_VERSION);
    expect(record.config_version).toBe(scoringConfig.version);
    expect(record.reporter).toBe("self");
    expect(record.duration_ms).toBe(240000);
  });

  it("includes the full scored result + 17-way spectrum", () => {
    expect(record.result.primary_phenotype_id).toBe(result.output.primary_phenotype_id);
    expect(record.result.severity_label).toBe(result.output.severity_label);
    expect(Object.keys(record.result.spectrum).sort()).toEqual([...PHENOTYPES].sort());
  });

  it("preserves the audit log, identity (PII), and fit feedback", () => {
    expect(record.answers).toHaveLength(answers.length);
    expect(record.answers[0]!.question_id).toBe("baseline");
    expect(record.identity.email).toBe("sam@example.com");
    expect(record.fit_rating).toBe(3);
    expect(record.fit_text).toBe("pretty close");
  });

  it("the full record round-trips as JSON (JSONB-safe)", () => {
    expect(() => JSON.parse(JSON.stringify(record))).not.toThrow();
  });

  it("noop persistence accepts a record without error", async () => {
    await expect(noopPersistence.saveSession(record)).resolves.toEqual({ ok: true });
  });
});
