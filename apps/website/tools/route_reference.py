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

EUROPE = ["london", "paris", "geneva", "milan", "nice", "warsaw"]
SOUTH_ASIA_SEA = ["mumbai", "singapore", "bangkok", "kuala-lumpur", "phuket", "bali", "chiang-mai"]
NORTH_ASIA = ["tokyo", "seoul"]
GULF = ["dubai", "doha", "riyadh"]
SEA = ["singapore", "bangkok", "kuala-lumpur", "phuket", "bali"]

def box(la1, la2, lo1, lo2):
    return lambda p: la1 <= p[0] <= la2 and lo1 <= p[1] <= lo2
CASPIAN = box(36.5, 44.5, 46, 64)            # Caucasus, Caspian, Turkmenistan
SOUTH_ASIA = box(8, 34, 64, 93)              # Afghanistan (south), Pakistan, India, Bay of Bengal
CENTRAL_ASIA = box(37, 52, 56, 95)           # Turkmenistan, Uzbekistan, Kazakhstan, western China
EGYPT = box(22, 32, 25, 36)                  # Egypt and the Red Sea
ARABIA_SEA = box(10, 25, 50, 73)             # southern Arabia, Oman and the Arabian Sea

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

rule("Europe to South Asia and South-East Asia takes the northern corridor (Caspian, then Pakistan or India) or the southern one (Egypt, Arabia, the Arabian Sea), south of the Himalaya",
     [(e, a) for e in EUROPE for a in SOUTH_ASIA_SEA],
     lambda S: ((any(CASPIAN(p) for p in S) and any(SOUTH_ASIA(p) for p in S)) or (any(EGYPT(p) for p in S) and any(ARABIA_SEA(p) for p in S)))
               and not any(p[0] > 33 and 75 < p[1] < 100 for p in S), "OPS, REU, WEGO")
rule("Europe to Japan and Korea crosses the Caspian and Central Asia",
     [(e, a) for e in EUROPE for a in NORTH_ASIA],
     lambda S: any(CASPIAN(p) for p in S) and any(CENTRAL_ASIA(p) for p in S), "WEGO, FIN")
rule("the Gulf to South-East Asia goes out over the Arabian Sea and India, never north of 30 N",
     [(g, a) for g in GULF for a in SEA],
     lambda S: max(p[0] for p in S) <= 30, "EASA, WEGO")
rule("no route enters Iran or Iraq",
     [(a, b) for a in P for b in P if IX[a] < IX[b]],
     lambda S: not any(routing.inside(p, routing.AREAS["mideast"]) for p in S), "EASA")

if fails:
    print(f"route reference: {len(fails)} of {checked} routes do not match"); [print("  " + f) for f in fails[:40]]; sys.exit(1)
print(f"route reference: all {checked} routes (nonstop and with a fuel stop) match the published corridors")
