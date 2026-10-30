"""One page per menu item (Morten, 30 Oct 2026: "I want each menu item we have with its own page, not one long page ...
match closer to GlobalJet"). Runs last in build.py, after header_nav.py, on the finished home page in all four languages.
  /                   home: hero, who we are, services (short), why, discover tiles, dates ahead, the slogan
  /services/          the three services, each in detail, on board, our operator standard
  /aircraft/          the aircraft finder
  /how-it-works/      the five steps
  /contact/           the private client desk and empty-leg alerts
  /destinations/, /terms.html, /privacy.html were already their own pages.
Languages: /services/ (English), /services/th/, /services/zh/, /services/ja/ and the same for each page.
How: every page is the same home page file (one design source, one template), with its own title, a page head with a
photo, and only its own sections shown (CSS by page). The sections of other pages are also taken out of the first
painted copy, so each page's HTML is its own for search engines. Every page ends with the slogan and the rule line
"Any aircraft, any route, upon availability." (statement block, luxury.py), placed last above the footer.
Idempotent: the page folders are written again on each build. Translations: i18n_pages.json."""
import os, re, json, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site")
BASE = "https://archeaviation.com"
LANGS = {"en": "index.html", "th": "th.html", "zh": "zh.html", "ja": "ja.html"}
HREFLANG = {"en": "en", "th": "th", "zh": "zh-Hans", "ja": "ja"}
ANCHOR = {"services": "services", "fleet": "aircraft", "journey": "how-it-works", "contact": "contact"}

EYE = "font-size:12.5px;letter-spacing:0.16em;text-transform:uppercase;color:#a9bdd4"
# page: (eyebrow = menu name, heading, lead, photo, title for the browser tab, description, sections shown)
PAGES = {
    "services": ("Services", "Three services. One standard.",
                 "Private charter, aviation advisory and fleet coordination, each run by senior aviation people and held to the same checks.",
                 None, "Private charter, advisory and fleet coordination",   # no photo head: the three service photos are the hero (Morten, 30 Oct 2026)
                 "Private jet charter, aviation advisory and fleet coordination from Singapore, worldwide. Every operator checked before you see a quote.",
                 ["#services", "#services-detail", "#onboard", "#standard"]),
    "aircraft": ("Aircraft", "The right aircraft for the trip.",
                 "From light jets to ultra-long-range. We hold no fleet, so we suggest what fits your trip and find it upon availability.",
                 "journey-3.webp", "Private jet categories and aircraft",
                 "Find the private jet category that fits your trip: passengers, range and cabin, suggested upon availability. Archē Executive holds no fleet.",
                 ["#fleet"]),
    "how-it-works": ("How it works", "Effortless for you. Thorough behind the scenes.",
                     "Five steps from your first message to landing, with one advisor and every operator checked before you commit.",
                     "journey-5.webp", "How private jet charter works",
                     "From first message to landing in five steps: tell us the trip, we source and vet, you confirm, we handle the details, you fly.",
                     ["#journey"]),
    "contact": ("Contact", "At your service, at any hour.",
                "Call, message or write to our private client desk, day or night, wherever you are.",
                "break-3.webp", "Contact the private client desk",
                "Reach Archē Executive's private client desk at any hour by phone, WhatsApp or email, or ask for a call back.",
                ["#top", "#contact"]),   # the quote form from the home hero sits right under the page head
}
HOME_SHOW = ["#top", "[data-screen-label=\"Intro\"]", "#services", ".ar-band[data-ar=\"services\"]", "#why", ".ar-trio", "#discover", "#dates"]
TILES = [("services", "Services", "Charter, advisory and fleet coordination.", "svc-charter.webp"),
         ("aircraft", "Aircraft", "Find the aircraft that fits the trip.", "journey-3.webp"),
         ("how-it-works", "How it works", "From first message to landing.", "journey-5.webp"),
         ("destinations", "Destinations", "Know the rules before you fly.", "break-1.webp")]

def url(slug, lang):
    if slug == "home": return "/" if lang == "en" else "/" + lang
    if slug == "destinations": return "/destinations/"
    return f"/{slug}/" + ("" if lang == "en" else lang + "/")

