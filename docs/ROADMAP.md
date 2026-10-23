# Archē Executive platform roadmap

The single list of what is done and what is still needed for the website, the portal and the academy. Claude updates it with every change; Morten decides the order. Replaces PRELAUNCH.md.

Status: ☐ to do · ◐ waiting on someone · ☑ done

## 1. Before go-live (must be done)
| | Item | Waiting on | Notes |
|---|---|---|---|
| ◐ | Phone and WhatsApp numbers | Morten (package) | Thai number: AIS SME business mobile plan in mind; maybe AIS Cloud BizCall or Teams Phone for one 24/7 number ringing several phones. The +65 charter desk number needs a Singapore provider. |
| ◐ | Legal entity, registration number, office addresses | Morten (package) | Footer, contact section, privacy notice, terms page. |
| ☐ | Contact email on archeaviation.com | Morten | Site still shows charter@archeexecutive.com. |
| ◐ | Native-speaker check of Thai, Chinese and Japanese | Morten | All text, including rows added 20 Oct (`apps/website/text_fixes.py`) and the photo-break lines and "What every trip includes" row added 21 Oct (`apps/website/sections.py`). |
| ◐ | Replace Paynode (not available to Asian companies): fast client collection and same-day operator payment, never paying operators before client money arrives | Morten (parked 23 Oct) | Project doc payment-flow-replacing-paynode-2026-10-23. Rule, contract B5, terms page and portal change together. |
| ☐ | Counsel review: privacy notice, terms of business, broker disclosure, CAAS/CAAT notices | Counsel | Terms page is built from Part B of the charter confirmation. |
| ◐ | Liability insurance: broker's professional liability and non-owned aircraft liability, stated in the terms | Morten (broker) | Peers state cover (FXAIR USD 100m per occurrence; JetSmarter USD 50m non-owned). Our terms say nothing. See terms comparison 20 Oct. |
| ☐ | Counsel to confirm: liability cap at the brokerage fee (B14) holds under Singapore law; SIAC arbitration also suits small claims (B16) | Counsel | Peers cap at the price paid. |
| ◐ | Run `supabase/migrations/0006_rfqs.sql` in Supabase (supplier quotes) | Morten | One paste in the SQL Editor. |
| ☐ | Counsel check of named business contacts: Singapore PDPA business-contact exemption, Thai PDPA (no such exemption), GDPR notice within one month for EU contacts | Counsel | Rule approved 20 Oct 2026. |
| ☐ | Staff sign-in by Microsoft 365; sign-in emails from archeaviation.com (custom SMTP) | Claude + Morten | |
| ☐ | Full run-through on desktop and phone, every language | Claude, then Morten | Every section, link, form; quote and call-back reach Today. |

## 2. Go-live
| | Item | Notes |
|---|---|---|
| ☐ | GoDaddy DNS: archeaviation.com and www → website; portal.archeaviation.com → portal | `DNS-GODADDY.md` |
| ☐ | Broker login link → portal.archeaviation.com | `apps/website/build.py`, PORTAL |
| ☐ | Email safety records SPF, DKIM, DMARC | |
| ☐ | Supabase sign-in addresses updated | |
| ☐ | Google Search Console: verify the domain, submit the sitemap | Free; shows which searches bring visitors. |
| ☐ | Decide whether to keep `/test.html` online after go-live (it holds no real data) | Remove the file to take it down. |
| ☐ | Turn daily prospect research back on (paused 21 Oct 2026 to save AI credit) | Restore the cron line in `.github/workflows/jobs.yml`. Crew hotels then continue at 3 airports a day. |

## 3. Right after go-live
| | Item | Notes |
|---|---|---|
| ☐ | Google Business Profile (Singapore; Bangkok if it is a real office) | Needs real address and phone. |
| ☐ | Website enquiry alert to the 24/7 desk | So no request is missed. |
| ☐ | Academy on the same sign-in at academy.archeaviation.com | |
| ☐ | Retire the claude.ai portal after two weeks of parallel running | |
| ☐ | Listings in genuine aviation directories and associations (for example AsBAA, if Archē joins) | Links from trusted sites help ranking. |

