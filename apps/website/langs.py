"""One address per language, and a ready-made copy of the page for search engines (Morten, 20 Oct 2026).

  archeaviation.com/      English
  archeaviation.com/th    Thai          (site/th.html, served at /th by a rewrite in vercel.json)
  archeaviation.com/zh    Chinese
  archeaviation.com/ja    Japanese

Each file carries a finished copy of the page in its language ("prerender"), so search engines and slow phones see the
whole page at once. The live page builds itself out of sight and replaces the copy as soon as it is ready; visitors
see no difference. The language buttons move between the four addresses.
"""
import os, re, json, threading, http.server, functools, socket

LANGS = {
    "th": {"locale": "th_TH", "title": "Archē Executive · เช่าเหมาลำเครื่องบินส่วนตัว · สิงคโปร์และกรุงเทพฯ",
           "desc": "เช่าเหมาลำเครื่องบินส่วนตัวจากสิงคโปร์และกรุงเทพฯ สู่ทุกที่ทั่วโลก เราคัดสรรเครื่องบินที่เหมาะสม ตรวจสอบผู้ให้บริการ และดูแลท่านจนกว่าจะลงจอด ตอบกลับภายใน 15 นาที ทุกเวลา"},
    "zh": {"locale": "zh_CN", "title": "Archē Executive · 私人飞机包机 · 新加坡与曼谷",
           "desc": "从新加坡和曼谷出发、通达全球的私人飞机包机服务。我们为您甄选合适的飞机，审核其背后的运营商，并全程陪伴直至落地。全天候 15 分钟内回复。"},
    "ja": {"locale": "ja_JP", "title": "Archē Executive · プライベートジェット・チャーター · シンガポール・バンコク",
           "desc": "シンガポールとバンコクから世界各地へ、プライベートジェット・チャーター。最適な機材を選び、運航会社を確かめ、着陸まで寄り添います。24時間いつでも、15分以内にお返事します。"},
}
HTML_LANG = {"en": "en", "th": "th", "zh": "zh-Hans", "ja": "ja"}

def patch_runtime(s):
    """Start in the page's own language and make the language buttons move between the four addresses."""
    old = "lang: (() => { try { return localStorage.getItem('arche-lang') || 'en'; } catch (e) { return 'en'; } })(),"
    assert s.count(old) == 1, "language start-up code changed in the Design file"
    s = s.replace(old, "lang: window.__ARCHE_LANG || 'en',")
    old = "setLang(l) { this.setState({ lang: l }"
    assert s.count(old) == 1
    s = s.replace(old, "setLang(l) { if (window.__ARCHE_LANG && l !== window.__ARCHE_LANG) { location.href = (l === 'en' ? '/' : '/' + l) + location.hash; return; } this.setState({ lang: l }")
    return s

def alternates(site):
    return "".join(f'<link rel="alternate" hreflang="{HTML_LANG[l]}" href="{site}/{"" if l == "en" else l}">' for l in ("en", "th", "zh", "ja")) + \
           f'<link rel="alternate" hreflang="x-default" href="{site}/">\n'

SWAP = """<style>#dc-prerender+#dc-root{position:absolute!important;left:0;right:0;top:0;visibility:hidden!important}</style>
<script>(function(){var want=window.__ARCHE_LANG||'en';var t=setInterval(function(){var p=document.getElementById('dc-prerender'),r=document.getElementById('dc-root');
if(!p){clearInterval(t);return}if(r&&r.querySelector('#contact')&&window.__archeI18n===want){clearInterval(t);var y=window.scrollY;p.remove();window.scrollTo(0,y)}},30);
setTimeout(function(){clearInterval(t);var p=document.getElementById('dc-prerender');if(p)p.remove()},10000)})();</script>
"""

class _Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = path.split("?")[0].split("#")[0]
        if p.rstrip("/") in ("/th", "/zh", "/ja"): path = p.rstrip("/") + ".html"
        return super().translate_path(path)
    def log_message(self, *a): pass

def serve(directory):
    sock = socket.socket(); sock.bind(("127.0.0.1", 0)); port = sock.getsockname()[1]; sock.close()
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(_Handler, directory=directory))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, port

def variant(s, lang, site):
    """The English page turned into another language's page (head only; the body copy is added by prerender)."""
    s = s.replace('<html lang="en">', f'<html lang="{HTML_LANG[lang]}">', 1)
    s = s.replace("<script>window.__resources=", f'<script>window.__ARCHE_LANG="{lang}";</script>\n<script>window.__resources=', 1)
    if lang == "en": return s
    L = LANGS[lang]; esc = lambda x: x.replace('"', "&quot;")
    s = re.sub(r"<title>.*?</title>", f"<title>{L['title']}</title>", s, count=1)
    for attr in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        s = re.sub(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{esc(L["desc"])}">', s, count=1)
    for attr in ('property="og:title"', 'name="twitter:title"'):
        s = re.sub(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{esc(L["title"])}">', s, count=1)
    s = s.replace(f'<link rel="canonical" href="{site}/">', f'<link rel="canonical" href="{site}/{lang}">', 1)
    s = s.replace(f'<meta property="og:url" content="{site}/">', f'<meta property="og:url" content="{site}/{lang}">', 1)
    s = s.replace('<meta property="og:locale" content="en_GB">', f'<meta property="og:locale" content="{L["locale"]}">', 1)
    return s

def build(out_dir, site):
    """Write th/zh/ja pages and add the finished copy to all four. Called by build.py after index.html is written."""
    from playwright.sync_api import sync_playwright
    path = os.path.join(out_dir, "index.html")
    base = open(path, encoding="utf-8").read()
    assert 'id="dc-prerender"' not in base
    base = base.replace('<link rel="canonical"', alternates(site) + '<link rel="canonical"', 1)
    pages = {l: variant(base, l, site) for l in ("en", "th", "zh", "ja")}
    files = {"en": "index.html", "th": "th.html", "zh": "zh.html", "ja": "ja.html"}
    for l, f in files.items(): open(os.path.join(out_dir, f), "w", encoding="utf-8").write(pages[l])
    srv, port = serve(out_dir)
    try:
        with sync_playwright() as pw:
            br = pw.chromium.launch()
            for l, f in files.items():
                pg = br.new_page(viewport={"width": 1440, "height": 900})
                pg.goto(f"http://127.0.0.1:{port}/{'' if l == 'en' else l}")
                pg.wait_for_function(f"document.querySelector('#dc-root #contact') && window.__archeI18n === '{l}'", timeout=30000)
                pg.wait_for_timeout(400)
                snap = pg.evaluate("document.getElementById('dc-root').innerHTML")
                pg.close()
                assert len(snap) > 20000, f"{l}: page copy looks empty"
                s = pages[l].replace("<x-dc>", f'<div id="dc-prerender">{snap}</div>\n<x-dc>', 1)
                s = s.replace("</body>", SWAP + "</body>", 1)
                open(os.path.join(out_dir, f), "w", encoding="utf-8").write(s)
                print(f"  {f}: page copy {len(snap) // 1024} KB")
            br.close()
    finally:
        srv.shutdown()
