-- Archē platform: joining history from the sign-in records (Morten, 2 Nov 2026)
-- Team > Invitations shows each person's joining log. This lets the portal read, for one person at a time, the
-- dated sign-in events that Supabase already keeps (account created, invitation link opened, signed in, new password
-- link asked for, password changed). Only the portal's server can call it; members and visitors cannot.
-- No IP addresses or devices are returned. Safe to run more than once.

drop function if exists public.join_auth_events(uuid, text);

create function public.join_auth_events(p_uid uuid, p_email text)
returns table (at timestamptz, action text)
language sql
stable
security definer
set search_path = auth, public
as $$
  select e.created_at as at, coalesce(e.payload ->> 'action', '') as action
  from auth.audit_log_entries e
  where (
      e.payload ->> 'actor_id' = p_uid::text
      or e.payload -> 'traits' ->> 'user_id' = p_uid::text
      or lower(coalesce(e.payload -> 'traits' ->> 'user_email', '')) = lower(p_email)
    )
    and coalesce(e.payload ->> 'action', '') <> 'token_refreshed'
  order by e.created_at desc
  limit 300;
$$;

revoke all on function public.join_auth_events(uuid, text) from public;
revoke all on function public.join_auth_events(uuid, text) from anon;
revoke all on function public.join_auth_events(uuid, text) from authenticated;
grant execute on function public.join_auth_events(uuid, text) to service_role;
