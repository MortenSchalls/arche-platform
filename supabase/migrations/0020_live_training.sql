-- Archē platform: live training (Morten, 28 Oct 2026)
-- The owner shares his screen with members he chooses (Team → Live training). The session is kept in the
-- config row 'live'. Only the owner and the chosen members may join its private channel, and only until the
-- session ends. Nothing is stored. Safe to run more than once.

create or replace function public.live_allowed(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.config c
    where c.key = 'live'
      and public.is_member()
      and p_topic = 'train:' || (c.value ->> 'id')
      and (c.value ->> 'until') ~ '^\d{4}-\d{2}-\d{2}T'
      and (c.value ->> 'until')::timestamptz > now()
      and (
        auth.uid()::text = c.value ->> 'owner'
        or (c.value -> 'watchers') ? auth.uid()::text
      )
  );
$$;

revoke all on function public.live_allowed(text) from public;
grant execute on function public.live_allowed(text) to authenticated;

-- receive messages on the channel
drop policy if exists live_receive on realtime.messages;
create policy live_receive on realtime.messages
  for select to authenticated
  using (realtime.messages.extension = 'broadcast' and public.live_allowed(realtime.topic()));

-- send messages on the channel
drop policy if exists live_send on realtime.messages;
create policy live_send on realtime.messages
  for insert to authenticated
  with check (realtime.messages.extension = 'broadcast' and public.live_allowed(realtime.topic()));
