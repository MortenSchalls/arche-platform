# Archē Executive platform roadmap

The single list of what is done and what is still needed for the website, the portal and the academy. Claude updates it with every change; Morten decides the order. Replaces PRELAUNCH.md.

Status: ☐ to do · ◐ waiting on someone · ☑ done

## 1. Before go-live (must be done)
| | Item | Waiting on | Notes |
|---|---|---|---|
| ◐ | Phone and WhatsApp numbers | Morten (package) | Thai number: AIS SME business mobile plan in mind; maybe AIS Cloud BizCall or Teams Phone for one 24/7 number ringing several phones. The +65 charter desk number needs a Singapore provider. |
| ◐ | Legal entity, registration number, office addresses | Morten (package) | Footer, contact section, privacy notice, terms page. |
| ☐ | Contact email on archeaviation.com | Morten | Site still shows charter@archeexecutive.com. |
| ◐ | Native-speaker check of Thai, Chinese and Japanese | Morten | All text, including rows added 20 Oct (`apps/website/text_fixes.py`). |
| ☐ | Counsel review: privacy notice, terms of business, broker disclosure, CAAS/CAAT notices | Counsel | Terms page is built from Part B of the charter confirmation. |
| ◐ | Liability insurance: broker's professional liability and non-owned aircraft liability, stated in the terms | Morten (broker) | Peers state cover (FXAIR USD 100m per occurrence; JetSmarter USD 50m non-owned). Our terms say nothing. See terms comparison 20 Oct. |
| ☐ | Counsel to confirm: liability cap at the brokerage fee (B14) holds under Singapore law; SIAC arbitration also suits small claims (B16) | Counsel | Peers cap at the price paid. |
| ◐ | Run `supabase/migrations/0005_optouts.sql` in Supabase (opt-out codes for business contacts) | Morten | One paste in the SQL Editor. |
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
| ☐ | Gulfstream source for the G650 cabin figures | Now from GlobalSecurity.org. |

## Done
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
- ☑ Named business contacts in all prospect lists (rule approved 20 Oct): work details from the organisation's own site or a licensed database only; brokers see them only on their own leads; opening is logged; opt-out deletes everywhere and blocks re-adding; 12-month deletion; first message says where we found them.
- ☑ Investor profiles and fit score: portfolio size (sourced only), ticket size, interests, industries, aviation exposure, geography; High/Medium/Low potential with reasons; filters on all of them.
- ☑ Investors and partners (owner only): own table protected by a database rule, own tab in Prospects, daily research across three areas (up to 45 organisations a day; a manual run covers all nine areas) with evidence and sanctions pre-screen; a prospect can be moved there (for example JET8). Nothing appears in shared logs or summaries.
- ☑ Operator research strengthened: EU Air Safety List refused, business-jet fleet, owning companies, regulator actions, insurance, and a daily automatic sanctions pre-screen (OFAC, UN, EU, UK) of every operator; a person still confirms before the first booking.
- ☑ Languages decided: English, Thai, Chinese and Japanese all stay; own translations, not machine translation (Morten).
- ☑ Translated pages checked in every state (all aircraft, all five steps, quote form, thank-you): no English left except names and placeholders. Cabin drawings now carry no words; a translated line under the finder explains them.
- ☑ Cancellation scale kept; client pays the higher of our scale or the operator's charge plus our brokerage fee (A9, in contract, portal and terms page).
- ☑ Terms of business compared with five peers (project doc terms-vs-peers-2026-10-20).
- ☑ Owner can change a prospect's type and undo Do not contact.
- ☑ Portal Day theme neutral grey.
