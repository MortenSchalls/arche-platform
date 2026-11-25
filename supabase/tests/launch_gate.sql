-- Launch gate tests (scripts/test_gate_sql.sh, throwaway local Postgres, example data only).
\set ON_ERROR_STOP 1
insert into auth.users values ('00000000-0000-0000-0000-00000000000b');
-- not ready: an enquiry and a quote save, sending for authorisation, approving and issuing are refused
insert into public.trips values ('00000000-0000-0000-0000-00000000000b','t1','{"stage":"quoted"}');
insert into public.trip_status values ('00000000-0000-0000-0000-00000000000b','t1','{"note":"x"}');
do $$ begin
  begin update public.trips set data = '{"stage":"submitted"}' where id = 't1'; raise exception 'submit allowed'; exception when others then if sqlerrm like 'submit allowed' then raise; end if; end;
  begin update public.trip_status set data = '{"approval":{"state":"approved","at":"2026-11-25"}}' where id = 't1'; raise exception 'approve allowed'; exception when others then if sqlerrm like 'approve allowed' then raise; end if; end;
  begin update public.trip_status set data = '{"state":"issued","issuedAt":"2026-11-25"}' where id = 't1'; raise exception 'issue allowed'; exception when others then if sqlerrm like 'issue allowed' then raise; end if; end;
  begin insert into public.trips values ('00000000-0000-0000-0000-00000000000b','t2','{"stage":"submitted"}'); raise exception 'insert submit allowed'; exception when others then if sqlerrm like 'insert submit allowed' then raise; end if; end;
end $$;
-- three of four ticked is still not ready
insert into public.config values ('intake', '{"ready":{"company":true,"bank":true,"payments":true}}');
select public.intake_ready() as r3 \gset
\if :r3
  \echo 'FAIL ready with three ticks'
  select 1/0;
\endif
-- ready: every step goes through; a later change to an approved or issued trip is never stopped
update public.config set value = '{"ready":{"company":true,"bank":true,"payments":true,"avinode":true}}' where key = 'intake';
update public.trips set data = '{"stage":"submitted"}' where id = 't1';
update public.trip_status set data = '{"approval":{"state":"approved","at":"2026-11-25"}}' where id = 't1';
update public.trip_status set data = '{"approval":{"state":"approved","at":"2026-11-25"},"state":"issued","issuedAt":"2026-11-25"}' where id = 't1';
update public.config set value = '{"ready":{}}' where key = 'intake';
update public.trip_status set data = '{"approval":{"state":"approved","at":"2026-11-25"},"state":"issued","issuedAt":"2026-11-25","clientPaid":true}' where id = 't1';
update public.trips set data = '{"stage":"submitted","note":"edited"}' where id = 't1';
\echo 'launch gate: all checks passed'
