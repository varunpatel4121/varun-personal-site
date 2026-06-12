-- ============================================================
-- Platform schema for varunpatel.me
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Profiles (extends auth.users)
-- Auto-created via trigger when a new user signs up.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Projects (workspaces scoped to a user + app)
-- The "app" column identifies which platform app owns this project (e.g. 'persona').

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  app text not null default 'persona',
  description text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app, slug)
);

alter table public.projects enable row level security;

create policy "Users can read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- 3. Documents (files uploaded to a project)
-- storage_path points to the file in the Supabase Storage "documents" bucket.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can read own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- 4. Chats (conversation threads within a project)

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chats enable row level security;

create policy "Users can read own chats"
  on public.chats for select
  using (auth.uid() = user_id);

create policy "Users can insert own chats"
  on public.chats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chats"
  on public.chats for update
  using (auth.uid() = user_id);

create policy "Users can delete own chats"
  on public.chats for delete
  using (auth.uid() = user_id);

-- 5. Messages (individual messages in a chat)

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Messages inherit access from their parent chat
create policy "Users can read messages in own chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own chats"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

-- 6. Updated-at trigger
-- Automatically sets updated_at on any row update for tables that have the column.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger set_chats_updated_at
  before update on public.chats
  for each row execute function public.set_updated_at();

-- 7. Indexes for common query patterns

create index idx_projects_user_app on public.projects (user_id, app);
create index idx_documents_project on public.documents (project_id);
create index idx_chats_project on public.chats (project_id);
create index idx_chats_user_project_updated on public.chats (user_id, project_id, updated_at desc);
create index idx_messages_chat on public.messages (chat_id);

-- ============================================================
-- Source Schema — Knowledge, Retrieval, and Provenance
-- ============================================================

-- Enable pgvector for embedding storage
create extension if not exists vector with schema extensions;

-- 8. Knowledge Bases
-- Top-level container for retrievable knowledge corpora.
-- owner_scope='global' for shared persona corpora, 'project' for private.

create table public.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid null references public.projects(id) on delete cascade,
  owner_scope text not null check (owner_scope in ('global', 'project')),
  app text not null default 'persona',
  slug text not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived', 'building', 'error')),
  is_default boolean not null default false,
  metadata jsonb not null default '{}',
  created_by uuid null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_kb_global_unique
  on public.knowledge_bases (app, slug)
  where owner_scope = 'global';

create unique index idx_kb_project_unique
  on public.knowledge_bases (project_id, app, slug)
  where owner_scope = 'project';

create index idx_kb_project on public.knowledge_bases (project_id)
  where project_id is not null;

alter table public.knowledge_bases enable row level security;

create policy "Authenticated users can read global knowledge bases"
  on public.knowledge_bases for select
  using (owner_scope = 'global' and auth.role() = 'authenticated');

