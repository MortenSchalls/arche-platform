#!/usr/bin/env python3
"""All or none (Morten, 8 Nov 2026): "each change we do, also change all related documents and manuals, we cannot have a
situation where only half is revised, all or none and all means audited."

This check rebuilds every generated text from its master and fails if anything committed differs, so a change that
reached only some of the places it belongs cannot pass the Portal checks. The map of what depends on what is
docs/CHANGE-MAP.md. Run it from anywhere:  python3 scripts/check_all_revised.py
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / "apps"
fails = []

def ok(name, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or not detail else "  -> " + detail))
    if not cond: fails.append(name)

def run(cmd, cwd):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode: print(r.stdout[-2000:], r.stderr[-2000:]); fails.append("ran: " + " ".join(cmd))
    return r

# 1. The manual's body (body38.js, read by the academy) is the same text as the Word manual (manual38.js).
norm = lambda s: s.replace("Archē", "Arche")
m = norm((A / "manual/manual38.js").read_text()).split("\n")
b = [l for l in norm((A / "manual/body38.js").read_text()).split("\n") if l.strip()]
try:
    i = m.index(b[0]); j = len(m) - 1 - m[::-1].index(b[-1])
    same = [l for l in m[i:j + 1] if l.strip()] == b
except ValueError:
    same = False
ok("manual: body38.js is the same text as the Word manual (manual38.js)", same)

# 2. The portal's Help and FAQ (guide.json) are the manual's Appendix H and I (manual/portal-guide.json).
g = json.loads((A / "manual/portal-guide.json").read_text())
want = json.dumps({"version": g["version"], "features": g["features"], "faq": g["faq"]}, indent=1, ensure_ascii=False)
have = json.dumps(json.loads((A / "portal/guide.json").read_text()), indent=1, ensure_ascii=False)
ok("portal Help and FAQ = manual Appendix H and I (run node apps/manual/manual38.js)", want == have)

# 3. Every portal module is the same in src-modules/ and in index.html (the owner's SQL is filled in index.html only).
idx = (A / "portal/index.html").read_text()
idx_n = re.sub(r"^const OWNER_SQL = .*$", "const OWNER_SQL = /*SQL*/{};", idx, flags=re.M)
bad = [p.name for p in sorted((A / "portal/src-modules").glob("*.js")) if p.read_text().rstrip("\n") not in idx_n]
ok("portal: every src-modules file is in index.html unchanged", not bad, ", ".join(bad))

# 4. Regenerate everything built from a master, then nothing may differ from what is there now.
gen = ["apps/portal/src-modules/agreement-text.js", "apps/academy/build/manual.json", "apps/academy/build/edition_map.json",
       "apps/academy/dist/arche-broker-academy.html", "apps/academy/dist/charter-broker-academy.html",
       "apps/portal/academy.html", "apps/portal/academy.test.html", "apps/portal/test.html"]
before = {g: (ROOT / g).read_bytes() for g in gen}
run(["python3", "make_agreement.py"], A / "portal")
run(["node", "extract.js"], A / "academy/build")
run(["python3", "build.py"], A / "academy/build")
for n in ("arche-broker-academy.html", "charter-broker-academy.html"):
    (A / "academy/dist" / n).write_bytes((A / "academy/build" / n).read_bytes())
run(["python3", "make_academy.py"], A / "portal")
run(["python3", "build_test.py"], A / "portal")
changed = [g for g in gen if (ROOT / g).read_bytes() != before[g]]
ok("generated files match their masters (agreement, academy from the manual, portal copies of the academy, test version)", not changed,
   "rebuilt and changed: " + ", ".join(changed) + " (commit the rebuilt files with the change)")
subprocess.run(["git", "checkout", "-q", "--", "apps/academy/build/chk_mobile_dark.png"], cwd=ROOT)

# 5. The agreement shown in the portal is the agreement source (agreement-text.js is inside index.html, checked by 3).
# 6. The academy's recording list must cover today's screens; the screen walk lives in apps/academy/audio/screens.js and
#    is run by the narration workflow on push; the academy audio test checks a recorded voice never mixes with the device.

print(f"{len(fails)} FAILED" if fails else "ALL REVISED TOGETHER")
sys.exit(1 if fails else 0)
