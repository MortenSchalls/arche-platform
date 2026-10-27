-- Sanctions screening log and private list storage (Morten, 27 Oct 2026: "trip check and sanctions needs one").
-- 1. Private storage "sanctions" for the name index the daily screen job builds from the official UN, US (OFAC), EU
--    and UK lists. No member can read or change it; only the server (secret key) does.
-- 2. screen_log: one row for every screening of a trip: each save of the trip form and each
--    "Screen names now" in Operations. Written only by
--    the server (api/screen.mjs) with the date, the person, the lists used and the result, so nobody can change a
--    result afterwards. Rows can never be edited. Operations and the owner read all rows; a broker reads only rows
--    for screenings they ran themselves.
-- Safe to run twice.

insert into storage.buckets (id, name, public) values ('sanctions', 'sanctions', false)
  on conflict (id) do update set public = false;

create table if not exists public.screen_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  by uuid not null references auth.users(id),
  role text not null default '',
  trip_owner uuid,
  trip_id text not null default '',
  purpose text not null default '' check (purpose in ('', 'trip', 'operations')),
  names jsonb not null default '[]'::jsonb,
  results jsonb not null default '[]'::jsonb,
  outcome text not null check (outcome in ('clear', 'possible match')),
  lists jsonb not null default '[]'::jsonb,
  lists_at timestamptz,
  stale boolean not null default false
);
create index if not exists screen_log_trip on public.screen_log (trip_owner, trip_id);
create index if not exists screen_log_at on public.screen_log (at);
alter table public.screen_log enable row level security;
revoke all on public.screen_log from anon;
revoke insert, update, delete on public.screen_log from authenticated;
drop policy if exists screen_log_staff on public.screen_log;
create policy screen_log_staff on public.screen_log for select using (public.is_staff());
drop policy if exists screen_log_self on public.screen_log;
create policy screen_log_self on public.screen_log for select using (public.is_member() and by = auth.uid());

-- a saved result is never edited, not even by the server
create or replace function public.screen_log_no_edit() returns trigger language plpgsql as $$
begin raise exception 'screening records cannot be changed'; end $$;
drop trigger if exists screen_log_no_edit on public.screen_log;
create trigger screen_log_no_edit before update on public.screen_log for each row execute function public.screen_log_no_edit();
