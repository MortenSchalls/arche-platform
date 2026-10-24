-- Enquiry pool (Morten, 24 Oct 2026): every charter enquiry (website, charter email, phone) reaches the owner first.
-- The owner releases it to all brokers (first come, first served) or assigns it to one broker, and can reassign at any time.
-- enquiry_pool: the trip summary everyone in the pool may see. enquiry_contacts: the client's details, only for
-- the broker who has the enquiry, and for owner and operations.
create table if not exists public.enquiry_pool     (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.enquiry_contacts (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.enquiry_pool enable row level security;
alter table public.enquiry_contacts enable row level security;
revoke all on public.enquiry_pool from anon;
revoke all on public.enquiry_contacts from anon;

drop policy if exists pool_owner on public.enquiry_pool;
drop policy if exists pool_staff_read on public.enquiry_pool;
drop policy if exists pool_member_read on public.enquiry_pool;
drop policy if exists pool_member_take on public.enquiry_pool;
create policy pool_owner on public.enquiry_pool for all using (public.is_owner()) with check (public.is_owner());
create policy pool_staff_read on public.enquiry_pool for select using (public.is_staff());
-- brokers see enquiries that are open to everyone, and their own
create policy pool_member_read on public.enquiry_pool for select using (public.is_member() and (data->>'status' = 'released' or data->>'claimedBy' = auth.uid()::text));
-- first come, first served: a broker may only turn an open enquiry into one taken by themselves; the row lock makes the first one win
create policy pool_member_take on public.enquiry_pool for update using (public.is_member() and data->>'status' = 'released') with check (data->>'status' = 'claimed' and data->>'claimedBy' = auth.uid()::text);

drop policy if exists poolc_owner on public.enquiry_contacts;
drop policy if exists poolc_staff_read on public.enquiry_contacts;
drop policy if exists poolc_taker_read on public.enquiry_contacts;
create policy poolc_owner on public.enquiry_contacts for all using (public.is_owner()) with check (public.is_owner());
create policy poolc_staff_read on public.enquiry_contacts for select using (public.is_staff());
create policy poolc_taker_read on public.enquiry_contacts for select using (public.is_member() and exists (select 1 from public.enquiry_pool p where p.id = enquiry_contacts.id and p.data->>'claimedBy' = auth.uid()::text));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'enquiry_pool') then
    alter publication supabase_realtime add table public.enquiry_pool;
  end if;
end $$;