create policy "Users can read own project knowledge bases"
  on public.knowledge_bases for select
  using (
    owner_scope = 'project'
    and exists (
      select 1 from public.projects
      where projects.id = knowledge_bases.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own project knowledge bases"
  on public.knowledge_bases for insert
  with check (
    owner_scope = 'project'
    and exists (
      select 1 from public.projects
      where projects.id = knowledge_bases.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own project knowledge bases"
  on public.knowledge_bases for update
  using (
    owner_scope = 'project'
    and exists (
      select 1 from public.projects
      where projects.id = knowledge_bases.project_id
        and projects.user_id = auth.uid()
    )
  );

create trigger set_knowledge_bases_updated_at
  before update on public.knowledge_bases
  for each row execute function public.set_updated_at();

-- 9. Sources
-- One logical source record per knowledge asset.

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  knowledge_base_id uuid not null references public.knowledge_bases(id) on delete cascade,
  project_id uuid null references public.projects(id) on delete cascade,
  document_id uuid null references public.documents(id) on delete set null,
  source_kind text not null check (source_kind in ('document', 'url', 'note', 'generated', 'external_import')),
  canonical_uri text,
  title text not null,
  description text,
  author text,
  speaker text,
  source_type text,
  language_code text,
  published_at timestamptz,
  visibility text not null default 'global' check (visibility in ('global', 'project', 'private')),
  status text not null default 'active' check (status in ('active', 'draft', 'archived', 'deleted')),
  current_version_id uuid null,
  metadata jsonb not null default '{}',
  created_by uuid null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sources_kb on public.sources (knowledge_base_id);
create index idx_sources_project on public.sources (project_id) where project_id is not null;
create index idx_sources_document on public.sources (document_id) where document_id is not null;
create index idx_sources_status on public.sources (knowledge_base_id, status);

alter table public.sources enable row level security;

create policy "Authenticated users can read global sources"
  on public.sources for select
  using (visibility = 'global' and auth.role() = 'authenticated');

create policy "Users can read own project sources"
  on public.sources for select
  using (
    visibility in ('project', 'private')
    and exists (
      select 1 from public.projects
      where projects.id = sources.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own project sources"
  on public.sources for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = sources.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own project sources"
  on public.sources for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = sources.project_id
        and projects.user_id = auth.uid()
    )
  );

create trigger set_sources_updated_at
  before update on public.sources
  for each row execute function public.set_updated_at();

-- 10. Source Versions
-- Immutable content snapshots for ingestion and reprocessing.

create table public.source_versions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  version_number integer not null,
  is_current boolean not null default true,
  content_hash text not null,
  raw_text text,
  cleaned_text text,
  structured_content jsonb not null default '{}',
  parser_name text,
  parser_version text,
  cleaning_recipe jsonb not null default '{}',
  char_count integer,
  token_count integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid null references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index idx_source_versions_unique
  on public.source_versions (source_id, version_number);

create index idx_source_versions_current
  on public.source_versions (source_id)
  where is_current = true;

alter table public.source_versions enable row level security;

create policy "Users can read source versions via source access"
  on public.source_versions for select
  using (
    exists (
      select 1 from public.sources s
      left join public.projects p on p.id = s.project_id
      where s.id = source_versions.source_id
        and (
          s.visibility = 'global'
          or (p.user_id = auth.uid())
        )
    )
  );

create policy "Users can insert source versions for own sources"
  on public.source_versions for insert
  with check (
    exists (
      select 1 from public.sources s
      join public.projects p on p.id = s.project_id
      where s.id = source_versions.source_id
        and p.user_id = auth.uid()
    )
  );

-- Deferred FK from sources.current_version_id -> source_versions
alter table public.sources
  add constraint sources_current_version_fkey
  foreign key (current_version_id)
  references public.source_versions(id)
  on delete set null
  deferrable initially deferred;

-- 11. Source Segments
-- The actual retrieval units (chunks, summaries, quotes, etc.)

create table public.source_segments (
  id uuid primary key default gen_random_uuid(),
  source_version_id uuid not null references public.source_versions(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  knowledge_base_id uuid not null references public.knowledge_bases(id) on delete cascade,
  segment_index integer not null,
  segment_kind text not null default 'chunk' check (segment_kind in ('chunk', 'summary', 'quote', 'title', 'qa_pair')),
  content text not null,
  content_hash text not null,
  token_count integer,
  char_count integer,
  speaker text,
  section_label text,
  start_offset integer,
  end_offset integer,
  start_time_ms integer,
  end_time_ms integer,
  importance_score numeric,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_segments_source_version on public.source_segments (source_version_id);
create index idx_segments_source on public.source_segments (source_id);
create index idx_segments_kb on public.source_segments (knowledge_base_id);
create index idx_segments_kind on public.source_segments (knowledge_base_id, segment_kind);

alter table public.source_segments enable row level security;

create policy "Users can read segments via knowledge base access"
  on public.source_segments for select
  using (
    exists (
      select 1 from public.knowledge_bases kb
      left join public.projects p on p.id = kb.project_id
      where kb.id = source_segments.knowledge_base_id
        and (
          kb.owner_scope = 'global'
          or (p.user_id = auth.uid())
        )
    )
  );

create policy "Users can insert segments for own project KBs"
  on public.source_segments for insert
  with check (
    exists (
      select 1 from public.knowledge_bases kb
      join public.projects p on p.id = kb.project_id
      where kb.id = source_segments.knowledge_base_id
        and p.user_id = auth.uid()
    )
  );

-- 12. Segment Embeddings
-- Stored separately from segments to support multiple models
-- and re-embedding without rewriting segment rows.

create table public.segment_embeddings (
  id uuid primary key default gen_random_uuid(),
  source_segment_id uuid not null references public.source_segments(id) on delete cascade,
  embedding_model text not null,
  embedding_dim integer not null,
  embedding extensions.vector not null,
  content_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_embeddings_segment on public.segment_embeddings (source_segment_id);
create index idx_embeddings_active
  on public.segment_embeddings (source_segment_id, embedding_model)
  where is_active = true;

alter table public.segment_embeddings enable row level security;

create policy "Users can read embeddings via segment access"
  on public.segment_embeddings for select
  using (
    exists (
      select 1 from public.source_segments seg
      join public.knowledge_bases kb on kb.id = seg.knowledge_base_id
      left join public.projects p on p.id = kb.project_id
      where seg.id = segment_embeddings.source_segment_id
        and (
          kb.owner_scope = 'global'
          or (p.user_id = auth.uid())
        )
    )
  );

create policy "Users can insert embeddings for own project segments"
  on public.segment_embeddings for insert
  with check (
    exists (
      select 1 from public.source_segments seg
      join public.knowledge_bases kb on kb.id = seg.knowledge_base_id
      join public.projects p on p.id = kb.project_id
      where seg.id = segment_embeddings.source_segment_id
        and p.user_id = auth.uid()
    )
  );

-- 13. Ingestion Runs
-- Operational lifecycle tracking for import/parse/chunk/embed.

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  knowledge_base_id uuid not null references public.knowledge_bases(id) on delete cascade,
  source_id uuid null references public.sources(id) on delete cascade,
  run_kind text not null check (run_kind in ('import', 'parse', 'clean', 'chunk', 'embed', 'reindex', 'delete')),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  triggered_by uuid null references public.profiles(id),
  job_payload jsonb not null default '{}',
  result_summary jsonb not null default '{}',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_ingestion_runs_kb on public.ingestion_runs (knowledge_base_id);
create index idx_ingestion_runs_source on public.ingestion_runs (source_id) where source_id is not null;
create index idx_ingestion_runs_status on public.ingestion_runs (status) where status in ('queued', 'running');

alter table public.ingestion_runs enable row level security;

create policy "Users can read own project ingestion runs"
  on public.ingestion_runs for select
  using (
    exists (
      select 1 from public.knowledge_bases kb
      left join public.projects p on p.id = kb.project_id
      where kb.id = ingestion_runs.knowledge_base_id
        and (
          kb.owner_scope = 'global'
          or (p.user_id = auth.uid())
        )
    )
  );

create policy "Users can insert ingestion runs for own project KBs"
  on public.ingestion_runs for insert
  with check (
    exists (
      select 1 from public.knowledge_bases kb
      join public.projects p on p.id = kb.project_id
      where kb.id = ingestion_runs.knowledge_base_id
        and p.user_id = auth.uid()
    )
  );

create policy "Users can update own project ingestion runs"
  on public.ingestion_runs for update
  using (
    exists (
      select 1 from public.knowledge_bases kb
      join public.projects p on p.id = kb.project_id
      where kb.id = ingestion_runs.knowledge_base_id
        and p.user_id = auth.uid()
    )
  );

-- 14. Message Citations
-- Connects assistant messages to retrieved segments for provenance.

create table public.message_citations (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  source_segment_id uuid not null references public.source_segments(id),
  source_id uuid not null references public.sources(id),
  retrieval_rank integer,
  relevance_score numeric,
  citation_label text,
  quoted_text text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_citations_message on public.message_citations (message_id);
create index idx_citations_segment on public.message_citations (source_segment_id);
create index idx_citations_source on public.message_citations (source_id);

alter table public.message_citations enable row level security;

create policy "Users can read citations for own messages"
  on public.message_citations for select
  using (
    exists (
      select 1 from public.messages m
      join public.chats c on c.id = m.chat_id
      where m.id = message_citations.message_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can insert citations for own messages"
  on public.message_citations for insert
  with check (
    exists (
      select 1 from public.messages m
      join public.chats c on c.id = m.chat_id
      where m.id = message_citations.message_id
        and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- Storage bucket: "documents"
-- Create this in the Supabase Dashboard under Storage > New Bucket
-- Settings:
--   Name: documents
--   Public: false (private)
--   File size limit: 50MB
--   Allowed MIME types: application/pdf, text/plain, text/markdown,
--                       text/csv, application/json
--
-- Then add this storage policy via SQL:
-- ============================================================

-- Allow authenticated users to upload to their own folder
-- Files should be stored at: {user_id}/{project_id}/{filename}
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

create policy "Users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- Quiz sessions (anonymous analytics for the Tech Loop Quiz)
-- No user_id — all data is anonymous by design.
-- Inserts come from the server-side API route using the service role key.
-- ============================================================

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  data jsonb not null,
  received_at timestamptz not null default now()
);

create index idx_quiz_sessions_session_id on public.quiz_sessions (session_id);
create index idx_quiz_sessions_received_at on public.quiz_sessions (received_at desc);

alter table public.quiz_sessions enable row level security;

-- Only service role (server-side API) can insert; no public read access.
create policy "Service role inserts quiz sessions"
  on public.quiz_sessions for insert
  with check (true);
