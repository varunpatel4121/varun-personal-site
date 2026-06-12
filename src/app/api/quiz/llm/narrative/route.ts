import { z } from "zod";
import {
  llmAvailable,
  streamNarrative,
  type QuizContext,
} from "@/features/blh-quiz/server/llm";

const contextSchema = z.object({
  anchorLabel: z.string().max(200).default(""),
  topPhenotypes: z
    .array(
      z.object({
        id: z.string().max(40),
        name: z.string().max(80),
        score: z.number(),
      }),
    )
    .max(9)
    .default([]),
  topJobs: z.array(z.string().max(80)).max(4).default([]),
  timing: z.array(z.string().max(40)).max(7).default([]),
  stage: z.string().max(20).default("unknown"),
  control: z.number().default(0),
  costs: z.array(z.string().max(40)).max(7).default([]),
  severityBand: z.string().max(20).optional(),
  safety: z.boolean().optional(),
  answers: z
    .array(
      z.object({
        question: z.string().max(400),
        answer: z.string().max(600),
      }),
    )
    .max(40)
    .default([]),
  classification: z
    .object({
      primaryName: z.string().max(80).nullable(),
      primaryRead: z.string().max(1200).nullable(),
      secondaryName: z.string().max(80).nullable(),
      confidence: z.string().max(20),
    })
    .optional(),
  mirrorResponse: z.string().max(20).nullable().optional(),
});

export async function POST(request: Request) {
  if (!llmAvailable()) {
    return Response.json({ error: "llm_unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = contextSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const anthropicStream = streamNarrative(parsed.data as QuizContext);
        anthropicStream.on("text", (delta) =>
          controller.enqueue(enc.encode(delta)),
        );
        await anthropicStream.finalMessage();
      } catch (err) {
        console.error("[quiz/narrative stream]", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
