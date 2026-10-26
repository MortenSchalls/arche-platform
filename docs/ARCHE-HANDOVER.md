# Archē Executive: handover file

The one file to start a new chat from. It says what Archē is, where everything is, the rules we work by, what is built,
what is decided and what is still open. Claude updates it at the end of every working session.
Last updated: 26 Oct 2026. Company formation requested 26 Oct 2026 via corporate services (about a week); then bank KYB, client payment provider and Avinode in parallel; launch target 1 Dec 2026. Peer rating: project note `claude/arche-setup-vs-peers-2026-10-26.md`.

**To continue in a new chat:** attach this file (or open the "Archē Executive" project, where it is kept) and say
"Continue the Archē work from the handover file". Claude reads it, then `CLAUDE.md` and `docs/ROADMAP.md` in the
repository.

---

## 1. What Archē is

- **Archē Executive** (legal name Arche Executive Pte. Ltd., Singapore, to be formed) is a private jet charter brokerage.
  It acts as the **client's agent** and never sells flights in its own name.
- It is **standalone**, not part of the Navoryx / Novaryx group. The founder stays **anonymous** on the website and in
  the broker offer.
- Brokers are **contracted consultants on 100% commission**, not employees. They work remotely, not from Thailand or
  Singapore. With 100% commission, **no Thai company** is needed.
- **Email (Microsoft 365 Email Essentials from GoDaddy, set up 26 Oct 2026):** msj@ (Morten), contact@ (public enquiries: on the website in all languages, privacy notice, Settings bookings and privacy email), operations@ (operators, handlers, 24/7), finance@ (payments, invoices, commission), sales@ (prospects and partners); brokers get firstname.lastname@archeaviation.com, which the portal suggests at countersignature and requires on the company domain. Proposed: privacy@ as a free alias, role mailboxes with display names 'Archē Executive …'.
- **Registered office:** 20 Collyer Quay, #09-01, Singapore 049319 (on the website in all languages, the privacy notice, the Word agreement, and pre-filled in portal Settings). Add the UEN when it arrives: `apps/website/company.py` (UEN), portal Settings, and the two UEN [●] in the Word agreement.
- **Singapore only until the Bangkok office opens:** the website says Singapore · Worldwide in all four languages, with one Singapore office and a Singapore number; no Bangkok office or Thai number anywhere client-facing.
- Owners: **Morten Schalls Jørgensen** and **Chayanun Chimmod** (second owner in the portal since 25 Oct 2026).

## 2. Business rules (from `CLAUDE.md`; change only on Morten's written instruction)

- **Money**
  - All figures in USD.
  - **Margin 9%** of the price the client pays: client price = (operator price + direct trip costs) ÷ 0.91, rounded up.
    This has been the rule since 25 Oct 2026 (it was 7%). A lower margin needs the director's approval.
  - Deposit 25% (at least USD 2,500) on signature; balance 7 days before departure; full payment if departure is under
    7 days away.
  - Clients pay only through a payment request. **Never print, store or send bank details.**
- **Commission:** Settings terms are unit USD 45,000, threshold 8 bookings a month, rate1 27%, rate2 35% of the profit.
  The offer says "up to 35% of the profit, no cap".
- **Bookings**
  - The owner approves every booking before the confirmation is issued.
  - Four eyes: nobody prices, issues or records payment on their own trip.
  - Every flight is followed to the last landing.
  - Follow-up within 24 h, then a rating request. A score of 3 or less starts service recovery.
- **Prospects and data**
  - Organisations first. Named people only as business contacts published by the organisation itself or taken from a
    licensed database.
  - No LinkedIn or marketplace scraping, no guessed contacts, no bought lists.
  - An opt-out deletes the person everywhere. Contacts not reached within 12 months are deleted.
  - Brokers see contacts only on their own leads.
- **Real data never goes into the repository**; tests use example data only.
- Any outbound or irreversible action needs a person to confirm it.
- **No e-signature service** unless Morten asks; signing happens in the portal.
- **Writing**
  - Plain, short English; use "Archē Executive" in branded text.
  - **The Word manual is the master:** change it first, then rebuild the academies.
