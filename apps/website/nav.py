"""One top menu on every page, fixed at the top while the page scrolls (Morten, 30 Oct 2026: "I would need to have the
top menu on all pages and also lock so it does not scroll. Each page needs to have the same navigation model, so all
pages work the same").
Runs last in build.py, after pages.py, on every HTML page of the site: home, the menu pages, the content pages
(destinations, regions, cities, countries, airports, guides), terms and privacy.
The same static header everywhere (no script):
  Menu · Services · Aircraft · How it works      ARCHĒ EXECUTIVE      Destinations · Contact · Terms · Privacy · EN ▾
  - fixed at the top, dark glass background, the page's own link marked;
  - Menu opens a panel with every link (the only menu below 1280 px, where the row of links is hidden);
  - the language menu keeps you on the same page where that page exists in the language (home and the menu pages);
    content pages are in English only, so there it leads to the home page in that language.
The template's own header (home and menu pages) is hidden; this one replaces it. Styles in /nav.css.
Idempotent: the header is replaced on each build."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site")
LANGS = ["en", "th", "zh", "ja"]
LABEL = {"en": "EN", "th": "ไทย", "zh": "中文", "ja": "日本語"}
T = {  # the menu's words, as in i18n.js
    "Menu": ("เมนู", "菜单", "メニュー"), "Services": ("บริการ", "服务", "サービス"), "Aircraft": ("เครื่องบิน", "机型", "機材"),
    "How it works": ("ขั้นตอนการให้บริการ", "服务流程", "ご利用の流れ"), "Destinations": ("จุดหมายปลายทาง", "目的地", "目的地"),
    "Contact": ("ติดต่อเรา", "联系我们", "お問い合わせ"), "Terms of business": ("เงื่อนไขการให้บริการ", "业务条款", "取引条件"),
    "Privacy": ("ความเป็นส่วนตัว", "隐私政策", "プライバシー"), "Home": ("หน้าแรก", "首页", "ホーム"),
    "Request a quote": ("ขอใบเสนอราคา", "获取报价", "お見積り依頼"),
}
MENU_PAGES = ["services", "aircraft", "how-it-works", "contact"]
LEFT = [("services", "Services"), ("aircraft", "Aircraft"), ("how-it-works", "How it works"), ("destinations", "Destinations")]
RIGHT = [("contact", "Contact"), ("terms", "Terms of business"), ("privacy", "Privacy")]   # four and three, so the quote button fits
SKIP = ("api", "logo-export", "vendor", "assets")

def say(x, l): return x if l == "en" else T[x][LANGS.index(l) - 1]

def url(slug, l):
    if slug == "home": return "/" if l == "en" else "/" + l
    if slug in MENU_PAGES: return f"/{slug}/" + ("" if l == "en" else l + "/")
    return {"destinations": "/destinations/", "terms": "/terms.html", "privacy": "/privacy.html"}[slug]

LOGO = ('<svg width="104" height="25" viewBox="0 0 300 72" fill="none" aria-hidden="true"><defs><linearGradient id="aenl" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#a9bdd4"/><stop offset="1" stop-color="#6e86a3"/></linearGradient></defs>'
        '<path d="M6 16 C 40 54, 92 60, 150 60 C 208 60, 260 54, 294 16" stroke="url(#aenl)" stroke-width="3.4"/>'
        '<path d="M56 42 C 92 50, 120 51, 150 51 C 180 51, 208 50, 244 42" stroke="url(#aenl)" stroke-width="2"/>'
        '<path d="M150 4 L157 18 L150 32 L143 18 Z" fill="url(#aenl)"/></svg>')

def _sel(sizes, extra=""):
    return ",".join(f'[style*="font-size: {x}px"]{extra},[style*="font-size:{x}px"]{extra}' for x in sizes)

# One type system for every page (Morten, 30 Oct 2026: "no consistency anymore on the fonts and the styles and sizes").
# Readers are mostly senior decision makers, often on a phone: Prata only for page and section titles and the slogan,
# Hanken Grotesk for everything else; body text 17 px (16 px on phones) at regular weight, never light, because thin
# text on a dark background is the first thing older eyes lose; nothing under 14 px except the spaced capitals of
# labels and menus (12.5 px, medium weight); one size for every section title.
SMALL = (10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5)
TYPE = ("/* type system (nav.py) */\n"
    "body,#dc-root,#dc-prerender{font-weight:400}\n"
    # light weight only for large display text
    + ",".join(f'[style*="font-weight: 300"]{s},[style*="font-weight:300"]{s}' for s in (':not([style*="font-size: 2"]):not([style*="font-size: 3"]):not([style*="font-size: 4"]):not([style*="font-size: 6"]):not([style*="clamp"])',))
    + "{font-weight:400!important}\n"
    # spaced capitals: labels, eyebrows, menus
    + _sel(SMALL, '[style*="uppercase"]') + "{font-size:12.5px!important;font-weight:500!important}\n"
    # small running text up to 14 px, 14-14.5 to 15 px, 15-16 to 16.5 px
    + _sel(SMALL, ':not([style*="uppercase"])') + "{font-size:14px!important}\n"
    + _sel((14, 14.5), ':not([style*="uppercase"])') + "{font-size:15px!important}\n"
    + _sel((15, 15.5, 16), ':not([style*="uppercase"])') + "{font-size:16.5px!important}\n"
    + ":is(p,li,dd)" + _sel((15, 15.5, 16)).replace(",", ",:is(p,li,dd)") + "{font-size:17px!important;line-height:1.7!important}\n"
    # one size for page titles (section titles: polish.py already sets one size for every h2)
    + "html[data-ae-page] h1{font-size:clamp(40px,5vw,68px)!important;line-height:1.1!important}\n"
    + "@media (max-width:600px){html[data-ae-page] p,html[data-ae-page] li{font-size:16px!important}html[data-ae-page] h1{font-size:36px!important}}\n")

def header(page, lang, langs_here):
    a = lambda slug, name: (f'<a href="{url(slug, lang)}"' + (' aria-current="page"' if slug == page else "") + f'>{say(name, lang)}</a>')
    langs = "".join(f'<a href="{langs_here(l)}" lang="{l}"' + (' aria-current="true"' if l == lang else "") + f'>{LABEL[l]}</a>' for l in LANGS)
    panel = "".join(a(s, n) for s, n in [("home", "Home")] + LEFT + RIGHT)
    return (f'<!--ae:nav--><header class="ae-nav" data-ae="nav"><div class="ae-nav-bar">'
            f'<details class="ae-nav-menu"><summary><span class="ae-burger" aria-hidden="true"></span>{say("Menu", lang)}</summary>'
            f'<nav class="ae-nav-panel" aria-label="{say("Menu", lang)}">{panel}<a class="ae-nav-cta" href="{url("contact", lang)}#top">{say("Request a quote", lang)}</a></nav></details>'
            f'<nav class="ae-nav-links l" aria-label="Main">{"".join(a(s, n) for s, n in LEFT)}</nav>'
            f'<a class="ae-nav-brand" href="{url("home", lang)}" aria-label="Archē Executive">{LOGO}<span class="w">ARCHĒ</span><span class="x">EXECUTIVE</span></a>'
            f'<nav class="ae-nav-links r" aria-label="More">{"".join(a(s, n) for s, n in RIGHT)}</nav>'
            f'<div class="ae-nav-end"><a class="ae-nav-quote" href="{url("contact", lang)}#top">{say("Request a quote", lang)}</a>'
            f'<details class="ae-nav-lang"><summary>{LABEL[lang]}</summary><div>{langs}</div></details></div>'
            '</div></header><!--/ae:nav-->')

CSS = """/* One top menu on every page (nav.py, 30 Oct 2026) */
.ae-nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(40,43,48,0.86);-webkit-backdrop-filter:blur(14px) saturate(120%);backdrop-filter:blur(14px) saturate(120%);border-bottom:1px solid rgba(243,245,248,0.10);font-family:'Hanken Grotesk',system-ui,sans-serif}
.ae-nav-bar{max-width:1520px;margin:0 auto;padding:10px 40px;display:grid;grid-template-columns:auto minmax(0,1fr) auto minmax(0,1fr) auto;align-items:center;column-gap:28px;box-sizing:border-box}
.ae-nav,.ae-nav *{line-height:1.2;box-sizing:border-box}.ae-nav svg{display:block}.ae-nav a{color:#c6cbd2;text-decoration:none}.ae-nav a:hover{color:#f3f5f8}
.ae-nav-links{display:flex;gap:20px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap}
.ae-nav-links.l{justify-self:end}.ae-nav-links.r{justify-self:start}
.ae-nav-links a{padding:6px 0;border-bottom:1px solid transparent}
.ae-nav-links a[aria-current="page"]{color:#f3f5f8;border-bottom-color:rgba(243,245,248,0.6)}
.ae-nav-brand{display:flex;flex-direction:column;align-items:center;gap:2px;grid-column:3}
.ae-nav-brand .w{font-family:Cinzel,serif;font-size:24px;line-height:1.15;letter-spacing:0.22em;font-weight:600;padding-left:0.24em;background:linear-gradient(178deg,#fff 0%,#d6e0eb 34%,#9db2ca 70%,#e4ebf2 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.ae-nav-brand .x{font-size:9.5px;font-weight:600;letter-spacing:0.8em;padding-left:0.8em;color:#c6cbd2}
.ae-nav details>summary{list-style:none;cursor:pointer;white-space:nowrap;color:#f3f5f8;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;padding:8px 2px}
.ae-nav details>summary::-webkit-details-marker{display:none}
.ae-nav-menu{grid-column:1;position:relative}
.ae-nav-menu>summary{display:flex;align-items:center;gap:12px}
.ae-burger{position:relative;width:24px;height:1px;background:#f3f5f8;display:inline-block}
.ae-burger::before{content:"";position:absolute;left:0;top:-6px;width:24px;height:1px;background:#f3f5f8}
.ae-burger::after{content:"";position:absolute;left:0;top:6px;width:14px;height:1px;background:#f3f5f8}
.ae-nav-menu[open] .ae-burger{background:transparent}
.ae-nav-menu[open] .ae-burger::before{top:0;transform:rotate(45deg)}.ae-nav-menu[open] .ae-burger::after{top:0;width:24px;transform:rotate(-45deg)}
.ae-nav-panel{position:absolute;left:-40px;top:calc(100% + 11px);width:min(420px,100vw);max-height:calc(100vh - 80px);overflow:auto;display:flex;flex-direction:column;padding:18px 40px 30px;background:rgba(40,43,48,0.97);border:1px solid rgba(243,245,248,0.10);border-left:0;box-sizing:border-box}
.ae-nav-panel a{padding:13px 0;border-bottom:1px solid rgba(243,245,248,0.08);font-family:Prata,Georgia,serif;font-size:22px;line-height:1.3;color:#f3f5f8}
.ae-nav-panel a[aria-current="page"]{color:#a9bdd4}
.ae-nav-panel a.ae-nav-cta{margin-top:22px;padding:14px 22px;border:1px solid rgba(243,245,248,0.45);text-align:center;font-family:'Hanken Grotesk',system-ui,sans-serif;font-size:12.5px;letter-spacing:0.18em;text-transform:uppercase}
.ae-nav-end{grid-column:5;justify-self:end;display:flex;align-items:center;gap:22px}.ae-nav-lang{position:relative}
.ae-nav a.ae-nav-quote{padding:10px 16px;border:1px solid rgba(243,245,248,0.5);color:#f3f5f8;font-size:12px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap}.ae-nav a.ae-nav-quote:hover{background:#f3f5f8;color:#2b2e33}
.ae-nav-lang>summary::after{content:"\\25BE";margin-left:6px;color:#a9bdd4;font-size:10px}
.ae-nav-lang>div{position:absolute;right:0;top:calc(100% + 6px);display:flex;flex-direction:column;gap:10px;padding:14px 18px;background:rgba(40,43,48,0.97);border:1px solid rgba(169,189,212,0.25);min-width:110px;font-size:13px;letter-spacing:0.08em}
.ae-nav-lang a[aria-current="true"]{color:#f3f5f8}
@media (max-width:1279px){.ae-nav-links{display:none}.ae-nav-bar{grid-template-columns:1fr auto 1fr}.ae-nav-brand{grid-column:2}.ae-nav-end{grid-column:3}}
@media (max-width:1439px) and (min-width:1280px){.ae-nav-links{gap:13px;font-size:11.5px;letter-spacing:0.1em}.ae-nav-bar{column-gap:18px;padding:10px 24px}}
@media (max-width:600px){.ae-nav a.ae-nav-quote{display:none}.ae-nav-bar{padding:8px 16px;column-gap:12px}.ae-nav-brand .w{font-size:20px}.ae-nav-brand svg{width:84px;height:20px}.ae-nav-brand .x{font-size:8.5px}
 .ae-nav-menu>summary{gap:10px}.ae-nav-panel{left:-16px;width:100vw;padding:12px 16px 24px;border-right:0}}
/* the page's own header (home and menu pages) gives way to this one */
#dc-root header,#dc-prerender header,header.top{display:none!important}
html{scroll-padding-top:96px}
.ae-nav-pad{height:96px}
@media (max-width:600px){.ae-nav-pad{height:72px}}
@media print{.ae-nav{position:static}}
/* home: the cabin photo as the hero (Morten, 30 Oct 2026) */
html[data-ae-page="home"] #top{background:linear-gradient(180deg,rgba(36,38,43,0.55) 0%,rgba(36,38,43,0.30) 38%,rgba(36,38,43,0.55) 70%,rgba(59,63,70,0.96) 100%),url(/img/why-photo.webp) center/cover no-repeat!important}
html[data-ae-page="home"] #top .hero-content p{color:#e2e6ea!important}
@media (max-width:900px){html[data-ae-page="home"] #top{background:linear-gradient(180deg,rgba(36,38,43,0.55) 0%,rgba(36,38,43,0.30) 38%,rgba(36,38,43,0.55) 70%,rgba(59,63,70,0.96) 100%),url(/img/why-photo-m.webp) center/cover no-repeat!important}}
/* the compass and jet watermark, fixed in the middle of the screen on every page while the page scrolls */
#top .arche-rose,#top .arche-rose+div[aria-hidden="true"],.hero .rose,.hero .jet{display:none!important}
.ae-wm{position:fixed;left:0;right:0;top:88px;bottom:0;z-index:900;pointer-events:none;display:flex;align-items:center;justify-content:center}
/* the original proportions of the home hero: jet 63% of the compass width, its tail on the compass ring */
.ae-wm>i{position:relative;display:block;width:min(100vw - 32px,100vh - 150px,1440px);aspect-ratio:1}
.ae-wm>i::before{content:"";position:absolute;inset:0;background:url(/assets/compass-rose.svg) center/contain no-repeat;opacity:0.075}
.ae-wm>i::after{content:"";position:absolute;left:18.5%;top:-2.6%;width:63%;aspect-ratio:2252/887;background:url(/assets/jet-line-watermark-wide.png) center/contain no-repeat;opacity:0.11}
@media print{.ae-wm{display:none}}
"""

def page_of(rel):
    """(page, language, function language -> URL of this page in that language)"""
    parts = rel.split(os.sep)
    home = {"index.html": "en", "th.html": "th", "zh.html": "zh", "ja.html": "ja"}
    if len(parts) == 1 and parts[0] in home: return "home", home[parts[0]], lambda l: url("home", l)
    if parts[0] in MENU_PAGES:
        l = parts[1] if len(parts) == 3 else "en"; return parts[0], l, (lambda s: (lambda l: url(s, l)))(parts[0])
    if rel == "terms.html": return "terms", "en", lambda l: url("home", l) if l != "en" else "/terms.html"
    if rel == "privacy.html": return "privacy", "en", lambda l: url("home", l) if l != "en" else "/privacy.html"
    page = "destinations" if parts[0] == "destinations" else "content"
    me = "/" + "/".join(parts[:-1]) + "/"
    return page, "en", lambda l: me if l == "en" else url("home", l)

FONTS = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&amp;family=Prata&amp;family=Hanken+Grotesk:wght@300;400;500;600"
NOTO = {"th": "&amp;family=Noto+Sans+Thai:wght@300;400;500", "zh": "&amp;family=Noto+Sans+SC:wght@300;400;500", "ja": "&amp;family=Noto+Sans+JP:wght@300;400;500"}

def speed(t, page, lang):
    """Speed on phones: each language loads only its own script's font (the Chinese and Japanese font lists alone are
    large), the hero photo is fetched first on Home, and the hidden template watermark is no longer preloaded."""
    t = re.sub(r'href="https://fonts\.googleapis\.com/css2\?family=Cinzel[^"]*"', f'href="{FONTS}{NOTO.get(lang, "")}&amp;display=swap"', t)
    t = t.replace('<link rel="preload" as="image" href="/assets/jet-line-watermark-wide.png">', "")
    t = re.sub(r'<link rel="preload" as="image" href="/img/why-photo[^"]*"[^>]*>', "", t)
    if page == "home":
        t = t.replace("</head>", '<link rel="preload" as="image" href="/img/why-photo-m.webp" media="(max-width:900px)" fetchpriority="high">'
                                 '<link rel="preload" as="image" href="/img/why-photo.webp" media="(min-width:901px)" fetchpriority="high"></head>', 1)
    return t

def run(verbose=True):
    open(os.path.join(SITE, "nav.css"), "w", encoding="utf-8").write(CSS + TYPE)
    n = 0
    for root, dirs, files in os.walk(SITE):
        if os.path.relpath(root, SITE).split(os.sep)[0] in SKIP: continue
        for fn in files:
            if not fn.endswith(".html"): continue
            p = os.path.join(root, fn); rel = os.path.relpath(p, SITE)
            if rel.startswith(SKIP) or "<body" not in open(p, encoding="utf-8").read(): continue
            t = open(p, encoding="utf-8").read()
            t = re.sub(r"<!--ae:nav-->.*?<!--/ae:nav-->", "", t, flags=re.S)
            t = re.sub(r'<link rel="stylesheet" href="/nav.css"[^>]*>', "", t)
            t = re.sub(r'<div class="ae-nav-pad"></div>', "", t)
            page, lang, here = page_of(rel)
            if page == "privacy" and 'name="description"' not in t:   # search basics the privacy page lacked
                t = t.replace("</head>", '<meta name="description" content="How Archē Executive uses the details you give us: what we keep, why, for how long, and how to ask us to delete them."><link rel="canonical" href="https://archeaviation.com/privacy.html"></head>', 1)
            t = speed(t, page, lang)
            t = t.replace("</head>", '<link rel="stylesheet" href="/nav.css"></head>', 1)
            m = re.search(r"<body[^>]*>", t)
            pad = '<div class="ae-nav-pad"></div>' if page in ("terms", "privacy") else ""
            t = t[:m.end()] + header(page, lang, here) + '<!--ae:nav--><div class="ae-wm" aria-hidden="true"><i></i></div><!--/ae:nav-->' + pad + t[m.end():]
            open(p, "w", encoding="utf-8").write(t); n += 1
    if verbose: print(f"  menu: the same fixed top menu on {n} pages")

if __name__ == "__main__": run()
