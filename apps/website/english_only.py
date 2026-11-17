"""English only until a translator has checked the other languages (Morten, 17 Nov 2026: "switch off all languages
except English until we have had it checked with a translator").

With company.LANGUAGES_ON = False, after every other step of the build:
  - the Thai, Chinese and Japanese pages are not published (site/th.html, zh.html, ja.html and <page>/th|zh|ja/);
  - the language menu (EN ▾) is taken out of the top bar on every page, and the page's own language buttons do nothing;
  - the hreflang links to the other languages and their sitemap entries are removed;
  - vercel.json sends any old /th, /zh or /ja address to the English page (temporary redirect, so the addresses can come
    back unchanged once the translations are checked).
The translations themselves (i18n.js, langs.py, nav.py) are kept unchanged: setting LANGUAGES_ON = True brings them back.
"""
import os, re, json, shutil
import company

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, "site")
OTHER = ("th", "zh", "ja")
SKIP = ("portal-preview",)

def run(verbose=True):
    if getattr(company, "LANGUAGES_ON", True): return
    gone = 0
    for l in OTHER:
        f = os.path.join(SITE, l + ".html")
        if os.path.exists(f): os.remove(f); gone += 1
    for root, dirs, files in os.walk(SITE):
        for d in list(dirs):
            if d in OTHER:
                shutil.rmtree(os.path.join(root, d)); dirs.remove(d); gone += 1
    pages = 0
    for root, dirs, files in os.walk(SITE):
        if os.path.relpath(root, SITE).split(os.sep)[0] in SKIP: continue
        for fn in files:
            if not fn.endswith(".html"): continue
            p = os.path.join(root, fn); t = open(p, encoding="utf-8").read(); o = t
            t = re.sub(r'<details class="ae-nav-lang">.*?</details>', "", t, flags=re.S)
            t = re.sub(r'<link rel="alternate" hreflang="(?:th|zh-Hans|zh|ja|x-default)" href="[^"]*">', "", t)
            t = re.sub(r'<link rel="alternate" hreflang="en" href="[^"]*">', "", t)
            t = t.replace("setLang(l) { if (window.__ARCHE_LANG", "setLang(l) { if (l !== 'en') return; if (window.__ARCHE_LANG")
            if t != o: open(p, "w", encoding="utf-8").write(t); pages += 1
    sm = os.path.join(SITE, "sitemap.xml")
    if os.path.exists(sm):
        x = open(sm, encoding="utf-8").read()
        x = re.sub(r"<url>(?:(?!</url>).)*?/(?:th|zh|ja)(?:/|\.html)?</loc>.*?</url>\s*", "", x, flags=re.S)
        x = re.sub(r'<xhtml:link rel="alternate" hreflang="(?:th|zh-Hans|zh|ja|x-default)"[^>]*/>', "", x)
        open(sm, "w", encoding="utf-8").write(x)
    vj = os.path.join(SITE, "vercel.json")
    if os.path.exists(vj):
        v = json.load(open(vj, encoding="utf-8"))
        v["rewrites"] = [r for r in v.get("rewrites", []) if r.get("source") not in ("/th", "/zh", "/ja")]
        red = [r for r in v.get("redirects", []) if "english_only" not in r.get("source", "") and not re.match(r"^(/:page)?/\((th\|zh\|ja)\)", r.get("source", ""))]
        red += [{"source": "/(th|zh|ja)", "destination": "/", "permanent": False},
                {"source": "/:page/(th|zh|ja)", "destination": "/:page/", "permanent": False},
                {"source": "/:page/(th|zh|ja)/", "destination": "/:page/", "permanent": False}]
        v["redirects"] = red
        json.dump(v, open(vj, "w", encoding="utf-8"), indent=1)
    if verbose: print(f"  english only: {gone} other-language pages or folders left out; language menu removed on {pages} pages")

def problems():
    """what check_site.py fails on while LANGUAGES_ON is False"""
    out = []
    if getattr(company, "LANGUAGES_ON", True): return out
    for l in OTHER:
        if os.path.exists(os.path.join(SITE, l + ".html")): out.append(f"{l}.html published (languages are off)")
    for root, dirs, files in os.walk(SITE):
        rel = os.path.relpath(root, SITE)
        if rel.split(os.sep)[0] in SKIP: continue
        if os.path.basename(root) in OTHER: out.append(f"{rel}/ published (languages are off)")
        for fn in files:
            if fn.endswith(".html"):
                t = open(os.path.join(root, fn), encoding="utf-8").read()
                if 'class="ae-nav-lang"' in t: out.append(f"{os.path.join(rel, fn)}: language menu still shown")
                if re.search(r'hreflang="(?:th|zh-Hans|ja)"', t): out.append(f"{os.path.join(rel, fn)}: links to another language")
    return out

if __name__ == "__main__": run()
