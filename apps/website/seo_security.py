"""Search, speed and security settings kept on every build (Morten, 26 Oct 2026).
Run by build.py after site_fixes.py; can also be run on its own:  python3 apps/website/seo_security.py
- Search: shorter English description, business details for Google (registered office, email, languages),
  sitemap with dates and language versions, small icons, theme colour.
- Speed: the hidden Bangkok office photo is no longer loaded; large photos are re-encoded smaller.
- Security: strict browser security headers for the whole site (vercel.json).
- Statistics: track.js on every page (first-party, no cookies; see the privacy notice)."""
import os, re, json, datetime
import company
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, "site")
BASE = "https://archeaviation.com"
DESC_EN = "Private jet charter from Singapore to anywhere. We find the right aircraft, vet the operator and stay with you until you land. Replies within 15 minutes, 24/7."
OLD_DESC_EN = "Private jet charter from Singapore, worldwide. We find the right aircraft, check the operator behind it, and stay with you until you land. Answers within 15 minutes, any hour."
PAGES = {"index.html": ("/", "en"), "th.html": ("/th", "th"), "zh.html": ("/zh", "zh-Hans"), "ja.html": ("/ja", "ja")}
LOCALES = {"index.html": "en_GB", "th.html": "th_TH", "zh.html": "zh_CN", "ja.html": "ja_JP"}

def bangkok_open():
    s = open(os.path.join(HERE, "build.py"), encoding="utf-8").read()
    m = re.search(r"^BANGKOK_OFFICE\s*=\s*(True|False)", s, re.M)
    return bool(m and m.group(1) == "True")

def icons():
    from PIL import Image
    src = os.path.join(HERE, "..", "portal", "img", "arche-icon-512.png")
    out = os.path.join(SITE, "assets")
    for n in (32, 180, 192, 512):
        p = os.path.join(out, f"icon-{n}.png")
        if not os.path.exists(p):
            Image.open(src).convert("RGBA").resize((n, n), Image.LANCZOS).save(p, optimize=True)

def photos():
    """Re-encode big photos once (listed in img/optimised.json so they are never re-encoded twice)."""
    from PIL import Image
    d = os.path.join(SITE, "img"); mark = os.path.join(d, "optimised.json")
    done = json.load(open(mark)) if os.path.exists(mark) else {}
    for f in sorted(os.listdir(d)):
        p = os.path.join(d, f)
        if not f.endswith(".webp") or os.path.getsize(p) < 140_000 or done.get(f) == os.path.getsize(p): continue
        im = Image.open(p); im.load()
        if max(im.size) > 1920: im.thumbnail((1920, 1920), Image.LANCZOS)
        im.save(p, "WEBP", quality=72, method=6); done[f] = os.path.getsize(p)
    json.dump(done, open(mark, "w"), indent=1, sort_keys=True)

def head(t, name):
    path, lang = PAGES[name]
    # icons and theme colour
    t = re.sub(r'<link rel="icon" href="/assets/arche-executive-logo\.png">',
               '<link rel="icon" type="image/png" sizes="32x32" href="/assets/icon-32.png">\n'
               '<link rel="apple-touch-icon" href="/assets/icon-180.png">\n<meta name="theme-color" content="#2b2e33">', t, count=1)
    # English description: Google shows about 155 characters
    if name == "index.html": t = t.replace(OLD_DESC_EN, DESC_EN)
    # other language versions for link previews
    if 'og:locale:alternate' not in t:
        alts = "".join(f'\n<meta property="og:locale:alternate" content="{v}">' for k, v in LOCALES.items() if k != name)
        t = re.sub(r'(<meta property="og:locale" content="[^"]*">)', lambda m: m.group(1) + alts, t, count=1)
    # business details for Google
    def ld(m):
        try: g = json.loads(m.group(1))
        except Exception: return m.group(0)
        for n in g.get("@graph", []):
            if n.get("@type") == "Organization":
                street, rest = company.ADDRESS.split(", Singapore ")[0], company.ADDRESS.rsplit(" ", 1)[-1]
                n["address"] = {"@type": "PostalAddress", "streetAddress": street, "addressLocality": "Singapore", "postalCode": rest, "addressCountry": "SG"}
                n["email"] = company.EMAIL
                cp = {"@type": "ContactPoint", "contactType": "customer service", "email": company.EMAIL,
                      "availableLanguage": ["English", "Thai", "Chinese", "Japanese"], "areaServed": "Worldwide",
                      "hoursAvailable": {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "00:00", "closes": "23:59"}}
                if company.PHONE: n["telephone"] = cp["telephone"] = company.PHONE
                n["contactPoint"] = [cp]
                if company.UEN: n["identifier"] = {"@type": "PropertyValue", "propertyID": "UEN", "value": company.UEN}
                if name == "index.html": n["description"] = DESC_EN
        return '<script type="application/ld+json">' + json.dumps(g, ensure_ascii=False) + "</script>"
    t = re.sub(r'<script type="application/ld\+json">(.*?)</script>', ld, t, count=1, flags=re.S)
    return t

