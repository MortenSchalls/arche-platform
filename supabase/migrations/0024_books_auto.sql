-- Books, part 2: as little typing as possible, and every mistake caught or undone (Morten, 10 Nov 2026: "keep your
-- suggestion, idea is that even the worst in class accountant or my 11 year old daughter can do this without mistakes,
-- and even if there should be mistakes, it will be caught and in worst case rolled back").
-- Bank lines match themselves (to an entry already in the books, or by a rule the owners set); receipts are read and
-- proposed; repeating costs come up by themselves; every posting is checked first and can be undone in one step.
-- Needs 0023. Safe to run twice.

-- bank lines: what happened to each line, in the bank's own currency and in US dollars
alter table public.acct_bank_lines add column if not exists currency text not null default 'USD';
alter table public.acct_bank_lines add column if not exists amount_usd numeric(16,2);
alter table public.acct_bank_lines add column if not exists fx_rate numeric(18,8);          -- units of the bank currency per USD
alter table public.acct_bank_lines add column if not exists fx_source text not null default '';
alter table public.acct_bank_lines add column if not exists status text not null default 'new';  -- new, matched, posted, suggested
alter table public.acct_bank_lines add column if not exists how text not null default '';        -- entry, rule, receipt, person
alter table public.acct_bank_lines add column if not exists rule_id uuid;
alter table public.acct_bank_lines add column if not exists suggestion jsonb;
alter table public.acct_bank_lines add column if not exists bank_ref text not null default '';   -- the bank's own reference (Wise)
create index if not exists acct_bank_lines_open on public.acct_bank_lines (status) where journal_id is null;

-- rules the owners set from their own first choice ("Vercel is software"): a matching bank line posts by itself
create table if not exists public.acct_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  match text not null check (length(match) between 3 and 80),     -- lower-case words the bank text must contain
  direction text not null default 'out' check (direction in ('in','out')),
  bank_account text references public.acct_accounts(code),         -- null: any bank account
  account text not null references public.acct_accounts(code),     -- where the money goes
  max_usd numeric(16,2),                                            -- above this it waits for a person (unusual amount)
  active boolean not null default true,
  created_by uuid, created_at timestamptz not null default now(),
  hits integer not null default 0, last_hit date, ended_at timestamptz
);

-- receipts and bills: the file, what was read from it, and what became of it
create table if not exists public.acct_receipts (
  id uuid primary key default gen_random_uuid(),
  file_hash text unique,                                            -- the same file is never taken twice
  file_path text not null default '', file_type text not null default '',
  status text not null default 'new' check (status in ('new','read','posted','paid','rejected')),
  data jsonb not null default '{}'::jsonb,                          -- supplier, date, total, currency, gst, account, read_by
  journal_id bigint references public.acct_journal(id),             -- the bill entry
  paid_journal_id bigint references public.acct_journal(id),        -- the bank entry that paid it
  created_by uuid, created_at timestamptz not null default now(), decided_by uuid, decided_at timestamptz
);

-- repeating entries (rent, the accountant's fee, depreciation): they come up as drafts on their day
create table if not exists public.acct_recurring (
  id uuid primary key default gen_random_uuid(),
  memo text not null, lines jsonb not null,
  day integer not null check (day between 1 and 28), every_months integer not null default 1 check (every_months between 1 and 12),
  next_date date not null, end_date date,
  active boolean not null default true, created_by uuid, created_at timestamptz not null default now()
);
-- a draft made from a repeat carries its key, so the same month never comes up twice
alter table public.acct_drafts add column if not exists source text unique;

do $$ declare t text; begin
  foreach t in array array['acct_rules','acct_receipts','acct_recurring'] loop
    execute format('alter table public.%I enable row level security', t);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on public.%I from anon', t); end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke all on public.%I from authenticated', t); end if;
  end loop;
end $$;

-- receipt files: a private bucket only the server reaches
insert into storage.buckets (id, name, public) values ('books', 'books', false) on conflict (id) do nothing;
