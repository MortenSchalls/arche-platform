"""Approximate routing for the journey map on Destinations (Morten, 13 Nov 2026: "only show aircraft that have a maximum of
1 fuel stop for the trips we show, and use the rules for the flights shown as we use in Navoryx").

Archē's own copy of the routing rules used on the Navoryx site (severance rule: a copy kept here, nothing read from that
site; docs/SEVERANCE.md). Routes avoid airspace that EU, UK, US and Swiss-registered aircraft cannot use or that the EASA
Conflict Zone Information Bulletins tell operators not to enter (bulletins on Russia, Ukraine, Iran, Iraq, Syria, Lebanon,
Jordan, Yemen, Afghanistan, Pakistan's western provinces, Sudan, Libya, Mali, Somalia, the waters of the Persian Gulf and
the Gulf of Oman west of 58 E, and the south-west of Saudi Arabia; checked 10 Nov 2026). Belarus is avoided with Russia and
Ukraine. Routes also keep off the high ground of the Himalaya and the Tibetan plateau (13 Nov 2026). No country is named on the site ("routed around restricted airspace").

The areas are drawn coarsely (about one degree) and routes are built from a small set of corridor points, so distances are
approximate and only for planning; the operator plans each flight. Per aircraft, the same rules as Navoryx: nonstop when the
routed distance is within the published range; otherwise one fuel stop at a named airport (none in the Gulf while its
bulletins are active), each leg within 96% of the published range (Navoryx: 5,900 of 6,163 nm), the quickest stop at least 15%
of the journey from either end. More than one stop: the aircraft is not shown. Time: distance at cruise speed + 0.4 h, and
1.3 h for a fuel stop. The bulletins change: re-check them with the weekly upkeep and adjust AREAS (and the Navoryx copy).
"""
import heapq
import math

R_NM = 3440.065
OFF_PATH = 600      # ... and the stop lies within 600 nm of the routed journey (12% of it on the longest journeys), unless
                    # the journey with it is at most 5% longer (a great circle over the far south passes no airport)
ON_THE_WAY = 1.15   # the journey with its fuel stop is at most 15% longer than the routed journey (13 Nov 2026)
LEG = 0.96          # a leg with a fuel stop stays within 96% of the published range (Navoryx: 5,900 of 6,163 nm)

