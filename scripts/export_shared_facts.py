"""Copy of the checked place facts for the other public website (Morten, 9 Nov 2026: research once, used by both;
"important is that we have the option to sever the ties between each if needed ie. sale, exit or closing the business
without harming any data or flow"). Writes docs/SHARED-FACTS.json: the facts, airport rules and official sources behind
every place in docs/PLACES.json. It is a copy, never a link: the other website keeps its own copy and builds from it
alone, so stopping this export changes nothing there (docs/SEVERANCE.md). Only public, official-source facts go in:
no client, broker, operator, supplier or investor data. Run: python3 scripts/export_shared_facts.py"""
import json, os, re, datetime, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(ROOT, "apps", "website", "content")
F = json.load(open(f"{C}/facts.json")); S = json.load(open(f"{C}/sources.json"))
PL = json.load(open(f"{ROOT}/docs/PLACES.json"))
pages = {json.load(open(f"{C}/pages/{f}"))["path"]: json.load(open(f"{C}/pages/{f}")) for f in os.listdir(f"{C}/pages")}
out = {"_why": __doc__.split("\n\n")[0].replace("\n", " "), "exported": datetime.date.today().isoformat(), "places": []}
used_src = set()
for x in PL["places"]:
    keys = set()
    for path in x["arche"]:
        p = pages[path]; t = json.dumps(p, ensure_ascii=False)
        keys |= set(re.findall(r"\{\{([a-z0-9_.]+)\}\}", t)) | {g[1] for g in p.get("glance", [])}
    prefixes = {k.split(".")[0] for k in keys}
    facts = {k: v for k, v in F.items() if k.split(".")[0] in prefixes}
    airports = {}
    for pre in prefixes:
        fp = f"{C}/airports/{pre.upper()}.json"
        if os.path.exists(fp):
            a = json.load(open(fp)); airports[a["icao"]] = {k: a[k] for k in ("icao", "iata", "name", "city", "country", "status", "checked", "rules", "missing")}
            used_src |= {r["src"] for r in a["rules"].values()}
    used_src |= {v["src"] for v in facts.values()}
    out["places"].append({"place": x["place"], "country": x["country"], "navoryx": x.get("navoryx"), "facts": facts, "airports": airports})
out["sources"] = {k: S[k] for k in sorted(used_src) if k in S}
json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else f"{ROOT}/docs/SHARED-FACTS.json", "w"), ensure_ascii=False, indent=1)
print(len(out["places"]), "places,", sum(len(p["facts"]) for p in out["places"]), "facts,", len(out["sources"]), "sources")
