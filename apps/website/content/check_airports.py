"""Checks the airport rules files (content/airports/<ICAO>.json) used by the portal's trip checks and the website.
Every rule needs a source from sources.json checked within 365 days; structured fields must be well formed;
no airport in a sanctioned country (excluded.json). Run:  python3 apps/website/content/check_airports.py"""
import json, os, re, sys, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
RULES = {"runway", "curfew", "customs", "slots", "ppr", "max_aircraft", "handling", "noise", "fuel", "hours", "permits", "deicing", "catering"}
class Bad(Exception): pass

def run(verbose=True):
    S = json.load(open(os.path.join(HERE, "sources.json"), encoding="utf-8"))
    X = json.load(open(os.path.join(HERE, "excluded.json"), encoding="utf-8"))
    today = datetime.date.today(); out = []; d = os.path.join(HERE, "airports")
    for f in sorted(os.listdir(d)):
        if not f.endswith(".json") or f.startswith("_"): continue
        a = json.load(open(os.path.join(d, f), encoding="utf-8")); n = f[:-5]
        if a.get("icao") != n or not re.fullmatch(r"[A-Z0-9]{4}", n): raise Bad(f"{f}: icao must match the file name")
        if not re.fullmatch(r"[A-Z]{2}", a.get("country", "")): raise Bad(f"{f}: country must be a 2-letter ISO code")
        if a["country"] in X["iso2"] or (a.get("iata") or "") in X["airports_iata"]: raise Bad(f"{f}: airport in a sanctioned country; remove it")
        if a.get("status") not in ("verified", "partial", "unavailable"): raise Bad(f"{f}: status must be verified, partial or unavailable")
        for k in ("name", "city", "tz", "checked"): 
            if not a.get(k): raise Bad(f"{f}: missing {k}")
        rules = a.get("rules", {})
        if a["status"] != "unavailable" and not rules: raise Bad(f"{f}: no rules recorded; use status unavailable")
        for k, r in rules.items():
            if k not in RULES: raise Bad(f"{f}: unknown rule {k}")
            if not r.get("v") or not r.get("src"): raise Bad(f"{f}: rule {k} needs a value and a source")
            if r["src"] not in S: raise Bad(f"{f}: rule {k}: source {r['src']} not in sources.json")
            age = (today - datetime.date.fromisoformat(S[r["src"]]["checked"])).days
            if age > 365: raise Bad(f"{f}: rule {k}: source checked more than 365 days ago; check again")
            if k == "curfew" and not r.get("none"):
                for w in r.get("windows_local", []):
                    if not (len(w) == 2 and all(re.fullmatch(r"[0-2]\d:[0-5]\d", x) for x in w)): raise Bad(f"{f}: curfew windows_local must be [\"HH:MM\",\"HH:MM\"]")
                if not r.get("windows_local"): raise Bad(f"{f}: curfew needs windows_local, or none: true")
            if k == "runway" and not isinstance(r.get("longest_m"), (int, float)): raise Bad(f"{f}: runway needs longest_m (metres)")
            if k == "customs" and "h24" not in r and not r.get("hours_local"): raise Bad(f"{f}: customs needs h24 true/false or hours_local")
        out.append({"icao": n, "status": a["status"], "rules": sorted(rules)})
    if verbose: print(f"  airports: {len(out)} files, {sum(1 for o in out if o['status']=='verified')} verified, {sum(1 for o in out if o['status']=='partial')} partial, {sum(1 for o in out if o['status']=='unavailable')} unavailable")
    return out

if __name__ == "__main__":
    try: run()
    except Bad as e: print("STOP:", e); sys.exit(1)