AREAS = {
    "north": [  # Russia, Belarus, Ukraine
        (69.8, 28.0), (60.5, 27.5), (57.5, 27.3), (56.0, 26.5), (53.9, 23.4), (51.5, 23.6), (50.4, 24.0), (48.4, 22.1),
        (47.9, 26.6), (45.3, 28.2), (45.2, 29.8), (44.3, 33.3), (44.6, 36.6), (43.4, 39.9), (42.0, 43.5), (41.2, 47.8),
        (42.6, 48.2), (44.7, 47.3), (46.4, 49.2), (48.1, 46.6), (50.5, 47.6), (51.2, 51.5), (50.8, 55.5), (51.4, 61.6),
        (50.6, 73.4), (51.7, 77.9), (50.0, 83.5), (49.2, 87.4), (50.6, 92.0), (50.0, 98.0), (49.8, 108.0), (49.6, 114.5),
        (53.4, 119.8), (52.5, 125.6), (49.4, 127.6), (47.6, 131.0), (48.4, 134.9), (45.2, 133.1), (42.3, 130.6),
        (43.6, 135.5), (46.5, 138.5), (50.0, 140.6), (52.0, 141.5), (45.8, 142.0), (43.2, 145.7), (44.5, 147.5),
        (50.5, 156.0), (55.0, 162.0), (59.5, 166.0), (61.5, 180.0), (82.0, 180.0), (82.0, 60.0), (82.0, 28.0),
    ],
    "north_e": [(61.5, -180.0), (65.0, -168.5), (68.0, -168.5), (72.5, -168.5), (82.0, -168.5), (82.0, -180.0)],
    "mideast": [  # Lebanon, Syria, Jordan, Iraq, Iran
        (33.1, 35.1), (34.6, 35.8), (36.0, 35.8), (36.6, 36.2), (36.8, 38.0), (37.1, 42.3), (37.3, 44.8), (39.0, 44.3),
        (39.8, 44.8), (38.9, 46.5), (39.6, 47.9), (38.4, 48.9), (37.4, 49.1), (36.6, 52.0), (37.0, 54.0), (37.4, 57.3),
        (37.8, 59.5), (36.6, 61.2), (34.0, 61.0), (31.4, 61.8), (29.9, 60.9), (27.2, 63.3), (25.3, 61.7), (25.3, 58.8),
        (26.6, 56.6), (27.1, 55.6), (27.4, 52.8), (28.9, 50.8), (29.9, 48.6), (29.1, 46.6), (31.9, 40.4), (32.2, 39.0),
        (29.6, 36.5), (29.3, 34.95), (31.0, 35.4), (32.7, 35.6), (33.1, 35.8),
    ],
    "gulf_water": [  # Persian Gulf over the water (arrivals and departures to the coast are allowed) and Gulf of Oman west of 58 E
        (29.9, 48.6), (28.9, 50.8), (27.4, 52.8), (27.1, 55.6), (26.6, 56.6), (25.3, 58.0), (24.3, 58.0), (24.9, 57.0),
        (25.9, 56.6), (26.2, 56.1), (25.6, 55.5), (24.9, 54.4), (24.7, 53.3), (24.3, 51.9), (25.9, 51.9), (26.4, 51.4),
        (26.3, 50.9), (25.0, 50.9), (25.8, 50.2), (27.0, 49.8), (28.3, 48.8), (29.0, 48.3),
    ],
    "south_arabia": [  # Yemen and the south-west of Saudi Arabia near it
        (12.4, 43.3), (16.4, 42.7), (18.4, 41.6), (19.5, 42.5), (19.5, 47.0), (19.0, 52.0), (16.6, 53.1), (15.0, 50.5),
        (13.6, 47.8), (12.6, 45.0),
    ],
    "afpak": [  # Afghanistan, Balochistan and Khyber Pakhtunkhwa
        (37.4, 74.9), (38.5, 71.3), (37.2, 67.8), (37.4, 66.5), (35.9, 64.5), (35.6, 62.3), (34.0, 61.0), (31.4, 61.8),
        (29.9, 60.9), (27.2, 63.3), (25.3, 61.7), (25.0, 66.6), (27.8, 67.6), (29.4, 70.5), (31.5, 71.3), (33.8, 72.2),
        (35.0, 73.3), (36.9, 73.7),
    ],
    "sudan_lib": [(22.0, 25.0), (31.6, 25.0), (32.9, 12.0), (23.5, 11.5), (19.5, 16.0), (15.6, 23.0), (10.0, 23.0),
                  (8.6, 24.2), (9.5, 30.0), (11.9, 33.2), (12.6, 36.1), (15.5, 36.6), (18.0, 38.6), (22.0, 36.9)],
    "mali": [(25.0, -4.8), (19.1, 4.3), (15.0, 3.6), (14.3, 0.2), (15.3, -4.4), (11.0, -6.0), (12.1, -11.4), (14.8, -12.2),
             (15.5, -11.0), (15.4, -5.4), (25.0, -6.6)],
    "somalia": [(11.9, 43.2), (11.9, 51.4), (2.0, 46.0), (-1.7, 41.6), (2.0, 41.0), (4.2, 41.9), (8.0, 47.9), (9.0, 44.0)],
    # not restricted airspace but high ground: the Himalaya, Karakoram and the Tibetan plateau. Flights between Europe or the
    # Gulf and South-East Asia keep south of the Himalaya, and flights to north Asia go round the plateau to the north
    # (Morten, 13 Nov 2026: "they tend to go south of Himalayas, not north ... most realistic flight paths for all routes")
    "high_ground": [(35.6, 73.4), (34.2, 75.3), (32.6, 76.9), (30.6, 79.0), (29.1, 80.9), (28.4, 84.0), (28.0, 87.0),
                    (27.9, 89.2), (27.6, 92.0), (28.1, 95.5), (28.4, 97.5), (27.6, 99.0), (29.4, 101.4), (32.0, 102.4),
                    (34.4, 101.2), (36.4, 98.0), (37.6, 93.0), (37.2, 88.0), (36.6, 82.0), (36.8, 77.0)],
}

