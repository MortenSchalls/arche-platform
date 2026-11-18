"""Readability on real screens (Morten, 19 Nov 2026: "Some of the writing is not clearly visible ... Urgently audit the
page and ensure this is fixed").

Measured on the rendered pages against the real pixels behind the text (photos, veils and the compass and jet watermark,
which lies over the page at 11 and 15%): the four muted greys of the page template passed 4.5:1 only on plain charcoal,
and fell to 3.4-4.3:1 wherever a watermark line runs behind them (footer company line, event source line, aircraft
finder counts, breadcrumbs, card notes). The Discover tiles get a darker veil behind their words (titles sat on bright
parts of the photos), and the aircraft finder's other categories are dimmed less (0.6 -> 0.88). Each grey is lifted one step, in every built page, style sheet and script, so text
keeps at least 4.5:1 with the watermark behind it (measured by tools/real_contrast.js):

    #b1b6bd -> #cfd3d9   (5.2 -> 7.0:1 on charcoal, 5.5:1 with a watermark line)
    #a3a9b1 -> #c8ccd2   (4.5 -> 6.6:1, 5.1:1)
    #a9bdd4 -> #bfcfe2   (5.5 -> 6.7:1, 5.2:1)
    #c6cbd2 -> #d5d9de   (6.5 -> 7.5:1, 5.8:1)

The colours stay the brand's cool greys, only lighter; the page sources are not edited, the change is made on the built
site, as the other build fixes are.
"""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, "site")
SKIP = ("portal-preview",)
MAP = {"b1b6bd": "cfd3d9", "a3a9b1": "c8ccd2", "a9bdd4": "bfcfe2", "c6cbd2": "d5d9de"}
RGB = {tuple(int(k[i:i + 2], 16) for i in (0, 2, 4)): tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in MAP.items()}

def fix(t):
    n = 0
    for k, v in MAP.items():
        t, c = re.subn("#" + k, "#" + v, t, flags=re.I); n += c
    def rgb(m):
        nonlocal n
        key = tuple(int(x) for x in m.group(2, 3, 4))
        if key not in RGB: return m.group(0)
        n += 1; r, g, b = RGB[key]
        return f"{m.group(1)}({r}, {g}, {b}" if ", " in m.group(0) else f"{m.group(1)}({r},{g},{b}"
    t = re.sub(r"(rgba?)\((\d+),\s*(\d+),\s*(\d+)", rgb, t)
    return t, n

CSS = """
/* readability.py (19 Nov 2026): text over photos and dimmed tabs, measured on the rendered page */
.ae-tile>img+span{background:linear-gradient(180deg,rgba(30,32,36,0.08) 18%,rgba(30,32,36,0.70) 50%,rgba(30,32,36,0.93) 100%)!important}
#fleet button[style*="opacity: 0.6"]{opacity:0.88!important}
"""

def run(verbose=True):
    files = changes = 0
    css = os.path.join(SITE, "nav.css"); c = open(css, encoding="utf-8").read()
    if "readability.py" not in c: open(css, "w", encoding="utf-8").write(c + CSS)
    for root, dirs, fs in os.walk(SITE):
        if os.path.relpath(root, SITE).split(os.sep)[0] in SKIP: continue
        for fn in fs:
            if not fn.endswith((".html", ".css", ".js", ".svg")): continue
            p = os.path.join(root, fn); t = open(p, encoding="utf-8").read()
            t2, n = fix(t)
            if n: open(p, "w", encoding="utf-8").write(t2); files += 1; changes += n
    if verbose: print(f"  readability: muted greys lifted in {files} files ({changes} places)")

def problems():
    out = []
    for root, dirs, fs in os.walk(SITE):
        if os.path.relpath(root, SITE).split(os.sep)[0] in SKIP: continue
        for fn in fs:
            if fn.endswith((".html", ".css", ".js")):
                t = open(os.path.join(root, fn), encoding="utf-8").read()
                if fix(t)[1]: out.append(f"{os.path.relpath(os.path.join(root, fn), SITE)}: a muted grey below the readable step is back")
    return out

if __name__ == "__main__": run()
