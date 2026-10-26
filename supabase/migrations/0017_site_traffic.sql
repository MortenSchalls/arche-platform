-- Website statistics and organisation links (Morten, 26 Oct 2026: "all traffic is monitored and used for internal
-- analytical improvements and sales push (prospects)").
-- First-party only: no cookies, no browser storage, no outside services. The IP address is never stored; Vercel gives
-- the country and city. Rows older than 13 months are deleted every night.
-- The website can only ADD rows through submit_visit(); it can never read anything.
-- Owner: sees everything (portal → Website). Brokers: see only visits that came through their own organisation links.

create table if not exists public.site_links (
  code text primary key check (code ~ '^[A-Za-z0-9]{6,12}$'),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id text not null,
  org text not null default '',
  created_at timestamptz not null default now()
);
alter table public.site_links enable row level security;
revoke all on public.site_links from anon;
drop policy if exists links_owner on public.site_links;
create policy links_owner on public.site_links for all using (public.is_owner()) with check (public.is_owner());
drop policy if exists links_self on public.site_links;
create policy links_self on public.site_links for all using (owner_id = auth.uid()) with check (owner_id = auth.uid() and public.is_member());

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  visit text not null,
  kind text not null,
  detail text not null default '',
  path text not null default '',
  lang text not null default '',
  ref text not null default '',
  utm jsonb not null default '{}'::jsonb,
  code text not null default '',
  device text not null default '',
  secs int not null default 0,
  country text not null default '',
  city text not null default ''
);
create index if not exists site_events_at on public.site_events (at);
create index if not exists site_events_code on public.site_events (code) where code <> '';
create index if not exists site_events_visit on public.site_events (visit);
alter table public.site_events enable row level security;
revoke all on public.site_events from anon;
drop policy if exists events_owner on public.site_events;
create policy events_owner on public.site_events for select using (public.is_owner());
drop policy if exists events_link_owner on public.site_events;
create policy events_link_owner on public.site_events for select using (
  code <> '' and exists (select 1 from public.site_links l where l.code = site_events.code and l.owner_id = auth.uid()));

create or replace function public.submit_visit(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare recent int;
begin
  if p is null or jsonb_typeof(p) <> 'object' or length(p::text) > 2000 then raise exception 'bad request'; end if;
  if coalesce(p->>'kind','') not in ('view','section','call','whatsapp','email','portal','language','finder',
     'quote_start','callback_start','quote_sent','callback_sent','leave') then raise exception 'bad kind'; end if;
  if coalesce(p->>'visit','') !~ '^[a-z0-9]{6,20}$' then raise exception 'bad visit'; end if;
  select count(*) into recent from public.site_events where at > now() - interval '10 minutes';
  if recent > 5000 then return; end if;                                   -- flood guard: drop quietly
  insert into public.site_events (visit, kind, detail, path, lang, ref, utm, code, device, secs, country, city)
  values (p->>'visit', p->>'kind', left(coalesce(p->>'detail',''),60), left(coalesce(p->>'path',''),60), left(coalesce(p->>'lang',''),5),
          left(coalesce(p->>'ref',''),80), case when jsonb_typeof(p->'utm') = 'object' then p->'utm' else '{}'::jsonb end,
          left(regexp_replace(coalesce(p->>'code',''),'[^A-Za-z0-9]','','g'),12), left(coalesce(p->>'device',''),8),
          least(greatest(coalesce((p->>'secs')::int,0),0),86400), left(coalesce(p->>'country',''),2), left(coalesce(p->>'city',''),60));
end $$;
revoke all on function public.submit_visit(jsonb) from public;
grant execute on function public.submit_visit(jsonb) to anon, authenticated;

-- Owner summary for the portal (one call; only the owner gets an answer)
create or replace function public.site_stats(days int default 30) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(days, 400))); out jsonb;
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  with e as (select * from public.site_events where at >= since),
  v as (select visit, min(at) at, max(country) country, max(city) city, max(device) device, max(path) path, max(lang) lang,
               coalesce(nullif(max(utm->>'source'),''), nullif(max(ref),''), 'direct') src, max(utm->>'campaign') campaign, max(code) code
        from e where kind = 'view' group by visit),
  act as (select kind, count(distinct visit) n from e group by kind)
  select jsonb_build_object(
    'since', since,
    'visits', (select count(*) from v),
    'byDay', (select coalesce(jsonb_agg(x order by x->>'d'), '[]') from (select jsonb_build_object('d', to_char(at::date,'YYYY-MM-DD'), 'n', count(*)) x from v group by at::date) t),
    'sources', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('k', src, 'n', count(*)) x from v group by src order by count(*) desc limit 15) t),
    'campaigns', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('k', campaign, 'n', count(*),
        'sent', (select count(distinct e2.visit) from e e2 where e2.kind in ('quote_sent','callback_sent') and e2.visit in (select visit from v v2 where v2.campaign = v.campaign))) x
        from v where coalesce(campaign,'') <> '' group by campaign order by count(*) desc limit 15) t),
    'countries', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('k', coalesce(nullif(country,''),'?'), 'n', count(*)) x from v group by country order by count(*) desc limit 15) t),
    'cities', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('k', coalesce(nullif(city,''),'?') || ', ' || coalesce(nullif(country,''),'?'), 'n', count(*)) x from v group by city, country order by count(*) desc limit 15) t),
    'pages', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('k', path, 'n', count(*)) x from v group by path order by count(*) desc limit 10) t),
    'devices', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('k', coalesce(nullif(device,''),'?'), 'n', count(*)) x from v group by device order by count(*) desc) t),
    'sections', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('k', detail, 'n', count(distinct visit)) x from e where kind = 'section' group by detail order by count(distinct visit) desc) t),
    'finder', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('k', detail, 'n', count(distinct visit)) x from e where kind = 'finder' group by detail order by count(distinct visit) desc limit 10) t),
    'actions', (select coalesce(jsonb_object_agg(kind, n), '{}') from act),
    'avgSecs', (select coalesce(round(avg(secs)),0) from e where kind = 'leave' and secs between 1 and 7200),
    'links', (select coalesce(jsonb_agg(x), '[]') from (select jsonb_build_object('code', l.code, 'org', l.org, 'lead', l.lead_id, 'by', l.owner_id,
        'visits', count(distinct ev.visit), 'last', max(ev.at),
        'acts', (select coalesce(jsonb_agg(distinct e3.kind), '[]') from e e3 where e3.code = l.code and e3.kind not in ('view','leave','section'))) x
        from public.site_links l join e ev on ev.code = l.code group by l.code, l.org, l.lead_id, l.owner_id order by max(ev.at) desc limit 50) t)
  ) into out;
  return out;
end $$;
revoke all on function public.site_stats(int) from public;
grant execute on function public.site_stats(int) to authenticated;

-- keep 13 months only
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'arche-site-events-retention';
    perform cron.schedule('arche-site-events-retention', '17 3 * * *', $c$delete from public.site_events where at < now() - interval '13 months'$c$);
  end if;
end $$;

-- live updates for the owner's Website page and brokers' link alerts (skipped if already added)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'site_events') then
    alter publication supabase_realtime add table public.site_events;
  end if;
end $$;

-- after-check: the portal confirms this step by calling site_stats
