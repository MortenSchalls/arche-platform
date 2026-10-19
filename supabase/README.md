# Database (Supabase)

`migrations/0001_init.sql` creates every table and the access rules (row-level security), matching the 25 rules of the claude.ai portal.

Tested on PostgreSQL 16 with a stand-in for Supabase's `auth` schema (20 Oct 2026):
- a broker sees only their own trips and cannot change prices or their own role;
- a broker cannot see prospects;
- a person who has signed up but is not yet approved sees nothing and cannot write;
- the owner sees everything.

Apply it in the Supabase dashboard: SQL Editor → paste the file → Run, or with the Supabase CLI (`supabase db push`).
