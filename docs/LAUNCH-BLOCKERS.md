# Archē website: launch blockers (record kept 9 Nov 2026)

Morten, 9 Nov 2026: "keep record on the missing items so we cannot launch before having these sorted out" and
"ensure we follow same GDPR rules as Navoryx and that it is indeed a blocker for launch".

**How the lock works.** `apps/website/launch_blockers.py` holds the list (the same lock as the Navoryx site). When
`company.LAUNCHED` is True and any item is open, `build.py` refuses to build the site; `check_site.py` lists every open
item on every run. An item comes off only when it is done and Morten has confirmed it, code and this record in the same
commit. Never remove one to get a pass.

| # | Item | Done when | Rule or source | Who |
|---|---|---|---|---|
| 2 | Phone | Singapore business number in `company.py` | Website contact routes | Morten |
| 4 | Approvals | (Privacy notice and Website terms of use approved by Morten 17 Nov 2026) Terms of business and `docs/DATA-PROTECTION-POLICY.md` (drafted 9 Nov 2026) approved, or reviewed by counsel | PDPA s.12, s.20 | Morten |
| 5 | 2FA on the other accounts | 2FA on Supabase, GitHub, Resend, Anthropic and the mailbox; Vercel DPA accepted (Vercel Pro and Vercel 2FA done: Morten, 17 Nov 2026) | Vercel DPA only on Pro/Enterprise; Hobby is non-commercial | Morten |
| 6 | Processor agreements | DPAs saved: Vercel, Supabase (region checked), Resend, Anthropic, GitHub, mail provider | PDPA s.24, s.26; GDPR Art. 28, 46 | Morten |
| 7 | Data intermediary agreement with Navoryx | Signed (heads of terms in the policy, Part D) | PDPA s.4(2), s.24; `docs/SEVERANCE.md` | Morten |
| 8 | EU and UK representatives | Appointed and named in the Privacy notice, or a reasoned decision recorded (policy Part C) | GDPR / UK GDPR Art. 27 | Morten |
| 9 | Payment provider | Agreed; clients pay only through its secure payment request | CLAUDE.md, Money | Morten |
| 10 | Launch day: test data | Test enquiries and records deleted from the portal | Policy A4 | Morten |

Closed 9 Nov 2026 (built and tested on staging): consent tick on the quote, call-back and empty-leg alert forms (the
server refuses an enquiry without it); written Data Protection Policy and compliance register drafted (approval in
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
| `PHONE` | `""` | the Singapore number (item 2) | phone and WhatsApp links and the call-back wording, everywhere the placeholder was |
| `PREVIEW` | `True` | `False` | quote, call-back and empty-leg forms with their consent ticks (sent to `/api/enquiry`); tag and opening line gone |
| `LAUNCHED` | `False` | `True` | search engines let in: robots.txt, sitemap.xml, no noindex (the build refuses while any item above is open) |
| `LANGUAGES_ON` | `False` | stays `False` until the translator has checked Thai, Chinese and Japanese | the language menu and the other-language pages |
| `WECHAT_ID` | `""` | only if Archē has a WeChat ID | the WeChat contact |

**Rehearsal before switching.** `python3 apps/website/tools/launch_rehearsal.py` builds the launch site in a
throw-away copy with these switches set (a test number if `PHONE` is still empty; the blocker stop lifted in the copy
only), then checks it: build, check_site, layout audit on every page at six widths, logo test, nothing of the preview
left, forms and consent ticks back, real number on phone and WhatsApp with no placeholder, robots.txt and sitemap.xml present,
no draft published, English only, every page opened in a browser without a script error, and the quote form reaching
its details step. Exit 0 = ready. Run it again on launch day with the real number set.

Order on the day:
1. Every item in the first table closed and confirmed by Morten (code and this record in the same commit).
2. Set `PHONE`, then `PREVIEW = False` and `LAUNCHED = True`; run the rehearsal, `check_site.py`, the layout audit
   and `scripts/check_all_revised.py`; push to staging; check the staging preview on a phone and a computer.
3. Send one test enquiry through each form on staging and check it arrives in the portal; then delete it (item 10).
4. Morten says "release": staging to main.
5. If not already done for the preview: Vercel Standard Protection on the website project (production open,
   previews private); the portal stays on All Deployments.
6. Submit the sitemap to the search engines.

Note: items 6 and 7 also concern the portal, which is already live with brokers' personal data.
