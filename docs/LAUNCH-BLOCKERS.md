# Archē website: launch blockers (record kept 9 Nov 2026)

Morten, 9 Nov 2026: "keep record on the missing items so we cannot launch before having these sorted out" and
"ensure we follow same GDPR rules as Navoryx and that it is indeed a blocker for launch".

**How the lock works.** `apps/website/launch_blockers.py` holds the list (the same lock as the Navoryx site). When
`company.LAUNCHED` is True and any item is open, `build.py` refuses to build the site; `check_site.py` lists every open
item on every run. An item comes off only when it is done and Morten has confirmed it, code and this record in the same
commit. Never remove one to get a pass.

| # | Item | Done when | Rule or source | Who |
|---|---|---|---|---|
| 1 | Company | Arche Executive Pte. Ltd. registered; UEN in `company.py` | Notice names the responsible organisation | Morten |
| 2 | Phone | Singapore business number in `company.py` | Website contact routes | Morten |
| 3 | Data Protection Officer | Appointed; privacy@archeaviation.com answered; shown by role on the Privacy page | PDPA s.11(3)-(5) | Morten |
| 4 | DPO on BizFile+ | Filed after incorporation; acknowledgement kept | ACRA BizFile+ | Morten |
| 5 | Data Protection Policy and compliance register | Written for Archē (purposes and retention, access and correction in 30 days, monthly deletion, breach plan with PDPC notice in 3 days, request and breach logs, staff access) and approved | PDPA s.12, s.21-26E | Claude drafts, Morten approves |
| 6 | Vercel Pro with two-factor sign-in | Archē on a Pro team, DPA accepted, 2FA on | Vercel DPA covers only Pro/Enterprise; Hobby is non-commercial | Morten (purchase) |
| 7 | Processor agreements | DPAs with transfer clauses accepted and saved: Vercel, Supabase (region checked), Resend, Anthropic, mail provider | PDPA s.24, s.26; GDPR Art. 28, 46 | Morten |
| 8 | Data intermediary agreement with Navoryx | Signed for the investor-relations records the portal keeps for Navoryx | PDPA s.4(2), s.24; `docs/SEVERANCE.md` | Morten |
| 9 | EU and UK representatives | Appointed and named in the Privacy notice, or a reasoned decision not to appoint them recorded here and signed off | GDPR / UK GDPR Art. 27 | Morten |
| 10 | Consent tick on every form | Quote, call-back and empty-leg alert forms each need a tick before sending, recorded with the enquiry; alerts and news keep their separate tick | PDPA s.14; same as the Navoryx forms | Claude builds, Morten approves |
| 11 | Legal pages approved | Privacy notice, Website terms of use and Terms of business approved against the compliance register (or by counsel, Morten's choice) | — | Morten |
| 12 | Test data deleted | Test enquiries and test records removed from the portal | Retention | Morten |
| 13 | Payment provider | Agreed; clients pay only through its secure payment request | CLAUDE.md, Money | Morten |

Then: set `company.LAUNCHED = True` (the build refuses while any item is open), release staging to main, turn off the
Vercel login for the website's production address, and submit the sitemap to the search engines.

Note: items 6 and 7 also concern the portal, which is already live with brokers' personal data.
