-- Supervisor rights (Morten, 26 Oct 2026): the owner can let experienced members supervise, assess and approve.
-- Rights are kept on the member's profile (data.rights), which only an owner can change. Nobody acts on their own work:
-- supervisors cannot decide their own requests, and assessors cannot send an agreement to themselves.
--   supervise: read everyone's supervised-step requests, approve or ask for changes on others' requests, and hand an
--              approved pool enquiry to the person who asked for it
--   assess:    see requests to join and academy progress, and send the agreement after a passed assessment
--              (countersigning stays with the owner as signatory)
--   approve:   approve bookings (operations members; they can already update trip status)
create or replace function public.has_right(r text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.active and coalesce((p.data->'rights'->>r)::boolean, false))
$$;

drop policy if exists profiles_supervisor_read on public.profiles;
create policy profiles_supervisor_read on public.profiles for select using (public.has_right('supervise') or public.has_right('assess'));

drop policy if exists req_supervisor_read on public.step_requests;
drop policy if exists req_supervisor_decide on public.step_requests;
create policy req_supervisor_read on public.step_requests for select using (public.has_right('supervise'));
create policy req_supervisor_decide on public.step_requests for update
  using (public.has_right('supervise') and owner_id <> auth.uid() and data->>'status' = 'pending')
  with check (public.has_right('supervise') and owner_id <> auth.uid() and data->>'status' in ('approved', 'changes'));

drop policy if exists pool_supervisor_assign on public.enquiry_pool;
create policy pool_supervisor_assign on public.enquiry_pool for update
  using (public.has_right('supervise') and data->>'status' = 'released')
  with check (public.has_right('supervise') and data->>'status' = 'claimed' and data->>'claimedBy' <> auth.uid()::text);

drop policy if exists join_assessor_read on public.join_requests;
create policy join_assessor_read on public.join_requests for select using (public.has_right('assess'));
drop policy if exists acad_progress_assessor_read on public.academy_progress;
create policy acad_progress_assessor_read on public.academy_progress for select using (public.has_right('assess'));
drop policy if exists agr_assessor_read on public.agreements;
drop policy if exists agr_assessor_send on public.agreements;
create policy agr_assessor_read on public.agreements for select using (public.has_right('assess'));
create policy agr_assessor_send on public.agreements for insert with check (public.has_right('assess') and id <> auth.uid()::text and data->>'status' = 'sent');
