-- Archē platform: first database setup
-- Mirrors the 25 access rules of the claude.ai portal (see docs/MIGRATION.md).
-- Roles: owner, ops, broker. "self" = the signed-in user's own rows.

create extension if not exists pgcrypto;

-- ---------- people and roles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  contract_name text not null default '',
  role text not null default 'broker' check (role in ('owner','ops','broker')),
  active boolean not null default false,
  book boolean not null default false,          -- booking rights for ops who also sell
  supervised boolean not null default false,    -- stage 6 supervised bookings
  base text default '',
  cert text default '',
  since timestamptz default now(),
  data jsonb not null default '{}'::jsonb
);

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select case when p.active then p.role else null end from public.profiles p where p.id = auth.uid()
$$;
create or replace function public.is_owner() returns boolean language sql stable as $$ select public.my_role() = 'owner' $$;
create or replace function public.is_staff() returns boolean language sql stable as $$ select public.my_role() in ('owner','ops') $$;
create or replace function public.is_member() returns boolean language sql stable as $$ select public.my_role() is not null $$;

-- ---------- generic key/value areas (config, intel, locks) ----------
create table public.config (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table public.intel  (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table public.locks  (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
-- regional cards are read by every active member (fixes the claude.ai gap where brokers could not read intel/cards)
create table public.region_cards (id text primary key, value jsonb not null, verified date, updated_at timestamptz default now());

-- ---------- owner-side records ----------
create table public.join_requests (user_id uuid primary key references auth.users(id) on delete cascade, data jsonb not null, at timestamptz default now());
create table public.prospects (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table public.audit_log (id bigint generated always as identity primary key, t timestamptz not null default now(), by uuid, action text not null, detail text default '');
create table public.faq (id text primary key, data jsonb not null, updated_at timestamptz default now());

-- ---------- per-person collections ----------
-- one table per claude.ai collection; owner_id = the {bid}/{uid} path segment
create table public.trips        (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));   -- desk/{bid}/deals
create table public.trip_status  (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));   -- status/{bid}/deals
create table public.payouts      (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));   -- payouts/{bid}/months
create table public.leads        (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));   -- leads/{bid}/items
create table public.access_log   (owner_id uuid not null references auth.users(id), id text not null default 'last', data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));
create table public.questions    (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));   -- asks/{uid}/items
create table public.training_runs(owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));   -- train/{uid}/runs
create table public.roleplay_runs(owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));   -- train/{uid}/rp

-- ---------- website enquiries (written by the public site through a server function only) ----------
create table public.website_enquiries (id uuid primary key default gen_random_uuid(), at timestamptz default now(), data jsonb not null, consent boolean not null default false, handled boolean not null default false);

-- ---------- row-level security ----------
alter table public.profiles enable row level security;
alter table public.config enable row level security;
alter table public.intel enable row level security;
alter table public.locks enable row level security;
alter table public.region_cards enable row level security;
alter table public.join_requests enable row level security;
alter table public.prospects enable row level security;
alter table public.audit_log enable row level security;
alter table public.faq enable row level security;
alter table public.trips enable row level security;
alter table public.trip_status enable row level security;
alter table public.payouts enable row level security;
alter table public.leads enable row level security;
alter table public.access_log enable row level security;
alter table public.questions enable row level security;
alter table public.training_runs enable row level security;
alter table public.roleplay_runs enable row level security;
alter table public.website_enquiries enable row level security;

-- profiles: staff read all; each person reads own; only owner writes (people cannot promote themselves)
create policy profiles_read on public.profiles for select using (public.is_staff() or id = auth.uid());
create policy profiles_write on public.profiles for all using (public.is_owner()) with check (public.is_owner());

-- config: members read, owner writes
create policy config_read on public.config for select using (public.is_member());
create policy config_write on public.config for all using (public.is_owner()) with check (public.is_owner());
-- intel: staff read, owner writes
create policy intel_read on public.intel for select using (public.is_staff());
create policy intel_write on public.intel for all using (public.is_owner()) with check (public.is_owner());
-- locks: staff (the rotation engine also runs with the service key, which bypasses RLS)
create policy locks_all on public.locks for all using (public.is_staff()) with check (public.is_staff());
-- regional cards: members read, owner writes
create policy cards_read on public.region_cards for select using (public.is_member());
create policy cards_write on public.region_cards for all using (public.is_owner()) with check (public.is_owner());

-- join requests: any signed-in person manages own; staff read all; owner decides
create policy join_self on public.join_requests for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy join_staff_read on public.join_requests for select using (public.is_staff());
create policy join_owner on public.join_requests for delete using (public.is_owner());

-- prospects, audit: staff only; audit is append-only
create policy prospects_staff on public.prospects for all using (public.is_staff()) with check (public.is_staff());
create policy audit_read on public.audit_log for select using (public.is_staff());
create policy audit_insert on public.audit_log for insert with check (public.is_member() and by = auth.uid());

-- faq: members read, owner writes
create policy faq_read on public.faq for select using (public.is_member());
create policy faq_write on public.faq for all using (public.is_owner()) with check (public.is_owner());

-- trips (broker side): staff all; broker own
create policy trips_staff on public.trips for all using (public.is_staff()) with check (public.is_staff());
create policy trips_self on public.trips for all using (public.is_member() and owner_id = auth.uid()) with check (public.is_member() and owner_id = auth.uid());

-- trip status, payouts (money side): staff write; broker reads own only
create policy status_staff on public.trip_status for all using (public.is_staff()) with check (public.is_staff());
create policy status_self_read on public.trip_status for select using (public.is_member() and owner_id = auth.uid());
create policy payouts_staff on public.payouts for all using (public.is_staff()) with check (public.is_staff());
create policy payouts_self_read on public.payouts for select using (public.is_member() and owner_id = auth.uid());

-- leads, access log, questions, training: staff all; person own
create policy leads_staff on public.leads for all using (public.is_staff()) with check (public.is_staff());
create policy leads_self on public.leads for all using (public.is_member() and owner_id = auth.uid()) with check (public.is_member() and owner_id = auth.uid());
create policy access_staff on public.access_log for select using (public.is_staff());
create policy access_self on public.access_log for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy questions_staff on public.questions for all using (public.is_staff()) with check (public.is_staff());
create policy questions_self on public.questions for all using (public.is_member() and owner_id = auth.uid()) with check (public.is_member() and owner_id = auth.uid());
create policy train_staff on public.training_runs for all using (public.is_staff()) with check (public.is_staff());
create policy train_self on public.training_runs for all using (public.is_member() and owner_id = auth.uid()) with check (public.is_member() and owner_id = auth.uid());
create policy rp_staff on public.roleplay_runs for all using (public.is_staff()) with check (public.is_staff());
create policy rp_self on public.roleplay_runs for all using (public.is_member() and owner_id = auth.uid()) with check (public.is_member() and owner_id = auth.uid());

-- website enquiries: staff read and update; inserts only through the server function (service key)
create policy enq_staff on public.website_enquiries for select using (public.is_staff());
create policy enq_staff_upd on public.website_enquiries for update using (public.is_staff()) with check (public.is_staff());

-- new sign-ups get an inactive profile; the owner approves in Team
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, contract_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', '')) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- live updates for the portal screens
alter publication supabase_realtime add table public.trips, public.trip_status, public.leads, public.prospects, public.config, public.profiles, public.join_requests, public.region_cards;
