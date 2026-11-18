# Archē website: launch blockers (record kept 9 Nov 2026)

Morten, 9 Nov 2026: "keep record on the missing items so we cannot launch before having these sorted out" and
"ensure we follow same GDPR rules as Navoryx and that it is indeed a blocker for launch".

**How the lock works.** `apps/website/launch_blockers.py` holds the list (the same lock as the Navoryx site). When
`company.LAUNCHED` is True and any item is open, `build.py` refuses to build the site; `check_site.py` lists every open
item on every run. An item comes off only when it is done and Morten has confirmed it, code and this record in the same
commit. Never remove one to get a pass.

| # | Item | Done when | Rule or source | Who |
|---|---|---|---|---|
| 2 | Phone | Singapore business number in `company.py`, written `+65 6123 4567` (`check_site.py` checks the format) | Website contact routes | Morten |
| 4 | Approvals | (Privacy notice and Website terms of use approved by Morten 17 Nov 2026) Terms of business and `docs/DATA-PROTECTION-POLICY.md` (drafted 9 Nov 2026) approved, or reviewed by counsel | PDPA s.12, s.20 | Morten |
| 5 | 2FA on the other accounts | 2FA on Supabase, GitHub, Resend, Anthropic and the mailbox; Vercel DPA accepted (Vercel Pro and Vercel 2FA done: Morten, 17 Nov 2026) | Vercel DPA only on Pro/Enterprise; Hobby is non-commercial | Morten |
| 6 | Processor agreements | DPAs saved: Vercel, Supabase (region checked), Resend, Anthropic, GitHub, mail provider | PDPA s.24, s.26; GDPR Art. 28, 46 | Morten |
| 7 | Data intermediary agreement with Navoryx | Signed (heads of terms in the policy, Part D) | PDPA s.4(2), s.24; `docs/SEVERANCE.md` | Morten |
| 8 | EU and UK representatives | Appointed and named in the Privacy notice, or a reasoned decision recorded (policy Part C) | GDPR / UK GDPR Art. 27 | Morten |
| 9 | Payment provider | Agreed; clients pay only through its secure payment request | CLAUDE.md, Money | Morten |
| 10 | Launch day: test data | Test enquiries and records deleted from the portal (after the form test in step 3 below) | Policy A4 | Morten |
| 11 | Phone and WhatsApp answered | The number answered 24/7 and WhatsApp Business active on it (the launch site says "24/7 charter desk", "Call direct", "Message on WhatsApp") | Website contact routes | Morten |

Closed 9 Nov 2026 (built and tested on staging): consent tick on the quote, call-back and empty-leg alert forms (the
form does not send without it, each form sends its real tick, and the server refuses an enquiry without consent;
since 18 Nov 2026 the sender no longer fills in the tick itself); written Data Protection Policy and compliance register drafted (approval in
item 4); BizFile+ DPO filing folded into item 3.

Closed 16 Nov 2026 (Morten sent the statutory registers: "Congratulations, we are LIVE!!!!"): item 1, the company,
registered as Arche Aviation Pte. Ltd., UEN 202652508N, incorporated 16 November 2026; the UEN is set in `company.py`
and the legal name is used on every page, agreement and document (trading as Archē Executive).

Closed 17 Nov 2026: item 3, the Data Protection Officer on BizFile+. Seen 17 Nov 2026 in the company information on the CorporateServices.com dashboard (Ottavia, the ACRA filing agent): it lists
Morten Schalls Joergensen as the company's DPO from 16 Nov 2026 (filed with the incorporation).

## Public preview (Morten, 17 Nov 2026: "ok for me, do it and show me")

The banks and Avinode need a website before the launch. `company.PREVIEW = True` builds the public preview
(`apps/website/preview.py`): a red "REMOVE BEFORE FLIGHT" tag hooked on the Archē name in the top bar, one opening line with the
enquiry email at the bottom of the screen, every form replaced by the email address (no personal data collected),
drafts left out, search engines still shut out. `check_site.py` fails if any form is left.

Preview gate, before Morten turns off the Vercel login for the website (`launch_blockers.preview_blockers`):

