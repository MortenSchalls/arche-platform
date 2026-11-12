"""No Bangkok office photo on the website until the office opens (Morten, 26 Oct 2026: Singapore only; build.py BANGKOK_OFFICE).
The page template still holds a hidden Bangkok office slot on the contact pages, and the build copied the photo to
site/img/, where anyone could open it. Run by build.py after every page is written: removes the hidden slot from every
page, the photo files and their entry in img/optimised.json."""
import os, re, glob, json
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site")
SLOT = re.compile(r'\s*<div data-dc-tpl="\d+" style="position: absolute; inset: 0px; display: none;">\s*<image-slot[^>]*id="office-bangkok"[^>]*></image-slot>\s*</div>')
def run():
    n = 0
    for p in glob.glob(os.path.join(SITE, "**", "*.html"), recursive=True):
        s = open(p, encoding="utf-8").read(); t = SLOT.sub("", s)
        if t != s: open(p, "w", encoding="utf-8").write(t); n += 1
    for f in glob.glob(os.path.join(SITE, "img", "office-bangkok*")): os.remove(f)
    o = os.path.join(SITE, "img", "optimised.json")
    if os.path.exists(o):
        d = json.load(open(o, encoding="utf-8"))
        if isinstance(d, dict):
            k = [x for x in d if "office-bangkok" in x]
            for x in k: d.pop(x)
            if k: json.dump(d, open(o, "w", encoding="utf-8"), indent=1)
    print("  Bangkok office photo removed from", n, "pages")
if __name__ == "__main__":
    run()
