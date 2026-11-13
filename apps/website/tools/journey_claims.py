"""Checks that what the journey map and the aircraft guide claim holds (Morten, 13 Nov 2026: "ensure the selection of
aircrafts are correct, and that what we claim holds"). Run after tools/routes.py or any change to the aircraft:
    python3 apps/website/tools/journey_claims.py"""
import json, os, re, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); C = os.path.join(HERE, "content")
AC = json.load(open(os.path.join(C, "aircraft_perf.json"), encoding="utf-8"))
R = json.load(open(os.path.join(C, "routes.json"), encoding="utf-8")); P = R["places"]
G = open(os.path.join(HERE, "design-source", "Arche Executive v7.dc.html"), encoding="utf-8").read()
bad = []
for m in AC["models"]:
    g = re.search(r"id: '%s', name: '([^']+)'.*?rangeKm: (\d+).*?route: '([^']+)'" % m["id"], G)
    if not g: bad.append(f"{m['id']}: not in the aircraft guide"); continue
    if int(g.group(2)) != round(m["range_nm"] * 1.852): bad.append(f"{m['id']}: guide range {g.group(2)} km, source {m['range_nm']} nm")
    for f in ("source", "cabin_source"):
        if not (m.get(f) and len(m[f]) == 3 and m[f][1].startswith("https://") and re.match(r"\d{4}-\d\d-\d\d$", m[f][2])): bad.append(f"{m['id']}: {f} incomplete")
    # the guide's example journey must be one the map shows as nonstop for this aircraft
    legs = [x.strip() for x in re.sub(r"\(.*?\)", "", g.group(3)).split("–")]
    for a, b in zip(legs, legs[1:]):
        ia = next((i for i, p in enumerate(P) if p.split("/")[2] == a.lower().replace(" ", "-")), None)
        ib = next((i for i, p in enumerate(P) if p.split("/")[2] == b.lower().replace(" ", "-")), None)
        if ia is None or ib is None: bad.append(f"{m['id']}: example {a} – {b} is not on the map"); continue
        v = R["routes"][f"{min(ia, ib)}|{max(ia, ib)}"]["v"][str(m["range_nm"])]
        if v != 0: bad.append(f"{m['id']}: guide example {a} – {b} is not nonstop on the map ({v and v[0]})")
none = [k for k, v in R["routes"].items() if all(x is None for x in v["v"].values())]
if none: bad.append(f"{len(none)} journeys with no aircraft at one stop or less")
print("\n".join("FAIL " + b for b in bad) or "journey claims: all hold (ranges match the guide, sources complete, guide examples nonstop, every journey has an aircraft)")
sys.exit(1 if bad else 0)
