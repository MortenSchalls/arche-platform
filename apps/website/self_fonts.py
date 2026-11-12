"""The website's fonts are served from the site itself, never from a font service (Morten, 9 Nov 2026: the website follows
the same data-protection rules as Navoryx, which hosts its own fonts). Loading fonts from Google sends every visitor's
address to Google. This step copies apps/website/fonts/ (Cinzel, Prata, Hanken Grotesk, Open Font License, from the
@fontsource packages) to site/fonts/ and replaces every link to fonts.googleapis.com / fonts.gstatic.com on every page
with /fonts/fonts.css (and /fonts/noto.css where the page used Noto Sans Thai, SC or JP). check_site.py fails if a page still links to a font service."""
import os, re, shutil, glob
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "site")
LINK = '<link href="/fonts/fonts.css" rel="stylesheet">'
NOTO = '<link href="/fonts/noto.css" rel="stylesheet">'   # Thai, Chinese and Japanese, on the pages that use them
GOOGLE = re.compile(r'<link\b[^>]*https://fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*', re.I)

def page(s):
    first = GOOGLE.search(s)
    if not first: return s
    noto = any("Noto+Sans" in m.group(0) for m in GOOGLE.finditer(s))
    s = s[:first.start()] + "\x00" + s[first.start():]
    s = GOOGLE.sub("", s)
    return s.replace("\x00", LINK + "\n" + (NOTO + "\n" if noto else ""), 1)

def run():
    shutil.copytree(os.path.join(HERE, "fonts"), os.path.join(OUT, "fonts"), dirs_exist_ok=True)
    n = 0
    for p in glob.glob(os.path.join(OUT, "**", "*.html"), recursive=True):
        s = open(p, encoding="utf-8").read(); t = page(s)
        if t != s: open(p, "w", encoding="utf-8").write(t); n += 1
    print("  fonts: served from /fonts/ on", n, "pages")

if __name__ == "__main__":
    run()
