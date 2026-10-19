# Moving off claude.ai: migration plan

The portal and academies today run inside claude.ai, which supplies the database (`db`), sign-in (`user`), file store (`assets`), AI (`sample`), downloads and the Google Drive connector (`mcp`). Each of these needs a replacement. The screens and business logic stay as they are.

## Target

| claude.ai today | After the move |
|---|---|
| `claude.use("db")` documents and collections | Supabase Postgres tables, with row-level security |
| `claude.use("user")`, Share menu roles | Supabase Auth: Microsoft 365 sign-in (Azure AD) for staff; email one-time codes for outside learners |
| `claude.use("assets")` uploads, issued PDFs | Supabase Storage, private buckets |
| `claude.use("sample")` AI calls | A small server function calling the Anthropic API; the API key stays on the server |
| `claude.use("mcp")` Google Drive backup | Scheduled Supabase backups plus a nightly export job to Google Drive or OneDrive |
| Scheduled tasks (prospect rotation, daily intelligence, backup) | Vercel Cron or Supabase scheduled functions using the same `engine.js` |

Plan: replace the six `claude.use(...)` calls with one adapter module (`apps/portal/src/platform.js`) that offers the same functions (`doc().get/set/update/onSnapshot`, `collection().get/where`), so the screen code barely changes. Supabase Realtime replaces `onSnapshot`.

## Access levels today (25 rules) and how they map

Roles today: owner (Morten), ops (Editor), broker or consultant (Contributor). After the move a `profiles` table holds `role` (owner, ops, broker) and `active`; row-level security replaces the rules below. `{self}` = the signed-in user's own id.

| Path | Read | Write | Table after the move |
|---|---|---|---|
| (root) | admin | owner | n/a |
| config/* (terms, company, assign, board, backup, launch) | interact | owner | `config` (key, value json) |
| roster, roster/{self} | admin; self reads own | owner | `profiles` |
| join, join/{self} | admin; self | owner; self writes own | `join_requests` |
| desk, desk/{self}/deals | admin; self | admin; self | `trips` (broker side) |
| status, status/{self}/deals | admin; self reads own | admin | `trip_status` (operations side) |
| payouts, payouts/{self}/months | admin; self reads own | admin | `payouts` |
| prospects | admin | admin | `prospects` |
| leads, leads/{self}/items | admin; self | admin; self | `leads` |
| access, access/{self} | admin; self | admin; self | `access_log` |
| intel/* (status, assign, drive, faq, logaudit, cards, cardProposals) | admin | owner | `intel` (key, value json) |
| faq | interact | owner | `faq` |
| asks, asks/{self}/items | admin; self | admin; self | `questions` |
| locks/engine | admin | admin | `locks` |
| audit | admin | admin | `audit_log` (append-only) |
| train, train/{self}/runs and /rp | admin; self | admin; self | `training_runs`, `roleplay_runs` |

Known gap to fix during the move: `intel` is readable by staff only, so brokers see the default regional cards rather than the owner's approved edits. Give `intel/cards` its own table readable by every active user.

Academies (separate artifacts today): `progress`, `progress/{self}`, `records`, `certs`, `config`. Map them to `academy_progress`, `academy_records`, `certificates` (public "verify a certificate" lookup) and `academy_config`. A passed internal academy should set the broker's portal access request automatically.

## Moving the data

1. In the live portal: Settings → Backup → Download full backup (owner only). This JSON holds every document and the list of uploaded files.
2. An import script (to be written: `scripts/import-backup.js`) loads it into Supabase and copies the files from the Google Drive backup folder into Storage.
3. Run the portal tests against the new database and compare record counts with the backup.
4. Keep the claude.ai portal read-only for two weeks after the switch.

Real data never goes into this repository. Backups stay in `data/backups/`, which git ignores.

## Website

`apps/website/design-source` is the Claude Design project (v7 is current). The `.dc.html` files need Claude Design's `support.js` and `image-slot.js` to render, and the images sit in `.image-slots.state.json`. Steps:
1. Export the final pages from Claude Design as plain HTML, or convert v7 into normal pages (`index.html` plus about, services, contact), extracting the images into `apps/website/public/img`.
2. Keep the eight languages from `i18n.js`.
3. Fix before going live (found in the October review): the stock-photo watermark on a services photo, and the placeholders [Advisor name], +65 0000 0000, the legal entity and "Pending confirmation" certificates.
4. Checked 20 Oct 2026: v7 renders in full from `design-source` (it loads React and Babel from unpkg.com at run time; the converted site must bundle them instead). On a 390 px phone the page is 691 px wide, so it scrolls sideways, and the logo sits off-centre beside MENU. Fix both in the conversion.
5. Website forms (quote, call-back, message) write to `website_enquiries`, which the portal shows as new leads. Consent wording follows PDPA Singapore and Thailand and GDPR.

## Order of work

1. Owner creates GitHub, Vercel and Supabase accounts with an @archeaviation.com address; registers an Azure app for Microsoft sign-in (guided).
2. Database tables and security rules; adapter module; portal running on a temporary Vercel address with example data.
3. Academy on the same sign-in; certificate verification page.
4. Website conversion.
5. Data import, full test run, owner sign-off.
6. GoDaddy DNS records (see `DNS-GODADDY.md`); switch over.

## Running costs to confirm at sign-up
Vercel (free tier likely enough at the start), Supabase (free to start, paid tier about USD 25 a month), Anthropic API (pay per use). Check current prices before committing.
