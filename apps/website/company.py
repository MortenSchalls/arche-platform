"""Company details on the website (Morten, 26 Oct 2026). Change them here only; build.py applies them on every build.
UEN: add the registration number when corporate services sends it, then run  python3 apps/website/company.py"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
NAME = "Arche Executive Pte. Ltd."
ADDRESS = "20 Collyer Quay, #09-01, Singapore 049319"
UEN = ""   # registration number, e.g. "202612345A"
EMAIL = "contact@archeaviation.com"   # public enquiry address (Morten, 26 Oct 2026; was charter@archeexecutive.com)
PRIVACY = "privacy@archeaviation.com"   # data protection requests (alias on contact@, 26 Oct 2026)
PHONE = ""       # Singapore business number, e.g. "+65 6123 4567"; also used for WhatsApp. Until set, the site shows a placeholder and check_site.py fails
LINE_ID = ""     # e.g. "@archeexecutive" once the LINE Official Account exists; until then the LINE card is left out
WECHAT_ID = ""   # e.g. "ArcheExecutive" once the WeChat account exists; until then the WeChat card is left out
# The website switch (Morten, 27 Oct 2026: "ensure nothing is live before we switch the website on").
# False (test website, behind Vercel Authentication): every page and draft is built and linked so Morten can use the
#   whole site, but every page also says "noindex, nofollow" and robots.txt shuts search engines out, in case the
#   login is ever off. True (launch day): search engines welcome; only approved pages are built and linked; drafts
#   are not published at all.
LAUNCHED = False
# Ties with the other public website (docs/SEVERANCE.md, Morten 9 Nov 2026): False on severance; nothing else changes.
SHARED_SITE = True
# Launch blockers (Morten, 9 Nov 2026: "keep record on the missing items so we cannot launch before having these
# sorted out"). Remove a line only when the item is done, with the date and who confirmed it in the commit message.
# build.py refuses to build with LAUNCHED = True while any line is left, and check_site.py lists them every run.
LAUNCH_BLOCKERS = [
    "UEN: Arche Executive Pte. Ltd. registered with ACRA and the number set in UEN above",
    "Phone: Singapore business number set in PHONE above (also used for WhatsApp)",
    "Counsel review of the Privacy notice, Website terms of use and Terms of business",
    "Data Protection Officer appointed and the privacy@ address answered (the Privacy notice names one)",
    "Data processing agreements with transfer clauses signed with the website host, database, email and AI providers (the Privacy notice says so)",
    "Payment provider agreed (clients pay only through its secure payment request)",
]
def pairs():
    line = " · ".join(x for x in (NAME, ("UEN " + UEN) if UEN else "", ADDRESS) if x)
    return [
        ("[Legal entity name · registration no. · registered address]", line),
        ("[Legal entity, Pte. Ltd.]", NAME),
        ("[Office address, Singapore]", ADDRESS),
        ('font-size:11.5px">Singapore</span><span>[Office address]</span>', 'font-size:11.5px">Singapore</span><span>' + ADDRESS + '</span>'),
        ("[registered address, Singapore]", ADDRESS),
        ("charter@archeexecutive.com", EMAIL), ("[privacy contact email]", PRIVACY),
        # the translated placeholders: a legal name and address stay as written in every language
        ("[ชื่อนิติบุคคล, Pte. Ltd.]", NAME), ("[法人名称, Pte. Ltd.]", NAME), ("[法人名, Pte. Ltd.]", NAME),
        ("[ที่อยู่สำนักงาน สิงคโปร์]", ADDRESS), ("[办公地址，新加坡]", ADDRESS), ("[オフィス所在地（シンガポール）]", ADDRESS),
        ("[ชื่อนิติบุคคล · เลขทะเบียน · ที่อยู่จดทะเบียน]", line), ("[法人名称 · 注册号 · 注册地址]", line), ("[法人名 · 登録番号 · 登記住所]", line),
    ] + ([("[registration number]", "UEN " + UEN)] if UEN else [])
def run():
    out, changed = os.path.join(HERE, "site"), []
    for f in os.listdir(out):
        p = os.path.join(out, f)
        if not f.endswith((".html", ".js")) or not os.path.isfile(p): continue
        t = open(p, encoding="utf-8").read(); n = t
        for a, b in pairs(): n = n.replace(a, b)
        if n != t: open(p, "w", encoding="utf-8").write(n); changed.append(f)
    return changed
if __name__ == "__main__":
    print("changed:", run())
