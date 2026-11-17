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
| 5 | Vercel Pro with 2FA | Archē on a Pro team, DPA accepted, 2FA on Vercel and the other accounts | Vercel DPA only on Pro/Enterprise; Hobby is non-commercial | Morten (purchase) |
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
| P1 | Vercel Pro with 2FA (part of 5) | The website runs on a Pro team (Hobby is non-commercial) with two-factor sign-in. Pro: Morten 17 Nov 2026; 2FA still to confirm | Morten |
| P2 | Privacy notice and website terms (part of 4) | Done: approved by Morten 17 Nov 2026 ("P2 approved") | — |

The full launch still needs every item in the table above.

Then: set `company.LAUNCHED = True` (the build refuses while any item is open), release staging to main, turn off the
Vercel login for the website's production address, and submit the sitemap to the search engines.

Note: items 6 and 7 also concern the portal, which is already live with brokers' personal data.
