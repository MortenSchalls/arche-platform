# Archē Executive: Data Protection Policy and compliance register

Version 1 (draft for Morten's approval), 9 November 2026. Internal; not published. This is the written policy that
PDPA s.12 requires: policies and practices, a complaints process, and information for the people who work with us.
It matches the public Privacy notice ("Last updated 9 November 2026") and follows the same standard as the Navoryx
policy (Morten, 9 Nov 2026: "ensure we follow same GDPR rules as Navoryx").

Owner: the Data Protection Officer (to be confirmed by Morten; launch blocker 3). On the website the DPO appears by
role and address only: privacy@archeaviation.com (an alias on contact@archeaviation.com, 26 Oct 2026). Review this
policy at least once a year, and whenever a new form, processor, country or purpose is added.

Company: Arche Executive Pte. Ltd. once registered. Until then the website stays unlaunched
(`company.LAUNCHED = False`) and the portal holds only the team's own and test data.

---

## Part A: Policy

### A1. What we hold, why, where and for how long

| Data | Collected by | Purpose | Kept in | Retention |
|---|---|---|---|---|
| Quote request: route, dates, passengers, name, how to reach, reply channel, flown before (optional), news opt-in | Website quote form, with consent tick | Answer the request; prepare quotes | Portal (Supabase), Today and Leads | 12 months after last contact, unless it becomes a booking |
| Call-back request: phone | Website call-back form, with consent tick | Call back | Portal | 12 months after last contact |
| Empty-leg alerts: email, routes | Website alert form, with its own consent tick | Send alerts and news the person asked for | Portal | Until they unsubscribe |
| Website statistics: page, referrer or campaign, country and city (from the network address, not stored), device type, sections reached, organisation link code | Our own script, no cookies; nothing when Do Not Track or Global Privacy Control is on | Improve the site; follow up our own outreach to organisations | Portal | 13 months |
| Bookings: client, payer and travellers (names, contact, travel document details the operator and authorities need), trip details, confirmation, payments recorded (no bank numbers) | Brokers in the portal | Arrange and look after the trip; contract; accounts | Portal; shared with the operator, handlers and authorities for that flight; payment provider | 5 years after the trip (accounting records, Companies Act s.199; also covers AML record-keeping) |
| KYC/KYB and sanctions screening results | Portal booking step; screening against official lists | Legal duties (CDSA, TSOFA; sanctions) | Portal (results only; no ID or bank numbers stored by Archē) | 5 years after the relationship ends |
| Business contacts (prospects): name, role, work email or phone, where found | Research from the organisation's own pages or a licensed database | Introduce our services to organisations | Portal (opening is logged; brokers see only their own leads) | Deleted at once on opt-out (one-way code kept); after 12 months without contact |
| Brokers: application, identity checks, agreement, academy progress and assessments, commission and payouts | Join flow, portal, academy | Contract, training, pay | Portal | Agreement term plus 5 years |
| Navoryx investor-relations records (Director only) | Navoryx investor page via `/api/ir` | Held for the Navoryx company as its data intermediary (Part D) | Portal | As Navoryx instructs (its policy: 12 months without contact) |
| Backups | Nightly job | Restore after loss | Encrypted pack in GitHub Actions | 90 days |

No cookies, advertising, tracking pixels or outside analytics on the website. **Adding any of these needs Morten's
decision first, a consent banner, and an updated Privacy notice before it goes live.**

### A2. Consent and purpose (PDPA s.13-20)
- Every website form needs a tick before it sends (quote, call-back, alerts; built 9 Nov 2026); the server refuses an
  enquiry without it. Alerts and news always have their own separate tick, never pre-ticked.
- Data is used only for the purposes in A1. A new purpose needs new consent, or a legal basis checked first.
- Withdrawal (s.16): act within 10 working days; tell the person what it means (we may no longer be able to answer or
  arrange a trip); stop using or delete the data in the portal and the mailbox, except records the law requires.

### A3. Access and correction (s.21-22)
1. A request comes to privacy@ (forward any received elsewhere).
2. Confirm identity from the address on our record; do not ask for ID documents unless there is real doubt, and keep
   no copy.
3. Search the portal (Today, Leads, trips, prospects, alerts), the mailbox and the backups' latest state.
4. Reply within **30 days** with the data and its uses and disclosures in the past year; if longer is needed, say so
   within the 30 days. **No charge.**
5. Correct without delay and tell anyone it was disclosed to in the past year (s.22(2)).
6. Log it (B3). EU, UK, Swiss and Thai visitors also have erasure, restriction, objection and portability: same steps,
   answered within one month.

### A4. Retention and deletion (s.25)
- **Monthly** (first working day): delete enquiries and call-backs 12 months after last contact, prospects' contacts
  not reached in 12 months (the portal's rotation job already does this), statistics older than 13 months; keep
  bookings and checks for 5 years. Note the run in the log.
- **Before the website launches**: delete all test enquiries and test records (launch blocker 12).

### A5. Protection (s.24): security baseline
| Account | Requirement | Status 9 Nov 2026 |
|---|---|---|
| Vercel | Pro team (DPA, commercial use) with 2FA | **Open**: Hobby plan (launch blocker 6) |
| Supabase | 2FA; row-level security; secret key only in Vercel and GitHub secrets | As built; 2FA to check |
| GitHub | 2FA; repository private; backups encrypted | Check 2FA |
| Resend, Anthropic, mail provider | 2FA; keys only in Vercel variables | Check |
| Portal | Every member signs in; brokers see only their own leads and trips; opening contacts logged; four-eyes on money | As built |
| Laptop / phone | Disk encryption, screen lock | Check |

Secrets never go into repositories, chats or emails. No passport, ID or bank numbers in AI tools.

### A6. Processors and transfers (s.4(2), s.26; PDPR 2021 reg. 10-11; GDPR Art. 28, 46)
| Processor | Role | Country | Contract | Status |
|---|---|---|---|---|
| Vercel Inc. | Website and portal hosting, functions, logs | USA | Vercel DPA, Pro/Enterprise only | **Open**: needs Pro |
| Supabase | Portal database and files | Region to check | Supabase DPA on acceptance | Accept, save, check region |
| Resend | Email delivery | USA | Resend DPA with SCCs | Accept and save |
| Anthropic | AI tools used by the team and the portal | USA | Commercial terms and DPA (no training on our data) | Save copy |
| Mail provider for archeaviation.com | Mailbox | Per provider | Provider DPA | Save copy |
| GitHub | Code and encrypted backups | USA | GitHub DPA | Save copy |
| Payment provider | Payment requests | To be agreed | Its DPA | With launch blocker 13 |
| Sanctions list publishers | Lists downloaded only; no personal data sent | — | None needed | OK |

Keep a PDF of every DPA with the date accepted in the company folder.

### A7. Data breach management (s.26A-26E)
1. **Contain** at once: revoke keys, rotate secrets, lock accounts.
2. **Assess** within 30 days of becoming aware (sooner if possible): what, whose, how many, likely harm.
3. **Notifiable** if likely to cause significant harm (identity, financial, KYC or travel-document data, or anything
   combined with them) or 500 or more people.
4. Notify the **PDPC within 3 calendar days** of deciding it is notifiable, and the people affected as soon as
   practicable unless the PDPC or the law says not to. Where GDPR applies, the lead authority within 72 hours.
5. Log every incident, notifiable or not. Processors must tell us without undue delay (check each DPA).

### A8. Messages and calls (Spam Control Act; PDPA Part 9)
- Write only about what the person asked for; alerts and news only to those who ticked for them; every message says
  how to stop; act on an unsubscribe within 10 working days.
- First message to a business contact: where we found their details and an opt-out; an opt-out deletes them at once
  in every list.
- Before any marketing call, SMS or WhatsApp to a Singapore number: check the DNC Registry (valid 30 days) unless we
  hold clear recorded consent; keep the result.

### A9. KYC, sanctions and reports
Screening of client, payer and travellers on every trip; results used only for the booking decision and kept with the
booking. A possible match is held for the Director, never answered differently (no tipping off). Suspicious
transactions to the STRO (CDSA s.45); terrorism-financing information to the Police (TSOFA).

### A10. Complaints
To privacy@; acknowledge within 2 working days, full answer within 30 days; log it. If not satisfied, point the person
to the PDPC (Singapore), Thailand's PDPC, or their EU/UK authority.

### A11. People who work with us
Every broker and team member reads this policy before getting portal access (the broker agreement already binds them
to the PDPA and to report any loss or misuse within 24 hours). Access ends the day they leave.

---

## Part B: Compliance register

| # | Topic | Requirement | What we have | Still needed | Who | Risk after action |
|---|---|---|---|---|---|---|
| 1 | Company | Notice names the organisation | Name in notice; UEN pending | Register; set UEN | Morten | Low |
| 2 | DPO | PDPA s.11(3)-(5) | privacy@ live; role on the Privacy page | Confirm who is DPO | Morten | Low |
| 3 | DPO on BizFile+ | ACRA | Not possible before UEN | File after registration | Morten | Low |
| 4 | Written policy | s.12 | This document | Approve; annual review | Morten | Low |
| 5 | Public notice | s.20; GDPR Art. 13 | Privacy notice, 16 sections (9 Nov 2026) | Approve | Morten | Low |
| 6 | Consent | s.14 | Tick on every form; server refuses without it | — | — | Low |
| 7 | Access/correction | s.21-22 | A3 | Start the log | DPO | Low |
| 8 | Retention | s.25 | A4; prospect deletion automated | Monthly routine after launch | DPO | Low |
| 9 | Security | s.24 | A5 | **Vercel Pro + 2FA**; 2FA everywhere | Morten | Medium → Low |
| 10 | Processors | s.4(2), s.24 | DPAs available | Accept and save (A6) | Morten | Medium → Low |
| 11 | Transfers | s.26 | Notice states it; DPAs with SCCs | Covered by 10 | — | Low |
| 12 | Breach plan | s.26A-E | A7 | Start the log | DPO | Low |
| 13 | DNC / spam | Part 9 | A8 | DNC check before calls | DPO | Low |
| 14 | GDPR / UK GDPR reach | Art. 3(2), Art. 27 | Notice covers bases and rights | Representatives or a recorded decision (Part C) | Morten | Medium → Low |
| 15 | Thai PDPA | Thai visitors (Thai-language site) | Rights and Thai PDPC named | — | — | Low |
| 16 | Cookies | ePrivacy | None | Banner before any analytics | — | Low |
| 17 | Children | — | 18+; travel booked by a parent | — | — | Low |
| 18 | Navoryx IR records | s.4(2) data intermediary | Director-only in the portal | **Agreement (Part D)** | Morten | Medium → Low |
| 19 | Terms of business | Contract | Part B of the charter confirmation | Approve | Morten | Low |
| 20 | Website terms | UCTA s.2(1) carve-out; Singapore law | Website terms of use | Approve | Morten | Low |

### B3. Logs (one spreadsheet, Director only)
Request log (access, correction, withdrawal, complaint, monthly deletion) and breach log (date, what, assessment,
notifiable, notifications sent).

---

## Part C: EU and UK representatives (decision for Morten)
The site offers private flights to and from European and UK cities and has city guides for them, so GDPR and UK GDPR
probably apply (Art. 3(2)). Options: (a) appoint an EU and a UK representative (service providers, roughly EUR 420-850
a year each; check current prices) and name them in the Privacy notice; or (b) record here a reasoned decision not to,
signed off by Morten. Recommendation: (a), the same as for Navoryx; one provider can often serve both companies.

## Part D: Data intermediary agreement with the Navoryx company (draft heads of terms)
- Arche Executive Pte. Ltd. keeps the Navoryx investor-relations records only on Navoryx's instructions and for its
  stated purposes (access decisions, sanctions screening, access log).
- Protection to the PDPA s.24 standard; access for the Director only; no investor names in shared logs.
- Retention as Navoryx instructs; on request or when the agreement ends, the records are exported whole to Navoryx
  and then deleted (`docs/SEVERANCE.md`).
- Breaches reported to Navoryx without undue delay, at the latest within 24 hours.
- Sub-processors named (Supabase, Vercel, Resend); Navoryx told before any change.
- Help with access and correction requests.
- Arche is not named on the Navoryx website or in its emails (`docs/IR-PORTAL-CONTRACT.md`).