def css(page, show):
    top = "clamp(56px,6vw,88px)" if PAGES.get(page, (0, 0, 0, 1))[3] else "calc(88px + clamp(48px,6vw,96px))"   # below the fixed menu
    keep = ",".join(["header", "footer", "#statement", ".ae-phead"] + show)
    return (f'<style id="ae-pages-css">html[data-ae-page="{page}"] div:has(> footer)>*:not({keep}){{display:none!important}}'
            + (f'html[data-ae-page="{page}"] {show[0]}{{padding-top:0!important;border-top:0!important}}'
               f'html[data-ae-page="{page}"] {show[0]}>div:first-child{{padding-top:{top}!important}}' if page != "home" else "") +
            ('html[data-ae-page="contact"] #top{min-height:0!important;background:none!important;padding:0!important}'
               'html[data-ae-page="contact"] #top>div:not(.hero-content){display:none!important}'
               'html[data-ae-page="contact"] #top .hero-content{padding:clamp(40px,5vw,72px) 40px 8px!important}'
               'html[data-ae-page="contact"] #top .hero-content>div:first-child{display:none!important}' if page == "contact" else "") +
            '.ae-tile:hover .ae-tile-img{transform:scale(1.04)}.ae-tile-img{transition:transform 1.2s ease}'
            '@media (max-width:600px){.ae-phead>div:last-child,#discover>div{padding-left:20px!important;padding-right:20px!important}}</style>')

def phead(slug):
    eye, h1, lead, img = PAGES[slug][:4]
    if not img:   # no photo head (Services): the page still has one title for search engines and screen readers
        return (f'<!--ae:pages--><h1 class="ae-phead" data-ae="pages" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;margin:0">{h1}</h1><!--/ae:pages-->')
    return (f'<!--ae:pages--><section class="ae-phead" data-ae="pages" style="position:relative;min-height:clamp(440px,64vh,660px);display:flex;align-items:flex-end;overflow:hidden;background:#2b2e33 url(/img/{img}) center/cover no-repeat">'
            '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(30,32,36,0.62) 0%,rgba(30,32,36,0.30) 45%,rgba(43,46,51,0.97) 100%)"></div>'
            '<div style="position:relative;width:100%;max-width:1440px;margin:0 auto;padding:190px 40px clamp(48px,6vw,84px);box-sizing:border-box">'
            f'<span style="{EYE}">{eye}</span>'
            f'<h1 style="margin:16px 0 18px;max-width:980px;font-family:Prata,Georgia,serif;font-weight:400;font-size:clamp(36px,5.4vw,74px);line-height:1.08;color:#f3f5f8">{h1}</h1>'
            f'<p style="margin:0;max-width:680px;font-size:18px;line-height:1.65;color:#d5d9de">{lead}</p></div></section><!--/ae:pages-->')

def discover(lang):
    tile = lambda s, name, line, img: (
        f'<a class="ae-tile" href="{url(s, lang)}" style="position:relative;display:block;min-height:clamp(260px,30vw,420px);overflow:hidden;text-decoration:none;border:1px solid rgba(243,245,248,0.12)">'
        f'<img class="ae-tile-img" src="/img/{img}" alt="" loading="lazy" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#2b2e33">'
        '<span style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(30,32,36,0.05) 30%,rgba(30,32,36,0.88) 100%)"></span>'
        f'<span style="position:absolute;left:28px;right:28px;bottom:26px;display:block"><span style="display:block;font-family:Hanken Grotesk,system-ui,sans-serif;font-weight:300;font-size:clamp(24px,2.2vw,28.8px);line-height:1.12;letter-spacing:-0.015em;color:#f3f5f8">{name}</span>'
        f'<span style="display:block;margin-top:8px;font-size:16px;line-height:1.6;color:#d5d9de">{line}</span>'
        '<span aria-hidden="true" style="display:block;margin-top:14px;width:36px;border-top:1px solid rgba(243,245,248,0.6)"></span></span></a>')
    return (f'<!--ae:pages--><section id="discover" data-ae="pages" style="border-top:1px solid rgba(243,245,248,0.12)"><div style="max-width:1440px;margin:0 auto;padding:clamp(56px,6vw,96px) 40px;box-sizing:border-box">'
            f'<span style="{EYE}">Discover</span><h2 style="margin:14px 0 36px;font-family:Prata,Georgia,serif;font-weight:400;font-size:clamp(28px,3.4vw,44px);line-height:1.15;color:#f3f5f8">Private aviation, in detail.</h2>'
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px">'
            + "".join(tile(*t) for t in TILES) + '</div></div></section><!--/ae:pages-->')

def statement_last(t):
    """The slogan and rule line sit last, just above the footer, on every page (contact comes after it in the template)."""
    rx = re.compile(r"<!--ae:lux--><section id=\"statement\".*?<!--/ae:lux-->", re.S)
    for m in reversed(list(rx.finditer(t))):
        f = t.find("<footer", m.end()); blk = m.group(0)
        t = t[:f] + blk + t[f:]; t = t[:m.start()] + t[m.end():]
    return t

