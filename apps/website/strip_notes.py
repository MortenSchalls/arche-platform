"""No internal notes in what visitors download (full audit, 16 Nov 2026): code comments that name people or the other
business (for example "(Morten, 13 Nov 2026)" or "like the Navoryx compass") stay in the sources and are taken out of the
built HTML, CSS and JS. Only comments are touched: CSS and JS /* ... */ blocks, JS // line comments and HTML <!-- -->
comments that contain one of the words below. check_site.py fails if any such word is left in a built file."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
WORDS = r"(?:Morten|Navoryx|Chayanun)"
BLOCK = re.compile(r"/\*(?:(?!\*/).)*?" + WORDS + r".*?\*/", re.S)
HTMLC = re.compile(r"<!--(?:(?!-->).)*?" + WORDS + r".*?-->", re.S)
LINE = re.compile(r"(?<![:\"'\\/])//[^\n]*?" + WORDS + r"[^\n]*")


def clean(t, ext):
    t = BLOCK.sub("", t)
    if ext == ".html": t = HTMLC.sub("", t)
    if ext in (".js", ".html"): t = LINE.sub("", t)
    return t


def run():
    out, n = os.path.join(HERE, "site"), 0
    for root, _, files in os.walk(out):
        for f in files:
            ext = os.path.splitext(f)[1]
            if ext not in (".html", ".css", ".js"): continue
            p = os.path.join(root, f)
            t = open(p, encoding="utf-8").read(); c = clean(t, ext)
            if c != t: open(p, "w", encoding="utf-8").write(c); n += 1
    print("  internal notes taken out of", n, "files")


def left():
    out, bad = os.path.join(HERE, "site"), []
    for root, _, files in os.walk(out):
        for f in files:
            if os.path.splitext(f)[1] in (".html", ".css", ".js"):
                p = os.path.join(root, f)
                if re.search(WORDS, open(p, encoding="utf-8").read()): bad.append(os.path.relpath(p, out))
    return bad


if __name__ == "__main__":
    run(); print("left:", left())