def body(t):
    if not bangkok_open():   # the pre-drawn page still held the hidden Bangkok photo, which browsers downloaded (360 KB)
        t = re.sub(r'\s*<div data-dc-tpl="383" style="position: absolute; inset: 0px; display: none;">\s*<image-slot[^>]*id="office-bangkok"[^>]*></image-slot>\s*</div>', "", t)
    if "/track.js" not in t:
        t = t.replace("</body>", '<script src="/track.js" defer></script>\n</body>', 1)
    return t

def state():
    p = os.path.join(SITE, "image-slots.state.json")
    if bangkok_open() or not os.path.exists(p): return
    s = json.load(open(p, encoding="utf-8"))
    if s.pop("office-bangkok", None) is not None: json.dump(s, open(p, "w", encoding="utf-8"))

def sitemap():
    day = datetime.date.today().isoformat()
    alt = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{lang}" href="{BASE}{path}"/>' for path, lang in PAGES.values()) + f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE}/"/>'
    urls = "".join(f"\n  <url><loc>{BASE}{path}</loc><lastmod>{day}</lastmod>{alt}\n  </url>" for path, lang in PAGES.values())
    urls += "".join(f"\n  <url><loc>{BASE}/{p}</loc><lastmod>{day}</lastmod></url>" for p in ("terms.html", "privacy.html"))
    built = os.path.join(HERE, "content", "built.json")   # verified content pages; drafts stay out until approved
    if os.path.exists(built):
        urls += "".join(f"\n  <url><loc>{BASE}{b['path']}</loc><lastmod>{day}</lastmod></url>" for b in json.load(open(built)) if not b["draft"])
    open(os.path.join(SITE, "sitemap.xml"), "w", encoding="utf-8").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + urls + "\n</urlset>\n")

CSP = ("default-src 'self'; "
       "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "          # the page template is compiled in the browser; no outside scripts
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src 'self' https://fonts.gstatic.com data:; "
       "img-src 'self' data: blob:; "
       "connect-src 'self'; "
       "frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; "
       "manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests")
SECURITY = [
    {"key": "Content-Security-Policy", "value": CSP},
    {"key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload"},
    {"key": "X-Content-Type-Options", "value": "nosniff"},
    {"key": "X-Frame-Options", "value": "DENY"},
    {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
    {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()"},
    {"key": "Cross-Origin-Opener-Policy", "value": "same-origin"},
]
def vercel():
    p = os.path.join(SITE, "vercel.json")
    v = json.load(open(p, encoding="utf-8"))
    hs = [h for h in v.get("headers", []) if h.get("source") != "/(.*)" or h.get("has")]
    hs.insert(0, {"source": "/(.*)", "headers": SECURITY})
    hs.append({"source": "/api/(.*)", "headers": [{"key": "Cache-Control", "value": "no-store"}, {"key": "X-Robots-Tag", "value": "noindex"}]})
    seen, out = set(), []
    for h in hs:
        k = json.dumps(h, sort_keys=True)
        if k not in seen: seen.add(k); out.append(h)
    v["headers"] = out
    json.dump(v, open(p, "w", encoding="utf-8"), indent=1, ensure_ascii=False)

def run():
    icons(); photos(); state(); sitemap(); vercel()
    changed = []
    for f in os.listdir(SITE):
        if not f.endswith(".html"): continue
        p = os.path.join(SITE, f); t = open(p, encoding="utf-8").read()
        n = body(head(t, f) if f in PAGES else t)
        if n != t: open(p, "w", encoding="utf-8").write(n); changed.append(f)
    return changed

if __name__ == "__main__":
    print("changed:", run())
