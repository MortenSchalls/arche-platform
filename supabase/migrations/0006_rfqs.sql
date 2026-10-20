-- Supplier quotes (Morten, 21 Oct 2026): quote requests to service partners, the quotes received and the award.
-- Owner and operations only. Brokers get nothing back from this table. Kept as its own table so it can later
-- move to a separate company (the AeroBridge idea) without touching the rest of the platform.
create table if not exists public.rfqs (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rfqs enable row level security;
revoke all on public.rfqs from anon;
drop policy if exists rfqs_staff on public.rfqs;
create policy rfqs_staff on public.rfqs for all using (public.is_staff()) with check (public.is_staff());

-- live updates in the portal (skipped if already added)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rfqs') then
    alter publication supabase_realtime add table public.rfqs;
  end if;
end $$;
