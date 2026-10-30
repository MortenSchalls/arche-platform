"""One-line header (Morten, 30 Oct 2026: "I need this style and menu in the footer, inserted in the header between menu and
languages"; then "Arche logo smaller, same size as the footer, remove phone number next to languages, have a small language
menu, so all these links can be on one line"). Runs last in build.py, on the home page in all four languages, on both
copies of the header (the page copy shown before the script starts, and the template the script renders):
  Menu and the first links · the logo in the middle (footer size) · the other links and a small language menu, the way
  GlobalJet does it (Morten's reference, 30 Oct 2026). The links are copied from the footer, so both always match.
The phone number leaves the header. Below 1200 px the row of links is hidden (the Menu button has them all) and the logo
sits in the middle; the phone layout in site-fixes.css stays as it was."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, "site")
LANG = {"index.html": "EN", "th.html": "ไทย", "zh.html": "中文", "ja.html": "日本語"}
STYLE = "display:flex;gap:18px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;flex-wrap:nowrap;color:#c6cbd2;white-space:nowrap"
SPLIT = 3   # links left of the logo
CSS = """<style id="ae-hnav-css">
.ae-hnav a{color:#c6cbd2;text-decoration:none}.ae-hnav a:hover{color:#f3f5f8}
.ae-lang{position:relative}
.ae-lang>summary{list-style:none;cursor:pointer;font-size:12px;letter-spacing:0.12em;color:#f3f5f8;padding:6px 2px;white-space:nowrap}
.ae-lang>summary::-webkit-details-marker{display:none}
.ae-lang>summary::after{content:"\\25BE";margin-left:6px;color:#a9bdd4;font-size:10px}
.ae-lang>div{position:absolute;right:0;top:calc(100% + 6px);flex-direction:column;gap:10px!important;padding:12px 16px;background:#2b2e33;border:1px solid rgba(169,189,212,0.25);z-index:30;min-width:110px}
@media (min-width:901px){
 header>div{display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;align-items:center!important;column-gap:32px!important;padding:18px 40px!important}
 header>div>button{grid-column:1;grid-row:1;justify-self:start}
 header>div>.ae-hnav.l{grid-column:1;grid-row:1;justify-self:end}
 header>div>a[href="#top"]{grid-column:2;grid-row:1;gap:4px!important}
 header>div>a[href="#top"] svg{width:120px!important;height:29px!important}
 header>div>a[href="#top"]>span:first-of-type{font-size:30px!important;line-height:1.2!important}
 header>div>a[href="#top"]>span:last-of-type{font-size:12px!important}
 header>div>.ae-hnav.r{grid-column:3;grid-row:1;justify-self:start}
 header>div>div:last-child{grid-column:3;grid-row:1;justify-self:end;gap:0!important}
}
@media (min-width:901px) and (max-width:1279px){header>div>.ae-hnav{display:none!important}}
@media (max-width:900px){.ae-hnav{display:none!important}}
header a[href^="tel:"]{display:none!important}
</style>"""
FOOT = re.compile(r'<nav( data-dc-tpl="\d+")? style="display: ?flex; ?gap: ?32px; ?font-size: ?12\.5px; ?letter-spacing: ?0\.22em;[^"]*">(.*?)</nav>', re.S)
RIGHT = re.compile(r'<div( data-dc-tpl="\d+")? style="justify-self: ?end;')
LANGS = re.compile(r'(<div( data-dc-tpl="\d+")? style="display: ?flex; ?gap: ?10px;?">.*?</div>)', re.S)
TEL = re.compile(r'\s*<a( data-dc-tpl="\d+")? href="tel:[^"]*"[^>]*>.*?</a>', re.S)

def navs(inner):
    links = re.findall(r"<a\b.*?</a>", re.sub(r' data-dc-tpl="\d+"', "", inner), flags=re.S)
    mk = (lambda c, ls, lab: f'<nav class="ae-hnav {c}" aria-label="{lab}" style="{STYLE}">{"".join(ls)}</nav>')
    return mk("l", links[:SPLIT], "Main"), mk("r", links[SPLIT:], "More")

def one(t, start, links, label):
    h = t.find(start)
    if h < 0 or links is None: return t
    e = t.index("</header>", h); seg = t[h:e]
    seg = TEL.sub("", seg, count=1)
    if 'class="ae-lang"' not in seg: seg = LANGS.sub(lambda m: f'<details class="ae-lang"><summary>{label}</summary>{m.group(1)}</details>', seg, count=1)
    left, right = navs(links)
    m = re.search(r'<a( data-dc-tpl="\d+")? href="#top"', seg); assert m, "header: logo not found"
    seg = seg[:m.start()] + left + seg[m.start():]
    m = RIGHT.search(seg); assert m, "header: right-hand block not found"
    seg = seg[:m.start()] + right + seg[m.start():]
    return t[:h] + seg + t[e:]

def patch(t, label):
    t = re.sub(r'<nav class="ae-hnav[^"]*".*?</nav>', "", t, flags=re.S)   # built again each time
    t = re.sub(r'<style id="ae-hnav-css">.*?</style>', "", t, flags=re.S)
    navs = list(FOOT.finditer(t))
    pre = next((m.group(2) for m in navs if m.group(1)), None); tpl = next((m.group(2) for m in navs if not m.group(1)), None)
    t = one(t, "<header data-dc-tpl=", pre, label)
    t = one(t, '<header style="position:absolute', tpl, label)
    return t.replace("</head>", CSS + "</head>", 1)

def run():
    for f, label in LANG.items():
        p = os.path.join(SITE, f)
        if not os.path.exists(p): continue
        n = patch(open(p, encoding="utf-8").read(), label)
        assert n.count("ae-hnav l") >= 1 and 'class="ae-lang"' in n, f"header not rebuilt in {f}"
        open(p, "w", encoding="utf-8").write(n)
    print("header: one line with menu, logo, links and language menu")

if __name__ == "__main__":
    run()
