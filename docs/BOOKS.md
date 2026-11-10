# Books: the owners' own accounts

Morten, 10 Nov 2026: "for me and my wife only, I want to have our own accounting section in the portal ... any
transaction should automatically be updating our books live ... password protected a a secoond security layer ...
options to share with bookeeping and accounting as non-owners ... daily backup in my drive ... sugest optimizations ...
any AI layer possible is accepted, as long as NO decisions can be made".

Company: **Arche Aviation Pte. Ltd.** (registered name, domain and mail), trading as **Archē Executive**. UEN to be added
in Books, Settings once issued. Currency USD; Singapore rules.

## Who sees it
- **The two owners** (shareholders): only the emails in the Vercel setting `BOOKS_OWNERS` (comma separated). They are
  never read from the database, so nobody can make themselves an owner from inside the portal. The Director role
  gives no access.
- **Accountant** (read, reports and downloads, drafts) and **bookkeeper** (read, drafts, bank lines): added by an
  owner in Books, Settings and access; they need a portal sign-in. Drafts are posted only by an owner.
- Brokers and everyone else: Books is not in their menu and the server refuses them.

## Second layer
After the normal sign-in, Books unlocks only with a **passkey** (Face ID, Touch ID, Windows Hello; checked on the
server, origin and challenge bound) or the **6-digit authenticator code** (Supabase MFA, verified within 5 minutes).
The first passkey can be added only within 10 minutes of a fresh password sign-in. The unlock gives a session kept in
the page's memory only: 15 minutes idle, 8 hours at most, ended at once by Lock. 8 wrong tries in an hour lock Books
for an hour. Every unlock, entry, export and change goes to the Books log.

## The ledger
- Double entry, chart of accounts 1000–7000 (`supabase/migrations/0023_books.sql`).
- The money steps post by themselves, in the database, the moment they are recorded: client payment received
  (Dr client payment account / Cr client money held), operator paid (Dr client money / Cr client payment account),
  trip flown (what is left of the client money becomes margin, trued up if a later payment arrives), broker commission
  paid (Dr commission / Cr bank). A posting that fails is listed under Advice and never holds up the portal.
- Posted entries can never be changed or deleted (database triggers); a mistake is corrected by a reversal.
- Every entry carries a fingerprint (SHA-256) of itself and the entry before; Settings, Check the ledger proves
  nothing was changed outside the portal.
- No browser ever talks to the database: only the server, with keys held in Vercel.

## Reports, budget and tax
Profit and loss, balance sheet, trial balance, cash flow, budget against actual, general ledger and a tax estimate,
each downloadable as CSV (formula-safe). The budget is the locked V2 budget of 8 Nov 2026
(`Arche_Aviation_Books_Budget_V2_2026-11-08.json` in Final versions), loaded once with the month that is month 1.
Tax estimate: 17%, start-up exemption (first three YAs), partial exemption, YA 2026 rebate, ECI within 3 months,
annual return within 7 months, dividends only out of profits, GST threshold S$1M, with the IRAS sources. Every tax
figure is an estimate for the accountant to confirm; nothing is filed from Books.

## Suggestions and AI
Advice gives rule-based suggestions (cash cover, client money, tax set-aside, ECI date, dividends from profits, GST
watch) with sources. The AI review (optional, needs `ANTHROPIC_API_KEY`) is sent **totals only**: no names, notes,
references or bank lines. Its answer is shown as plain text (markup and links removed), is capped by a spend limit
(default USD 5 a month), and can never post, pay, approve or change anything. The owners decide.

## Banks
Wise Business and Citi Singapore statements (CSV) are imported, never duplicated, and matched to entries. No account
numbers are stored. A live Wise feed and invoicing (InvoiceNow if GST registered) are a later phase.

## Backup
The nightly backup job (`jobs/backup.mjs`) copies the books tables first, and also writes an encrypted copy of the
books alone (AES-256 with `BACKUP_PASSPHRASE`) as the artifact `books-backup-<run>` (30 days). The scheduled task
"Daily Books backup to Google Drive (Arche Aviation)" (03:41 Bangkok) puts that encrypted file in the Drive folder
"Arche Aviation Books backups". Restore: `jobs/backup.mjs` restore, then `select reset_identities();`.

## Setup (Morten, once)
1. Supabase, SQL editor: run `supabase/migrations/0023_books.sql`. (The backup job lists the books tables, so do this
   before releasing.)
2. Vercel, portal project, Environment variables: `BOOKS_OWNERS` = the two owners' sign-in emails; optional
   `BOOKS_ORIGIN` = the portal address passkeys are bound to.
3. Supabase, Authentication: multi-factor (TOTP) on.
4. Optional: `ANTHROPIC_API_KEY` for the AI review.
5. In Books: add a passkey or the authenticator app, load the budget, set the UEN and year end.

## Tests
`node apps/portal/tests/books.test.mjs` (ledger, tax, advice, CSV, bank, budget, AI facts, passkeys, server gates),
`sh scripts/test_books_sql.sh` (the database on a throwaway Postgres: posting, refusals, immutability, trip margin,
reversal, hash chain, access, restore), `node apps/portal/tests/bookstest.js` (screens, lock, 390 px, brokers
excluded). All three run in the Portal checks.

No system is hacker-proof; Books is built in layers so that one failure does not open the books.
