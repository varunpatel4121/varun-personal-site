-- ============================================================================
-- Parent Tech Loop Quiz — structured persistence schema (Postgres / Supabase).
-- Lives in its own `pq` schema; portable into bluelighthealth.com.
--
-- Marketing-funnel quiz: parent_email is the lead. PII isolated in
-- pq.respondents; analytics in pq.sessions/answers/results; full SessionRecord
-- kept as JSONB. Writes come only from a server-side route (service-role key).
-- Wiring is deferred — run this against Supabase, then point the route at it.
-- ============================================================================

create schema if not exists pq;

create table if not exists pq.sessions (
  id                uuid primary key default gen_random_uuid(),
  session_id        text not null unique,
  schema_version    text not null,
  config_version    text not null,
  content_version   text not null,
  age_band          text,
  started_at        timestamptz,
  completed_at      timestamptz,
  duration_ms       integer,
  safety_flag       boolean not null default false,
  support_level     text,
  fit_rating        smallint,
  fit_text          text,
  ai_narrative_used boolean not null default false,
  ai_model          text,
  record            jsonb not null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_pq_sessions_session_id on pq.sessions (session_id);
create index if not exists idx_pq_sessions_created_at on pq.sessions (created_at desc);
create index if not exists idx_pq_sessions_support on pq.sessions (support_level);

-- Respondents (PII / leads — access-controlled).
create table if not exists pq.respondents (
  id                   uuid primary key default gen_random_uuid(),
  session_id           text not null references pq.sessions (session_id) on delete cascade,
  email                text,
  consented_to_contact boolean not null default false,
  created_at           timestamptz not null default now()
);
create index if not exists idx_pq_respondents_email on pq.respondents (lower(email));

create table if not exists pq.answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    text not null references pq.sessions (session_id) on delete cascade,
  position      integer not null,
  section       text not null,
  question_id   text not null,
  question_text text not null,
  values        jsonb not null default '[]',
  labels        jsonb not null default '[]',
  free_text     text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_pq_answers_session_id on pq.answers (session_id);

create table if not exists pq.results (
  id                    uuid primary key default gen_random_uuid(),
  session_id            text not null references pq.sessions (session_id) on delete cascade,
  primary_child_loop    text not null,
  primary_result_name   text not null,
  secondary_child_loop  text,
  family_pattern        text,
  parent_role           text,
  support_level         text not null,
  cost_domains          jsonb not null default '[]',
  urgency_markers       jsonb not null default '[]',
  urgency_score         numeric not null default 0,
  safety_flag           boolean not null default false,
  cta_readiness         text,
  primary_concern       text,
  confidence            text not null,
  hard_rules_triggered  jsonb not null default '[]',
  spectrum              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  unique (session_id)
);
create index if not exists idx_pq_results_primary on pq.results (primary_child_loop);

alter table pq.sessions    enable row level security;
alter table pq.respondents enable row level security;
alter table pq.answers     enable row level security;
alter table pq.results     enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'pq' and tablename = 'sessions' and policyname = 'service inserts') then
    create policy "service inserts" on pq.sessions    for insert with check (true);
    create policy "service inserts" on pq.respondents for insert with check (true);
    create policy "service inserts" on pq.answers     for insert with check (true);
    create policy "service inserts" on pq.results     for insert with check (true);
  end if;
end $$;
