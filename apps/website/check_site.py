"""Pre-launch check of the public website. Lists anything that must not go live.
Run:  python3 apps/website/check_site.py   (exit code 1 while something is left)"""
import os, re, sys, json
import company
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
RULES = [(r"0000 0000|6500000000", "phone placeholder: set PHONE in company.py"),
         (r"\[Placeholder\]|\[registration number\]|\[date\]|\[●\]|\[privacy contact email\]", "text placeholder"),
         (r"(?i)paynode", "Paynode named (removed everywhere until Morten agrees otherwise)"),
         (r"charter@archeexecutive\.com|archeexecutive\.com", "old domain"),
         (r"Bangkok office|สำนักงานกรุงเทพ|曼谷办事处|バンコクオフィス|\+66", "Bangkok office or Thai number (Singapore only)")]
EXCL = json.load(open(os.path.join(os.path.dirname(HERE), "content", "excluded.json"), encoding="utf-8"))
RULES.append((r"(?i)\b(" + "|".join(re.escape(w) for w in EXCL["countries"] + EXCL["words"]) + r")\b", "sanctioned place named (must not be on the website)"))
problems = []
pages = sorted(os.path.relpath(os.path.join(d, f), HERE) for d, _, fs in os.walk(HERE) for f in fs if f.endswith(".html") and "/vendor" not in d)
for f in pages:
    t = open(os.path.join(HERE, f), encoding="utf-8").read()
    for rx, why in RULES:
        n = len(re.findall(rx, t))
        if n: problems.append(f"{f}: {why} ({n}x)")
if not company.UEN: problems.append("company.py: UEN not set (add it when ACRA registration is done)")
print("\n".join(problems) or "Website ready: no placeholders left.")
sys.exit(1 if problems else 0)
