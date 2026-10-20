#!/usr/bin/env python3
"""Search and speed basics for the live site, applied by build.py after the page is assembled.
SITE_URL is the address Google should index; the test address on vercel.app is kept out of search."""
import os, json, base64, re
from PIL import Image, ImageDraw, ImageFont

SITE_URL = "https://archeaviation.com"
TITLE = "Archē Executive · Private jet charter · Singapore and Bangkok"
DESC = ("Private jet charter from Singapore and Bangkok, worldwide. We find the right aircraft, check the operator "
        "behind it, and stay with you until you land. Answers within 15 minutes, any hour.")
FONTS = ("https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Prata"
         "&family=Hanken+Grotesk:wght@300;400;500;600&family=Noto+Sans+Thai:wght@300;400;500"
         "&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Sans+JP:wght@300;400;500&display=swap")

def head_tags():
    org = {"@context": "https://schema.org", "@graph": [
        {"@type": "Organization", "@id": SITE_URL + "/#org", "name": "Archē Executive", "alternateName": "Arche Executive",
         "legalName": "Arche Executive Pte. Ltd.", "url": SITE_URL + "/", "logo": SITE_URL + "/assets/arche-executive-logo.png",
         "description": DESC, "areaServed": ["Singapore", "Thailand", "Asia-Pacific", "Worldwide"],
         "knowsAbout": ["Private jet charter", "Business aviation", "Aircraft charter brokerage", "Aviation advisory"]},
        {"@type": "Service", "@id": SITE_URL + "/#charter", "serviceType": "Private jet charter", "provider": {"@id": SITE_URL + "/#org"},
         "areaServed": ["Singapore", "Thailand", "Asia-Pacific", "Worldwide"],
         "description": "Whole-aircraft private jet charter arranged as agent for the client, on third-party operators holding an Air Operator Certificate."},
        {"@type": "WebSite", "@id": SITE_URL + "/#site", "url": SITE_URL + "/", "name": "Archē Executive", "publisher": {"@id": SITE_URL + "/#org"},
         "inLanguage": "en"}]}
    return f'''<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<link rel="canonical" href="{SITE_URL}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Archē Executive">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:url" content="{SITE_URL}/">
<meta property="og:image" content="{SITE_URL}/og-image.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{TITLE}">
<meta name="twitter:description" content="{DESC}">
<meta name="twitter:image" content="{SITE_URL}/og-image.jpg">
<link rel="preload" as="image" href="/assets/jet-line-watermark-wide.png">
<script type="application/ld+json">{json.dumps(org, ensure_ascii=False)}</script>
'''

def apply(s, out_dir, here):
    # language, title/description/link previews/business description
    s = s.replace("<html>", '<html lang="en">', 1)
    s = re.sub(r"<title>.*?</title>\n?", "", s, count=1)
    s = re.sub(r'<meta name="description"[^>]*>\n?', "", s, count=1)
    s = s.replace('<link rel="stylesheet" href="/site-fixes.css">', head_tags() + '<link rel="stylesheet" href="/site-fixes.css">', 1)
    # fonts actually used (headings Prata, logo Cinzel, text Hanken Grotesk; Noto only downloads for Thai/Chinese/Japanese text)
    s2 = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet">',
                f'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="{FONTS.replace("&", "&amp;")}" rel="stylesheet">', s, count=1)
    assert s2 != s, "font link not found"; s = s2
    # images: one file each instead of one 1.1 MB bundle, so the page shows before every picture has loaded
    sp = os.path.join(out_dir, "image-slots.state.json"); slots = json.load(open(sp, encoding="utf-8"))
    os.makedirs(os.path.join(out_dir, "img"), exist_ok=True)
    for k, v in slots.items():
        u = v.get("u", "")
        m = re.match(r"data:image/(webp|jpeg|jpg|png);base64,(.*)", u, re.S)
        if not m: continue
        ext = {"jpeg": "jpg"}.get(m.group(1), m.group(1)); name = f"{k}.{ext}"
        open(os.path.join(out_dir, "img", name), "wb").write(base64.b64decode(m.group(2)))
        v["u"] = "img/" + name
    json.dump(slots, open(sp, "w", encoding="utf-8"))
    # robots and sitemap
    open(os.path.join(out_dir, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    open(os.path.join(out_dir, "sitemap.xml"), "w").write(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{SITE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>{SITE_URL}/th</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>{SITE_URL}/zh</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>{SITE_URL}/ja</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>{SITE_URL}/privacy.html</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>
  <url><loc>{SITE_URL}/terms.html</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>
</urlset>
''')
    # keep the test address (*.vercel.app) out of search results; only archeaviation.com gets indexed
    json.dump({"rewrites": [{"source": f"/{l}", "destination": f"/{l}.html"} for l in ("th", "zh", "ja")],
               "headers": [{"source": "/(.*)", "has": [{"type": "host", "value": ".*\\.vercel\\.app"}],
                            "headers": [{"key": "X-Robots-Tag", "value": "noindex, nofollow"}]},
                           {"source": "/(img|assets|vendor)/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=2592000"}]}]},
              open(os.path.join(out_dir, "vercel.json"), "w"), indent=1)
    og_image(out_dir, here)
    return s

def og_image(out_dir, here):
    """1200 x 630 link-preview picture: charcoal, compass ring, the aircraft and the name."""
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (52, 55, 61)); d = ImageDraw.Draw(img)
    for r in range(380, 0, -4):
        c = int(52 + 14 * (1 - r / 380)); d.ellipse((W/2 - r*1.6, 250 - r, W/2 + r*1.6, 250 + r), fill=(c, c + 3, c + 9))
    jet = Image.open(os.path.join(out_dir, "assets", "jet-line-watermark-wide.png")).convert("RGBA")
    jw = 1000; jet = jet.resize((jw, int(jet.size[1] * jw / jet.size[0])), Image.LANCZOS)
    a = jet.split()[3].point(lambda v: int(v * 0.55)); jet.putalpha(a)
    img.paste(jet, ((W - jw) // 2, 70), jet)
    fdir = os.path.join(here, "..", "portal", "fonts")
    f1 = ImageFont.truetype(os.path.join(fdir, "Cinzel_600SemiBold.ttf"), 76)
    f2 = ImageFont.truetype(os.path.join(fdir, "HankenGrotesk_600SemiBold.ttf"), 22)
    f3 = ImageFont.truetype(os.path.join(fdir, "HankenGrotesk_400Regular.ttf"), 26)
    def centred(y, text, font, fill, spacing=0):
        w = sum(d.textlength(ch, font=font) for ch in text) + spacing * (len(text) - 1); x = (W - w) / 2
        for ch in text: d.text((x, y), ch, font=font, fill=fill); x += d.textlength(ch, font=font) + spacing
    centred(410, "ARCHĒ", f1, (226, 233, 241), 18)
    centred(505, "EXECUTIVE", f2, (190, 202, 216), 14)
    centred(555, "Private jet charter · Singapore · Bangkok", f3, (169, 189, 212))
    img.save(os.path.join(out_dir, "og-image.jpg"), quality=86)
