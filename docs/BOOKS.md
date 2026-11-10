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

## As little typing as possible (part 2, SQL 0024)
Morten, 10 Nov 2026: "keep your suggestion, idea is that even the worst in class accountant or my 11 year old daughter can
do this without mistakes, and even if there should be mistakes, it will be caught and in worst case rolled back".
- **To do** is the first screen: everything that needs a person, one choice each. Everything else is already done.
- **Bank lines.** Wise USD and SGD come in by themselves when Books opens (at most every 6 hours, or "Get Wise lines now"),
  with a read-only Wise API token in Vercel (`WISE_TOKEN`); Wise does not ask for extra confirmation for Singapore
  profiles. Citi is a CSV file. Singapore dollar lines are turned into US dollars at the ECB reference rate of the day
  (the rate and its date are kept on the line; no rate, no guess). Each new line, in this order: pays an open bill of the
  same amount and currency; is linked to an entry already in the books for that amount within 7 days (trip payments,
  transfers between our own accounts), so nothing is posted twice; is posted by an owner's rule; or waits in To do with a
  suggestion (the account used last time for that payee, bank fees, interest).
- **Rules** are made only by an owner's own choice ("Do the same next time"), with a limit of three times the amount (at
  least USD 500); a line above the limit, or with any warning, waits for a person. Bank, Your rules: stop a rule, or undo
  it with everything it posted (each entry reversed, its lines back in To do).
- **Receipts and bills.** A photo or PDF (made smaller in the browser, under 3 MB, the same file never twice, kept in the
  private `books` storage bucket). The AI reads supplier, date, total, currency and GST (the file goes to the AI provider
  for this one reading; instructions written on a receipt are ignored) and suggests the account, preferring the one used
  last time for that supplier. A person checks the fields and presses Post: cost against what we owe the supplier
  (2000), or the director (2500) if paid personally. The bank payment later clears it by itself; a rate difference goes
  to exchange gain or loss. Without an AI key the fields are typed.
- **Repeating entries** (rent, the accountant's fee, depreciation) come up as drafts on their day, each month once; a
  person presses Post.
- **The checks** run before every posting, by a person, a rule or a draft. Blocks: a closed period, a date more than a
  month ahead, GST accounts before registration, client money by anyone but an owner, a dividend above the profits
  available (Companies Act s.403). Warnings ("post anyway" needed; an automatic posting waits instead): a possible double
  (same account and amount within 7 days), an amount far above anything before on that account, a bank going below
  zero, money the wrong way round, a date in the future or over a year back, client money by hand.
- **Undo** (Transactions) posts the reversing entry; the bank line or bill it belonged to goes back to To do as a
  suggestion and is not redone by itself.
- **Close a period** (Settings, owners): nothing can be posted or undone with a date up to that day.
- **Checks every time Books opens:** the books balance, the chain holds, each dollar bank account agrees with its last
  statement balance (a gap means an opening balance or a line is missing), nothing waits more than two weeks.

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
Wise comes in by itself (above); Citi Singapore statements (CSV) are imported. Nothing is imported twice. No account
numbers are stored. Invoicing (InvoiceNow if GST registered), month-end and year-end packs and SGD reporting are the next phase.

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
4. Optional: `ANTHROPIC_API_KEY` for the AI review and receipt reading.
5. Run `supabase/migrations/0024_books_auto.sql` after 0023.
6. Optional, for the Wise feed: in Wise Business, Settings, API tokens, create a **read-only** token and put it in
   Vercel as `WISE_TOKEN`.
7. In Books: add a passkey or the authenticator app, load the budget, set the UEN and year end.

## Tests
`node apps/portal/tests/books.test.mjs` (ledger, tax, advice, CSV, bank, budget, AI facts, passkeys, server gates),
`node apps/portal/tests/books.auto.test.mjs` (matching, checks, currencies, receipts, repeats, undo, Wise),
`sh scripts/test_books_sql.sh` (the database, 0023 and 0024 on a throwaway Postgres: posting, refusals, immutability, trip margin,
reversal, hash chain, access, restore), `node apps/portal/tests/bookstest.js` (screens, To do, "post anyway", lock, 390 px,
brokers excluded). All four run in the Portal checks.

No system is hacker-proof; Books is built in layers so that one failure does not open the books.
