import { createClient } from "@supabase/supabase-js";
import type { SessionRecord, ParentResponse, ParentOutput } from "@blh/parent-quiz";

// Writes a Parent Quiz SessionRecord to the structured `pq` schema
// (packages/parent-quiz/schema/0001_parent_quiz.sql). parent_email is the lead,
// isolated in pq.respondents. Best-effort: never breaks the result page.

type ParentRecord = SessionRecord<ParentResponse, ParentOutput>;

export async function POST(request: Request) {
  let record: ParentRecord;
  try {
    record = (await request.json()) as ParentRecord;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!record || typeof record.session_id !== "string") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return Response.json({ ok: true, persisted: false });

  try {
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }).schema("pq");
    const sid = record.session_id;
    const r = record.result;

    await db.from("sessions").insert({
      session_id: sid,
      schema_version: record.schema_version,
      config_version: record.config_version,
      content_version: record.content_version,
      age_band: record.response?.ageBand ?? null,
      started_at: record.started_at,
      completed_at: record.completed_at,
      duration_ms: record.duration_ms ?? null,
      safety_flag: r.safety_flag,
      severity_band: r.severity_band,
      support_urgency: r.support_urgency,
      fit_rating: record.fit_rating,
      fit_text: record.fit_text,
      ai_narrative_used: record.ai.narrative_used,
      ai_model: record.ai.model ?? null,
      record,
    });

    if (record.identity?.email) {
      await db.from("respondents").insert({
        session_id: sid,
        email: record.identity.email,
        consented_to_contact: record.identity.consentedToContact ?? false,
      });
    }

    if (record.answers.length) {
      await db.from("answers").insert(
        record.answers.map((a, i) => ({
          session_id: sid,
          position: a.position ?? i,
          section: a.section,
          question_id: a.question_id,
          question_text: a.question_text,
          values: a.values,
          labels: a.labels,
          free_text: a.free_text ?? null,
        })),
      );
    }

    await db.from("results").insert({
      session_id: sid,
      primary_pattern: r.primary_pattern,
      primary_result_name: r.primary_result_name,
      secondary_patterns: r.secondary_patterns,
      severity_band: r.severity_band,
      support_urgency: r.support_urgency,
      safety_flag: r.safety_flag,
      evidence_signals: r.evidence_signals,
      result_copy_key: r.result_copy_key,
      primary_concern: r.primary_concern,
      age_band: r.age_band,
      confidence: r.confidence,
      hard_rules_triggered: r.hard_rules_triggered,
      spectrum: r.spectrum,
    });

    return Response.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("[quiz/parent-sessions]", err);
    return Response.json({ ok: true, persisted: false });
  }
}
