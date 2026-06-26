import { createClient } from "@supabase/supabase-js";
import type { SessionRecord } from "@blh/tech-loop-quiz";

// Writes a Tech Loop Quiz SessionRecord to the structured `tlq` schema
// (see packages/tech-loop-quiz/schema/0001_tech_loop_quiz.sql). PII (name/email)
// lands in tlq.respondents; analytics in tlq.sessions/answers/results. The full
// record is also stored as JSONB so nothing is ever lost. Best-effort: an
// analytics write must never break the user's result page.

export async function POST(request: Request) {
  let record: SessionRecord;
  try {
    record = (await request.json()) as SessionRecord;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!record || typeof record.session_id !== "string") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Deferred wiring: succeed silently when Supabase isn't configured.
  if (!supabaseUrl || !serviceKey) return Response.json({ ok: true, persisted: false });

  try {
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }).schema("tlq");
    const sid = record.session_id;

    await db.from("sessions").insert({
      session_id: sid,
      schema_version: record.schema_version,
      config_version: record.config_version,
      content_version: record.content_version,
      reporter: record.reporter,
      life_stage: record.life_stage,
      started_at: record.started_at,
      completed_at: record.completed_at,
      duration_ms: record.duration_ms ?? null,
      safety_triggered: record.result.safety_triggered,
      fit_rating: record.fit_rating,
      fit_text: record.fit_text,
      ai_narrative_used: record.ai.narrative_used,
      ai_model: record.ai.model ?? null,
      record,
    });

    if (record.identity?.name || record.identity?.email) {
      await db.from("respondents").insert({
        session_id: sid,
        name: record.identity.name ?? null,
        email: record.identity.email ?? null,
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
          scale: a.scale ?? null,
          free_text: a.free_text ?? null,
          signals: a.signals ?? [],
        })),
      );
    }

    const r = record.result;
    await db.from("results").insert({
      session_id: sid,
      primary_phenotype_id: r.primary_phenotype_id,
      primary_phenotype_name: r.primary_phenotype_name,
      primary_score: r.primary_score,
      primary_confidence: r.primary_confidence,
      primary_adaptive: r.primary_adaptive,
      secondary_phenotype_id: r.secondary_phenotype_id,
      severity_score: r.severity_score,
      severity_label: r.severity_label,
      top_hook_tags: r.top_hook_tags,
      top_job_tags: r.top_job_tags,
      top_entry_points: r.top_entry_points,
      top_loop_shapes: r.top_loop_shapes,
      cost_domains: r.cost_domains,
      platform_features: r.platform_features,
      hard_rules_triggered: r.hard_rules_triggered,
      formulation_sentence: r.formulation_sentence,
      copy_generation_mode: r.copy_generation_mode,
      spectrum: r.spectrum,
    });

    return Response.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("[quiz/sessions]", err);
    return Response.json({ ok: true, persisted: false });
  }
}
