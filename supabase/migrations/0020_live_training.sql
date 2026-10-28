-- Archē platform: live training in the real portal (Morten, 28 Oct 2026)
-- The owner shares his screen over a PRIVATE Realtime channel "train:<id>". Only the owner and the members he chose
-- (config key 'live': {id, owner, watchers[], scope[], until}) may join it, and only until the session ends.
-- Nothing is stored by Realtime; the portal also masks email addresses and phone numbers before sending.

create or replace function public.live_allowed(topic text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.config c
    where c.key = 'live'
      and topic = 'train:' || (c.value->>'id')
      and coalesce(c.value->>'until', '') > to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS')
      and (auth.uid()::text = c.value->>'owner' or (c.value->'watchers') ? auth.uid()::text)
      and public.is_member()
  );
$$;
revoke all on function public.live_allowed(text) from public;
grant execute on function public.live_allowed(text) to authenticated;

drop policy if exists live_receive on realtime.messages;
create policy live_receive on realtime.messages for select to authenticated
  using (realtime.messages.extension = 'broadcast' and public.live_allowed(realtime.topic()));
drop policy if exists live_send on realtime.messages;
create policy live_send on realtime.messages for insert to authenticated
  with check (realtime.messages.extension = 'broadcast' and public.live_allowed(realtime.topic()));
