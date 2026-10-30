"""The footer menu, in the same style, also in the header (Morten, 30 Oct 2026: "I need this style and menu in the footer,
inserted in the header between menu and languages"). Runs last in build.py, on the home page in all four languages:
the links are copied from the footer menu, so both always match (Destinations included once it is switched on).
On phones the header row has no room: the Menu button keeps every link there, so the row is hidden below 900 px.
On wider screens the hero drawing (aircraft and compass rose) moves down 40 px to make room for the row."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, "site")
STYLE = ("display:flex;gap:28px;font-size:12.5px;letter-spacing:0.22em;text-transform:uppercase;flex-wrap:wrap;"
         "justify-content:center;color:#c6cbd2")
CSS = ("<style id=\"ae-hnav-css\">.ae-hnav{max-width:1440px;margin:-6px auto 0;padding:0 40px}"
       ".ae-hnav a{color:#c6cbd2;text-decoration:none}.ae-hnav a:hover{color:#f3f5f8}"
       "@media (max-width:900px){.ae-hnav{display:none!important}}</style>")
FOOT = re.compile(r'<nav( data-dc-tpl="\d+")? style="display: ?flex; ?gap: ?32px; ?font-size: ?12\.5px; ?letter-spacing: ?0\.22em;[^"]*">(.*?)</nav>', re.S)

def nav(inner):
    inner = re.sub(r' data-dc-tpl="\d+"', "", inner)
    return f'<nav class="ae-hnav" aria-label="Main" style="{STYLE}">{inner.strip()}</nav>'

JET = re.compile(r'(<div aria-hidden="true")( style="position:absolute;left:50%;top:calc\(205px - ([^;]*?)\);)')
def room(t):
    """the hero drawing 40 px lower on screens wide enough for the header menu"""
    m = JET.search(t)
    if not m: return t, ""
    t = t.replace(m.group(0), m.group(1) + ' class="arche-jet"' + m.group(2))
    return t, ("@media (min-width:901px){.arche-rose{top:240px!important}.arche-jet{top:calc(245px - " + m.group(3) + ")!important}}")
def patch(t):
    t = re.sub(r'<nav class="ae-hnav".*?</nav>', "", t, flags=re.S)   # built again each time
    t = re.sub(r'<style id="ae-hnav-css">.*?</style>', "", t, flags=re.S)
    t = t.replace(' class="arche-jet"', "")
    t, extra = room(t)
    navs = list(FOOT.finditer(t))
    pre = [m for m in navs if m.group(1)]; tpl = [m for m in navs if not m.group(1)]
    # the page copy shown before the script starts (#dc-prerender) and the template the script renders
    h = t.find("<header data-dc-tpl=")
    if pre and h >= 0:
        e = t.index("</header>", h); t = t[:e] + nav(pre[0].group(2)) + t[e:]
        navs = list(FOOT.finditer(t)); tpl = [m for m in navs if not m.group(1)]
    h = t.find('<header style="position:absolute')
    if tpl and h >= 0:
        e = t.index("</header>", h); t = t[:e] + nav(tpl[0].group(2)) + t[e:]
    css = CSS.replace("</style>", extra + "</style>")
    return t.replace("</head>", css + "</head>", 1) if "</head>" in t else t

def run():
    for f in ("index.html", "th.html", "zh.html", "ja.html"):
        p = os.path.join(SITE, f)
        if not os.path.exists(p): continue
        t = open(p, encoding="utf-8").read()
        n = patch(t)
        assert n.count('class="ae-hnav"') >= 1, f"header menu not placed in {f}"
        open(p, "w", encoding="utf-8").write(n)
    print("header menu: placed")

if __name__ == "__main__":
    run()
