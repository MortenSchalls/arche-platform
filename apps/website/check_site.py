"""Pre-launch check of the public website. Lists anything that must not go live.
Run:  python3 apps/website/check_site.py   (exit code 1 while something is left)"""
import os, re, sys, json
import company
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
RULES = [(r"0000 0000|6500000000", "phone placeholder: set PHONE in company.py"),
         (r"\[Placeholder\]|\[registration number\]|\[date\]|\[●\]|\[privacy contact email\]", "text placeholder"),
         (r"(?i)paynode", "Paynode named (removed everywhere until Morten agrees otherwise)"),
         (r"charter@archeexecutive\.com|archeexecutive\.com", "old domain"),
         (r"fonts\.googleapis\.com|fonts\.gstatic\.com", "font loaded from a font service (sends visitors' addresses to it): run self_fonts.py"),
         (r"office-bangkok|Bangkok office|สำนักงานกรุงเทพ|曼谷办事处|バンコクオフィス|\+66", "Bangkok office or Thai number (Singapore only)")]
EXCL = json.load(open(os.path.join(os.path.dirname(HERE), "content", "excluded.json"), encoding="utf-8"))
RULES.append((r"(?i)\b(" + "|".join(re.escape(w) for w in EXCL["countries"] + EXCL["words"]) + r")\b", "sanctioned place named (must not be on the website)"))
problems = []
pages = sorted(os.path.relpath(os.path.join(d, f), HERE) for d, _, fs in os.walk(HERE) for f in fs if f.endswith(".html") and "/vendor" not in d)
for f in pages:
    t = open(os.path.join(HERE, f), encoding="utf-8").read()
    for rx, why in RULES:
        n = len(re.findall(rx, t))
        if n: problems.append(f"{f}: {why} ({n}x)")
# Same audit philosophy as the Navoryx site (Morten, 9 Nov 2026: "use the same audit philosophy across all builds")
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
notes = []
# 1. places on both websites: docs/PLACES.json, identical in both repositories
PL = json.load(open(os.path.join(REPO, "docs", "PLACES.json"), encoding="utf-8")) if company.SHARED_SITE else {"places": []}   # docs/SEVERANCE.md
mine = {}
for f in os.listdir(os.path.join(os.path.dirname(HERE), "content", "pages")):
    p = json.load(open(os.path.join(os.path.dirname(HERE), "content", "pages", f), encoding="utf-8"))
    if p["type"] in ("city", "country"): mine[p["path"]] = p
listed = {a for x in PL["places"] for a in x["arche"]}
for path in (sorted(set(mine) - listed) if company.SHARED_SITE else []): problems.append(f"places: {path} is not in docs/PLACES.json (add it there and on the other website)")
for x in PL["places"]:
    for a in x["arche"]:
        if a not in mine: problems.append(f"places: {x['place']}: {a} is listed but has no page")
    if not x["arche"] or not x.get("navoryx"):
        if x.get("waiting"): notes.append(f"places: {x['place']} waiting: {x['waiting']}")
        else: problems.append(f"places: {x['place']} is on one website only, with no reason given")
    if company.LAUNCHED and x["arche"] and all(mine.get(p, {}).get("draft") for p in x["arche"]):
        problems.append(f"places: {x['place']}: every page is still a draft, so the launched site would not show it")
if company.SHARED_SITE:   # the copy for the other website must match the facts here (docs/SEVERANCE.md)
    import subprocess, tempfile
    tmp = os.path.join(tempfile.mkdtemp(), "f.json")
    subprocess.run([sys.executable, os.path.join(REPO, "scripts", "export_shared_facts.py"), tmp], check=True, capture_output=True)
    now, cur = json.load(open(tmp)), json.load(open(os.path.join(REPO, "docs", "SHARED-FACTS.json")))
    if now["places"] != cur["places"] or now["sources"] != cur["sources"]:
        problems.append("docs/SHARED-FACTS.json is older than the facts: run python3 scripts/export_shared_facts.py and copy it to navoryx-website")
drafts = sorted(p for p, v in mine.items() if v.get("draft"))
if drafts: notes.append(f"{len(drafts)} city and country pages are drafts waiting for Morten's approval: " + ", ".join(drafts))
# 2. legal pages: what the PDPA asks a notice to cover, and the website terms
LEGAL = {"privacy.html": ["Personal Data Protection Act 2012", "Data Protection Officer", "Do Not Call Registry", "Personal Data Protection Commission",
                          "standard contractual clauses", "thirty days", "Cookies", "How long we keep it", "Children"],
         "website-terms.html": ["Information, not an offer", "Liability", "death or personal injury", "laws of Singapore", "Privacy notice"],
         "terms.html": ["B6", "Privacy notice", "Website terms of use"]}
for f, need in LEGAL.items():
    fp = os.path.join(HERE, f)
    t = open(fp, encoding="utf-8").read() if os.path.exists(fp) else ""
    for w in need:
        if w not in t: problems.append(f"{f}: missing \"{w}\"")
# 3. layout gate: tools/layout_audit.js must have run on exactly these built pages and found nothing
import hashlib
h = hashlib.sha256()
def _walk(d):
    for f in sorted(os.listdir(d)):
        p = os.path.join(d, f)
        if os.path.isdir(p): _walk(p)
        elif f.endswith((".html", ".css", ".js")): h.update(os.path.relpath(p, HERE).replace(os.sep, "/").encode()); h.update(open(p, "rb").read())
_walk(HERE)
stamp = os.path.join(os.path.dirname(HERE), "audit", "layout.json")
if not os.path.exists(stamp): problems.append("layout audit not run: NODE_PATH=$(npm root -g) node apps/website/tools/layout_audit.js")
else:
    L = json.load(open(stamp))
    if L["site_hash"] != h.hexdigest(): problems.append("layout audit is older than the built pages: run it again")
    elif L["findings"]: problems.append(f"layout audit found {len(L['findings'])} problems (apps/website/audit/layout.json)")
for n in notes: print("NOTE:", n)
# launch blockers that only a person can close (launch_blockers.py, Morten 9 Nov 2026)
from launch_blockers import launch_blockers
for b in launch_blockers():
    problems.append("launch blocker: " + b)
print("\n".join(problems) or "Website ready: no placeholders left.")
sys.exit(1 if problems else 0)
