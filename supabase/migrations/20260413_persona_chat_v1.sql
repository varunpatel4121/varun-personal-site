-- Persona Chat V1 migration
-- Adds metadata to chats, an index for sidebar ordering, and a missing profiles INSERT policy.

-- Add metadata column to chats (messages already has one)
alter table public.chats
  add column if not exists metadata jsonb not null default '{}';

-- Index for sidebar: list chats by user + project, ordered by updated_at
create index if not exists idx_chats_user_project_updated
  on public.chats (user_id, project_id, updated_at desc);

-- Allow users to self-create their profile row if the signup trigger missed it
-- (e.g. schema re-applied after user already existed in auth.users)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.profiles for insert
      with check (auth.uid() = id);
  end if;
end $$;
