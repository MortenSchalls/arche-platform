-- Run ONCE, after you have signed in to the new portal for the first time.
-- Replace the email with the one you signed in with.
update public.profiles
   set role = 'owner', active = true, contract_name = 'Morten Schalls Jørgensen'
 where id = (select id from auth.users where email = 'morten@archeaviation.com');
-- check: should show one row with role owner
select p.contract_name, p.role, p.active, u.email from public.profiles p join auth.users u on u.id = p.id where p.role = 'owner';
