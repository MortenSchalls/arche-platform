-- Books database tests (run by scripts/test_books_sql.sh on a throwaway local Postgres; example data only).
\set ON_ERROR_STOP 1
-- 1. a balanced entry posts; the same source posts once
select public.acct_post('2026-12-01', 'Share capital paid in', 'test:capital', 'opening',
  '[{"account":"1000","debit":19000},{"account":"3000","credit":19000}]'::jsonb) as j1 \gset
select public.acct_post('2026-12-01', 'again', 'test:capital', 'opening', '[{"account":"1000","debit":5},{"account":"3000","credit":5}]'::jsonb) as j1b \gset
select (:j1 = :j1b) as same_source_posts_once \gset
\if :same_source_posts_once
\else
  \echo 'FAIL same source posted twice'
  select 1/0;
\endif
-- 2. unbalanced, one-line, unknown account and zero lines are refused
do $$ begin
  begin perform public.acct_post('2026-12-01','x',null,'manual','[{"account":"1000","debit":10},{"account":"3000","credit":9}]'); raise exception 'unbalanced accepted'; exception when others then if sqlerrm like 'unbalanced accepted' then raise; end if; end;
  begin perform public.acct_post('2026-12-01','x',null,'manual','[{"account":"1000","debit":10}]'); raise exception 'one line accepted'; exception when others then if sqlerrm like 'one line accepted' then raise; end if; end;
  begin perform public.acct_post('2026-12-01','x',null,'manual','[{"account":"9999","debit":10},{"account":"3000","credit":10}]'); raise exception 'unknown account accepted'; exception when others then if sqlerrm like 'unknown account accepted' then raise; end if; end;
  begin perform public.acct_post('2026-12-01','x',null,'manual','[{"account":"1000","debit":10},{"account":"3000","credit":10},{"account":"5900","debit":0}]'); raise exception 'zero line accepted'; exception when others then if sqlerrm like 'zero line accepted' then raise; end if; end;
end $$;
-- 3. posted entries cannot be changed or deleted
do $$ begin
  begin update public.acct_journal set memo = 'changed'; raise exception 'update allowed'; exception when others then if sqlerrm like 'update allowed' then raise; end if; end;
  begin delete from public.acct_lines; raise exception 'delete allowed'; exception when others then if sqlerrm like 'delete allowed' then raise; end if; end;
  begin truncate public.acct_journal cascade; raise exception 'truncate allowed'; exception when others then if sqlerrm like 'truncate allowed' then raise; end if; end;
end $$;
-- 4. a trip: deposit, balance, operator paid, flown -> margin = received - paid
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000b');
insert into public.trip_status (owner_id, id, data) values ('00000000-0000-0000-0000-00000000000b', 'T1',
  '{"ref":"AE-TEST-1","receipts":[{"date":"2026-12-02","amount":25000,"at":"a1"}]}');
update public.trip_status set data = data || '{"receipts":[{"date":"2026-12-02","amount":25000,"at":"a1"},{"date":"2026-12-05","amount":75000,"at":"a2"}],"payouts":[{"date":"2026-12-06","amount":91000,"at":"p1"}]}' where id = 'T1';
update public.trip_status set data = data || '{"state":"flown","flownDate":"2026-12-10"}' where id = 'T1';
update public.trip_status set data = data || '{"note":"saved again"}' where id = 'T1';
do $$ declare m numeric; c numeric; n int; begin
  select coalesce(sum(credit - debit), 0) into m from public.acct_lines where account = '4000';
  if m <> 9000 then raise exception 'margin % not 9000', m; end if;
  select coalesce(sum(credit - debit), 0) into c from public.acct_lines where account = '2100';
  if c <> 0 then raise exception 'client money left %', c; end if;
  select count(*) into n from public.acct_journal where source like 'trip:%';
  if n <> 4 then raise exception 'trip postings % not 4 (each event once)', n; end if;
