-- Archē platform: consultants, brokers with booking rights, and the file store

-- the portal also has charter consultants
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner','ops','broker','consultant'));

-- a broker or consultant with booking rights works as operations (as on claude.ai: roster.book + Editor)
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select case when not p.active then null
              when p.role in ('broker','consultant') and p.book then 'ops'
              else p.role end
  from public.profiles p where p.id = auth.uid()
$$;

-- private file store for trip documents, issued confirmations and signed contracts
insert into storage.buckets (id, name, public) values ('portal-files', 'portal-files', false) on conflict (id) do nothing;
create policy portal_files_read on storage.objects for select using (bucket_id = 'portal-files' and public.is_member());
create policy portal_files_insert on storage.objects for insert with check (bucket_id = 'portal-files' and public.is_member() and (storage.foldername(name))[1] = auth.uid()::text);
create policy portal_files_delete on storage.objects for delete using (bucket_id = 'portal-files' and public.is_staff());
