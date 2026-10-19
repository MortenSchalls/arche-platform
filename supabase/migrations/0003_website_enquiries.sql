-- Archē platform: website quote and call-back requests reach the portal
-- The public website calls submit_enquiry() with the publishable key; it can only add a row,
-- never read or change anything. Staff see the rows in the portal (Today → Website enquiries).

create or replace function public.submit_enquiry(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid; recent int;
begin
  if p is null or jsonb_typeof(p) <> 'object' or length(p::text) > 8000 then raise exception 'bad request'; end if;
  if coalesce(p->>'type','') not in ('quote','callback') then raise exception 'bad type'; end if;
  select count(*) into recent from public.website_enquiries where at > now() - interval '10 minutes';
  if recent > 50 then raise exception 'busy'; end if;               -- simple flood guard
  insert into public.website_enquiries (data, consent) values (p - 'consent', coalesce((p->>'consent')::boolean, false)) returning id into new_id;
  return new_id;
end $$;
revoke all on function public.submit_enquiry(jsonb) from public;
grant execute on function public.submit_enquiry(jsonb) to anon, authenticated;

-- (website_enquiries already receives live updates in Supabase; no publication change needed)