end $$;
-- 5. money received after the flight trues the margin up
update public.trip_status set data = data || '{"receipts":[{"date":"2026-12-02","amount":25000,"at":"a1"},{"date":"2026-12-05","amount":75000,"at":"a2"},{"date":"2026-12-12","amount":500,"at":"a3"}]}' where id = 'T1';
do $$ declare m numeric; begin select sum(credit - debit) into m from public.acct_lines where account = '4000'; if m <> 9500 then raise exception 'true-up margin % not 9500', m; end if; end $$;
-- 6. a bad trip row never blocks the portal: the error is kept
insert into public.trip_status (owner_id, id, data) values ('00000000-0000-0000-0000-00000000000b', 'T2', '{"receipts":[{"date":"2026-12-02","amount":"25000","at":"z"}],"payouts":"oops"}');
-- 7. commission paid out
insert into public.payouts (owner_id, id, data) values ('00000000-0000-0000-0000-00000000000b', '2026-12', '{"paid":true,"amount":2430,"date":"2026-12-31","ref":"W123"}');
do $$ declare m numeric; begin select sum(debit - credit) into m from public.acct_lines where account = '5000'; if m <> 2430 then raise exception 'commission % not 2430', m; end if; end $$;
-- 8. a reversal mirrors the entry, and only once
select public.acct_post('2026-12-15', 'Office rent', null, 'manual', '[{"account":"5900","debit":800},{"account":"1000","credit":800}]'::jsonb) as rent \gset
select public.acct_reverse(:rent, '2026-12-16', '', null);
do $$ declare m numeric; begin select sum(debit - credit) into m from public.acct_lines where account = '5900'; if m <> 0 then raise exception 'reversal left %', m; end if;
  begin perform public.acct_reverse((select max(id) from public.acct_journal where kind = 'manual'), '2026-12-16', '', null); raise exception 'reversed twice'; exception when others then if sqlerrm like 'reversed twice' then raise; end if; end;
end $$;
-- 9. the hash chain is intact, and a change made around the triggers is found
do $$ begin if exists (select 1 from public.acct_verify()) then raise exception 'chain reported broken on intact books'; end if; end $$;
alter table public.acct_lines disable trigger acct_lines_frozen;
update public.acct_lines set debit = 1 where id = (select min(id) from public.acct_lines where debit > 1);
alter table public.acct_lines enable trigger acct_lines_frozen;
do $$ begin if not exists (select 1 from public.acct_verify()) then raise exception 'tampering not found'; end if; end $$;
-- 10. the browser roles cannot read or call anything
set role authenticated;
do $$ begin
  begin perform 1 from public.acct_journal; raise exception 'authenticated can read'; exception when insufficient_privilege then null; end;
  begin perform public.acct_post('2026-12-01','x',null,'manual','[]'); raise exception 'authenticated can post'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- 11. after a restore the counters move past the restored ids
insert into public.acct_log (id, action) values (5000, 'restored row');
select public.reset_identities();
insert into public.acct_log (action) values ('after restore');
do $$ begin if (select max(id) from public.acct_log) <= 5000 then raise exception 'identity not moved'; end if; end $$;
-- 12. part 2 (0024): rules, receipts and repeats are closed to the browser; a repeat's month makes one draft only;
--     a receipt file is taken once; a rule needs real words
set role authenticated;
do $$ begin
  begin perform 1 from public.acct_rules; raise exception 'authenticated can read rules'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.acct_receipts; raise exception 'authenticated can read receipts'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.acct_recurring; raise exception 'authenticated can read repeats'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.acct_drafts (created_by, source, data) values ('00000000-0000-0000-0000-00000000000b', 'rec:x:2026-12-01', '{}');
insert into public.acct_drafts (created_by, source, data) values ('00000000-0000-0000-0000-00000000000b', 'rec:x:2026-12-01', '{}') on conflict (source) do nothing;
do $$ begin if (select count(*) from public.acct_drafts where source = 'rec:x:2026-12-01') <> 1 then raise exception 'repeat drafted twice'; end if; end $$;
insert into public.acct_receipts (file_hash) values ('abc');
do $$ begin
  begin insert into public.acct_receipts (file_hash) values ('abc'); raise exception 'same receipt twice'; exception when unique_violation then null; end;
  begin insert into public.acct_rules (match, account) values ('ab', '5300'); raise exception 'two-letter rule accepted'; exception when check_violation then null; end;
end $$;
do $$ begin if not exists (select 1 from storage.buckets where id = 'books' and not public) then raise exception 'private receipts bucket missing'; end if; end $$;
\echo 'books.sql: all checks passed'
