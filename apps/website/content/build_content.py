"""Builds the search-content pages (airports, cities, guides) as fast static HTML in the site's own design.
Rules (Morten, 27 Oct 2026; CLAUDE.md "Website content"):
- Every fact comes from facts.json with a source in sources.json and a check date. Page text may not contain
  any digit outside a {{fact}} token, so no number can appear without a source.
- No sanctioned country, territory, company or person is listed or named (excluded.json). No fleet claims, no prices.
- Facts older than 365 days stop the build (they must be checked again).
- Pages marked "draft" are built with noindex and left out of the sitemap until Morten approves them.
Run:  python3 apps/website/content/build_content.py   (also run by build.py)"""
import json, os, re, sys, html, datetime, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, "..", "site")
sys.path.insert(0, os.path.join(HERE, ".."))
import company
BASE = "https://archeaviation.com"
EXCL = json.load(open(os.path.join(HERE, "excluded.json"), encoding="utf-8"))
BANNED = re.compile(r"\b(" + "|".join(re.escape(w) for w in EXCL["countries"] + EXCL["words"]) + r")\b", re.I)   # sanctioned places: never on the website
CLAIMS = re.compile(r"\b(our fleet|our aircraft|we own|we operate|cheapest|guaranteed|best price|lowest price)\b", re.I)
PRICE = re.compile(r"(USD|US\$|\$|SGD|EUR|€|£)\s?\d|\bfrom\s+(USD|\$)", re.I)
MAX_AGE = 365

class Bad(Exception): pass

def load():
    S = json.load(open(os.path.join(HERE, "sources.json"), encoding="utf-8"))
    F = json.load(open(os.path.join(HERE, "facts.json"), encoding="utf-8"))
    P = []
    for f in sorted(os.listdir(os.path.join(HERE, "pages"))):
        if f.endswith(".json"): P.append(json.load(open(os.path.join(HERE, "pages", f), encoding="utf-8")) | {"_file": f})
    return S, F, P

def check_excluded():
    d = datetime.date.fromisoformat(EXCL["reviewed"])
    if (datetime.date.today() - d).days > 120: raise Bad(f"excluded.json last reviewed {EXCL['reviewed']}: review it against the official sanctions lists (more than 120 days)")

def check_sources(S):
    today = datetime.date.today()
    for k, s in S.items():
        for need in ("title", "url", "publisher", "checked"):
            if not s.get(need): raise Bad(f"source {k}: missing {need}")
        if not s["url"].startswith("https://"): raise Bad(f"source {k}: url must be https")
        d = datetime.date.fromisoformat(s["checked"])
        if d > today: raise Bad(f"source {k}: check date in the future")
        if (today - d).days > MAX_AGE: raise Bad(f"source {k}: checked {s['checked']}, older than {MAX_AGE} days; check it again")

def check_facts(F, S):
    for k, f in F.items():
        if "v" not in f or not f.get("src"): raise Bad(f"fact {k}: needs a value and a source")
        if f["src"] not in S: raise Bad(f"fact {k}: unknown source {f['src']}")
        if BANNED.search(json.dumps(f["v"])): raise Bad(f"fact {k}: mentions an excluded country")

TOKEN = re.compile(r"\{\{([a-z0-9_.]+)\}\}")
def all_text(p):
    out = [p["title"], p["description"], p["eyebrow"], p["h1"], p["lead"]]
    for s in p["sections"]: out += [s["h"]] + s["p"]
    for q in p.get("faq", []): out += [q["q"], q["a"]]
    out += [g[0] for g in p.get("glance", [])]
    return out