# corridor points used when the direct path is not open (lat, lon); a name is shown only for fuel stops
NODES = {
    "ist": (41.0, 28.9), "bsea": (41.7, 41.4), "baku": (40.4, 50.0), "casp": (40.0, 53.2), "ashg": (37.95, 58.4),
    "tash": (41.3, 69.3), "alma": (43.3, 76.9), "urum": (43.9, 87.5), "lanz": (36.1, 103.8), "beij": (40.1, 116.6),
    "seoul": (37.5, 127.0), "cairo": (30.1, 31.4), "rsea": (25.0, 36.2), "medina": (24.5, 39.7), "riy_n": (26.5, 45.0),
    "muscat": (23.6, 58.3), "arab": (17.5, 62.0), "kara": (24.9, 67.2), "delhi": (28.6, 77.1), "kath": (27.7, 85.4),
    "kef": (64.0, -22.6), "grn": (74.0, -40.0), "arc": (78.0, -100.0), "anc": (61.2, -150.0), "shemya": (52.7, 174.1),
    "npac": (45.0, 165.0), "bering": (56.0, -172.0), "halifax": (44.9, -63.5),
    "uae_in": (24.0, 55.2), "uae_w": (23.6, 52.5), "qat_s": (24.5, 51.2), "ahsa": (25.3, 49.4), "lax": (33.9, -118.4), "hnl": (21.3, -157.9),
    # Africa corridors (7 Nov 2026): Sahara between the Mali and Libya areas, the west coast, central and east Africa
    "alg": (30.0, 6.0), "niger": (16.0, 8.0), "chad": (12.0, 16.0), "congo": (-2.0, 20.0), "canary": (28.0, -15.5),
    "dakar": (14.7, -17.5), "abidjan": (5.3, -4.0), "addis": (9.0, 38.7), "nairobi": (-1.3, 36.8),
    # Eastern Mediterranean and Balkans corridor to central Europe, west of the closed airspace (added 8 Nov 2026 after
    # Morten's Warsaw check: without it, Gulf and India routes to Poland swung back over North Africa)
    "ath": (37.9, 23.7), "bel": (44.8, 20.4), "bud": (47.4, 19.3),
    # south of the closed airspace over Somalia, out over the Indian Ocean (added 8 Nov 2026 by the route audit: Lagos to the
    # Maldives and Sydney had turned north to Medina)
    "mombasa": (-4.0, 39.7), "seych": (-4.6, 55.5),
    # South Pacific fuel stops for South America to Australia (added 8 Nov 2026 by the route audit: no route before)
    "akl": (-37.0, 174.8), "ppt": (-17.55, -149.6),
    # Indian Ocean fuel stops (added 8 Nov 2026 by the route audit with Auckland and Honolulu: New Zealand to South Africa
    # had gone via Singapore, Lagos to Auckland had no route)
    "per": (-31.94, 115.97), "mru": (-20.43, 57.68),
    # south of the Himalaya to South-East Asia and round the Tibetan plateau (added 13 Nov 2026 with the high ground):
    # northern India, Kolkata and the Bay of Bengal, Yangon, Kunming and Chengdu, and Lahore for Central Asia to India
    "lhe": (31.5, 74.4), "ccu": (22.65, 88.45), "bay": (17.0, 88.0), "rgn": (16.9, 96.1), "kmg": (25.1, 102.9), "ctu": (30.6, 104.0),
}
# named fuel-stop airports outside the areas (none in the Gulf while its bulletins are active), plus Archē's city pages
# outside the Gulf (added by tools/routes.py)
STOPS = {"anc": "Anchorage", "alma": "Almaty", "cairo": "Cairo", "kef": "Keflavik", "delhi": "Delhi", "hnl": "Honolulu",
         "akl": "Auckland", "ppt": "Papeete, Tahiti", "per": "Perth", "mru": "Mauritius", "halifax": "Halifax"}


