-- Alerts that keep coming until someone acts (Morten, 26 Oct 2026).
-- 1. push_subs: each phone or computer that receives alerts. A person adds and removes only their own; owners see all.
-- 2. Every 2 minutes Supabase calls the portal's alert check (pg_cron + pg_net, both free on Supabase).
create table if not exists public.push_subs (owner_id uuid not null references auth.users(id) on delete cascade, id text not null, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now(), primary key (owner_id, id));
alter table public.push_subs enable row level security;
revoke all on public.push_subs from anon;
drop policy if exists push_owner_read on public.push_subs;
drop policy if exists push_self on public.push_subs;
create policy push_owner_read on public.push_subs for select using (public.is_owner());
create policy push_self on public.push_subs for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('arche-alerts', '*/2 * * * *', $$ select net.http_post(url := 'https://portal.archeaviation.com/api/alerts', body := '{}'::jsonb, headers := '{"Content-Type": "application/json"}'::jsonb) $$);