def check_page(p, F):
    name = p["_file"]
    for need in ("path", "type", "title", "description", "eyebrow", "h1", "lead", "sections"):
        if not p.get(need): raise Bad(f"{name}: missing {need}")
    if not re.fullmatch(r"/(airports|cities|guides|regions|needs|events)/[a-z0-9-]+/", p["path"]): raise Bad(f"{name}: path {p['path']} not allowed")
    if len(p["title"]) > 65: raise Bad(f"{name}: title longer than 65 characters")
    if not 110 <= len(p["description"]) <= 165: raise Bad(f"{name}: description should be 110–165 characters (is {len(p['description'])})")
    words = 0
    for t in all_text(p):
        bare = TOKEN.sub("", t)
        if re.search(r"\d", bare): raise Bad(f"{name}: a number outside a sourced fact: \"{t[:80]}\"")
        for m in TOKEN.finditer(t):
            if m.group(1) not in F: raise Bad(f"{name}: unknown fact {m.group(1)}")
        if BANNED.search(t): raise Bad(f"{name}: mentions an excluded country: \"{t[:80]}\"")
        if CLAIMS.search(t): raise Bad(f"{name}: claim not allowed for a broker: \"{t[:80]}\"")
        if PRICE.search(t): raise Bad(f"{name}: prices are not shown yet")
        words += len(TOKEN.sub(lambda m: str(F[m.group(1)]["v"]), t).split())
    for g in p.get("glance", []):
        if g[1] not in F: raise Bad(f"{name}: unknown fact {g[1]}")
    if words < 300: raise Bad(f"{name}: only {words} words; a page needs real content (300+)")
    return words

