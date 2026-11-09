"""Launch blockers for the Archē website: everything that must be sorted out before it goes live (Morten, 9 Nov 2026:
"keep record on the missing items so we cannot launch before having these sorted out"; "ensure we follow same GDPR
rules as Navoryx and that it is indeed a blocker for launch"). The same lock as the Navoryx site: build.py refuses to
build with company.LAUNCHED = True while any item is open, and check_site.py lists them on every run. Remove a line
only when the item is done and Morten has confirmed it, in the same commit as docs/LAUNCH-BLOCKERS.md; never to get a
pass."""
import company


def launch_blockers():
    b = []
    if not company.UEN: b.append("1 Company: Arche Executive Pte. Ltd. registered with ACRA and the UEN set in company.py")
    if not company.PHONE: b.append("2 Phone: Singapore business number set in company.py (also used for WhatsApp)")
    b += [
        "3 Data Protection Officer appointed and privacy@archeaviation.com answered (PDPA s.11; the Privacy notice names the role)",
        "4 DPO filed on ACRA BizFile+ after incorporation (Update Company Information > Data Protection Officer)",
        "5 Written Data Protection Policy and compliance register for Archē (PDPA s.12), like the Navoryx policy: purposes, retention routine, access and correction, breach plan, request and breach logs",
        "6 Vercel Pro team with two-factor sign-in (the Vercel DPA covers only Pro and Enterprise; Hobby is for non-commercial use)",
        "7 Data processing agreements accepted and a copy kept, with transfer clauses: Vercel (Pro), Supabase (region checked), Resend, Anthropic and the mail provider (PDPA s.24 and s.26; the Privacy notice says so)",
        "8 Data intermediary agreement with the Navoryx company for the investor-relations records the portal keeps for it (docs/SEVERANCE.md)",
        "9 EU and UK representatives (GDPR and UK GDPR Art. 27) appointed and named in the Privacy notice, or a reasoned decision not to appoint them recorded and signed off by Morten",
        "10 Consent tick on the quote, call-back and empty-leg alert forms, recorded with each enquiry (as on the Navoryx forms); alerts and news keep their own separate tick",
        "11 Privacy notice, Website terms of use and Terms of business approved by Morten against the compliance register (or by counsel, his choice)",
        "12 Test enquiries and test records deleted from the portal before launch",
        "13 Payment provider agreed (clients pay only through its secure payment request)",
    ]
    return b
