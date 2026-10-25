-- Supervised steps (Morten, 26 Oct 2026): while a member is supervised, each gated step (quote to client, taking an
-- enquiry, first contact with a new prospect, recording payments, supplier quotes) waits for the owner's OK.
-- One row per request. The member can create and amend their own pending requests and read their own; only an owner
-- can approve or ask for changes. Owners release each step per member in Team.
create table if not exists public.step_requests (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now(), primary key (owner_id, id));
alter table public.step_requests enable row level security;
revoke all on public.step_requests from anon;
drop policy if exists req_owner on public.step_requests;
drop policy if exists req_self_read on public.step_requests;
drop policy if exists req_self_ask on public.step_requests;
drop policy if exists req_self_amend on public.step_requests;
create policy req_owner on public.step_requests for all using (public.is_owner()) with check (public.is_owner());
create policy req_self_read on public.step_requests for select using (public.is_member() and owner_id = auth.uid());
create policy req_self_ask on public.step_requests for insert with check (public.is_member() and owner_id = auth.uid() and data->>'status' = 'pending');
create policy req_self_amend on public.step_requests for update using (public.is_member() and owner_id = auth.uid() and data->>'status' = 'pending') with check (public.is_member() and owner_id = auth.uid() and data->>'status' = 'pending');

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'step_requests') then
    alter publication supabase_realtime add table public.step_requests;
  end if;
end $$;
