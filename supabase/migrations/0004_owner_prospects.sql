-- Investors and strategic partners: visible to the owner only (Morten, 20 Oct 2026).
-- The access rule below is the protection: operations staff and brokers get nothing back from this table,
-- whatever the portal screen does. The daily research job writes with the secret key (server only).
create table if not exists public.owner_prospects (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.owner_prospects enable row level security;
revoke all on public.owner_prospects from anon;
drop policy if exists owner_prospects_owner on public.owner_prospects;
create policy owner_prospects_owner on public.owner_prospects for all using (public.is_owner()) with check (public.is_owner());

-- live updates in the portal (skipped if already added)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'owner_prospects') then
    alter publication supabase_realtime add table public.owner_prospects;
  end if;
end $$;
