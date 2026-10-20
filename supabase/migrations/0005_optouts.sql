-- Opt-outs from named business contacts (Morten, 20 Oct 2026). Stores only one-way codes (SHA-256 hashes) of the
-- email address and of name + organisation, never the details themselves. Anyone signed in may record an opt-out
-- and check against the list; only the owner may remove an entry.
create table if not exists public.optouts (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.optouts enable row level security;
revoke all on public.optouts from anon;
drop policy if exists optouts_read on public.optouts;
drop policy if exists optouts_add on public.optouts;
drop policy if exists optouts_owner on public.optouts;
create policy optouts_read on public.optouts for select using (public.is_member());
create policy optouts_add on public.optouts for insert with check (public.is_member());
create policy optouts_owner on public.optouts for all using (public.is_owner()) with check (public.is_owner());
