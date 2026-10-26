-- Supervision share (Morten, 26 Oct 2026): a supervisor sees the trips that pay them a supervision share, so their
-- commission page can show it. They see only those trips' status record (price, gross profit, reference), and only
-- when the share is theirs.
drop policy if exists status_supervisor_read on public.trip_status;
create policy status_supervisor_read on public.trip_status for select using (public.is_member() and data->'supShare'->>'uid' = auth.uid()::text);
