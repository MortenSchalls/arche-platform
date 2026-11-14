"""Reference check for the journey map's routes (Morten, 13 Nov 2026: "use historical data to ensure we do not make
mistakes, that is crucial if we offer this function"). The rules and their sources are the "references" section of
docs/AIRSPACE.json, the copy shared with the Navoryx site (Morten, 14 Nov 2026: "apply same rules to Navoryx"): what flights
between these regions are reported to do. Every route in content/routes.json between the places named, nonstop and with a
fuel stop, must keep to each rule; and no route enters an area the shared file closes. Run after tools/routes.py:
    python3 apps/website/tools/route_reference.py      (exit 1 on a mismatch)
"""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
import routing

REF = routing.SHARED["references"]
R = json.load(open(os.path.join(HERE, "content", "routes.json")))
NAMES = {p["name"]: p["path"].split("/")[2] for p in json.load(open(os.path.join(HERE, "content", "map_places.json")))["places"]}
P = [p.split("/")[2] for p in R["places"]]
IX = {p: i for i, p in enumerate(P)}
BOX = {k: (lambda b: (lambda p: b[0] <= p[0] <= b[1] and b[2] <= p[1] <= b[3]))(v) for k, v in REF["boxes"].items()}


def group(name):
    return [NAMES[n] for n in REF["groups"][name] if n in NAMES]


def samples(pts):
    out = []
    for a, b in zip(pts, pts[1:]):
        out += routing.gc_points(tuple(a), tuple(b), 60)
    return out


def routes(a, b):
    """the nonstop route and every route with a fuel stop shown on the map for this pair"""
    i, j = sorted([IX[a], IX[b]]); v = R["routes"][f"{i}|{j}"]
    return ([v["r"][1]] if v["r"] else [None]) + [x[3] for x in v["v"].values() if x]


fails, checked = [], 0
for rule in REF["rules"]:
    g1, g2 = rule["between"]
    for a in group(g1):
        for b in group(g2):
            if a == b:
                continue
            for k, pts in enumerate(routes(a, b)):
                if pts is None:
                    fails.append(f"{a}-{b}: no route"); continue
                checked += 1
                S = samples(pts)
                ok = True
                if "pass" in rule:
                    ok = any(all(any(BOX[x](p) for p in S) for x in alt) for alt in rule["pass"])
                if ok and "never" in rule:
                    ok = not any(BOX[x](p) for x in rule["never"] for p in S)
                if ok and "max_lat" in rule:
                    ok = max(p[0] for p in S) <= rule["max_lat"]
                if not ok:
                    fails.append(f"{a}-{b}{' (with a fuel stop)' if k else ''}: {rule['name']} [{', '.join(rule['src'])}]")

# no route through a closed area (beyond the arrival and departure allowances)
for key, v in R["routes"].items():
    i, j = map(int, key.split("|"))
    for k, pts in enumerate([v["r"][1]] if v["r"] else []):
        for x, y in zip(pts, pts[1:]):
            if routing.blocked(tuple(x), tuple(y), (tuple(pts[0]), tuple(pts[-1]))):
                fails.append(f"{P[i]}-{P[j]}: a leg crosses a closed area"); break

if fails:
    print(f"route reference: {len(fails)} mismatches ({checked} checks)"); [print("  " + f) for f in fails[:40]]; sys.exit(1)
print(f"route reference: all {checked} checks (nonstop and with a fuel stop) match the published corridors; no route crosses a closed area")
