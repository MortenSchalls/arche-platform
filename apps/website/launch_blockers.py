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
        "3 Data Protection Officer (Morten, appointed 9 Nov 2026) filed on ACRA BizFile+ once the company is registered (policy B1)",
        "4 Approve: Privacy notice, Website terms of use, Terms of business and the Data Protection Policy and compliance register (docs/DATA-PROTECTION-POLICY.md, drafted 9 Nov 2026), or have counsel review them",
        "5 Vercel Pro team with two-factor sign-in (the Vercel DPA covers only Pro and Enterprise; Hobby is for non-commercial use); 2FA on Supabase, GitHub, Resend, Anthropic and the mailbox",
        "6 Data processing agreements accepted and a copy saved: Vercel (Pro), Supabase (region checked), Resend, Anthropic, GitHub and the mail provider (policy A6)",
        "7 Data intermediary agreement with the Navoryx company signed (heads of terms: policy Part D)",
        "8 EU and UK representatives appointed and named in the Privacy notice, or a reasoned decision not to recorded and signed off (policy Part C)",
        "9 Payment provider agreed (clients pay only through its secure payment request)",
        "10 Launch day: test enquiries and test records deleted from the portal (policy A4)",
    ]
    return b
