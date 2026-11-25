-- stand-ins for Supabase's auth and storage, enough to test the 0028 read rule (example data only)
create role anon; create role authenticated;
create schema auth; create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create function public.my_role() returns text language sql stable as $$ select nullif(current_setting('test.role', true), '') $$;
create function public.is_owner() returns boolean language sql stable as $$ select public.my_role() = 'owner' $$;
create function public.is_staff() returns boolean language sql stable as $$ select public.my_role() in ('owner','ops') $$;
create function public.is_member() returns boolean language sql stable as $$ select public.my_role() is not null $$;
create table public.trips (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, primary key (owner_id, id));
create table public.trip_status (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, primary key (owner_id, id));
create schema storage;
create table storage.objects (bucket_id text, name text);
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
alter table storage.objects enable row level security;
grant usage on schema storage, auth, public to authenticated;
grant select on storage.objects, public.trips, public.trip_status to authenticated;
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'), ('00000000-0000-0000-0000-00000000000d');
-- broker A holds trip tA, broker B holds trip tB; the Director (d) uploaded a confirmation into A's trip folder and an older one at his root
insert into public.trips values ('00000000-0000-0000-0000-00000000000a', 'tA', '{"docs":[]}'), ('00000000-0000-0000-0000-00000000000b', 'tB', '{}');
insert into public.trip_status values ('00000000-0000-0000-0000-00000000000a', 'tA', '{"confIssued":{"assetId":"00000000-0000-0000-0000-00000000000d/oldconf"}}');
insert into storage.objects values
 ('portal-files', '00000000-0000-0000-0000-00000000000a/trips/00000000-0000-0000-0000-00000000000a/tA/aoc'),
 ('portal-files', '00000000-0000-0000-0000-00000000000b/trips/00000000-0000-0000-0000-00000000000b/tB/passport'),
 ('portal-files', '00000000-0000-0000-0000-00000000000d/trips/00000000-0000-0000-0000-00000000000a/tA/conf'),
 ('portal-files', '00000000-0000-0000-0000-00000000000d/oldconf'),
 ('portal-files', '00000000-0000-0000-0000-00000000000d/records/p001/register'),
 ('portal-files', '00000000-0000-0000-0000-00000000000d/investors/i001/nda');