- **Notices:** ask Morten first whether a change needs a notice and agree the wording. A notice in the code is only a
  draft until he publishes it in Team.
- **Design**
  - Day and Night themes.
  - Text contrast at least 4.5:1.
  - Prata or Cinzel for headings, Hanken Grotesk for text.
  - Every screen works at 390 px with no sideways scroll.

## 3. Where everything is

| What | Where |
|---|---|
| Code (website, portal, academy, manual, jobs) | GitHub `MortenSchalls/arche-platform`, branch `main` |
| Portal and academy (live) | https://portal.archeaviation.com (Vercel). Old address arche-platform-sandy.vercel.app still works |
| Website | https://archeaviation.com, hidden behind Vercel Authentication until launch day |
| Database and sign-in | Supabase project `zqsogqfbkftujvcgrtok` |
| Domain and DNS | GoDaddy. A @ 76.76.21.21; www CNAME cname.vercel-dns.com; portal CNAME to Vercel |
| Scheduled jobs | GitHub Actions "Portal jobs": rotation every 3 h, nightly encrypted backup 02:17 Bangkok kept 90 days; daily research paused |
| Final documents (Word, PDF, Excel) | Mac: `Downloads/New Business/Navoryx Executive/Pipeline layers/Arche Executive/Final versions` |
| Planning notes | claude.ai project docs `claude/*.md` (see section 9) |
| Roadmap (single to-do list) | `docs/ROADMAP.md` in the repository |

**Secrets** (Supabase secret key, Anthropic key, database password, backup passphrase) are **never** sent to Claude.
Morten enters them himself in Vercel, GitHub or Supabase.

## 4. The portal: what is built

The portal is a single page (`apps/portal/index.html`) with modules in `apps/portal/src-modules/` copied into it.
`platform.js` connects it to Supabase. `build_test.py` makes the example-data test page.

- **Owner's Today**
  - Prompt for your tasks.
  - Notice drafts to decide on.
  - **Requests waiting for your OK** (supervised steps).
  - Bookings to approve.
  - Aftercare.
  - Decisions and late jobs.
  - Rotation.
  - **Trust and performance matrix** for every member: trust measures house rules kept, performance measures results.
    Weekly history is kept for good.
- **Team**
  - **To do for you**: SQL and outside steps. The portal ticks a step itself where it can check it.
  - **Supervision and supervisor rights.**
  - **Notices** (drafts, publish, who has read them).
  - **Alerts:** who receives alerts (SMS, WhatsApp, email; Morten's alerts by phone push and email for now, SMS later), for which events, in escalation order. Free phone push and email (Resend free plan) are built: Supabase calls `/api/alerts` every 2 minutes; each open item alerts again every 15 min (setting) by push and hourly by email until someone acts, adding the next person after 30 min (setting). Working since 26 Oct 2026: phone push on 2 devices and email from alerts@archeaviation.com (Resend domain verified; receiving left off) to msj@archeaviation.com. Morten's own address: msj@archeaviation.com, only for what concerns him (alerts, owner messages), not the public enquiry address.
  - Assessments, people, booking rights.
- **Joining**, all in the portal:
  1. offer
  2. academy
  3. assessment request
  4. assessment by the owner or an assessor
  5. agreement signed in the portal
  6. owner countersigns
  7. onboarding package: Archē email, signature generator, Standards of Conduct, signed agreement, meeting backgrounds
  8. desk opens

  New people start **supervised**.
- **Supervised steps:** these wait for the owner's OK, and the owner releases each step per person.
  - Brokers: quote to client, taking a pool enquiry, first contact with a new prospect.
  - Operations: recording payments, supplier quotes.
- **Supervisor rights**, ticked by the owner:
  - supervise steps
  - assess new people (countersigning stays with the owner)
  - approve bookings (operations only)

  Rights never apply to the person's own work.
- **Supervision share (Schedule 1, agreement version 2026-10-26.2):** while supervised with a named supervisor, 3 points of gross profit on each booking approved in that time go to the supervisor (24% instead of 27%, 32% instead of 35%); to Archē when an owner supervises; owner can forfeit a supervisor's share on a booking for a rule breach; no automatic end (stops when supervision is switched off). Recorded on the trip at approval; shown in both people's commission. Supervisor named per person in Team → Supervision. Offer says: 'Learn with a supervisor, then earn as one.'
- **Onboarding page (owner):** joining and leaving moved out of Team. Requests to join carry a qualification checklist (11 minimum items, 7 desired, 5 red flags); the agreement waits until every minimum is ticked and no red flag is.
- **Broker intake and leaving (26 Oct 2026):** agreements held back until company, bank, client payments and Avinode are ticked in Team → Ready to sign brokers (insurance optional; clause 8.9 now says insurance is being arranged, agreement version 2026-10-26); supervision limit (default 6, others wait); counsel check for a candidate's new country; candidates name 10–20 organisations at assessment, which become their own leads at countersignature; one-tick End engagement (now or 30 days' notice) frees enquiries, prospects and leads, removes rights and alerts, and asks the leaver to confirm deleting Archē data within 7 days; I'm unavailable switch routes alerts to a backup; supervised brokers ask one OK for a batch of first contacts; 24-hour operator and handler contacts required before a confirmation. Offer: earnings shown as an example, plus 'examples, not a promise' note.
- **Notices:** shown on members' dashboards until they confirm. The confirmation is logged and counts in trust.
  Published only by the owner.
