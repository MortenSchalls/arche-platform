-- Alerts (Morten, 26 Oct 2026): who receives portal alerts, on which channel, for which events, and the company's
-- official WhatsApp sender once it is set up. Owner only: phone numbers and emails here are never visible to members.
create table if not exists public.alert_settings (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.alert_settings enable row level security;
revoke all on public.alert_settings from anon;
drop policy if exists alerts_owner on public.alert_settings;
create policy alerts_owner on public.alert_settings for all using (public.is_owner()) with check (public.is_owner());
