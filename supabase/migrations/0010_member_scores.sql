-- Trust and performance history (Morten, 26 Oct 2026): one row per week, kept for good, never trimmed.
-- Each row holds every member's trust and performance score that week. Owner only: members and operations cannot read it.
create table if not exists public.member_scores (id text primary key, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.member_scores enable row level security;
revoke all on public.member_scores from anon;
drop policy if exists scores_owner on public.member_scores;
create policy scores_owner on public.member_scores for all using (public.is_owner()) with check (public.is_owner());