def gc_nm(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * R_NM * math.asin(math.sqrt(min(1, h)))


def gc_points(a, b, step_nm=40):
    d = gc_nm(a, b)
    n = max(2, int(d / step_nm))
    p1, l1, p2, l2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    v1 = (math.cos(p1) * math.cos(l1), math.cos(p1) * math.sin(l1), math.sin(p1))
    v2 = (math.cos(p2) * math.cos(l2), math.cos(p2) * math.sin(l2), math.sin(p2))
    w = math.acos(max(-1, min(1, sum(x * y for x, y in zip(v1, v2)))))
    if w < 1e-9:
        return [a, b]
    out = []
    for i in range(n + 1):
        f = i / n
        A, B = math.sin((1 - f) * w) / math.sin(w), math.sin(f * w) / math.sin(w)
        x, y, z = (A * u + B * v for u, v in zip(v1, v2))
        out.append((math.degrees(math.atan2(z, math.hypot(x, y))), math.degrees(math.atan2(y, x))))
    return out


def inside(pt, poly):
    la, lo = pt
    c = False
    j = len(poly) - 1
    for i in range(len(poly)):
        yi, xi = poly[i]
        yj, xj = poly[j]
        if (yi > la) != (yj > la) and lo < (xj - xi) * (la - yi) / (yj - yi + 1e-12) + xi:
            c = not c
        j = i
    return c


SKIP = set()   # areas left out for a comparison run (tools/routes.py: was the bend for restricted airspace or for high ground?)


def blocked(a, b, ends=()):
    """True if the great circle a-b passes through any area. The first and last 120 nm next to a city on the coast of the
    Gulf are allowed (arrivals and departures)."""
    pts = gc_points(a, b)
    for p in pts:
        for k, poly in AREAS.items():
            if k in SKIP:
                continue
            if inside(p, poly):
                if k == "gulf_water" and any(gc_nm(p, e) < 120 for e in ends):
                    continue
                return True
    return False


_EDGE = {}   # open/blocked edges, kept between calls (the build is a few thousand routes)
_SP = {}


def shortest(a_geo, b_geo, extra=None):
    key = (tuple(a_geo), tuple(b_geo), tuple(sorted(SKIP)))
    if not extra and key in _SP:
        return _SP[key]
    r = _shortest(a_geo, b_geo, extra)
    if not extra:
        _SP[key] = r
    return r


def _shortest(a_geo, b_geo, extra=None):
    """Shortest open path from a to b through the corridor points. Returns (nm, [points])."""
    nodes = dict(NODES)
    if extra:
        nodes.update(extra)
    nodes["__a"], nodes["__b"] = a_geo, b_geo
    ends = (a_geo, b_geo)
    keys = list(nodes)
    dist = {"__a": 0.0}
    prev = {}
    q = [(0.0, "__a")]
    seen = set()
    cache = _EDGE
    while q:
        d, k = heapq.heappop(q)
        if k in seen:
            continue
        seen.add(k)
        if k == "__b":
            break
        for m in keys:
            if m in seen:
                continue
            key = (nodes[k], nodes[m], ends if (nodes[k] in ends or nodes[m] in ends) else (), tuple(sorted(SKIP)))
            if key not in cache:
                cache[key] = None if blocked(nodes[k], nodes[m], ends) else gc_nm(nodes[k], nodes[m])
            e = cache[key]
            if e is None:
                continue
            nd = d + e
            if nd < dist.get(m, 1e18):
                dist[m] = nd
                prev[m] = k
                heapq.heappush(q, (nd, m))
    if "__b" not in dist:
        return None
    path, k = [], "__b"
    while k != "__a":
        path.append(nodes[k])
        k = prev[k]
    path.append(a_geo)
    return dist["__b"], path[::-1]


def why_bent(path_nm, a, b, legs=None):
    """0 = straight, 1 = round restricted airspace, 2 = round high ground, 3 = both. legs: [(from, to, nm), ...]."""
    legs = legs or [(a, b, path_nm)]
    rest = terr = False
    for x, y, nm in legs:
        SKIP.add("high_ground")
        try:
            open_ = shortest(x, y)
        finally:
            SKIP.discard("high_ground")
        o = open_[0] if open_ else nm
        rest = rest or o > gc_nm(x, y) * 1.02
        terr = terr or nm > o * 1.02
    return (1 if rest else 0) + (2 if terr else 0)


def near_path(g, pts):
    """Distance in nm from point g to the nearest point of the routed path (sampled along each leg)."""
    best = 1e9
    for x, y in zip(pts, pts[1:]):
        for p in gc_points(x, y, 60):
            best = min(best, gc_nm(g, p))
    return best


def plan_pair(a, b, stops, ranges):
    """Routes between a and b for each published range. stops: {name: (lat, lon)}. Returns
    {"direct": nm, "route": [nm, points, detour] or None, "via": {range: [stop name, nm, legs, points, detour] or 0 or None}}
    0 = nonstop, None = more than one fuel stop."""
    direct = gc_nm(a, b)
    r = shortest(a, b)
    legs = {}
    for name, g in stops.items():
        if gc_nm(g, a) < 30 or gc_nm(g, b) < 30:
            continue
        r1, r2 = shortest(a, g), shortest(g, b)
        if r1 and r2:
            legs[name] = (r1, r2, g)
    out = {"direct": direct, "route": [r[0], r[1], why_bent(r[0], a, b)] if r else None, "via": {}}
    for rng in ranges:
        if r and r[0] <= rng:
            out["via"][rng] = 0
            continue
        best = None
        for name, (r1, r2, g) in legs.items():
            if r1[0] > rng * LEG or r2[0] > rng * LEG:
                continue
            tot = r1[0] + r2[0]
            if min(r1[0], r2[0]) < 0.15 * tot:
                continue
            if r and (tot > r[0] * ON_THE_WAY or (tot > r[0] * 1.05 and near_path(g, r[1]) > max(OFF_PATH, 0.12 * r[0]))):   # a stop off the way (London to Singapore via Almaty) is not a realistic plan
                continue
            if best is None or tot < best[1]:
                best = [name, tot, [r1[0], r2[0]], r1[1] + r2[1][1:], (a, g, r1[0], g, b, r2[0])]
        if best:
            x = best[4]; best[4] = why_bent(0, a, b, [(x[0], x[1], x[2]), (x[3], x[4], x[5])])
        out["via"][rng] = best
    return out
