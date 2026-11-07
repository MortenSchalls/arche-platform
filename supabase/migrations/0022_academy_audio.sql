-- Archē platform: recorded narration for the Broker Academy (Morten, 7 Nov 2026)
-- A private storage bucket for the academy's recorded voices (Isabella and Fable). Anyone signed in to the portal,
-- including people still joining, may listen; nobody can list it from outside, upload to it or change it. Only the
-- recording job on GitHub writes to it, with the server key. Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('academy-audio', 'academy-audio', false)
on conflict (id) do update set public = false;

drop policy if exists "academy audio: signed-in members listen" on storage.objects;
create policy "academy audio: signed-in members listen" on storage.objects
  for select to authenticated
  using (bucket_id = 'academy-audio');
