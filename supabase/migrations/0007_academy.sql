-- Archē Broker Academy on the portal sign-in (Morten, 23 Oct 2026).
-- progress: each person reads and writes their own; owner and operations read everyone's; the owner can reset anyone's.
-- records: the director's training records (owner writes, owner and operations read).
-- certificates: the certificate register (owner writes; anyone can check a certificate number).
create table if not exists public.academy_progress (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.academy_records  (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.certificates     (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.academy_progress enable row level security;
alter table public.academy_records enable row level security;
alter table public.certificates enable row level security;
revoke all on public.academy_progress from anon;
revoke all on public.academy_records from anon;

drop policy if exists acad_progress_self on public.academy_progress;
drop policy if exists acad_progress_staff_read on public.academy_progress;
drop policy if exists acad_progress_owner on public.academy_progress;
create policy acad_progress_self on public.academy_progress for all using (id = auth.uid()::text) with check (id = auth.uid()::text);
create policy acad_progress_staff_read on public.academy_progress for select using (public.is_staff());
create policy acad_progress_owner on public.academy_progress for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists acad_records_owner on public.academy_records;
drop policy if exists acad_records_staff_read on public.academy_records;
create policy acad_records_owner on public.academy_records for all using (public.is_owner()) with check (public.is_owner());
create policy acad_records_staff_read on public.academy_records for select using (public.is_staff());

drop policy if exists certs_owner on public.certificates;
drop policy if exists certs_verify on public.certificates;
create policy certs_owner on public.certificates for all using (public.is_owner()) with check (public.is_owner());
create policy certs_verify on public.certificates for select using (true);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'academy_progress') then
    alter publication supabase_realtime add table public.academy_progress;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'academy_records') then
    alter publication supabase_realtime add table public.academy_records;
  end if;
end $$;
