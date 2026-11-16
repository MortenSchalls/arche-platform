-- 0026: chart of accounts to accounting best practice (Morten, 16 Nov 2026: "update to best practices on accounting").
-- Archē acts as the client's agent, so under SFRS(I) 15 its revenue is the net Archē fee, recognised when the trip is
-- flown; client money held for trips stays a liability (2100) and the operator's share never passes through revenue.
-- Cost of sales is what it costs to earn that fee (broker commission, the supervisor reward, introducer fees), so
-- "Gross profit" on the profit and loss is revenue less cost of sales, the standard SFRS(I) 1-1 line.
-- Names only: posted entries are never changed. Safe to run twice. Run after 0025.
update public.acct_accounts set name = 'Archē fee (agency revenue, 9% of booking value)' where code = '4000';
update public.acct_accounts set name = 'Insurance' where code = '5600';
insert into public.acct_accounts (code, name, kind, grp, system) values
  ('5020', 'Supervisor reward', 'expense', 'Cost of sales', true)
on conflict (code) do update set name = excluded.name, kind = excluded.kind, grp = excluded.grp;
