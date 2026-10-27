-- Archē platform: empty-leg alert sign-ups from the website home page (Morten, 27 Oct 2026)
-- 1. submit_enquiry() also accepts type 'alert' (an email and the routes the person flies). The website API
--    (apps/website/site/api/enquiry.mjs) checks the email before calling it. Still add-only for the website.
-- 2. Staff may delete an enquiry row, so an unsubscribe removes the person's email at once.

create or replace function public.submit_enquiry(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid; recent int;
begin
  if p is null or jsonb_typeof(p) <> 'object' or length(p::text) > 8000 then raise exception 'bad request'; end if;
  if coalesce(p->>'type','') not in ('quote','callback','alert') then raise exception 'bad type'; end if;
  select count(*) into recent from public.website_enquiries where at > now() - interval '10 minutes';
  if recent > 50 then raise exception 'busy'; end if;               -- simple flood guard
  insert into public.website_enquiries (data, consent) values (p - 'consent', coalesce((p->>'consent')::boolean, false)) returning id into new_id;
  return new_id;
end $$;
revoke all on function public.submit_enquiry(jsonb) from public;
grant execute on function public.submit_enquiry(jsonb) to anon, authenticated;

drop policy if exists enq_staff_del on public.website_enquiries;
create policy enq_staff_del on public.website_enquiries for delete using (public.is_staff());
grant delete on public.website_enquiries to authenticated;