def links(t, lang, sub):
    for a, slug in ANCHOR.items(): t = t.replace(f'href="#{a}"', f'href="{url(slug, lang)}"')
    if sub:   # quote links go to the quote form on Contact; "why" to the home page, in the same language
        t = t.replace('href="#top"', f'href="{url("contact", lang)}#top"')   # "Check availability" and other quote links: the quote form.replace('href="#why"', f'href="{url("home", lang)}#why"')
    return t

def sections(s):
    """(start, end, opening tag) of every <section> at any depth, with balanced end."""
    out = []
    for m in re.finditer(r"<section\b[^>]*>", s):
        depth, i = 1, m.end()
        while depth:
            o = s.find("<section", i); c = s.find("</section>", i)
            if o != -1 and o < c: depth += 1; i = o + 8
            else: depth -= 1; i = c + 10
        out.append((m.start(), i, m.group(0)))
    return out

def prune(t, show):
    """Takes the other pages' sections out of the first painted copy (dc-prerender), not out of the template."""
    a = t.find('<div id="dc-prerender"');
    if a < 0: return t
    b = t.find("<footer", a); seg = t[a:b]
    ids = {x[1:] for x in show if x.startswith("#")} | {"statement"}
    marks = [x[1:] for x in show if x.startswith(".")] + [x[1:-1] for x in show if x.startswith("[")]
    cut = []
    for st, en, tag in sections(seg):
        m = re.search(r'\bid="([^"]+)"', tag)
        if 'class="ae-phead"' in tag or (m and m.group(1) in ids) or any(k.split("[")[0] in tag for k in marks): continue
        if any(st >= c0 and en <= c1 for c0, c1 in cut): continue
        cut.append((st, en))
    for st, en in sorted(cut, reverse=True): seg = seg[:st] + seg[en:]
    return t[:a] + seg + t[b:]

def head(t, slug, lang, title, desc):
    t = re.sub(r"<title>.*?</title>", f"<title>{title} · Archē Executive</title>", t, count=1, flags=re.S)
    t = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + desc, t, count=1)
    t = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + title + " · Archē Executive", t, count=1)
    t = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + desc, t, count=1)
    t = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + BASE + url(slug, lang), t, count=1)
    t = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + BASE + url(slug, lang), t, count=1)
    for l, h in HREFLANG.items():
        t = re.sub(rf'(<link rel="alternate" hreflang="{h}" href=")[^"]*', lambda m: m.group(1) + BASE + url(slug, l), t, count=1)
    t = re.sub(r'(<link rel="alternate" hreflang="x-default" href=")[^"]*', lambda m: m.group(1) + BASE + url(slug, "en"), t, count=1)
    # the page itself and its place in the site, for search engines
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": BASE + url(slug, lang), "url": BASE + url(slug, lang), "name": title, "description": desc,
         "inLanguage": HREFLANG[lang], "isPartOf": {"@type": "WebSite", "name": "Archē Executive", "url": BASE + "/"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Archē Executive", "item": BASE + url("home", lang)},
            {"@type": "ListItem", "position": 2, "name": title, "item": BASE + url(slug, lang)}]}]}
    t = re.sub(r'<script type="application/ld\+json" data-ae="page">.*?</script>', "", t, flags=re.S)
    return t.replace("</head>", '<script type="application/ld+json" data-ae="page">' + json.dumps(ld, ensure_ascii=False) + "</script></head>", 1)

def tr_rows():
    return json.load(open(os.path.join(HERE, "i18n_pages.json"), encoding="utf-8"))["rows"]

