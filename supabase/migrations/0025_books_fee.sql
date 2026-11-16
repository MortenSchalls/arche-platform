-- 0025: the Archē fee (Morten, 16 Nov 2026: "we do not calculate margin of 9%, but charge 9% fixed").
-- Account 4000 is named "Archē fee (9% of booking value)" and the trip posting says "Archē fee earned". Posted entries are
-- never changed (they stay as posted); only the account name and the text of new postings change. Run after 0024.
update public.acct_accounts set name = 'Archē fee (9% of booking value)' where code = '4000';

-- Trip money: client money sits in 2100 per trip until the last leg is flown; then what is left of it (received less paid
-- to the operator) is the Archē fee. Anything received or paid after the flight trues it up. Same as 0023 except the text.
create or replace function public.acct_trip_post() returns trigger language plpgsql security definer set search_path = public as $$
declare d jsonb := new.data; k text := 'trip:' || new.owner_id || ':' || new.id; ref text := coalesce(nullif(new.data->>'ref', ''), new.id);
        x jsonb; i int; amt numeric; bal numeric; nrev int;
begin
  begin
    if jsonb_typeof(d->'receipts') = 'array' and jsonb_array_length(d->'receipts') > 0 then
      i := 0;
      for x in select * from jsonb_array_elements(d->'receipts') loop
        i := i + 1; amt := acct_num(x->>'amount');
        if amt > 0 then perform acct_post(acct_date(x->>'date'), 'Client money cleared: ' || ref, k || ':r:' || coalesce(x->>'at', i::text) || ':' || amt, 'auto',
          jsonb_build_array(jsonb_build_object('account','1100','debit',amt,'ref',k), jsonb_build_object('account','2100','credit',amt,'ref',k))); end if;
      end loop;
    elsif coalesce(d->>'clientPaid', '') = 'true' and acct_num(d->>'price') > 0 then
      amt := acct_num(d->>'price');
      perform acct_post(acct_date(d->>'clientPaidDate'), 'Client paid: ' || ref, k || ':client', 'auto',
        jsonb_build_array(jsonb_build_object('account','1100','debit',amt,'ref',k), jsonb_build_object('account','2100','credit',amt,'ref',k)));
    end if;
    if jsonb_typeof(d->'payouts') = 'array' and jsonb_array_length(d->'payouts') > 0 then
      i := 0;
      for x in select * from jsonb_array_elements(d->'payouts') loop
        i := i + 1; amt := acct_num(x->>'amount');
        if amt > 0 then perform acct_post(acct_date(x->>'date'), 'Operator paid: ' || ref, k || ':p:' || coalesce(x->>'at', i::text) || ':' || amt, 'auto',
          jsonb_build_array(jsonb_build_object('account','2100','debit',amt,'ref',k), jsonb_build_object('account','1100','credit',amt,'ref',k))); end if;
      end loop;
    elsif coalesce(d->>'operatorPaid', '') = 'true' and acct_num(d->>'opPrice') > 0 then
      amt := acct_num(d->>'opPrice');
      perform acct_post(acct_date(d->>'operatorPaidDate'), 'Operator paid: ' || ref, k || ':operator', 'auto',
        jsonb_build_array(jsonb_build_object('account','2100','debit',amt,'ref',k), jsonb_build_object('account','1100','credit',amt,'ref',k)));
    end if;
    if coalesce(d->>'state', '') = 'flown' then
      bal := acct_ref_balance('2100', k);
      if bal <> 0 then
        select count(*) into nrev from acct_journal where source like k || ':margin:%';
        if bal > 0 then
          perform acct_post(acct_date(coalesce(d->>'flownDate', '')), 'Archē fee earned, trip flown: ' || ref, k || ':margin:' || (nrev + 1), 'auto',
            jsonb_build_array(jsonb_build_object('account','2100','debit',bal,'ref',k), jsonb_build_object('account','4000','credit',bal,'ref',k)));
        else
          perform acct_post(acct_date(coalesce(d->>'flownDate', '')), 'Check: operator paid more than the client on ' || ref, k || ':margin:' || (nrev + 1), 'auto',
            jsonb_build_array(jsonb_build_object('account','4000','debit',-bal,'ref',k), jsonb_build_object('account','2100','credit',-bal,'ref',k)));
        end if;
      end if;
    end if;
  exception when others then
    insert into acct_errors (source, message, data) values (k, left(sqlerrm, 300), jsonb_build_object('table', 'trip_status'));
  end;
  return new;
end $$;
