"""Launch blockers for the Archē website: everything that must be sorted out before it goes live (Morten, 9 Nov 2026:
"keep record on the missing items so we cannot launch before having these sorted out"; "ensure we follow same GDPR
rules as Navoryx and that it is indeed a blocker for launch"). The same lock as the Navoryx site: build.py refuses to
build with company.LAUNCHED = True while any item is open, and check_site.py lists them on every run. Remove a line
only when the item is done and Morten has confirmed it, in the same commit as docs/LAUNCH-BLOCKERS.md; never to get a
pass."""
import company


def launch_blockers():
    b = []
    if not company.UEN: b.append("1 Company: Arche Aviation Pte. Ltd. registered with ACRA and the UEN set in company.py")
    if not company.PHONE: b.append("2 Phone: Singapore business number set in company.py (also used for WhatsApp)")
    b += [
        "4 Approve: Terms of business and the Data Protection Policy and compliance register (docs/DATA-PROTECTION-POLICY.md, drafted 9 Nov 2026), or have counsel review them (Privacy notice and Website terms of use approved by Morten 17 Nov 2026)",
        "5 Vercel Pro team with two-factor sign-in (the Vercel DPA covers only Pro and Enterprise; Hobby is for non-commercial use); 2FA on Supabase, GitHub, Resend, Anthropic and the mailbox",
        "6 Data processing agreements accepted and a copy saved: Vercel (Pro), Supabase (region checked), Resend, Anthropic, GitHub and the mail provider (policy A6)",
        "7 Data intermediary agreement with the Navoryx company signed (heads of terms: policy Part D)",
        "8 EU and UK representatives appointed and named in the Privacy notice, or a reasoned decision not to recorded and signed off (policy Part C)",
        "9 Payment provider agreed (clients pay only through its secure payment request)",
        "10 Launch day: test enquiries and test records deleted from the portal (policy A4)",
    ]
    return b


def preview_blockers():
    """The public preview (company.PREVIEW, Morten 17 Nov 2026: "ok for me, do it and show me") collects no personal data:
    every form is the email address. Before Morten turns off the Vercel login for the website, these must be done.
    Done: P2 privacy notice and website terms approved (Morten, 17 Nov 2026: "P2 approved")."""
    return [
        "P1 (part of 5) Two-factor sign-in on Vercel confirmed (the team is on Pro: Morten, 17 Nov 2026)",
    ]
