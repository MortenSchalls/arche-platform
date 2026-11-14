"""Reference check for the journey map's routes (Morten, 13 Nov 2026: "they normally do not fly these routes ... do some
research and get it right, use historical data to ensure we do not make mistakes, that is crucial if we offer this
function"). Each rule below is what flights between these regions are reported to do, with its source; every route in
content/routes.json between the places named must keep to it. Run after tools/routes.py:
    python3 apps/website/tools/route_reference.py

Sources (checked 13 Nov 2026):
  OPS   OPSGROUP, "Dodging Danger: The Three Routes Through the Middle East", 18 Nov 2024: the north route (Turkey, the
        Caucasus, the Caspian, Turkmenistan, Afghanistan, Pakistan) "is the route being favored between destinations in
        Europe and India/South East Asia". https://ops.group/blog/dodging-danger-the-three-routes-through-the-middle-east/
  REU   Reuters (via ThePrint), "Airlines fly over Afghanistan as Middle East becomes the greater risk", 23 Aug 2024:
        flight-tracking data shows Singapore Airlines, British Airways, Lufthansa, Air France-KLM, Turkish and Thai
        overflying Afghanistan at high altitude. https://theprint.in/world/airlines-fly-over-afghanistan-as-middle-east-becomes-the-greater-risk/2234881/
  EASA  CZIB-2017-08R19 Afghanistan (not below FL320) and CZIB-2018-02R21 Pakistan (not below FL260 over Baluchistan and
        Khyber Pakhtunkhwa), both revised 24 Jul 2026, valid to 31 Jan 2027; Iran and Iraq: no operations at any altitude.
  WEGO  Wego, "How Europe-Asia flights are being rerouted around the Middle East (2026)", checked 10 Sep 2026: the
        northern corridor (Turkiye, Georgia, Azerbaijan, Turkmenistan or Uzbekistan) for northern India, mainland
        South-East Asia and East Asia; the southern corridor (Egypt, southern Saudi Arabia, Oman, the Arabian Sea) for
        South-East Asia, Australia and southern India. https://blog.wego.com/how-flights-between-europe-and-asia-are-being-rerouted-around-the-middle-east-in-2026/
  FIN   Finnair, "Avoiding Russian airspace": to Japan and Korea either over the pole or the southern route through
        Central Asia. https://finnair.com/en/bluewings/world-of-finnair/avoiding-russian-airspace--from-a-shortcut-to-a-detour-2553644
"""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
import routing

R = json.load(open(os.path.join(HERE, "content", "routes.json")))
P = [p.split("/")[2] for p in R["places"]]
IX = {p: i for i, p in enumerate(P)}

# the corridor rules and their sources are shared with the Navoryx site (docs/AIRSPACE.json "references", a copy in each
# repository, 13 Nov 2026); places are matched by name, and names this site has no page for are left out
REF = routing.SHARED["references"]
_PL = json.load(open(os.path.join(HERE, "content", "map_places.json"), encoding="utf-8"))["places"]
_BYNAME = {p["name"]: p["path"].split("/")[2] for p in _PL}
def group(name):
    return [_BYNAME[n] for n in REF["groups"][name] if n in _BYNAME]
def box(b):
    return lambda p: b[0] <= p[0] <= b[1] and b[2] <= p[1] <= b[3]
BOX = {k: box(v) for k, v in REF["boxes"].items()}

def samples(pts):
    out = []
    for a, b in zip(pts, pts[1:]):
        out += routing.gc_points(tuple(a), tuple(b), 60)
    return out

def routes(a, b):
    """the nonstop route and every route with a fuel stop shown on the map for this pair"""
    i, j = sorted([IX[a], IX[b]]); v = R["routes"][f"{i}|{j}"]
    out = [v["r"][1]] if v["r"] else [None]
    return out + [x[3] for x in v["v"].values() if x]

fails, checked = [], 0
def rule(name, pairs, test, src):
    global checked
    for a, b in pairs:
        for k, pts in enumerate(routes(a, b)):
            if pts is None: fails.append(f"{a}-{b}: no route ({name})"); continue
            checked += 1
            if not test(samples(pts)): fails.append(f"{a}-{b}{' (with a fuel stop)' if k else ''}: {name} [{src}]")

def shared(r):
    def test(S):
        ok = True
        if "pass" in r:
            ok = any(all(any(BOX[x](p) for p in S) for x in alt) for alt in r["pass"])
        if ok and "never" in r:
            ok = not any(BOX[x](p) for x in r["never"] for p in S)
        if ok and "max_lat" in r:
            ok = max(p[0] for p in S) <= r["max_lat"]
        return ok
    return test
for _r in REF["rules"]:
    rule(_r["name"], [(a, b) for a in group(_r["between"][0]) for b in group(_r["between"][1]) if a != b], shared(_r), ", ".join(_r["src"]))
rule("no route enters Iran or Iraq",
     [(a, b) for a in P for b in P if IX[a] < IX[b]],
     lambda S: not any(routing.inside(p, routing.AREAS["mideast"]) for p in S), "EASA")

if fails:
    print(f"route reference: {len(fails)} of {checked} routes do not match"); [print("  " + f) for f in fails[:40]]; sys.exit(1)
print(f"route reference: all {checked} routes (nonstop and with a fuel stop) match the published corridors")
