-- Assessments (Morten, 26 Oct 2026): the qualification checklist for each candidate, ticked by the owner or an
-- assessor (supervisor right "assess", SQL 0012). One row per candidate (id = their user id). Never visible to the
-- candidate or other members. Assessors cannot assess themselves.
-- the supervisor-rights check from 0012, repeated here so this file also works if 0012 has not run yet
create or replace function public.has_right(r text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.active and coalesce((p.data->'rights'->>r)::boolean, false))
$$;
create table if not exists public.assessments (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.assessments enable row level security;
revoke all on public.assessments from anon;
drop policy if exists assess_owner on public.assessments;
drop policy if exists assess_assessor on public.assessments;
create policy assess_owner on public.assessments for all using (public.is_owner()) with check (public.is_owner());
create policy assess_assessor on public.assessments for all using (public.has_right('assess') and id <> auth.uid()::text) with check (public.has_right('assess') and id <> auth.uid()::text);