# ---------- rendering in the site's design ----------
LOGO = '<svg width="{w}" height="{h}" viewBox="0 0 300 72" fill="none" aria-hidden="true"><defs><linearGradient id="{id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#a9bdd4"/><stop offset="1" stop-color="#6e86a3"/></linearGradient></defs><path d="M6 16 C 40 54, 92 60, 150 60 C 208 60, 260 54, 294 16" stroke="url(#{id})" stroke-width="{s1}"/><path d="M56 42 C 92 50, 120 51, 150 51 C 180 51, 208 50, 244 42" stroke="url(#{id})" stroke-width="{s2}"/><path d="M150 4 L157 18 L150 32 L143 18 Z" fill="url(#{id})"/></svg>'
CSS = """
:root{--bg:#3b3f46;--ink:#f3f5f8;--text:#c6cbd2;--muted:#b1b6bd;--accent:#a9bdd4;--line:rgba(243,245,248,.12)}
*{box-sizing:border-box}html{overflow-x:clip}
body{margin:0;background:var(--bg);color:var(--text);font:300 17px/1.75 'Hanken Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:1440px;margin:0 auto;padding:0 40px}
header.top{position:absolute;top:0;left:0;right:0;z-index:3}
header.top .bar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;padding:28px 0}
.nav-l{justify-self:start;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
.nav-r{justify-self:end;display:flex;gap:22px;align-items:center;font-size:12.5px;letter-spacing:.12em;white-space:nowrap}
.brand{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--ink)}
.brand .w{font-family:Cinzel,serif;font-size:38px;line-height:1.15;letter-spacing:.22em;font-weight:600;padding-left:.24em;background:linear-gradient(178deg,#fff 0%,#d6e0eb 34%,#9db2ca 70%,#e4ebf2 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.brand .x{font-size:11.5px;font-weight:600;letter-spacing:.8em;padding-left:.8em;background:linear-gradient(178deg,#fff 0%,#d6e0eb 34%,#9db2ca 70%,#e4ebf2 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero{position:relative;padding:0 0 64px;background:radial-gradient(70% 60% at 50% 30%,rgba(190,206,224,.10) 0%,rgba(190,206,224,0) 70%);overflow:hidden}
.hero .rose{position:absolute;inset:150px 0 0;opacity:.12;pointer-events:none;-webkit-mask-image:linear-gradient(#000 0%,#000 40%,transparent 90%);mask-image:linear-gradient(#000 0%,#000 40%,transparent 90%)}
.hero .rose img{display:block;width:100%;height:auto}
.hero .jet{position:absolute;left:50%;top:150px;transform:translateX(-50%);width:min(1400px,110vw);aspect-ratio:2252/887;background:url(/assets/jet-line-watermark-wide.png) center/contain no-repeat;opacity:.16;pointer-events:none;-webkit-mask-image:linear-gradient(#000 0%,#000 50%,transparent 100%);mask-image:linear-gradient(#000 0%,#000 50%,transparent 100%)}
.hero .in{position:relative;max-width:880px;margin:0 auto;text-align:center;padding-top:clamp(300px,26vw,400px)}
.crumbs{font-size:12px;letter-spacing:.12em;color:var(--muted);margin-bottom:18px}.crumbs a{color:var(--muted)}
.eyebrow{display:inline-block;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
h1{margin:18px 0 18px;font:400 clamp(34px,4.6vw,60px)/1.12 Prata,Georgia,serif;letter-spacing:-.005em;background:linear-gradient(176deg,#fff 0%,#eef2f6 40%,#b4c0cd 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-wrap:balance}
.lead{margin:0 auto;max-width:640px;font-size:18px;line-height:1.65;color:var(--text);text-wrap:pretty}
main{position:relative}
.cols{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:56px;align-items:start;padding:24px 0 72px}
article h2{font:400 26px/1.3 Prata,Georgia,serif;color:var(--ink);margin:44px 0 12px}
article h2:first-child{margin-top:0}
article p{margin:0 0 16px;color:var(--text)}
sup.s{font-size:10.5px;margin-left:2px}sup.s a{color:var(--accent)}
.card{border:1px solid var(--line);background:rgba(243,245,248,.03);padding:28px}
.card .k{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 14px;display:block}
.card dl{margin:0}.card dt{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:14px}
.card dd{margin:4px 0 0;color:var(--ink);font-size:15px;line-height:1.55}
.side{position:sticky;top:24px;display:flex;flex-direction:column;gap:20px}
.faq details{border-top:1px solid var(--line);padding:16px 0}.faq details:last-child{border-bottom:1px solid var(--line)}
.faq summary{cursor:pointer;color:var(--ink);font-size:17px;list-style:none}.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";float:right;color:var(--accent)}.faq details[open] summary::after{content:"−"}
.faq p{margin:10px 0 0}
.src ol{margin:0;padding-left:20px;font-size:13.5px;line-height:1.6;color:var(--muted)}.src li{margin-bottom:8px}
.cta{margin:8px 0 0;text-align:center;padding:56px 24px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.cta .t{font:400 clamp(26px,3.2vw,38px)/1.2 Prata,Georgia,serif;color:var(--ink);margin:10px 0 14px}
.cta p{max-width:620px;margin:0 auto 26px}
.btn{display:inline-block;padding:16px 28px;font-size:12.5px;letter-spacing:.18em;text-transform:uppercase;border:1px solid rgba(243,245,248,.4);color:var(--ink);margin:6px}
.btn.p{background:linear-gradient(115deg,#f3f5f8 0%,#c9d2dc 45%,#f3f5f8 100%);color:#2b2e33;border-color:transparent}
.btn:hover{text-decoration:none;filter:brightness(1.05)}
.rel{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px}.rel a{font-size:15px}
footer.ft{border-top:1px solid var(--line);margin-top:72px}
footer .fin{padding:72px 0 32px;display:flex;flex-direction:column;gap:44px}
footer nav{display:flex;gap:28px;flex-wrap:wrap;justify-content:center;font-size:12.5px;letter-spacing:.22em;text-transform:uppercase}footer nav a{color:var(--text)}
footer .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:40px;padding:32px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
footer .g .k{font-size:11.5px;letter-spacing:.16em;color:var(--accent);text-transform:uppercase}
footer .g p{margin:10px 0 0;font-size:13.5px;line-height:1.7;color:var(--muted)}
footer .b{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;font-size:12px;letter-spacing:.1em;color:var(--muted)}
footer .bl{text-align:right;padding:0 0 28px;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase}footer .bl a{color:var(--muted)}
.cols.one{grid-template-columns:1fr}
.hub h2{scroll-margin-top:24px}.hub .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px;margin:0 0 8px}
.hub .grid a{display:block;border:1px solid var(--line);background:rgba(243,245,248,.03);padding:20px 22px;color:var(--text)}.hub .grid a:hover{text-decoration:none;border-color:var(--accent)}
.hub .grid b{display:block;color:var(--ink);font:400 19px/1.3 Prata,Georgia,serif;margin-bottom:6px}.hub .grid span{font-size:14.5px;line-height:1.55;display:block}
.draft{display:inline-block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;border:1px solid #d9a441;color:#e8c27a;padding:2px 8px;margin-bottom:8px}
.testbar{position:fixed;left:0;right:0;bottom:0;z-index:9;background:#d9a441;color:#2b2e33;font:600 12px/1.4 'Hanken Grotesk',sans-serif;letter-spacing:.06em;text-align:center;padding:6px 12px}
@media (max-width:1000px){.cols{grid-template-columns:1fr}.side{position:static}}
@media (max-width:760px){.wrap{padding:0 16px}header.top .bar{grid-template-columns:auto 1fr;padding:16px 0}.brand{grid-column:1/-1;grid-row:2;justify-self:center}.nav-r a.tel{display:none}.brand .w{font-size:30px}body{font-size:16px}.card{padding:22px}.btn{display:block;margin:10px 0}}
"""

