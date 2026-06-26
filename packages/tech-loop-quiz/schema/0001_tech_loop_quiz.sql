-- ============================================================================
-- Tech Loop & Phenotype Formulation Quiz — structured persistence schema
-- Target: Postgres / Supabase.  Portable: lives in its own `tlq` schema so it
-- drops cleanly into any project (personal site now, bluelighthealth.com later).
--
-- Design goals (from the AI Quiz brief):
--   • Deterministic, auditable "data instrument" — one row per answer, with the
--     normalized tags it produced, raw free text preserved verbatim.
--   • PII (name/email) isolated in tlq.respondents, separate from analytics.
--   • The full SessionRecord is also kept as JSONB (tlq.sessions.record) so no
--     data is ever lost even as relational columns evolve.
--   • Writes come only from a server-side route holding the service-role key.
--
-- Wiring: run this against your Supabase project, then point the app's
-- /api/quiz/sessions route at it (see the package README). Deferred by default.
-- ============================================================================

create schema if not exists tlq;

-- ── Versioned question bank ──────────────────────────────────────────────────
-- "Version every question by audience, section, model dimension, and scoring
-- key" — so the engine's inputs are reproducible across config revisions.
create table if not exists tlq.question_bank (
  id            uuid primary key default gen_random_uuid(),
  question_id   text not null,
  version       text not null,
  audience      text not null default 'self',     -- self | child
  section       text not null,                    -- frame|baseline|pull|job|loop|cost|disambiguation|result
  model_pillar  text,                             -- pull | job | loop | cost
  question_text text not null,
  scoring_key   jsonb not null default '{}',      -- option_id -> {type, tag, ...}
  created_at    timestamptz not null default now(),
  unique (question_id, version)
);

-- ── Sessions (no PII) ────────────────────────────────────────────────────────
create table if not exists tlq.sessions (
  id               uuid primary key default gen_random_uuid(),
  session_id       text not null unique,
  schema_version   text not null,
  config_version   text not null,
  content_version  text not null,
  reporter         text not null,                 -- self | child
  life_stage       text,
  started_at       timestamptz,
  completed_at     timestamptz,
  duration_ms      integer,
  safety_triggered boolean not null default false,
  fit_rating       smallint,                      -- "did we get it right?" 0..4
  fit_text         text,
  ai_narrative_used boolean not null default false,
  ai_model         text,
  record           jsonb not null,                -- full SessionRecord (lossless)
  created_at       timestamptz not null default now()
);
create index if not exists idx_tlq_sessions_session_id on tlq.sessions (session_id);
create index if not exists idx_tlq_sessions_created_at on tlq.sessions (created_at desc);

-- ── Respondents (PII — access-controlled, separate table) ────────────────────
create table if not exists tlq.respondents (
  id                   uuid primary key default gen_random_uuid(),
  session_id           text not null references tlq.sessions (session_id) on delete cascade,
  name                 text,
  email                text,
  consented_to_contact boolean not null default false,
  created_at           timestamptz not null default now()
);
create index if not exists idx_tlq_respondents_session_id on tlq.respondents (session_id);
create index if not exists idx_tlq_respondents_email on tlq.respondents (lower(email));

-- ── Answers (one row per question — the audit log) ───────────────────────────
create table if not exists tlq.answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    text not null references tlq.sessions (session_id) on delete cascade,
  position      integer not null,
  section       text not null,
  question_id   text not null,
  question_text text not null,
  values        jsonb not null default '[]',      -- selected machine values
  labels        jsonb not null default '[]',      -- selected human labels
  scale         smallint,
  free_text     text,                             -- preserved verbatim
  signals       jsonb not null default '[]',      -- normalized [{type, tag}]
  created_at    timestamptz not null default now()
);
create index if not exists idx_tlq_answers_session_id on tlq.answers (session_id);

-- ── Results (the scored formulation + spectrum) ──────────────────────────────
create table if not exists tlq.results (
  id                    uuid primary key default gen_random_uuid(),
  session_id            text not null references tlq.sessions (session_id) on delete cascade,
  primary_phenotype_id  text not null,
  primary_phenotype_name text not null,
  primary_score         numeric not null,
  primary_confidence    text not null,            -- high|medium|low|mixed
  primary_adaptive      boolean not null default false,
  secondary_phenotype_id text,
  severity_score        numeric not null,
  severity_label        text not null,            -- light_grip|steady_pull|deep_loop|high_impact_loop
  top_hook_tags         jsonb not null default '[]',
  top_job_tags          jsonb not null default '[]',
  top_entry_points      jsonb not null default '[]',
  top_loop_shapes       jsonb not null default '[]',
  cost_domains          jsonb not null default '[]',
  platform_features     jsonb not null default '[]',
  hard_rules_triggered  jsonb not null default '[]',
  formulation_sentence  text not null,
  copy_generation_mode  text not null default 'deterministic',
  spectrum              jsonb not null default '{}',  -- {phenotype_id: fit_score}
  created_at            timestamptz not null default now(),
  unique (session_id)
);
create index if not exists idx_tlq_results_primary on tlq.results (primary_phenotype_id);
create index if not exists idx_tlq_results_severity on tlq.results (severity_label);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Anonymous by design: only the service role (server-side) writes; no public
-- read. Tighten/loosen per deployment.
alter table tlq.sessions     enable row level security;
alter table tlq.respondents  enable row level security;
alter table tlq.answers      enable row level security;
alter table tlq.results      enable row level security;
alter table tlq.question_bank enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'tlq' and tablename = 'sessions' and policyname = 'service inserts') then
    create policy "service inserts" on tlq.sessions     for insert with check (true);
    create policy "service inserts" on tlq.respondents  for insert with check (true);
    create policy "service inserts" on tlq.answers      for insert with check (true);
    create policy "service inserts" on tlq.results      for insert with check (true);
    create policy "service reads"   on tlq.question_bank for select using (true);
  end if;
end $$;