- **Enquiry pool:** every enquiry reaches the owner first. The owner releases it to all brokers (first come, first served)
  or assigns it. The booking-cycle target is 5 days, adjustable in Settings.
- Also built:
  - trips and operations queue
  - booking approval
  - charter confirmation
  - aftercare and ratings
  - commission
  - prospects with 3-hourly rotation and leads
  - supplier quotes (RFQ)
  - investors list (owner only)
  - audit log
  - backups and restore check
- **Password sign-in** for everyone (except Microsoft sign-in).
- **AI features** (Assistant, trip co-pilot, roleplay lab, briefing) need an Anthropic key and credit in Vercel.
  They are **switched off** for now (Morten, 25 Oct 2026: later). The portal says so clearly.
- **Tests**, in `apps/portal/tests/`:
  - jointest (onboarding)
  - pooltest
  - sbtest (database rules)
  - pwtest
  - mxtest (tasks and matrix)
  - suptest (supervised steps)
  - nttest (notices)
  - rightstest (supervisor rights)
  - colorscan
  - audit

  Job tests: `jobs/test.mjs`.

## 5. Database updates (SQL in `supabase/migrations/`)

| SQL | What | Status |
|---|---|---|
| 0001–0005 | Base, roles and files, website enquiries, investors, opt-outs | Run |
| 0006 | Supplier quotes | **Check**: on the Team task list (ticks itself if already run) |
| 0007 | Academy progress | **Check**: on the Team task list |
| 0008, 0009 | Enquiry pool, agreements | Run 25 Oct 2026 |
| 0010 | Trust and performance history | **To run** (Team task list) |
| 0011 | Supervised steps | **To run** |
| 0012 | Supervisor rights | **To run** (mark done by hand after running) |
| 0013 | Alerts: recipients and official sender (owner only) | **To run**, then add yourself in Team → Alerts |
| 0014 | Phones that receive alerts, and the 2-minute alert check (pg_cron) | Run 26 Oct 2026 (alerts working) |
| 0015 | Assessments: qualification checklist (owner and assessors only) | Run 26 Oct 2026 |
| 0016 | Supervision share: supervisors see the trips that pay them | Run 26 Oct 2026 |

How to run: Team → To do for you → **Copy SQL** → Supabase → SQL Editor → paste → Run.

## 6. Documents (latest versions in "Final versions" on the Mac)

- **Broker commission offer:** written to attract. It includes "About Archē" and no leadership sentence. Figures at 9%:
  8 bookings = USD 8,748 a month (USD 104,976 a year); the table runs up to 16 bookings = USD 20,088 a month.
  The offer is also shown and signed in the portal.
- **Singapore independent broker consultancy agreement:**
  - version 2026-10-24
  - booking defined start to finish
  - commission only on completed transactions
  - Standards of Conduct
  - Archē email only
  - company WhatsApp, LINE and WeChat accounts
  - enquiry pool and 5-day cycle

  Signed in the portal.
