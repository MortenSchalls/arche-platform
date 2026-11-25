-- Archē platform: the launch gate in the database (Morten, 25 Nov 2026: "Yes add").
-- Before launch, agreements are signed and countersigned at once, but no trip may be sent for authorisation, approved
-- or issued until company, bank, client payments and Avinode are all ticked in Onboarding > Ready for bookings
-- (config/intake). The portal already stops these steps on screen; this makes the database refuse them too, whatever
-- sends the write. Safe to run twice.

create or replace function public.intake_ready() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select bool_and(coalesce(value->'ready'->>k, '') in ('true', '1'))
    from public.config, unnest(array['company', 'bank', 'payments', 'avinode']) as k
    where key = 'intake'
  ), false)
$$;
grant execute on function public.intake_ready() to authenticated;

-- trips: moving a trip to "submitted" (sent for authorisation)
create or replace function public.launch_gate_trips() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.data->>'stage', '') = 'submitted'
     and (tg_op = 'INSERT' or coalesce(old.data->>'stage', '') <> 'submitted')
     and not public.intake_ready() then
    raise exception 'Bookings open at launch: company, bank, client payments and Avinode must all be ticked in Onboarding > Ready for bookings.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists launch_gate on public.trips;
create trigger launch_gate before insert or update on public.trips for each row execute function public.launch_gate_trips();

-- trip_status: a new approval, or a first issue
create or replace function public.launch_gate_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.intake_ready() then return new; end if;
  if coalesce(new.data->'approval'->>'state', '') = 'approved'
     and (tg_op = 'INSERT' or coalesce(old.data->'approval'->>'state', '') <> 'approved'
          or coalesce(old.data->'approval'->>'at', '') <> coalesce(new.data->'approval'->>'at', '')) then
    raise exception 'Bookings open at launch: a trip cannot be approved until Ready for bookings is all ticked.' using errcode = 'P0001';
  end if;
  if coalesce(new.data->>'issuedAt', '') <> '' and (tg_op = 'INSERT' or coalesce(old.data->>'issuedAt', '') = '') then
    raise exception 'Bookings open at launch: a confirmation cannot be issued until Ready for bookings is all ticked.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists launch_gate on public.trip_status;
create trigger launch_gate before insert or update on public.trip_status for each row execute function public.launch_gate_status();