| # | Item | Done when | Who |
|---|---|---|---|
| P1 | Vercel Pro with 2FA (part of 5) | Done: Pro team and two-factor sign-in on Vercel (Morten, 17 Nov 2026: "is DONE") | — |
| P2 | Privacy notice and website terms (part of 4) | Done: approved by Morten 17 Nov 2026 ("P2 approved") | — |

The full launch still needs every item in the table above.

## Launch day: the switches (Morten, 18 Nov 2026: "ensure all we are now removing for prelaunch are ready on a switch at actual launch date")

Everything the preview takes away is only switched off, never deleted: the forms, phone and WhatsApp, the other
languages, the search-engine files and the draft pages all come back from `apps/website/company.py` alone.

| Switch in `company.py` | Preview | Launch | What it brings back |
|---|---|---|---|
| `PHONE` | `""` | the Singapore number, `+65 6123 4567` form (items 2 and 11) | phone and WhatsApp links, the header "24/7 charter desk", "Call direct", the call-back wording, the number in the business details for search engines |
| `PREVIEW` | `True` | `False` | quote, call-back and empty-leg forms with their consent ticks (sent to `/api/enquiry`); tag and opening line gone |
| `LAUNCHED` | `False` | `True` | search engines let in: robots.txt open with the sitemap, sitemap.xml, no noindex on pages or in vercel.json (the build refuses while any item above is open) |
| `LANGUAGES_ON` | `False` | stays `False` until the translator has checked Thai, Chinese and Japanese | the language menu, the other-language pages and their search and link-preview entries |
| `LINE_ID`, `WECHAT_ID` | `""` | only once the account exists | the LINE or WeChat card; each card says "Thai and English." or "Mandarin and English.", so set the ID only when that language is covered too |

Nothing else changes by hand: the forms and the phone come back from the page source, which the preview never edits
(it changes only the built pages).

**Rehearsal before switching.** `python3 apps/website/tools/launch_rehearsal.py` builds the launch site in a
throw-away copy with these switches set (a test number if `PHONE` is still empty; the blocker stop lifted in the copy
only) and checks it: build; `check_site.py` (every problem fails; open launch blockers are listed as "wait"); layout
audit on every page at six widths; logo test; nothing of the preview left; on the five menu pages the forms and consent
ticks back, sending to `/api/enquiry` with the real tick; real number on phone and WhatsApp, no placeholder; robots.txt
open, every sitemap address a built page, no noindex on pages or in vercel.json; no draft page or marker; English only;
in a browser every page HTTP 200 with no script error, the quote form at its details step with name and consent tick,
the call-back sending nothing without the tick and once with it. Exit 0 = ready (with the open blockers listed).

Order on the day:
1. Items 2 to 9 and 11 closed and confirmed by Morten (code and this record in the same commit).
2. On staging: set `PHONE` and `PREVIEW = False`, keep `LAUNCHED = False`; run `python3 apps/website/build.py`, the
   layout audit (`NODE_PATH=$(npm root -g) node apps/website/tools/layout_audit.js`), `check_site.py`, the rehearsal
   and `scripts/check_all_revised.py`; commit `apps/website/site/` with `company.py` and `content/lastmod.json` (Vercel
   serves the committed `site/` and builds only when it changed); push to staging.
3. On the staging address (still noindex): send one test enquiry through each form (quote, call-back, empty-leg
   alert) and check each arrives in the portal; check on a phone and a computer; then delete the test enquiries and
   records and close item 10.
4. Set `LAUNCHED = True`; build (it refuses while any item is open), layout audit, `check_site.py`, rehearsal,
   `check_all_revised.py`; commit `site/` with the switch and this record; push to staging; Portal checks green.
5. Morten says "release": staging to main.
6. After the release: the website deployment on the main commit says "Deployment has completed" (not "Canceled by
   Ignored Build Step"); then, if not already done for the preview, Vercel Standard Protection on the website project
   (production open, previews private; the portal stays on All Deployments).
7. On https://archeaviation.com, logged out: robots.txt open, no `X-Robots-Tag` header, no tag or opening line, phone
   and WhatsApp links with the real number, every form shown with its tick.
8. Submit the sitemap to the search engines; update `docs/ARCHE-HANDOVER.md` and its project copy.

Note: items 6 and 7 also concern the portal, which is already live with brokers' personal data.