- **Training manual:** Word v3_8 is the master. The broker academy and external academy are rebuilt from it.
- **Budget V2 (Excel):**
  - revenue-scaled admin
  - broker plan: 3 brokers in month 1, 10 by month 6, then +3 a month to 100
  - 9% margin
  - 10-year net about USD 114.5 M (year 1 about USD 1.33 M)
  - caution: from year 3 the volume exceeds LunaJets
- Email signature, meeting backgrounds, go-live SQL, owner SQL and prospect imports.
  Prospect files hold real data: **do not share**.

## 7. People

- **Natalia:** former business development manager, joining commission-only. She goes through every joining step in the
  portal and starts supervised.
- **Chayanun Chimmod:** second owner in the portal.
- **Kasper, Sam:** Origin (Navoryx) people, not Archē.

## 8. Open items

The dated launch steps (UEN, bank, payments, Avinode, Singapore number, email, insurance quote, test payment, group 1, launch, then ACA and operator ratings) are in Team → To do for you, sorted by due date.
 (also on the portal task list and in `docs/ROADMAP.md`)

1. Run SQL 0006/0007 (check), 0010, 0011, 0012 from Team.
2. Company details in Settings (UEN, address, emails, privacy email, signatory). Needed before agreements can be sent.
3. Email: create @archeaviation.com mailboxes, the SPF/DKIM/DMARC records, then custom SMTP for sign-in emails.
4. Remove the old portal address from Supabase redirect URLs.
5. Decide on the three notice drafts in Team: supervised steps, how notices work, supervisor rights.
6. Later:
   - switch on the AI (key and credit)
   - company WhatsApp, LINE and WeChat after company formation
   - turn daily research back on at go-live
   - launch day: make the website public
   - decide on `/test.html`
   - external broker academy: paid access by credit card before it opens (needs price and card provider)
   - SMS service for alerts (account and sender name; key entered by Morten in Supabase)
   - official WhatsApp number for alerts (Meta verification, message template)
   - WhatsApp team setup (proposed 26 Oct 2026): Community "Archē Executive Team" with Announcements, Desk, Operations 24/7, Supervisors, New joiners and per-trip groups for complex charters; owners only as admins; no client personal data in groups; the portal is the record
7. Counsel and other before-launch items: see `docs/ROADMAP.md` section 1. Examples: payment provider to replace Paynode,
   insurance, PDPA checks, native-speaker check of translations.
8. Check Team → To do for you: any SQL step still open there (the portal checks each one itself) is the true status.
9. Prospects:
   - 53 organisations imported 25 Oct 2026, researched in chat (option 2, no API cost).
   - Gaps with no business-jet caterer or verified crew hotel: Hong Kong caterer; crew hotels at WSSS/WSSL, VTBD, RPLL
     and VRMM.
   - Weekly research by scheduled task: offered, not yet set up.

## 9. Planning notes in the project (claude/…)

Archē notes in the claude.ai project. Others there are Navoryx or Origin work.
- commission-structure-check-2026-10-24
- broker-onboarding-and-enquiry-pool-2026-10-24
- payment-flow-replacing-paynode-2026-10-23
- telesales-agency-vs-brokers-sim-2026-10-21
- aerobridge-arche-supplier-quotes-2026-10-21
- arche-roadmap
- terms-vs-peers-2026-10-20
- website-review-vs-globaljet-2026-10-20
- arche-platform-package-2026-10-20
- training-feedback-build-2026-10-19
- margin-vs-peers-2026-10-19
- arche-broker-portal-beta-2026-10-17
- commission-only-year1-sim-2026-10-17
- arche-training-manual-review-2026-10-17
- arche-charter-confirmation-review-2026-10-17
- brand-application-spec-2026-10-08

## 10. Working agreements with Claude

- Morten does all sign-ins and settings in Supabase, Vercel and GoDaddy. Claude gives exact click paths.
- **The portal is the true source:** every step for Morten appears in Team → To do for you, with a prompt on Today.
- Claude runs the tests for the part it changed and says what it ran. The commit lines name Claude and the session.
- Final files are saved to the Mac "Final versions" folder. Real data is never stored in the repository.
- Notices: Claude asks first; Morten publishes.