def fact_html(F, S, key, refs):
    f = F[key]; v = f["v"]
    if isinstance(v, list): v = ", ".join(map(str, v))
    if f["src"] not in refs: refs.append(f["src"])
    n = refs.index(f["src"]) + 1
    return f'{html.escape(str(v))}<sup class="s"><a href="#src-{n}" aria-label="Source {n}">{n}</a></sup>'

def cap(s): return s[:1].upper() + s[1:]

def fill(t, F, S, refs, plain=False):
    if plain: return TOKEN.sub(lambda m: (cap if re.search(r"(^|[.?!]\s+)$", t[:m.start()]) else str)(str(F[m.group(1)]["v"])), t)
    out, last = [], 0
    for m in TOKEN.finditer(t):
        before = t[last:m.start()]; out.append(html.escape(before)); fh = fact_html(F, S, m.group(1), refs)
        if re.search(r"(^|[.?!]\s+)$", t[:m.start()]): fh = cap(fh)   # a fact that starts a sentence gets a capital
        out.append(fh); last = m.end()
    out.append(html.escape(t[last:]))
    return "".join(out).replace("&amp;#", "&#")

def page_html(p, F, S, P):
    refs = []
    body = []
    for s in p["sections"]:
        body.append(f"<h2>{html.escape(s['h'])}</h2>" + "".join(f"<p>{fill(x, F, S, refs)}</p>" for x in s["p"]))
    glance = ""
    if p.get("glance"):
        glance = '<div class="card"><span class="k">At a glance</span><dl>' + "".join(f"<dt>{html.escape(k)}</dt><dd>{cap(fact_html(F, S, f, refs))}</dd>" for k, f in p["glance"]) + "</dl></div>"
    faq = ""
    if p.get("faq"):
        faq = "<h2>Questions we are asked</h2><div class=\"faq\">" + "".join(f"<details><summary>{html.escape(q['q'])}</summary><p>{fill(q['a'], F, S, refs)}</p></details>" for q in p["faq"]) + "</div>"
    known = {x["path"]: x for x in P}
    rel = [r for r in p.get("related", []) if r in known]
    related = ('<h2>Read next</h2><div class="rel">' + "".join(f'<a href="{r}">{html.escape(known[r]["h1"])} →</a>' for r in rel) + "</div>") if rel else ""
    srcs = "" if not refs else '<div class="card src"><span class="k">Sources</span><ol>' + "".join(
        f'<li id="src-{i+1}"><a href="{html.escape(S[k]["url"])}" rel="noopener nofollow" target="_blank">{html.escape(S[k]["title"])}</a>. {html.escape(S[k]["publisher"])}. Checked {datetime.date.fromisoformat(S[k]["checked"]).strftime("%-d %B %Y")}.</li>'
        for i, k in enumerate(refs)) + "</ol></div>"
    checked = max([S[k]["checked"] for k in refs] or [datetime.date.today().isoformat()])
    # structured data
    url = BASE + p["path"]
    section = {"airport": ("Airports", "/airports/"), "guide": ("Guides", "/guides/"), "city": ("Cities", "/cities/"), "region": ("Regions", "/regions/"), "hub": ("Destinations", "/destinations/")}.get(p["type"], ("Guides", "/guides/"))
    ld = [{"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Archē Executive", "item": BASE + "/"},
        {"@type": "ListItem", "position": 2, "name": section[0], "item": BASE + section[1]},
        {"@type": "ListItem", "position": 3, "name": p["h1"], "item": url}]}]
    if p.get("faq"):
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": fill(q["a"], F, S, [], plain=True)}} for q in p["faq"]]})
    if p["type"] == "airport" and p.get("airport") and p["airport"].get("geo") in F:
        a = p["airport"]; g = F[a["geo"]]["v"]
        ld.append({"@context": "https://schema.org", "@type": "Airport", "name": a["name"], "icaoCode": F[a["icao"]]["v"], "geo": {"@type": "GeoCoordinates", "latitude": g[0], "longitude": g[1]}, "address": {"@type": "PostalAddress", "addressLocality": a["city"], "addressCountry": a["country"]}})
    ld.append({"@context": "https://schema.org", "@type": "WebPage", "url": url, "name": p["title"], "description": p["description"], "dateModified": checked, "publisher": {"@id": BASE + "/#org"}, "inLanguage": "en"})
    robots = '<meta name="robots" content="noindex, nofollow">' if p.get("draft") or not company.LAUNCHED else ""
    phone = company.PHONE or "+65 0000 0000"; tel = "+" + re.sub(r"\D", "", phone) if company.PHONE else "+6500000000"
    wa = "https://wa.me/" + re.sub(r"\D", "", tel)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(p['title'])} · Archē Executive</title>
