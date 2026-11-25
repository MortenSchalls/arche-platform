-- Archē platform: stored files are seen only by those who need them (25 Nov 2026)
-- Found by the independent review of 25 Nov 2026: the rule of 0002 let every portal member read and list every file in
-- portal-files, so a broker could open another broker's passport and contract files. Morten asked the same day that all
-- documents are traceable per flight and per record (prospects, operators, service partners, investors).
-- After this:
--   the Director and mandated staff (is_staff) read every file, except investor files;
--   investor files (<uploader>/investors/<id>/...) are read by the Director only (is_owner);
--   a broker reads the files they uploaded, the files of their own trips (<uploader>/trips/<broker>/<trip id>/...) and older
--   confirmations and signed contracts named in their trip's authorisation record (written only by staff);
--   record files (<uploader>/records/<prospect id>/...) are read by staff and by the uploader.
-- Uploading still goes only into one's own folder (0002). Safe to run twice.
drop policy if exists portal_files_read on storage.objects;
drop policy if exists portal_files_read_scoped on storage.objects;
create policy portal_files_read_scoped on storage.objects for select using (
  bucket_id = 'portal-files' and public.is_member() and (
    -- investor documents: the owners (the Director) only
    case when (storage.foldername(name))[2] = 'investors' then public.is_owner()
    else (
      public.is_staff()
      -- one's own uploads
      or (storage.foldername(name))[1] = auth.uid()::text
      -- files of one's own trips: <uploader>/trips/<trip broker>/<trip id>/...; the broker's id is in the path, so a
      -- trip id copied into another broker's row opens nothing (review 25 Nov 2026)
      or ((storage.foldername(name))[2] = 'trips' and (storage.foldername(name))[3] = auth.uid()::text)
      -- older confirmations and signed contracts, named in the trip's authorisation record, which only staff write
      or exists (select 1 from public.trip_status s where s.owner_id = auth.uid() and position(objects.name in s.data::text) > 0)
    ) end
  )
);
-- a check the portal can call to see this rule is in place (Today ticks the step by itself)
create or replace function public.files_private() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'portal_files_read_scoped')
$$;
grant execute on function public.files_private() to authenticated;
