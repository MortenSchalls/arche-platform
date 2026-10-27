"""Import research JSON (brief in UPKEEP.md) into facts.json, sources.json, airports/<ICAO>.json and country facts (<iso2>.<field>).
Keeps the verbatim quote with every fact. Run: python3 apps/website/content/importer.py research.json [rejected-keys.json]"""
import json, sys, os, datetime, re
C = os.path.dirname(os.path.abspath(__file__))   # content/
TODAY = datetime.date.today().isoformat()
RULES = {"runway", "curfew", "customs", "slots", "ppr", "max_aircraft", "handling", "noise", "fuel", "hours", "permits", "deicing", "catering"}
S = json.load(open(f"{C}/sources.json")); F = json.load(open(f"{C}/facts.json"))
drop = set(json.load(open(sys.argv[2]))) if len(sys.argv) > 2 else set()   # fact keys rejected at spot check
R = json.load(open(sys.argv[1]))
for k, s in R.get("sources", {}).items():
    if not s.get("url", "").startswith("https://"): print("skip source (not https)", k); continue
    S[k] = {"title": s["title"], "url": s["url"], "publisher": s["publisher"], "checked": TODAY}
for a in R.get("airports", []):
    ic = a["icao"].upper(); low = ic.lower(); rules = {}
    g = a.get("geo") or {}
    s0 = g.get("src") or next((f["src"] for f in a.get("facts", {}).values() if f.get("src") in S), None)
    if s0: F[f"{low}.icao"] = {"v": ic, "src": s0}
    if a.get("iata") and g.get("src"): F[f"{low}.iata"] = {"v": a["iata"], "src": g["src"]}
    if g.get("v") and g.get("src") in S: F[f"{low}.geo"] = {"v": g["v"], "src": g["src"], "quote": g.get("quote", "")}
    for k, f in a.get("facts", {}).items():
        key = f"{low}.{k}"
        if key in drop or not f.get("v") or f.get("src") not in S: 
            if f.get("src") not in S: print("no source", key, f.get("src"))
            continue
        F[key] = {"v": f["v"], "src": f["src"], "quote": f.get("quote", "")}
        if k in RULES:
            r = {kk: vv for kk, vv in f.items() if kk not in ("quote",)}
            r["quote"] = f.get("quote", "")
            rules[k] = r
    if "curfew" in rules and not rules["curfew"].get("windows_local") and not rules["curfew"].get("none"): rules.pop("curfew")
    if "runway" in rules and not isinstance(rules["runway"].get("longest_m"), (int, float)): rules.pop("runway")
    if "customs" in rules and "h24" not in rules["customs"] and not rules["customs"].get("hours_local"): rules.pop("customs")
    main = {"runway", "customs", "curfew"}
    status = "verified" if main <= set(rules) or (main - {"curfew"} <= set(rules) and a.get("facts", {}).get("curfew")) else ("partial" if rules else "unavailable")
    out = {"icao": ic, "iata": a.get("iata"), "name": a["name"], "city": a["city"], "country": a["country"], "tz": a["tz"], "tier": 1,
           "status": status, "checked": TODAY, "rules": rules, "missing": a.get("missing", []), "notes": a.get("notes", "")}
    json.dump(out, open(f"{C}/airports/{ic}.json", "w"), ensure_ascii=False, indent=1)
    print(ic, status, sorted(rules))
for c in R.get("countries", []):                       # country facts: <iso2>.<field>, e.g. th.permit
    iso = c["iso2"].lower()
    for k, f in c.get("facts", {}).items():
        key = f"{iso}.{k}"
        if key in drop or not f.get("v") or f.get("src") not in S: print("skip country fact", key); continue
        F[key] = {"v": f["v"], "src": f["src"], "quote": f.get("quote", "")}
    F[f"{iso}.name"] = {"v": c["name"], "src": next((f["src"] for f in c.get("facts", {}).values() if f.get("src") in S), None)}
    print("country", c["iso2"], sorted(c.get("facts", {})))
for k, f in R.get("facts", {}).items():
    if k in drop or not f.get("v") or f.get("src") not in S: print("skip fact", k); continue
    F[k] = {"v": f["v"], "src": f["src"], "quote": f.get("quote", "")}
json.dump(S, open(f"{C}/sources.json", "w"), ensure_ascii=False, indent=1)
json.dump(F, open(f"{C}/facts.json", "w"), ensure_ascii=False, indent=1)
