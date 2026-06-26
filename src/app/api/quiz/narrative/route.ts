import Anthropic from "@anthropic-ai/sdk";

// Optional AI narrative: warms the tone of the deterministic draft. The package
// builds the system/user prompt (engine output + approved library copy); this
// route only relays it to Anthropic. No key configured → 503, and the client
// gracefully falls back to the deterministic copy.

export async function POST(request: Request) {
  let body: { system?: string; user?: string };
  try {
    body = (await request.json()) as { system?: string; user?: string };
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.system || !body.user) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "ai_unavailable" }, { status: 503 });

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.QUIZ_NARRATIVE_MODEL ?? "claude-sonnet-4-6";
    const msg = await client.messages.create({
      model,
      max_tokens: 600,
      temperature: 0.6,
      system: body.system,
      messages: [{ role: "user", content: body.user }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) return Response.json({ error: "empty" }, { status: 502 });
    return Response.json({ text });
  } catch (err) {
    console.error("[quiz/narrative]", err);
    return Response.json({ error: "ai_error" }, { status: 502 });
  }
}
