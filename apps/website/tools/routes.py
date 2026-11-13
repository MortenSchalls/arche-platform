"""Builds content/routes.json for the journey map: for every pair of city pages, the routed distance around restricted
airspace and, for each aircraft in the aircraft guide, nonstop, one named fuel stop, or not shown (routing.py, the same
rules as the Navoryx planner). Run after changing the places, the aircraft or the restricted areas:
    python3 apps/website/tools/routes.py"""
import json, os, sys, datetime, time
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
import routing

C = os.path.join(HERE, "content")
P = json.load(open(os.path.join(C, "map_places.json"), encoding="utf-8"))["places"]
AC = json.load(open(os.path.join(C, "aircraft_perf.json"), encoding="utf-8"))["models"]
GULF = {"/cities/doha/", "/cities/dubai/", "/cities/riyadh/"}   # no fuel stops in the Gulf while its bulletins are active
stops = {routing.STOPS[k]: tuple(routing.NODES[k]) for k in routing.STOPS}
for p in P:
    if p["path"] not in GULF:
        stops[p["name"]] = (p["lat"], p["lon"])
ranges = sorted({m["range_nm"] for m in AC})
t0 = time.time(); out = {}
for i, a in enumerate(P):
    for b in P[i + 1:]:
        r = routing.plan_pair((a["lat"], a["lon"]), (b["lat"], b["lon"]), stops, ranges)
        rt = r["route"]
        out[f"{i}|{P.index(b)}"] = {
            "d": round(r["direct"]),
            "r": [round(rt[0]), [[round(x, 1), round(y, 1)] for x, y in rt[1]], rt[2]] if rt else None,
            "v": {str(k): (0 if v == 0 else None if v is None else [v[0], round(v[1]), [round(x) for x in v[2]],
                                                                    [[round(x, 1), round(y, 1)] for x, y in v[3]], v[4]])
                  for k, v in r["via"].items()}}
json.dump({"built": datetime.date.today().isoformat(), "areas_checked": "10 Nov 2026 (EASA conflict-zone bulletins; Russia closed to EU, UK, US and Swiss-registered aircraft)",
           "places": [p["path"] for p in P], "routes": out}, open(os.path.join(C, "routes.json"), "w"), separators=(",", ":"))
print(len(out), "routes in", round(time.time() - t0), "s")