<meta name="description" content="{html.escape(p['description'])}">
{robots}
<link rel="canonical" href="{url}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icon-32.png">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<meta name="theme-color" content="#2b2e33">
<meta property="og:type" content="article"><meta property="og:site_name" content="Archē Executive">
<meta property="og:title" content="{html.escape(p['title'])}"><meta property="og:description" content="{html.escape(p['description'])}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{BASE}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Prata&family=Hanken+Grotesk:wght@300;400;600&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="/assets/jet-line-watermark-wide.png">
<style>{CSS}</style>
{''.join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False) + '</script>' for x in ld)}
</head>
<body>
<header class="top"><div class="wrap"><div class="bar">
<a class="nav-l" href="/">← Archē Executive</a>
<a class="brand" href="/" aria-label="Archē Executive home">{LOGO.format(w=150, h=36, id='lg1', s1=3, s2=1.8)}<span class="w">ARCHĒ</span><span class="x">EXECUTIVE</span></a>
<div class="nav-r"><a href="/#contact">Contact</a><a class="tel" href="tel:{tel}">{html.escape(phone)}</a></div>
</div></div></header>
<section class="hero"><div class="rose" aria-hidden="true"><img src="/assets/compass-rose.svg" alt=""></div><div class="jet" aria-hidden="true"></div>
<div class="wrap"><div class="in">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> · {'<span>Destinations</span>' if p["type"] == "hub" else '<a href="/destinations/#' + p["type"] + '">' + section[0] + '</a>'}</nav>
<span class="eyebrow">{html.escape(p['eyebrow'])}</span>
<h1>{html.escape(p['h1'])}</h1>
<p class="lead">{fill(p['lead'], F, S, refs)}</p>
</div></div></section>
<main><div class="wrap"><div class="cols{' one' if p.get('_main') else ''}">
<article>{'' if company.LAUNCHED or not p.get('draft') else '<span class="draft">Draft · waiting for approval</span>'}{p.get('_main') or (''.join(body) + faq + related)}</article>
<aside class="side">{glance}{srcs}</aside>
</div>
<section class="cta">
<span class="eyebrow">Any aircraft · any route · upon availability</span>
<div class="t">Tell us the trip. We do the rest.</div>
<p>We are a broker: we find the right aircraft for your trip, check the operator behind it and stay with you until you land.</p>
<a class="btn p" href="/#top">Request a quote</a><a class="btn" href="{wa}">WhatsApp</a><a class="btn" href="mailto:{company.EMAIL}">{html.escape(company.EMAIL)}</a>
</section></div></main>
<footer class="ft"><div class="wrap"><div class="fin">
<div style="display:flex;flex-direction:column;align-items:center;gap:22px"><a class="brand" href="/" aria-label="Archē Executive home">{LOGO.format(w=110, h=27, id='lg2', s1=4, s2=2.4)}<span class="w" style="font-size:28px">ARCHĒ</span><span class="x">EXECUTIVE</span></a>
<nav><a href="/#services">Services</a><a href="/#fleet">Aircraft</a><a href="/#journey">How it works</a><a href="/destinations/">Destinations</a><a href="/#contact">Contact</a><a href="/terms.html">Terms of business</a><a href="/privacy.html">Privacy</a></nav></div>
<div class="g"><div><span class="k">Broker disclosure</span><p>Archē Executive acts solely as agent for its clients and does not own or operate any aircraft. All flights are operated by third-party air operators holding the appropriate Air Operator Certificate, who retain full operational control of each flight. The operator for your flight is named in your quotation and charter agreement before you confirm.</p></div>
<div><span class="k">This page</span><p>Facts checked on {datetime.date.fromisoformat(checked).strftime('%-d %B %Y')} against the sources listed. Rules change; the operator confirms the current rules for your flight.</p><p>{html.escape(company.NAME)} · {html.escape(company.ADDRESS)}</p></div></div>
<div class="b"><span>© {datetime.date.today().year} Archē Executive</span><span>Singapore · Worldwide</span></div>
</div><div class="bl"><a href="https://portal.archeaviation.com" rel="nofollow">Broker login</a></div></div></footer>
{'' if company.LAUNCHED else '<style>body{padding-bottom:34px}</style><div class="testbar">Test website · not public · ' + ('draft page, waiting for approval' if p.get('draft') else 'list of pages' if p['type'] == 'hub' else 'approved page') + '</div>'}
<script src="/track.js" defer></script>
</body>
</html>
"""

def add_events(P):
    """Dated events on city pages (events.json): only those not yet over; past ones drop off at the next build."""
    f = os.path.join(HERE, "events.json")
    if not os.path.exists(f): return
    E = json.load(open(f, encoding="utf-8"))["events"]; today = datetime.date.today().isoformat()
    for p in P:
        if not p.get("events"): continue
        xs = sorted([e for e in E if e["city"] == p["events"] and e["end"] >= today], key=lambda e: e["start"])[:6]
        p["sections"] = [s for s in p["sections"] if not s.get("_ev")]
        if not xs: continue
        sec = {"_ev": True, "h": "Dates ahead", "p": ["Large events fill airports, slots and parking early. These are the next dates confirmed by the organisers; if you plan to travel for one of them, tell us as early as you can."] +
               [f"{e['name']}{' ' + e['venue'] if e.get('venue') else ''}: {{{{{e['key']}}}}}." for e in xs]}
        i = next((k for k, s in enumerate(p["sections"]) if s["h"].startswith("How we plan")), len(p["sections"]))
        p["sections"].insert(i, sec)

NAV = {"index.html": "Destinations", "th.html": "จุดหมายปลายทาง", "zh.html": "目的地", "ja.html": "目的地"}
def site_nav(on):
    """A Destinations link in the main site's menu, mobile menu and footer, next to "How it works"; removed when there
    is nothing to show (launched with no approved page yet)."""
    for f, label in NAV.items():
        p = os.path.join(SITE, f)
        if not os.path.exists(p): continue
        t = open(p, encoding="utf-8").read()
        t = re.sub(r'<a href="/destinations/" data-ae="dest"[^>]*>[^<]*</a>', "", t)
        if on:
            t = re.sub(r'(<a data-dc-tpl="\d+" href="#journey">[^<]*</a>)', lambda m: m.group(1) + f'<a href="/destinations/" data-ae="dest">{label}</a>', t, count=1)
            t = re.sub(r'(<a href="#journey" onClick="\{\{ closeMenu \}\}"( style="[^"]*")>How it works</a>)', lambda m: m.group(1) + f'<a href="/destinations/" data-ae="dest"{m.group(2)}>Destinations</a>', t, count=1)
            t = re.sub(r'(<a href="#journey">How it works</a>)', lambda m: m.group(1) + '<a href="/destinations/" data-ae="dest">Destinations</a>', t, count=1)
        open(p, "w", encoding="utf-8").write(t)
    p = os.path.join(SITE, "i18n.js")
    if on and os.path.exists(p):
        t = open(p, encoding="utf-8").read(); row = "['How it works','ขั้นตอนการให้บริการ','服务流程','ご利用の流れ'],"
        if "['Destinations'," not in t and row in t: open(p, "w", encoding="utf-8").write(t.replace(row, row + "\n['Destinations','จุดหมายปลายทาง','目的地','目的地'],"))

GROUPS = [("region", "Regions"), ("city", "Cities"), ("airport", "Airports"), ("guide", "Guides")]
def hub(F, S, pub, verbose=True):
    """/destinations/: every published page, grouped. On the test website drafts are listed with a Draft mark."""
    out = os.path.join(SITE, "destinations", "index.html")
    if not pub:
        if os.path.exists(out): os.remove(out)
        return
    secs = []
    for t, name in GROUPS:
        xs = sorted([p for p in pub if p["type"] == t], key=lambda p: p["h1"])
        if not xs: continue
        cards = "".join(f'<a href="{p["path"]}">{"" if company.LAUNCHED or not p.get("draft") else "<em class=draft>Draft</em>"}<b>{html.escape(p["h1"])}</b><span>{html.escape(fill(p["lead"], F, S, [], plain=True))}</span></a>' for p in xs)
        secs.append(f'<h2 id="{t}">{name}</h2><div class="grid">{cards}</div>')
    p = {"path": "/destinations/", "type": "hub", "title": "Private jet destinations, airports and guides", "draft": False,
         "description": "Guides to private flights by region, city and airport, and how charter works, each checked against official sources with the date it was checked.",
         "eyebrow": "Destinations and guides", "h1": "Where private flights go, and how they work",
         "lead": "Guides to regions, cities and airports, and to how charter works. Every fact is checked against an official source, with the date. Any aircraft, any route, upon availability.",
         "sections": [], "_main": '<div class="hub">' + "".join(secs) + "</div>"}
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write(page_html(p, F, S, pub))
    if verbose: print(f"  /destinations/  {len(pub)} pages listed")

def portal_rules(S, verbose=True):
    """The portal's trip checks read one file: sanctioned places plus the verified airport rules (apps/portal/airport-rules.json)."""
    d = os.path.join(HERE, "airports"); A = {}
    for f in sorted(os.listdir(d)):
        if not f.endswith(".json") or f.startswith("_"): continue
        a = json.load(open(os.path.join(d, f), encoding="utf-8"))
        rules = {k: {**r, "srcTitle": S[r["src"]]["title"], "srcUrl": S[r["src"]]["url"], "checked": S[r["src"]]["checked"]} for k, r in a.get("rules", {}).items()}
        A[a["icao"]] = {"status": a["status"], "checked": a["checked"], "tz": a["tz"], "country": a["country"], "rules": rules, "missing": a.get("missing", [])}
    out = {"generated": datetime.date.today().isoformat(), "excluded": {k: EXCL[k] for k in ("countries", "words", "iso2", "airports_iata")}, "airports": A}
    p = os.path.join(HERE, "..", "..", "portal", "airport-rules.json")
    open(p, "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    if verbose: print(f"  portal: airport-rules.json with {len(A)} airports")

def run(verbose=True):
    S, F, P = load()
    check_excluded(); check_sources(S); check_facts(F, S)
    import check_airports; check_airports.run(verbose)
    portal_rules(S, verbose)
    paths = set(); built = []
    add_events(P)
    for p in P: check_page(p, F)
    # launched: drafts are not published at all; test website: everything is built so Morten can use it in full
    pub = [p for p in P if not (company.LAUNCHED and p.get("draft"))]
    for p in P:
        if p in pub: continue
        d = os.path.join(SITE, p["path"].strip("/"))
        if os.path.isdir(d): shutil.rmtree(d)
    for p in pub:
        if p["path"] in paths: raise Bad(f"{p['_file']}: path used twice")
        paths.add(p["path"]); w = check_page(p, F)
        out = os.path.join(SITE, p["path"].strip("/"), "index.html")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8").write(page_html(p, F, S, pub))
        built.append({"path": p["path"], "draft": bool(p.get("draft")), "words": w})
        if verbose: print(f"  {p['path']}  {w} words{'  (draft: noindex)' if p.get('draft') else ''}")
    hub(F, S, pub, verbose); site_nav(bool(pub))
    json.dump(built, open(os.path.join(HERE, "built.json"), "w"), indent=1)
    return built

if __name__ == "__main__":
    try: run()
    except Bad as e: print("STOP:", e); sys.exit(1)