## 4. Ideas to decide later
| | Item | Notes |
|---|---|---|
| ☐ | Small collapsed FAQ at the bottom of the page | Uses the 23 approved FAQ answers; often shown directly in Google. Morten likes the simple one-page site, so optional. |
| ☐ | Separate pages (charter, advisory, fleet, Singapore, Bangkok, routes) | Morten prefers one page; on hold. |
| ☐ | Accreditations strip | Hidden until Archē holds real accreditations (`SHOW_ACCREDITATIONS` in build.py). |
| ☐ | Rotation of website enquiries to the broker on duty | |
| ☐ | 7%/9% margin split | Only once Morten defines it. |
| ☐ | Replacement aircraft B11: let the client refuse a replacement and get a refund (less costs) when it differs materially, instead of counting refusal as cancellation | FXAIR refunds in that case. |
| ☐ | Service partners step 2: limousine and VIP ground transport at the same airports | Small step; same checks. |
| ☐ | Service partners step 3: helicopter transfers (city to airport, resort and island hops) | Check AOC and safety record as for operators. |
| ☐ | Service partners step 4: yacht charter partners (Phuket, Côte d'Azur, Mediterranean) | Fits jet-plus-yacht trips. |
| ☐ | AeroBridge spin-out: separate company and data once Supplier quotes is proven on real trips; Archē stays a client | Shared engine, not a merger (project doc aerobridge-arche-supplier-quotes-2026-10-21). |
| ☐ | Live crew-hotel rates and availability from a licensed source: a crew-accommodation partner (for example get-e, Croowy, Hotels Worldwide) or a hotel-distribution contract; Amadeus closed its free self-service APIs in July 2026 | Decide once Supplier quotes is in use. |
| ☐ | Gulfstream source for the G650 cabin figures | Now from GlobalSecurity.org. |

## Done
**23 Oct 2026**
- ☑ Portal course in Training: 43 lessons covering every screen and the business rules, by role (broker 23, operations, owner all), each with a Try it task in the test version and up to 3 checks, then a final check (80% to pass); progress per person, team progress for owner and operations. Troubleshooting guide updated to the new platform (v2.0) with supplier quotes, operators and service partners, business contacts, investors and the test version.
- ☑ Portal: sign in with email and password (owner creates the login in Supabase; the person must choose their own password on first sign-in). Interim until sign-in emails from our own domain work.
- ☑ Website: shorter copy, larger headlines and more space on desktop, metallic labels and dividers, in all four languages.

**21 Oct 2026**
- ☑ Website: three full-width photo breaks with one line each, a "What every trip includes" row (vetted operators, one fixed price, 24/7 desk), background one tone lighter (#3b3f46, muted text lifted to keep 4.5:1), new How-it-works step 1 photo; every photo used once; in all four languages (6 new iStock photos, 21 Oct).
- ☑ Test version of the portal (`/test.html`): no sign-in, switch between Test Owner, Test Operations and Test Broker; example data in the browser only; never touches the real database.
- ☑ Daily prospect research paused until go-live; the current lists are the base. Rotation and backups keep running.
- ☑ AI spend control: every research call metered in USD; USD 1.50 per scheduled run and USD 40 a month in total, then research pauses; manual runs have their own limit (default USD 3); 6 searches per question instead of 12; the cheaper model for service partners and crew hotels; investor research one area a day; spend shown on Today.
- ☑ Crew hotels as their own service: researched at the 30 airports: hotels at most 15 minutes by road with a dedicated airport shuttle (both mandatory, with sources), and crew-accommodation companies; from hotels' own sites, never booking or review sites; own progress record; in Supplier quotes with rooms and nights. Removed "Hotel for crew" from trip support.
- ☑ Supplier quotes (owner and operations): request quotes from checked service partners at an airport, compare them with an explained score, award with four-eyes; nothing sent from the portal; all in USD. First piece of the AeroBridge idea.

**20 Oct 2026**
- ☑ Portal on Supabase and Vercel; prospects, settings and FAQ moved; background jobs on GitHub Actions.
- ☑ Website on Vercel: hero aircraft (Global 7500 proportions), compass rose, heading option A, phone layout, forms to the portal.
- ☑ SEO basics: titles, descriptions, link previews, business description, sitemap, test address kept out of Google.
- ☑ All website pictures cleared: our own cabin cross-section drawings in the aircraft finder; 11 licensed iStock photos; advisor portrait removed.
- ☑ Terms of business page from the contract (Part B), linked in the footer.
- ☑ Contract clause B5: Paynode only, in the charter confirmation, the portal and the terms page.
- ☑ Archē spelling, typo fixes, translations completed for all changed text.
- ☑ No "who is behind Archē" content on the site (Morten's choice).
- ☑ One address per language (/th, /zh, /ja) and a ready-made page copy that search engines can read straight away.
- ☑ Service partners (business-jet suppliers): FBOs and ground handlers, trip support and in-flight catering at 30 key airports; IS-BAH evidence, sanctions pre-screen, business contacts from their own sites; never assigned to brokers; a monthly refresh once all airports are covered.
- ☑ Opt-out table (0005) set up in Supabase.
- ☑ Named business contacts in all prospect lists (rule approved 20 Oct): work details from the organisation's own site or a licensed database only; brokers see them only on their own leads; opening is logged; opt-out deletes everywhere and blocks re-adding; 12-month deletion; first message says where we found them.
- ☑ Investor profiles and fit score: portfolio size (sourced only), ticket size, interests, industries, aviation exposure, geography; High/Medium/Low potential with reasons; filters on all of them.
- ☑ Investors › Import list (owner only): paste organisations, one per line; duplicates and personal names skipped; the profile run researches and scores them.
- ☑ Investors and partners (owner only): own table protected by a database rule, own tab in Prospects, daily research across three areas (up to 45 organisations a day; a manual run covers all nine areas) with evidence and sanctions pre-screen; a prospect can be moved there (for example JET8). Nothing appears in shared logs or summaries.
- ☑ Operator research strengthened: EU Air Safety List refused, business-jet fleet, owning companies, regulator actions, insurance, and a daily automatic sanctions pre-screen (OFAC, UN, EU, UK) of every operator; a person still confirms before the first booking.
- ☑ Languages decided: English, Thai, Chinese and Japanese all stay; own translations, not machine translation (Morten).
- ☑ Translated pages checked in every state (all aircraft, all five steps, quote form, thank-you): no English left except names and placeholders. Cabin drawings now carry no words; a translated line under the finder explains them.
- ☑ Cancellation scale kept; client pays the higher of our scale or the operator's charge plus our brokerage fee (A9, in contract, portal and terms page).
- ☑ Terms of business compared with five peers (project doc terms-vs-peers-2026-10-20).
- ☑ Owner can change a prospect's type and undo Do not contact.
- ☑ Portal Day theme neutral grey.
