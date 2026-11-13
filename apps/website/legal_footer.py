"""The same footer on the legal pages as on every other page (Morten, 13 Nov 2026: "ensure we are aligned throughout all
pages on layout and design"). Privacy, Terms of business and Website terms had no footer, so no broker disclosure, no
footer menu and no company line. Run by build.py after the content pages: copies the footer of a built content page
(and its styles, scoped to the footer) into the three legal pages, with the company line in place of "This page"."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site")
PAGES = ["privacy.html", "terms.html", "website-terms.html"]
SRC = os.path.join(SITE, "destinations", "index.html")

def footer_and_css():
    s = open(SRC, encoding="utf-8").read()
    f = s[s.index('<footer class="ft">'):s.index("</footer>") + len("</footer>")]
    f = re.sub(r'<div><span class="k">This page</span><p>.*?</p>(<p>.*?</p>)</div>', r'<div><span class="k">Company</span>\1</div>', f, flags=re.S)
    css = re.search(r"<style>(.*?)</style>", s, re.S).group(1)
    keep = []
    for line in css.splitlines():
        if line.startswith("footer"): keep.append(line)
        elif line.startswith((".brand{", ".brand .w{", ".brand .x{", ".wrap{")):
            keep.append(re.sub(r"(^|\})\s*(\.[\w ]+[^{]*)\{", lambda m: m.group(1) + "footer.ft " + m.group(2) + "{", line))
    keep.append("@media (max-width:760px){footer.ft .wrap{padding:0 16px}footer.ft .brand .w{font-size:30px}}")
    keep.append("footer.ft a{text-decoration:none}footer.ft a:hover{text-decoration:underline}")
    return f, "\n".join(keep)

def run():
    f, css = footer_and_css(); n = 0
    for name in PAGES:
        p = os.path.join(SITE, name)
        t = open(p, encoding="utf-8").read()
        t = re.sub(r'<!--ae:legalfoot-->.*?<!--/ae:legalfoot-->', "", t, flags=re.S)
        t = t.replace("</main>", "</main>\n<!--ae:legalfoot--><style>" + css + "</style>" + f + "<!--/ae:legalfoot-->", 1)
        open(p, "w", encoding="utf-8").write(t); n += 1
    print("  legal pages: the site footer on", n, "pages")

if __name__ == "__main__":
    run()
