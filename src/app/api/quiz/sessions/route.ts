import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  let record: unknown;
  try {
    record = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  if (!record || typeof (record as Record<string, unknown>).session_id !== "string") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // Silently succeed when Supabase isn't configured — sessions are best-effort analytics.
    return Response.json({ ok: true });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    await supabase.from("quiz_sessions").insert({
      session_id: (record as Record<string, unknown>).session_id,
      data: record,
      received_at: new Date().toISOString(),
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[quiz/sessions]", err);
    // Never break the user's result page over an analytics write failure.
    return Response.json({ ok: true });
  }
}
