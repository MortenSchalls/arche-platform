-- 0028: who reads which stored file (example data only); each line fails the run if the count is wrong
\set ON_ERROR_STOP 1
create or replace function pg_temp.expect(who text, role text, want int) returns void language plpgsql as $$
declare n int; begin
  perform set_config('test.uid', who, false); perform set_config('test.role', role, false);
  set local role authenticated; select count(*) into n from storage.objects; reset role;
  if n <> want then raise exception 'role % (%) sees % files, expected %', role, who, n, want; end if;
  raise notice 'PASS % sees % files', role, n; end $$;
begin; select pg_temp.expect('00000000-0000-0000-0000-00000000000a', 'broker', 3); commit;   -- own upload, the Director's file in A's trip, the older confirmation named in A's status
begin; select pg_temp.expect('00000000-0000-0000-0000-00000000000b', 'broker', 1); commit;   -- only own passport file: not A's AOC, records or investor files
begin; select pg_temp.expect('00000000-0000-0000-0000-00000000000c', 'ops', 5); commit;      -- staff: everything but investor files
begin; select pg_temp.expect('00000000-0000-0000-0000-00000000000d', 'owner', 6); commit;    -- the Director: everything
begin; select pg_temp.expect('00000000-0000-0000-0000-00000000000e', '', 0); commit;         -- not a member: nothing
select public.files_private() as rule_in_place;
