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
- **Email (Microsoft 365 Email Essentials from GoDaddy, set up 26 Oct 2026):** msj@ (Morten), contact@ (public enquiries: on the website in all languages and the Settings bookings email); privacy@ (alias on contact@: privacy notice and Settings privacy email), operations@ (operators, handlers, 24/7), finance@ (payments, invoices, commission), sales@ (prospects and partners); brokers get firstname.lastname@archeaviation.com, which the portal suggests at countersignature and requires on the company domain. Role mailboxes show display names "Archē Executive …"; only msj@ is admin. Plans: Email Essentials for all; Online Business Essentials (Teams) for msj@ and anyone who hosts client meetings.
- **Registered office:** 20 Collyer Quay, #09-01, Singapore 049319 (on the website in all languages, the privacy notice, the Word agreement, and pre-filled in portal Settings). Add the UEN when it arrives: `apps/website/company.py` (UEN), portal Settings, and the two UEN [●] in the Word agreement.
- **Website fixes kept on every build** (`apps/website/site_fixes.py`, run by build.py after company.py; 26 Oct 2026): the office block shows the city once with the heading "Registered office"; jurisdictional notice is factual Singapore wording (agent, not an air operator; flights under the named operator's AOC) in four languages, to be confirmed by counsel; the trip line says "paid through a secure payment link"; LINE and WeChat cards are hidden until `LINE_ID` / `WECHAT_ID` are set in company.py; the phone comes from `PHONE` in company.py (empty = placeholder); privacy header date set in `PRIVACY_DATE`.
- **Pre-launch website check:** `python3 apps/website/check_site.py` must say "no placeholders left" before the site is made public (now open: phone number and UEN). Referenced in the launch task in Team.
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

- **Website page (owner, 26 Oct 2026)**: own cookieless statistics from archeaviation.com (visits, sources, campaigns, countries and cities, sections reached, what was used, enquiries sent, suggestions, organisation links opened). Brokers get a website link per lead (archeaviation.com/?r=CODE) and Today shows organisations that opened theirs in the last 48 hours. Module `src-modules/traffic.js`; website side `site/track.js` and `site/api/collect.mjs`; details in `docs/SEO.md`.
- **Paynode removed everywhere (26 Oct 2026)** until Morten agrees otherwise: rule, B5, terms, portal, course, academies, manual, charter confirmation say "a secure payment request from our payment provider". Data field `paynodeRef` kept internally.
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
| 0017 | Website statistics (site_events, site_links, submit_visit, site_stats, 13-month clean-up) | Run 26 Oct 2026 |
| 0018 | Sanctions screening log (screen_log, written only by api/screen.mjs, never editable) and private storage bucket "sanctions" | Run 27 Oct 2026 |
| 0019 | Website enquiries accept type "alert" (empty-leg alert sign-ups); staff may delete an enquiry row (unsubscribe) | Run 27 Oct 2026 |

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
6b. Website (26 Oct 2026): run SQL 0017; Google Search Console verified 26 Oct by DNS TXT record (keep it; never accept GoDaddy's automatic connect with "Gmail Setup", it can remove Microsoft 365 email); submit sitemap.xml on launch day (in the launch task); then Bing Webmaster Tools after launch. Portal content policy is in report-only mode: check the live portal console and switch `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `apps/portal/vercel.json`. Ask Morten whether the website link per lead needs a notice to members (none added). Privacy notice has a new "Website statistics" section (show Morten). Client payment task changed (Morten agreed 26 Oct): "Choose the client payment provider and apply": Wise when the UEN arrives, Airwallex in parallel as backup, decide on Wise's written answer, counsel on payment licence. Avinode offer received 26 Oct (Starter Broker USD 740/month, extra user USD 118, white-label web app USD 500, 6 months prepaid; KYB about 2 weeks): task "Join Avinode" updated; details in project note claude/avinode-membership-offer-2026-10-26.md. Suggested: no white-label web app at start.
6c. Website content pages (27 Oct 2026): plan in project note claude/website-search-content-plan-2026-10-27.md (16 broker sites compared; global reach with Asian depth; places and needs, never routes). Built by `apps/website/content/build_content.py` from `facts.json` + `sources.json` (every fact sourced and dated; no digit outside a sourced fact; no Russia/Iran/Iraq/Syria/Venezuela; no prices or fleet claims; facts older than 365 days stop the build). Two pilot pages as drafts (noindex, not in sitemap): /airports/singapore-seletar/ and /guides/cabotage/. Waiting for Morten's approval of look and wording before the first batch (4 region hubs, 12 cities, 6 airports, 3 guides). Saved copy of the site before this work: branch saved/website-2026-10-27 (tag push was refused by the proxy) and zip in Final versions.
6d. Sanctions rule (27 Oct 2026): excluded places in apps/website/content/excluded.json (Morten's five plus manual G.2/G.7; Kazakhstan left out as it is a payment-provider limit, not sanctions). Quote form no longer offers Moscow or Yangon airports. Terms clause B6 rewritten (regimes named, screening of all parties and the operator, ownership and control, frozen funds, B13 for new sanctions): needs counsel review with the rest of Part B. Manual 3.2 gained the ownership-and-control step (OFAC FAQs 401/402; EU Council Best Practices 3 Jul 2024); manual, PDF and both academies rebuilt. Pilot pages approved by Morten 27 Oct (look, tone, detail); next is the first batch of about 25 pages as drafts.
6e. Sanctions coverage checked 27 Oct 2026 against the official programme lists (UN 15, OFAC 36, UK 25 country regimes, MAS 8; EU map not readable here). excluded.json now also holds the remaining UN country regimes and broad US/UK country programmes: Afghanistan, Somalia, Yemen, DR Congo, Central African Republic, Haiti, Mali, Guinea-Bissau. Targeted-only places (Hong Kong, China, Lebanon, Nicaragua, Zimbabwe, Guinea, Bosnia) stay on the website; their people and companies are screened in KYC. Kept current by: weekly job jobs/regimes.mjs (Mondays) → intel/sanctions-regimes → owner sees "Sanctions watch" in Team and a prompt on Today, reviews, asks Claude to update, presses Mark reviewed; the website build stops if excluded.json is not reviewed for 120 days. People and companies: lib/sanctions.mjs screens operators against OFAC, UN, EU and UK lists; brokers screen every booking (manual 3.2).
6f. Sanctions in the process (27 Oct 2026): the automatic operator screen had only run inside the paused daily research job. Now separate: jobs/screen.mjs (daily 06:41 Bangkok, no AI) screens every operator and service partner and their owners against OFAC, UN, EU and UK, sets matches to review, and stores a name index in private storage (bucket "sanctions"). Bookings: Operations box "Sanctions screening" on each trip (src-modules/screening.js): names one per line, "Screen names now" (api/screen.mjs, owner and operations only) → save record on trip status; issuing needs a clear record covering the charterer and company now on the trip, or the owner's recorded decision after a possible match. Approval chips show it. Team → Sanctions watch shows the daily screen and the weekly programme watch. First run needed: GitHub → Actions → Portal jobs → screen (and regimes). Manual 3.2 updated; academies rebuilt (external edition gets a generic line).
6g. Airport rules (27 Oct 2026): per-airport files in apps/website/content/airports/<ICAO>.json (sourced rules: runway, curfew windows, customs hours, slots, PPR, size limits…), validator check_airports.py (run by build_content.py), queue _queue.json (140 tier-1 business-aviation airports; tier 2 built when tier 1 is done), procedure airports/README.md. Scheduled task "Daily airport rules research" (cloud, 04:34 Bangkok daily, 50 airports a run, push notification report, auto approval). Seletar done. Next to build: (1) red sanctions blocking as you type (countries, airports, names, companies), (2) world airport base data + cabotage traffic light, (3) trip traffic light using the airport files (curfew, size, customs), then permits/slots/de-icing/catering/pets as amber.
6h. Trip checks (27 Oct 2026, src-modules/tripchecks.js): red/amber/grey/green per trip, shown as "Trip checks" on every trip and live in the trip form. Red: sanctioned place in client country or payer, airport in a sanctioned country, name possible match (api/screen.mjs, now open to brokers too), departure inside a verified curfew, cabotage US (49 USC 41703(c)) or intra-EU with a non-EU operator (Reg 1008/2008 Art 15). Amber (must be confirmed with the operator, recorded): other domestic legs with a foreign operator, EEA/Swiss operator on intra-EU legs, arrival curfew, size limit, customs hours. Grey: airport rules not researched yet. Red blocks send to operations, approval and issue (capture-phase click guard); amber blocks send to operations until confirmed. Name matches released only by the owner (trip status, so brokers cannot write it). New quote field: operator's country (AOC). Data: apps/portal/airport-rules.json, regenerated by build_content.py (the daily research commits it). Base airport list: apps/portal/airports.json (7,009 airports, country, position, runway).
7. Counsel and other before-launch items: see `docs/ROADMAP.md` section 1. Examples: choosing the payment provider (Paynode removed everywhere 26 Oct 2026),
   insurance, PDPA checks, native-speaker check of translations.
8. Check Team → To do for you: any SQL step still open there (the portal checks each one itself) is the true status.
9. Prospects:
   - 53 organisations imported 25 Oct 2026, researched in chat (option 2, no API cost).
   - Gaps with no business-jet caterer or verified crew hotel: Hong Kong caterer; crew hotels at WSSS/WSSL, VTBD, RPLL
     and VRMM.
   - Weekly research by scheduled task: offered, not yet set up.

6i. Booking steps (27 Oct 2026, src-modules/nextsteps.js), after Morten's dummy booking ("it does not suggest what needs to be filled"): every trip shows "Steps to book this trip": 1 Client and trip, 2 Operator quote, 3 Checks and documents, 4 Confirmation details (recommended), 5 Send to operations, 6 Operations check, 7 Signature and payment, 8 Flight and follow-up. Each item is ticked or open, says who does it ("your turn"), and has a button that opens the exact field. The trip form marks needed fields (*) and lists what is still missing as you type; the save message names the next step; under Send to operations the exact missing items are listed. Send to operations now needs: client name, email or phone, country of residence, every leg with from, to, date, local time and passengers, operator name, operator's country, aircraft type, operator price, all 7 checks, no red and no open amber trip checks. AOC, insurance and quote documents and the confirmation details are shown as recommended. No AI involved.
6j. Sanctions log (27 Oct 2026): SQL 0018 adds screen_log. api/screen.mjs writes a row for each trip-form save (purpose "trip") and each "Screen names now" in Operations (purpose "operations", owner/ops only); the log id is kept on the trip's screening record. Brokers read only their own rows. Matching ignores names made only of trade words (aviation, business, centre, airport, handling…): the first run had flagged four real handling agents on "Business Aviation Centre". First screen job run 27 Oct 2026 03:20 UTC: 168 operators and partners, lists OFAC SDN, OFAC alias, UN, EU, UK, 69,257 names; the regimes job was started the same morning. Owner tasks on Today: sql-0018, screen-job, regimes-job (each ticks itself).

6k. Website content batch (27 Oct 2026): 25 draft pages (noindex, out of the sitemap until Morten approves): airports Hong Kong, Changi, Dubai World Central, Teterboro, Farnborough, Sydney; cities London, Geneva, Nice/Cannes, Paris, Dubai, New York, Hong Kong, Singapore, Tokyo, Bangkok, Phuket, Sydney; regions Europe, Asia-Pacific, Middle East, North America; guides operator safety audits, empty legs, charter price. Facts researched from official sources (AIPs, airport operators, authorities, laws), each with its verbatim quote in facts.json; 20 new airport rule files (2 verified, 18 partial) also feed the portal's trip checks. Voluntary or approval-type night rules (Teterboro, White Plains, Geneva, Sydney) show amber, not red. Independent text review done and fixed. Seletar page corrected: Changi is not available to non-scheduled aircraft of 40 seats or fewer, so it is not the night alternative for business jets. Open: UK, Swiss, French and Japanese AIPs could not be read (operator and authority pages used); Dubai conditions of use are older seasonal editions; ARGUS no longer lists "Gold Plus" (used in BROKER_CHECKS and the manual): Morten to decide the audit rule wording.

6l. Test website switch (27 Oct 2026, Morten: "ensure nothing is live before we switch the website on, but I need to see all in full function"): company.LAUNCHED = False in apps/website/company.py. While False: every page and draft is built and linked (menu and footer "Destinations" → /destinations/, drafts marked), a yellow "Test website · not public" bar shows on content pages, every page sends X-Robots-Tag noindex, nofollow and robots.txt disallows everything, on top of Vercel Authentication. On launch day set True and rebuild: search engines allowed, sitemap includes approved pages and /destinations/, drafts are not published at all, and the Destinations link disappears if nothing is approved yet. Slot coordinators now named in brackets (ACL, COHOR).

Today for brokers and operations, 28 Oct 2026 (Morten: "a Today page for each function"): brokers and operations now open on Today (first menu item; Dashboard stays for progress and figures). Broker: tasks, flights today/tomorrow on their trips, waiting on operations or the director, open enquiries in the pool, aftercare, notices. Operations: tasks, flights today/tomorrow on all trips, client payments outstanding with the balance date (deposit/balance rule), files to check, aftercare, notices. All collapsible. src-modules/roletoday.js (appended at the end of the main script so it wraps every earlier vToday); test tests/roletodaytest.js. Manual Appendix H (portal guide) not yet updated for this page.

Flight tracking, 28 Oct 2026 (Morten: "how do we all track the flight and status?"): (1) every trip file's Flight following shows Track links by the aircraft registration from the quote (Flightradar24, FlightAware, ADS-B Exchange; free public pages; some private aircraft are hidden; the operator's times stay the record). (2) Leg status (Delayed, Diverted, Cancelled in red) with the note and registration on the broker and operations Today flights list, with a Track link. (3) New alert type "Flight status change" in api/alerts.mjs: each new leg status (departed, delayed, diverted, cancelled, landed) is sent once within 6 hours, by push to the trip's broker's own devices and by push and email to Team > Alerts entries that tick it (existing entries must tick it); airports and trip reference only, never the client name or note. Saving leg status now records `set` (when the status changed). Tests: tests/roletodaytest.js (tracking), tests/alertsrv.test.mjs (flight alerts). Automatic status from a paid feed not built; cost note: FlightAware AeroAPI Standard from USD 100/month (commercial use, alerts included); the free Personal tier is not for business use. On a computer, Track opens the tracker in one small window beside the portal (reused for the next flight); on phones or where pop-ups are blocked it opens as a tab. The trackers refuse being shown inside other sites, so no frame inside the portal. Open: Manual 11.5 and Appendix H to mention the Track links (manual first, then academies). Tracking demo (owner only, src-modules/trackdemo.js): open the portal with ?demo=track&reg=…&from=…&to=…&time=HH:MM&dep=<UTC ISO> to add one TEST trip (Example, price 0, ref TEST-TRACK) on a real aircraft; removed by Team > Remove example data. Used 28 Oct 2026 with 9V-SNA (SQ318 WSSS–EGLL). On 28–29 Oct 2026 the owner's first opening adds that trip automatically once (marker config/trackdemo stops it coming back). The owner's Today now also lists flights today and tomorrow with Track.

Start joining again, 28 Oct 2026 (Morten: reset Natalia so she starts from the offer, then contract): owner-only panel on Team (src-modules/resetjoin.js). Per person: deletes join request, agreement, academy progress (academy_progress) and sets the profile to not active with no roster data, so they land on step 1 again; login, leads, trips and training records kept; audit line "Joining started again".

Release safety and admin actions, 28 Oct 2026 (Morten: Natalia could not open the portal; "lost revenue, cannot happen in a live environment"; "when I ask for an immediate reset, I need you to be able to do so"):
- Opening never hangs: if opening errors or takes over 15 s, one automatic retry, then "The portal could not open here … Try again" (never on the sign-in screen). Old claude.ai text removed. tests/boottest.js.
- Checks before release: .github/workflows/checks.yml runs on every push (alerts, admin, boottest, roletodaytest, rightstest, inttest). Working rule proposed to Morten: Claude works on branch `staging` (Vercel preview); main (the live portal) only gets changes after the checks pass and Morten says "release". Vercel swaps a new version in at once, so an update itself does not take the portal offline; the risk is a broken version, which the checks guard against.
- Admin actions Claude can run at once: .github/workflows/admin.yml + jobs/admin.mjs (person-status, reset-joining) with the GitHub secret key; Claude dispatches via `gh api -X POST repos/MortenSchalls/arche-platform/actions/workflows/admin.yml/dispatches -f ref=main -f "inputs[action]=…" -f "inputs[email]=…"` and reads the result from the job annotation (`gh api repos/…/check-runs/<job id>/annotations`); the plain log is not reachable from the workspace. Verified 28 Oct with an example address. Every reset goes to the audit log.

Invite and reset at next sign-in, 28 Oct 2026: Team > "Invite someone to join" (owner): name + email → api/invite.mjs creates the login (Supabase admin generate_link, type invite; magiclink if the login exists but never signed in), emails a one-time link from welcome@archeaviation.com (Resend, reply-to the owner), returns the link so the owner can send it by WhatsApp if the email fails; list in intel/invites; audit line. The person opens the link, chooses a password and sees step 1 (offer). Reset at next sign-in: Admin actions `reset-next-login` (email or name) puts the person on intel/resetnext; api/resetcheck.mjs, asked by the portal once per page load for non-owners, resets them when they open the portal after a new sign-in. Natalia queued 28 Oct (Morten: "next time she logs in, it should be reset").

Released 28 Oct 2026 12:00 CET (Morten: "Release, go live"): invite from Team, reset at next sign-in, opening guard. Natalia (Nataliia Nazarenko, team member, broker) is on the reset-at-next-sign-in list; her last sign-in was 28 Oct 11:04 CET. Open: findings 2, 1, 3, 4, 6, 5 (see CLAUDE.md, Releases) and the phone layout ("the portal is so big it is difficult to see the different pages and functions" on the phone).

28 Oct 2026, later: Natalia taken off the reset list (Morten: "do not yet reset Natalia"); her portal name corrected from "Nataliia Nazarenko" to "Natalia Nazarenko" (signed agreement unchanged; check her passport spelling). Admin actions added: cancel-reset-next, set-name. Invitation email intro = options A and B (released 12:21 CET); Amalie (Morten's daughter) to be invited from Team as the first real test.

Invitations, 28 Oct 2026 afternoon (staging, waiting for "release"): inviting owner gets a BCC of every invitation and the replies; Team list "Invitations: N pending, N accepted" with sign-in time and joining step (GET /api/invite, owners only). GitHub emails Morten when Portal checks fail on staging; that is the safety net working (the live portal is untouched).

Released 28 Oct 2026 13:55 and 14:36 CET: BCC and pending/accepted list; readable heading on the choose-your-password screen (was dark on dark). Next: phone layout, then findings 2, 1, 3, 4, 6, 5.

29 Oct 2026 05:40 Bangkok, released: (1) "See as a person" (src-modules/seeas.js): the header preview menu lists every team member; the owner sees that person's portal exactly as they do (their Today, leads, trips, training), read-only (every save, upload and /api POST refused; the frozen db is wrapped in a proxy over an empty target). tests/seeastest.js. (2) Alerts rewritten after 70 alerts in one night (Morten: "the alert is for urgent measures, not to cry wolf"): urgent (approval with departure within 48 h; delayed, diverted, cancelled flight) = push at once day or night, every 30 min, max 4, escalation; normal (approval, website enquiry, supervised step, service recovery, departed/landed) = one push + one reminder after 4 h, never 22:00–07:00 Bangkok; low (late backup/rotation) = no push; one morning summary email from 07:00; no per-item emails. The repeat-minutes setting is no longer used. Cause of the 70: two website enquiries never marked handled (since 26 and 28 Oct) and one booking waiting for approval since 27 Oct (ref tmvq3lodjibfx), each repeated every 15 min. Admin actions leads-status and alerts-status (read only). Natalia: 40 leads since 23 Oct, none contacted, all past the 24-hour rule; proposal (starter pace 10 leads, clock restarts) waiting for Morten's OK; partner offer to be decided by Morten.
Note: the daily airport-rules job commits website content straight to main (not via staging); merge main into staging before each release.

29 Oct 2026: partner offer decided by Morten: introducer fee 15% of Archē's gross profit per booking, for 12 months per introduced client, paid after the last flight and full client payment, against the partner company's invoice, never to individuals; client stays Archē's (our confirmation, KYC, payment request only). Draft: docs/drafts/Arche-Introducer-Agreement-DRAFT-0.1.docx (Singapore law, SIAC, PDPA 2012, Prevention of Corruption Act 1960; for legal review; notes page to remove before sending). Next: manual first, then the lead "Next step" box and first email. Starter pace (10 leads in first 30 days) on staging, waiting for release; the rotations at 07:11 and 10:11 Bangkok gave Natalia 20 more leads (30 now), to trim back to 10 after the release.

29 Oct 2026, on staging (waiting for "release"): starter pace (engine starterOpen 10 / starterDays 30); forgot password on the sign-in page (api/reset.mjs, Supabase recovery link by Resend, max 1 per 5 min and 5 a day, same answer whether or not the email exists); My profile for everyone incl. joining (api/me.mjs, own contact fields in profiles.data.self; password change); invite email gives the portal and academy addresses; "Send again" per invitation (new person: invite; never signed in: magic link; signed in before: recovery link with a "new link" email); expired link on choose-password renews or offers "Send me a new link" (John saw "Auth session missing!"); Team lists show email addresses (GET /api/invite returns people, owners only); HTML no-cache headers. Old claude.ai copies retired 29 Oct (now point to the live addresses): Archē Broker Academy XaGEQD5MgnRJDyg6yzeUEx, Archē Broker Portal 4PvBwJDgrgf8hxw5Gh8AXp, TEST portal 2gwZDf8HMNXE63iMLvyndg (shared by link; its academy.test.html too). External Charter Broker Academy artifact Lakc4BYR6AdLakhbrXUaQc is still the 19 Oct version (ask Morten). Open: supervisor role (compensation to decide), automatic emails from Microsoft 365 (design for approval).

Released 29 Oct 2026 06:18 CET: everything listed as "on staging" above (starter pace, forgot password, My profile, Send again, expired-link fix, email addresses in Team, no-cache). Natalia trimmed to 10 again right after (7 Thailand, 3 Singapore; 20 back to the pool; first contact due 30 Oct 12:18 Bangkok). External Charter Broker Academy artifact taken offline until launch (Morten: "+2-3 months"). People on 29 Oct: Jan Torndyb (signed in, password set, joining), John Brady (signed in, no password: needs Send again), Amalie (signed in, joining), Jona Dejuan (invited, never opened). Next: supervisor switch (supervise, assess, train incl. live training via the server), pay setting left for Morten (suggested 3% of gross profit on supervised brokers' bookings).

Supervisor role, 29 Oct 2026, released 07:09 CET ( Morten: "the supervisor to be able to do assessments and training, as well as sharing the screens during bookings"; "lets make it so i can set this later"): (1) Team → Supervision: a "Supervisor" switch per person gives three rights at once: supervise steps, assess new people, and the new right "Train and share screen" (RIGHTS.train); single rights can still be ticked. (2) "Text to send" per person: a ready text for WhatsApp or email listing that person's rights and the pay, with Copy (falls back to select). (3) "Supervisor pay" panel in Team: points of gross profit (setting terms.supRate); empty = the agreement's 3 points (Schedule 1); 0 = to be agreed, no share recorded; applies to bookings approved from then on (agree changes in writing with people who signed at 3). (4) Holders of the train right get Training → Live training: they share their own screen with people they choose, with the syllabus, through the new server function apps/portal/api/live.mjs (only owners may write config; the server makes the caller the sharer, checks watchers are active people, never Security or Settings, one session at a time; an owner can end anyone's session; writes lesson results to the trainees' training records and an audit line). No new SQL: Realtime access (SQL 0020) already lets the sharer and watchers in. (5) Supervisors with train or assess see Team training (results of all members) under Training → Booking practice, read through /api/live. On staging 29 Oct 07:25 CET, not live yet (Vercel build limit until about 07:10 CET 30 Oct): the Supervisor switch and Text to send moved under each name (first column) because the rights column is off-screen to the right. Files: src-modules/supervise.js, src-modules/livetrain.js, api/live.mjs. Tests: tests/supervisortest.js (screens, /api/live mocked), tests/live.test.mjs (server checks), both now in "Portal checks" with livereal.js.

Booking with the operator, 29 Oct 2026, on staging (waiting for "release"; Morten: "failure proof procedure where it is always the higher fee of the operator"; no Archē liability insurance for the first months, all insurance on the operator; "we can only pay when money is received from client"; margin 9% minimum, other margins only his decision; "always save data that are not locked"). Rules now in CLAUDE.md (Money and pricing) and the manual (v3.8 29 Oct: 10.1, 10.2, 10.5, 10.6, 10.7, 8.5, Appendix A.1; academies and portal academy rebuilt). Portal (src-modules/bookingplan-core.js arithmetic, src-modules/bookingplan.js screens):
- Broker, "Operator terms and insurance" under Operator safety: the operator's cancellation lines (from booking / under N days or hours), payment lines (must add up to 100%), insurance (insurer, valid until, aircraft on the certificate, every leg inside the cover, confirmed with the insurer or its broker, certificate attached; the amount stays in Operator safety). Blocks Send; red trip checks for a certificate ending before the last flight, aircraft not on it, route outside it, amount below the minimum. The pre-issue ticks "ins" and "terms" are set from this record and cannot be ticked by hand. Preview of the client's charges and payment dates.
- Operations, "Booking with the operator" in the trip file: Request to Book date, how long the operator holds the aircraft, the operator's contract attached (new document type "Operator contract") and ticked as matching. Issuing is blocked until done and while the offer expiry is later than the hold.
- Charter confirmation: A3 new item ("If the Operator requires payment earlier, or its cancellation charges rise earlier, the dates and amounts in this confirmation's payment schedule apply."); the price box prints this booking's schedule; the A9 table prints, per period, the higher of our scale and the operator's charge plus our fee. Schedule rule: 25% (min 2,500) on signature and balance 7 days before as before, raised so that two days before every operator payment date and every rise of its cancellation charge the client has paid at least that much. The signature email follows.
- Money: client money recorded with amount and date (several receipts; paid in full sets Client paid); the operator's contract can be recorded as signed only after the client signed and when the money received covers what the operator wants at signing and its charge from then; operator payments only after that, never above money received or the operator price (replaces the old one-click buttons on these trips; older trips without operator terms keep the old buttons). Today → "Money on bookings": client payment missing (with the date to cancel with the operator before its next charge), sign the operator's contract now, operator payment due within 3 days.
- Margin: Settings refuses below 9% (and the terms form no longer drops other settings when saved); the owner can set another margin on one trip (in "Booking with the operator", before issue) with a reason; the price follows and operations saving keeps it; the approval card shows it.
- Operator library (intel 'oplib', server function api/oplib.mjs; Control → Operator library for staff): at issue, flight and cancellation each booking adds the operator's terms, insurance, aircraft, route codes, dates, pax counts, prices and margin (no client details). Brokers are offered "Use the terms on file" for a known operator (aircraft and route must be confirmed again).
Tests: tests/bookingtest.js (screens), tests/bookingplan.test.mjs (arithmetic, 400 random bookings: always the higher charge, never pre-fund), both in Portal checks. Trips already with operations need their operator terms filled by operations before issue (all current trips are tests).
Deadlines and cancellation, 29 Oct 2026, on staging (Morten: "automate operator and client cancellations if actions are not taken before due date/time"; "alerts 12 hours before due for operator as we are being liable if not cancelled ... highest alert for all involved, same as AOG"). The final cancellation stays one click by a person (CLAUDE.md: irreversible actions need a person; Avinode has no link to the portal). Built: (1) payment reminders to clients 3 days and 1 day before each schedule payment, sent by api/alerts.mjs from operations@archeaviation.com (env CLIENT_FROM to change), copy and replies to the company bookings email, only while the owner has switched them on in Team > Alerts ("I approve this wording"; the wording version is stored, a later wording change switches them off until approved again); (2) client payment overdue: urgent alert (type "Booking money"); (3) unsigned offer past its validity lapses by itself (Today, trip file, normal alert); (4) one-click cancellation in the trip file (reason: payment missing A3 or client's written notice A9; the operator's charge and "cancelled on Avinode" required; api/notice.mjs sends the client the notice with the A9 charge and records it; the library gets the outcome); (5) "CRITICAL: operator deadline" (renamed from AOG at Morten's request, 29 Oct 2026: AOG is for aircraft; same top level): from 12 hours before the operator's charge or payment rises on a booking whose operator contract is signed, while money is short or the operator unpaid, and after such a deadline: every alert-list person, every owner and operations member and the trip's broker, phone every 10 minutes day and night with no limit, email every hour, red bar on every page. Shared arithmetic and wording in src-modules/bookingplan-core.js (server: server/money.mjs). Tests: tests/moneyalerts.test.mjs (in Portal checks) and more in tests/bookingtest.js. Manual 10.2 "Deadlines the portal watches"; academies rebuilt.

NEXT, after Morten says "release" for the booking and deadline work (Morten, 29 Oct 2026: "check again once live that all functions are working, all changes are latest revisions and no legacy bugs or old data and documents are present, all working as intended and all procedures do not overlap. We need simplicity and fast flexible bookings"): (1) merge main into staging, release, confirm the Vercel production build (the build limit resets about 07:10 CET 30 Oct); (2) on the live portal run through a test booking end to end as broker, operations and owner (operator terms, Request to Book, issue, client money, operator contract, operator payment, cancellation) and check the alerts run (Team > Alerts last check, no errors); (3) look for leftovers: old one-click payment buttons, old "operator's stricter scale" remarks tick, duplicate modules in index.html, the old tests that click ins/terms by hand, trips with old states, old academy/manual copies, retired artifacts, the gdpr-review branch; (4) walk the whole booking flow for overlap and double entry (broker form, steps guide, pre-issue ticks, operator terms, operations panel, Booking with the operator, confirmation editor) and propose simplifications to Morten before changing anything; (5) remove the test trips (ref tmvq3lodjibfx and other test bookings) only with Morten's OK.

GDPR review copies, 28 Oct 2026: branch `gdpr-review` (not merged). Portal there = the example-data test version (index.html is test.html, config.js empty, no live database); every server function in apps/portal/api and apps/website/site/api is a stub that saves and sends nothing. Preview URLs: website https://arche-platform-m4gj-git-gdpr-review-arche-platform.vercel.app, portal https://arche-platform-portal-git-gdpr-review-arche-platform.vercel.app. Both behind Vercel Authentication; Morten makes them viewable for the consultant with Share > Anyone with the link on each deployment. Delete the branch (and the links stop) when the review ends. Never merge it into main.

Collapsible Today and Dashboard, 28 Oct 2026 (Morten: "make all my information on Today's page collapsible"): every section (panels, Bookings to approve, Key figures) has a ▾/▸ toggle on its heading, plus Collapse all / Expand all; remembered on the device (localStorage arche.collapsed.v1). src-modules/collapse.js; test tests/clptest.js.

Live training in the REAL portal, 28 Oct 2026 (Morten: "I need the live portal ... option to select what to share"; then "a syllabus ... to be switched on and off"): Training → Live training (moved from Team 28 Oct 2026): the owner ticks who may watch (every active portal member with a role), which pages are shared (nothing pre-selected; Security and Settings cannot be chosen), how long (1–8 h), and a syllabus (none, Familiarisation, Full). Watchers get a "Watch" banner on every page. On a page not shared, or on the investor list (always), watchers see a pause. Every email address and phone number is masked before sending. Private Realtime channel train:<id>; SQL 0020 (live_allowed() + policies on realtime.messages) lets only the owner and the chosen watchers join while the session in config/live is open. Syllabus (src-modules/livetrain.js, SYL): Familiarisation (8 lessons, about 2.5 h) and Full (Modules 0–14, then Avinode/payment training, 8 shadowed trips, practical exam, 10 supervised bookings); owner card with page, points to show, the trainee's task, Back/Done/Skip, course switch; watcher sees it beside the screen; "Syllabus: on/off" in the sharing bar; "Lesson done" is written to train/<uid>/runs/syl-<course>-<lesson> and the audit log. Tests: tests/livereal.js 30 checks (local relay instead of Realtime). Not yet tried against live Realtime.

Live training, 28 Oct 2026 (Morten: train Natalia "inside the portal so she sees what I do"): in the test portal (portal.archeaviation.com/test.html) the test bar has "Live training: share my screen" (8-letter code and a link to send) and "Watch". The watcher sees the sharer's screen live, scaled to her screen, with pointer, clicks and typed values, and can press "Share mine instead" to swap. Example data only: the real portal would show owner-only data (investors, other brokers' contacts) to the watcher, so it is not offered there. Sound over a phone or Teams call. Transport: Supabase Realtime broadcast channel "arche-train-<code>" with the publishable key (nothing stored); code in apps/portal/tests/live-train.js, inlined by build_test.py; test tests/livetest.js (local relay). Not yet tried against the live Realtime service (no access from Claude's workspace): if it says "Could not connect", Supabase → Project Settings → Realtime → allow public channels.

Scheduled tasks, 28 Oct 2026 (Morten: "stop alerts for now and then I can activate when we go live"): "Daily airport rules research" (04:34 Bangkok) and "Weekly website upkeep" (Tuesday 03:17 Bangkok) recreated with phone notifications off; same schedule and instructions, auto mode. Turn notifications back on in each task's settings in the Claude app, or ask Claude, at launch.

6m-bis. Archē-approved operators (Morten, 27 Oct 2026 evening: "Ok confirmed"): an operator without an accepted audit is approved by the director once, for twelve months, after seven checks (manual 8.3; the five checks plus safety documents reviewed and the operator's written crew-minimum commitment), kept in config/opapproved (Team → Archē-approved operators; approve from a trip with "Approve … for twelve months" or from Team; withdraw; Today warns 30 days before an approval ends; suspending an operator ends its approval). Brokers then quote it like an audited operator; per-trip basics still apply. One-trip director approval remains for others. The separate client disclosure email is replaced by one safety line (safetyLine in opsafety.js) shown on the trip with a Copy button and printed on the charter confirmation as "Operator safety: …". Manual 8.2/8.3, quiz and checklists, academies (quiz explanations realigned), website guide and home text (with TH/ZH/JA), draft notice, docs/OPERATOR-AUDIT-STANDARD.md updated. Test: tests/approvedtest.js (19 checks).

6m. Operator safety standard (adopted 27 Oct 2026; docs/OPERATOR-AUDIT-STANDARD.md): accepted without approval: ARGUS Platinum/Platinum Elite, WYVERN Wingman/PRO, IS-BAO Stage 2/3 (current on the last flight date, checked at the source within 14 days, link and "Safety audit" document). Anything else: director (owner) approval on the trip, the five 8.3 checks, crew minimums (captain 3,000 h / 250 on type, FO 1,000 h), and the client told in writing ("Client safety disclosure" document). Every operator: two pilots on jets, insurance at least USD 50M jet / 25M turboprop, five years clear (else owner approval), suspension list (config/opsuspend). Portal: Operator safety panel on each trip (src-modules/opsafety.js); missing items block Send to operations; breaches are red trip checks (block approve/issue); the audit tick cannot be set before the record is complete; ops approve/issue blocked while incomplete. Test: tests/safetytest.js. Manual Module 8.2/8.3/8.5 and quiz updated; academies rebuilt; charter confirmation label updated; website audits guide states the standard. Gold Plus no longer exists at ARGUS; Gold Certified is described by ARGUS as remote. Open: ask ARGUS in writing about Gold Certified; confirm insurance minimums with the insurance broker; check rating display in Avinode.

6n. Website, 27 Oct 2026 (continued): dated events on city pages (content/events.json, official dates only, past ones drop at the next build; sponsor names left out); Phuket page adds Krabi (VTSG) and Samui (VTSM) from the Thai AIP (2025 editions: newer 2026 pages could not be opened, re-check before launch); airport rule files VTSG and VTSM for the portal. Home page readability: hero form labels 11 px, inputs 40 px on phones, larger tap areas (site-fixes.css). Competitor review (ASA, Chapman Freeborn, MJets, ACS, VR Luxe, Singapore Air Charter) and proposed home-page changes in docs/WEBSITE-REVIEW-2026-10-27.md, waiting for Morten's approval.

Checks 27 Oct 2026 (late morning): the four handling agents wrongly flagged by the first screen run were set back to their normal status by Morten; archeaviation.com redirects to the Vercel login without a Vercel session; SQL 0018 and 0019 run.)

6o. Automation and home page (27 Oct 2026, Morten: "ensure the audits we list is something we can back up ... automated as we do with the sanctions list ... also for events and airports, countries"):
- Audit registries: the daily audits job (jobs/audits.mjs, 06:53 Bangkok, GitHub Actions with Chromium) reads the ARGUS operator registry (www.argus.aero/operatorregistry, a paginated Wix list; the job presses its own "next" control; levels Gold, Gold Certified, Platinum, Platinum Elite, Under Review) and the WYVERN Wingman directory (trading name, base, certificate number and certificate holder; Wingman and Wingman PRO are not told apart, so a PRO claim is checked against the Wingman list). First full run 27 Oct 2026: ARGUS 528 operators, WYVERN 135 names (106 operators plus holder names); all four level pages read. The browser read retries three times; if a registry still cannot be read, the last good list is kept for up to 7 days and shown with its date in the trip's safety panel, after that the broker's own check is the proof. Stored privately in storage registries/index.json; api/auditcheck.mjs looks an operator up for the Operator safety panel; "not listed" is never said from a partial list (minimums 300 / 50). It also watches the ARGUS, WYVERN and IBAC pages that describe the levels (Team → Audit watch; a plain request that is refused is retried in the browser). IS-BAO has no public registry: the broker's own check, link and evidence remain the proof. ARGUS also has a page "operator-registry-new" that loads in a frame; the job uses the older list, which is complete (checked by hand: 531 entries A–Z).
- Approve and issue wait for the first registry answer instead of refusing (opsafety.js).
- Events, airports, countries: weekly upkeep (scheduled task, Tuesday) per apps/website/content/UPKEEP.md: new events, re-checks of sources older than 300 days, next 3 places from _pages_queue.json researched by RESEARCH-BRIEF.md and imported with content/importer.py (also country facts <iso2>.<field>). Daily airport rules task as before.
- Regional batch (drafts): country pages Malaysia, Thailand, Vietnam, Maldives, Sri Lanka, Japan, South Korea, Taiwan, India (/countries/…); city pages Seoul, Taipei, Kuala Lumpur; airport rule files for 19 airports (WMSA, WMKK, WADD, WIHH, RPLL, RPLC, VTCC, VMMC, VVTS, VVNB, VDTI, VRMM, VCBI, RKSS, RKSI, RCSS, RCTP, VIDP, VABB; several partial). Hub group renamed "Countries and territories". Indonesia, Philippines, Cambodia, Bali and Macau stay in the queue for re-research (official pages not readable).
- Home page (apps/website/home_extras.py, run by build.py): broker line under the hero, "Our standard" band (links to the audits guide), "Destinations" strip (regions and cities; approved pages only once launched), "Dates ahead" (next three events), empty-leg alert sign-up in Contact, quote form step 2 asks "Flown privately before?" and a separate unticked opt-in for alerts and news. Thai, Chinese and Japanese for all of it in apps/website/i18n_home.json (inserted into site/i18n.js between ae:home markers at every build; dates shown per language, Thai with the Buddhist-era year); reviewed line by line by a second, independent pass and corrected 27 Oct 2026; a native speaker should still read them before launch. Destinations section regrouped by region (Asia-Pacific first), with country permit guides in one line; city and country pages carry a "region" field for this. website api/enquiry.mjs accepts type "alert" and the two answers; the portal's Website enquiries panel shows them, with "Delete (unsubscribe)" for alerts. Alert emails must be sent by a person, only legs that fit, each with an unsubscribe line.

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
