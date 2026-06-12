import { z } from "zod";
import { JOB_TAGS, PHENOTYPE_IDS } from "./types";
import type { QuizQuestion, ScoringConfig } from "./types";

const phenotypeId = z.enum(PHENOTYPE_IDS as [string, ...string[]]);
const jobTag = z.enum(JOB_TAGS as [string, ...string[]]);

export function makeFollowupSchema(config: ScoringConfig) {
  const weight = z.number().min(0).max(config.llm.maxOptionWeight);
  const option = z.object({
    text: z.string().min(3).max(220),
    ph: z.record(phenotypeId, weight).optional().default({}),
    jobs: z.array(jobTag).max(3).optional().default([]),
  });
  const question = z.object({
    question: z.string().min(10).max(280),
    options: z.array(option).min(3).max(5),
  });
  return z.object({
    questions: z.array(question).min(1).max(config.llm.maxFollowups),
  });
}

export type FollowupPayload = z.infer<ReturnType<typeof makeFollowupSchema>>;

export function followupsToQuestions(
  payload: FollowupPayload,
): QuizQuestion[] {
  return payload.questions.map((q, qi) => ({
    id: `followup_llm_${qi}`,
    type: "single" as const,
    kicker: "About what you said",
    question: q.question,
    source: "llm" as const,
    options: [
      ...q.options.map((o, oi) => ({
        id: `o${oi}`,
        text: o.text,
        ph: o.ph as QuizQuestion["options"][number]["ph"],
        jobs: Object.fromEntries((o.jobs ?? []).map((j) => [j, 1])),
      })),
      { id: "none", text: "Honestly, none of these", unsure: true },
    ],
  }));
}

export function followupJsonSchema() {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  ph: {
                    type: "object",
                    properties: Object.fromEntries(
                      PHENOTYPE_IDS.map((p) => [p, { type: "number" }]),
                    ),
                    additionalProperties: false,
                  },
                  jobs: {
                    type: "array",
                    items: { type: "string", enum: [...JOB_TAGS] },
                  },
                },
                required: ["text", "ph", "jobs"],
                additionalProperties: false,
              },
            },
          },
          required: ["question", "options"],
          additionalProperties: false,
        },
      },
    },
    required: ["questions"],
    additionalProperties: false,
  } as const;
}