def run(verbose=True):
    rows = tr_rows(); T = {r[0]: dict(zip(("th", "zh", "ja"), r[1:])) for r in rows}
    need = ["Discover", "Private aviation, in detail.", "Charter, advisory and fleet coordination."] + [x for p in PAGES.values() for x in (p[1], p[2], p[4], p[5])]
    miss = [x for x in need if x not in T]; assert not miss, f"pages: no translation for {miss}"
    say = lambda x, l: x if l == "en" else T.get(x, {}).get(l, x)
    for slug in PAGES: shutil.rmtree(os.path.join(SITE, slug), ignore_errors=True)
    for lang, f in LANGS.items():
        p = os.path.join(SITE, f)
        s = open(p, encoding="utf-8").read()
        s = re.sub(r"<!--ae:pages-->.*?<!--/ae:pages-->", "", s, flags=re.S)
        s = re.sub(r'<style id="ae-pages-css">.*?</style>', "", s, flags=re.S)
        s = re.sub(r'<html([^>]*?) data-ae-page="[^"]*"', r"<html\1", s, count=1)
        s = re.sub(r'<base href="/">', "", s)
        # home: links to the pages, the discover tiles before "Dates ahead" (or the slogan), and only the home sections
        home = statement_last(links(s, lang, False))
        anchor = re.compile(r'(<!--ae:home--><section id="dates")') if '<section id="dates"' in home else re.compile(r'(<!--ae:lux--><section id="statement")')
        home = anchor.sub(lambda m: discover(lang) + m.group(1), home)
        home = home.replace("</head>", css("home", HOME_SHOW) + "</head>", 1).replace("<html", '<html data-ae-page="home"', 1)
        open(p, "w", encoding="utf-8").write(prune(home, HOME_SHOW))
        for slug, (eye, h1, lead, img, title, desc, show) in PAGES.items():
            t = statement_last(links(s, lang, True))
            t = re.sub(r'(<section(?: data-dc-tpl="\d+")? id="top")', lambda m: phead(slug) + m.group(1), t)
            m = re.search(r'<section data-dc-tpl="\d+" id="top".*?</section>', t, re.S)   # the hidden home hero keeps no h1 here
            t = t[:m.start()] + m.group(0).replace("<h1 ", '<p role="presentation" ').replace("</h1>", "</p>") + t[m.end():]
            m = re.search(r'<section id="top".*?</section>', t, re.S)
            if m: t = t[:m.start()] + m.group(0).replace("<h1 ", '<p role="presentation" ').replace("</h1>", "</p>") + t[m.end():]
            assert t.count('class="ae-phead"') == 2, f"{slug}: page head not placed ({lang})"
            t = t.replace("location.href = (l === 'en' ? '/' : '/' + l) + location.hash",
                          f"location.href = (l === 'en' ? '/{slug}/' : '/{slug}/' + l + '/')")
            t = re.sub(r"<head>", '<head><base href="/">', t, count=1)
            t = t.replace("</head>", css(slug, show) + "</head>", 1).replace("<html", f'<html data-ae-page="{slug}"', 1)
            t = head(t, slug, lang, say(title, lang), say(desc, lang))
            if img: t = t.replace("</head>", f'<link rel="preload" as="image" href="/img/{img}" fetchpriority="high"></head>', 1)   # the page head photo first
            out = os.path.join(SITE, slug, "" if lang == "en" else lang, "index.html")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            open(out, "w", encoding="utf-8").write(prune(t, show))
    # content pages and terms/privacy: their links to home anchors now go to the pages
    for root, _, files in os.walk(SITE):
        for fn in files:
            if not fn.endswith(".html"): continue
            q = os.path.join(root, fn); x = open(q, encoding="utf-8").read(); y = x
            for a, slug in ANCHOR.items(): y = y.replace(f'href="/#{a}"', f'href="/{slug}/"')
            if y != x: open(q, "w", encoding="utf-8").write(y)
    # translations
    p = os.path.join(SITE, "i18n.js"); t = open(p, encoding="utf-8").read()
    js = lambda x: "'" + x.replace("\\", "\\\\").replace("'", "\\'") + "'"
    t = re.sub(r"// ae:pages[^\n]*\n.*?// /ae:pages\n", "", t, flags=re.S)
    t = t.replace("const ROWS = [\n", "const ROWS = [\n// ae:pages rows (pages.py, from i18n_pages.json)\n" + "".join("[" + ",".join(js(x) for x in r) + "],\n" for r in rows) + "// /ae:pages\n", 1)
    open(p, "w", encoding="utf-8").write(t)
    # sitemap: the pages and their language versions
    sm = os.path.join(SITE, "sitemap.xml")
    if os.path.exists(sm):
        x = open(sm, encoding="utf-8").read(); day = datetime.date.today().isoformat()
        x = re.sub(r"\n  <url><loc>[^<]*/(?:services|aircraft|how-it-works|contact)/[^<]*</loc>.*?</url>", "", x, flags=re.S)
        add = ""
        for slug in PAGES:
            alt = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{HREFLANG[l]}" href="{BASE}{url(slug, l)}"/>' for l in LANGS)
            add += "".join(f"\n  <url><loc>{BASE}{url(slug, l)}</loc><lastmod>{day}</lastmod>{alt}\n  </url>" for l in LANGS)
        open(sm, "w", encoding="utf-8").write(x.replace("\n</urlset>", add + "\n</urlset>"))
    if verbose: print(f"  pages: {', '.join('/' + s + '/' for s in PAGES)} in 4 languages; home shortened with discover tiles")

if __name__ == "__main__": run()
