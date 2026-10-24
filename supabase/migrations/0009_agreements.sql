-- Agreements signed in the portal (Morten, 24 Oct 2026): nothing is sent as a file by email.
-- The owner sends the agreement after a passed assessment; the person reads it, fills in their details and signs in the
-- portal; the owner countersigns, which also opens the portal and issues the onboarding package.
-- One row per person (id = their user id). The person can read their own row and can only turn "sent" into "signed".
create table if not exists public.agreements (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.agreements enable row level security;
revoke all on public.agreements from anon;

drop policy if exists agr_owner on public.agreements;
drop policy if exists agr_staff_read on public.agreements;
drop policy if exists agr_self_read on public.agreements;
drop policy if exists agr_self_sign on public.agreements;
create policy agr_owner on public.agreements for all using (public.is_owner()) with check (public.is_owner());
create policy agr_staff_read on public.agreements for select using (public.is_staff());
create policy agr_self_read on public.agreements for select using (id = auth.uid()::text);
create policy agr_self_sign on public.agreements for update using (id = auth.uid()::text and data->>'status' = 'sent') with check (id = auth.uid()::text and data->>'status' = 'signed');

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'agreements') then
    alter publication supabase_realtime add table public.agreements;
  end if;
end $$;
