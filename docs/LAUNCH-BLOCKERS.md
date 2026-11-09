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
| 3 | Data Protection Officer | Confirmed who it is (privacy@archeaviation.com is live, role on the Privacy page); filed on BizFile+ after registration | PDPA s.11(3)-(5) | Morten |
| 4 | Approvals | Privacy notice, Website terms of use, Terms of business and `docs/DATA-PROTECTION-POLICY.md` (drafted 9 Nov 2026) approved, or reviewed by counsel | PDPA s.12, s.20 | Morten |
| 5 | Vercel Pro with 2FA | Archē on a Pro team, DPA accepted, 2FA on Vercel and the other accounts | Vercel DPA only on Pro/Enterprise; Hobby is non-commercial | Morten (purchase) |
| 6 | Processor agreements | DPAs saved: Vercel, Supabase (region checked), Resend, Anthropic, GitHub, mail provider | PDPA s.24, s.26; GDPR Art. 28, 46 | Morten |
| 7 | Data intermediary agreement with Navoryx | Signed (heads of terms in the policy, Part D) | PDPA s.4(2), s.24; `docs/SEVERANCE.md` | Morten |
| 8 | EU and UK representatives | Appointed and named in the Privacy notice, or a reasoned decision recorded (policy Part C) | GDPR / UK GDPR Art. 27 | Morten |
| 9 | Payment provider | Agreed; clients pay only through its secure payment request | CLAUDE.md, Money | Morten |
| 10 | Launch day: test data | Test enquiries and records deleted from the portal | Policy A4 | Morten |

Closed 9 Nov 2026 (built and tested on staging): consent tick on the quote, call-back and empty-leg alert forms (the
server refuses an enquiry without it); written Data Protection Policy and compliance register drafted (approval in
item 4); BizFile+ DPO filing folded into item 3.

Then: set `company.LAUNCHED = True` (the build refuses while any item is open), release staging to main, turn off the
Vercel login for the website's production address, and submit the sitemap to the search engines.

Note: items 6 and 7 also concern the portal, which is already live with brokers' personal data.
