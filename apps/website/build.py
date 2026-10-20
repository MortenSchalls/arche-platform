#!/usr/bin/env python3
"""Build the public website (apps/website/site) from the Claude Design source.

    python3 apps/website/build.py

The Design file (design-source/Arche Executive v7.dc.html) stays the master for look and text.
This script copies it and adds what a live site needs:
  - React served from our own site (no dependency on unpkg.com at run time)
  - phone layout fixes (no sideways scrolling at 390 px)
  - the quote and call-back forms send to /api/enquiry, which stores them for the portal
  - a privacy line under each form and a discreet "Broker login" link in the footer
  - images read from image-slots.state.json (a normal file name, which every host serves)
"""
import os, shutil, re, json

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "design-source")
OUT = os.path.join(HERE, "site")
SHOW_ACCREDITATIONS = False   # Morten 20 Oct 2026: hide until Archē holds accreditations; set True to bring the section back
PORTAL = "https://arche-platform-sandy.vercel.app"  # change to https://portal.archeaviation.com at go-live

def build():
    os.makedirs(OUT, exist_ok=True)
    for f in ("support.js", "i18n.js", "doc-page.js"):
        shutil.copy(os.path.join(SRC, f), OUT)
    i18n = open(os.path.join(OUT, "i18n.js"), encoding="utf-8").read()
    row = "['Private aviation, handled with','การบินส่วนตัว ที่ดูแลด้วย','私人航空，','プライベート・アビエーションを、'],"
    assert i18n.count(row) == 1
    i18n = i18n.replace(row, row + "\n['Private aviation,','การบินส่วนตัว','私人航空，','プライベート・アビエーションを、'],\n['handled with','ที่ดูแลด้วย','',''],")
    open(os.path.join(OUT, "i18n.js"), "w", encoding="utf-8").write(i18n)
    for d in ("assets", "logo-export"):
        shutil.copytree(os.path.join(SRC, d), os.path.join(OUT, d), dirs_exist_ok=True)
    shutil.copy(os.path.join(SRC, ".image-slots.state.json"), os.path.join(OUT, "image-slots.state.json"))
    slot = open(os.path.join(SRC, "image-slot.js"), encoding="utf-8").read()
    assert "const STATE_FILE = '.image-slots.state.json';" in slot
    slot = slot.replace("const STATE_FILE = '.image-slots.state.json';", "const STATE_FILE = 'image-slots.state.json';")
    open(os.path.join(OUT, "image-slot.js"), "w", encoding="utf-8").write(slot)

    s = open(os.path.join(SRC, "Arche Executive v7.dc.html"), encoding="utf-8").read()

    # 1. React from our own site
    head_add = """<script>window.__resources={"https://unpkg.com/react@18.3.1/umd/react.production.min.js":"/vendor/react.production.min.js","https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js":"/vendor/react-dom.production.min.js"};</script>
<title>Archē Executive · Private jet charter · Singapore and Bangkok</title>
<meta name="description" content="Private jet charter from Singapore and Bangkok. We find the right aircraft, check the operator behind it, and stay with you until you land.">
<link rel="icon" href="/assets/arche-executive-logo.png">
<link rel="stylesheet" href="/site-fixes.css">
"""
    assert s.count('<script src="./support.js"></script>') == 1
    s = s.replace('<script src="./support.js"></script>', head_add + '<script src="./support.js"></script>')

    # 2. forms send to /api/enquiry
    old_submit = "this.setState(ok ? { step: 'done', detailsError: false } : { detailsError: true });"
    assert s.count(old_submit) == 1
    s = s.replace(old_submit, "if (ok) window.archeSend({ type: 'quote', trip: s.trip, legs: s.legs, returnDate: s.returnDate, pax: s.pax, name: s.name, reach: s.reach, reply: s.reply, lang: s.lang });\n        " + old_submit)
    old_cb = "cbSubmit: () => s.cbPhone.trim() && this.setState({ cbDone: true }),"
    assert s.count(old_cb) == 1
    s = s.replace(old_cb, "cbSubmit: () => { if (!s.cbPhone.trim()) return; window.archeSend({ type: 'callback', phone: s.cbPhone, lang: s.lang }); this.setState({ cbDone: true }); },")

    # 3. privacy line and broker login
    notice = '<p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#a3a9b1">We use your details only to answer this request. <a href="/privacy.html" style="color:#c6cbd2;text-decoration:underline">Privacy notice</a></p>'
    i = s.index('<button onClick="{{ submit }}"'); j = s.index("</button>", i) + len("</button>")
    s = s[:j] + notice + s[j:]
    cb = '<span style="font-size:14px;color:#c6cbd2">An advisor calls back within 15 minutes.</span>'
    assert s.count(cb) == 1
    s = s.replace(cb, cb[:-7] + ' <a href="/privacy.html" style="color:#a3a9b1;text-decoration:underline;font-size:12px">Privacy notice</a></span>')
    s = s.replace('<a href="#top">Privacy</a>', '<a href="/privacy.html">Privacy</a>')
    login = f'<div style="max-width:1440px;margin:0 auto;padding:0 40px 28px;text-align:right"><a href="{PORTAL}" rel="nofollow" style="font-size:11.5px;letter-spacing:0.16em;text-transform:uppercase;color:#a3a9b1">Broker login</a></div>'
    assert s.count("</footer>") == 1
    s = s.replace("</footer>", login + "</footer>")

    # accreditations strip (CERT. 01-04): kept in the Design file, left out of the live site until there is something to show
    if not SHOW_ACCREDITATIONS:
        i = s.index('<section id="standards"'); j = s.index("</section>", i) + len("</section>")
        s = s[:i] + s[j:]
    # hero heading (Morten 20 Oct 2026, option A): one typeface, upright; accent in the logo's steel-blue
    # gradient; line break after the comma. The two half-lines get their own translations below.
    old_h1 = 'Private aviation, handled with <em style="font-family:\'DM Serif Display\',Georgia,serif;font-style:italic;font-weight:400;color:#a9bdd4">care and precision.</em>'
    assert s.count(old_h1) == 1
    s = s.replace(old_h1, 'Private aviation,<br>handled with <em style="font-family:inherit;font-style:normal;font-weight:400;'
                  'background:linear-gradient(176deg,#dbe5f0 0%,#a9bdd4 45%,#7d96b4 100%);-webkit-background-clip:text;background-clip:text;color:transparent">care and precision.</em>')
    # 4. sender (plain script, after the page)
    s = s.replace("</body>", """<script>
window.archeSend = function (data) {
  try { fetch('/api/enquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, page: location.pathname, consent: true }) }); } catch (e) {}
};
</script>
</body>""")
    shutil.copy(os.path.join(HERE, "site-fixes.css"), OUT)
    shutil.copy(os.path.join(HERE, "privacy.html"), OUT)
    # hero drawing: wings 50% longer, tips about 2 cm (76 px) from the screen edge
    import subprocess, sys
    subprocess.run([sys.executable, os.path.join(HERE, "widen_wings.py")], check=True, cwd=HERE)
    old_jet = "width:min(1200px,92vw);aspect-ratio:1774/887;background:url('assets/jet-line-watermark-white.png')"
    assert s.count(old_jet) == 1
    # size kept as before the wingspan cut (0.803 = 2252/2804), so the aircraft does not grow; drawing moved up 40 px
    s = s.replace(old_jet, "width:calc((100vw - 118px) * 0.803);max-width:1930px;aspect-ratio:2252/887;background:url('assets/jet-line-watermark-wide.png')")
    old_top = 'position:absolute;left:50%;top:190px;transform:translateX(-50%);width:calc('
    assert s.count(old_top) == 1
    s = s.replace(old_top, 'position:absolute;left:50%;top:150px;transform:translateX(-50%);width:calc(')
    # compass rose watermark: top just below the logo, full page width, fades out towards the bottom of the hero
    subprocess.run([sys.executable, os.path.join(HERE, "compass_rose.py")], check=True, cwd=HERE)
    jet_div = '<div aria-hidden="true" style="position:absolute;left:50%;top:150px;'
    assert s.count(jet_div) == 1
    rose = ('<div aria-hidden="true" class="arche-rose" style="position:absolute;left:0;right:0;top:200px;bottom:0;overflow:hidden;pointer-events:none;'
            'opacity:0.14;-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 45%,transparent 92%);mask-image:linear-gradient(180deg,#000 0%,#000 45%,transparent 92%)">'
            '<img src="assets/compass-rose.svg" alt="" style="display:block;width:100%;height:auto"></div>')
    s = s.replace(jet_div, rose + jet_div)
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(s)
    print("built", os.path.join(OUT, "index.html"), len(s))

if __name__ == "__main__":
    build()
