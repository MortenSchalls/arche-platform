"""Pre-launch check of the public website. Lists anything that must not go live.
Run:  python3 apps/website/check_site.py   (exit code 1 while something is left)"""
import os, re, sys
import company
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
RULES = [(r"0000 0000|6500000000", "phone placeholder: set PHONE in company.py"),
         (r"\[Placeholder\]|\[registration number\]|\[date\]|\[●\]|\[privacy contact email\]", "text placeholder"),
         (r"Paynode", "payment provider named on a client page (terms Part B is checked by hand)"),
         (r"charter@archeexecutive\.com|archeexecutive\.com", "old domain"),
         (r"Bangkok office|สำนักงานกรุงเทพ|曼谷办事处|バンコクオフィス|\+66", "Bangkok office or Thai number (Singapore only)")]
problems = []
for f in sorted(os.listdir(HERE)):
    if not f.endswith(".html"): continue
    t = open(os.path.join(HERE, f), encoding="utf-8").read()
    for rx, why in RULES:
        if f == "terms.html" and why.startswith("payment"): continue
        n = len(re.findall(rx, t))
        if n: problems.append(f"{f}: {why} ({n}x)")
if not company.UEN: problems.append("company.py: UEN not set (add it when ACRA registration is done)")
print("\n".join(problems) or "Website ready: no placeholders left.")
sys.exit(1 if problems else 0)
