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
import os, shutil, re, json, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "design-source")
OUT = os.path.join(HERE, "site")
BANGKOK_OFFICE = False   # Morten 26 Oct 2026: Archē stays Singaporean until the Bangkok office opens (see singapore_only.py)
SHOW_ACCREDITATIONS = False   # Morten 20 Oct 2026: hide until Archē holds accreditations; set True to bring the section back
PORTAL = "https://portal.archeaviation.com"  # go-live address (Morten, 25 Oct 2026)

def build():
    os.makedirs(OUT, exist_ok=True)
    for f in ("support.js", "i18n.js", "doc-page.js"):
        shutil.copy(os.path.join(SRC, f), OUT)
    i18n = open(os.path.join(OUT, "i18n.js"), encoding="utf-8").read()
    row = "['Private aviation, handled with','การบินส่วนตัว ที่ดูแลด้วย','私人航空，','プライベート・アビエーションを、'],"
    assert i18n.count(row) == 1
    i18n = i18n.replace(row, row + "\n['Private aviation,','การบินส่วนตัว','私人航空，','プライベート・アビエーションを、'],\n['handled with','ที่ดูแลด้วย','',''],")
    import text_fixes
    i18n = text_fixes.i18n(i18n)   # brand spelling, new and corrected translations
    import polish
    i18n = polish.add_rows(i18n)   # shorter Why Archē and How it works texts (23 Oct 2026)
    open(os.path.join(OUT, "i18n.js"), "w", encoding="utf-8").write(i18n)
    for d in ("assets", "logo-export"):
        shutil.copytree(os.path.join(SRC, d), os.path.join(OUT, d), dirs_exist_ok=True)
    # pictures: the Design file's images, with any file in apps/website/images/<slot-id>.(webp|jpg|png)
    # taking its place. Register of sources and licences: docs/IMAGE-REGISTER.md
    slots = json.load(open(os.path.join(SRC, ".image-slots.state.json"), encoding="utf-8"))
    img_dir = os.path.join(HERE, "images"); os.makedirs(os.path.join(OUT, "img"), exist_ok=True)
    for f in sorted(os.listdir(img_dir)) if os.path.isdir(img_dir) else []:
        slot, ext = os.path.splitext(f)
        if ext.lower() not in (".webp", ".jpg", ".jpeg", ".png"): continue
        shutil.copy(os.path.join(img_dir, f), os.path.join(OUT, "img", f))
        slots[slot] = {"u": "img/" + f, "s": 1, "x": 0, "y": 0}
        print("  picture replaced:", slot)
    slots.pop("advisor-portrait", None)   # no advisor photo on the site (see contact panel below)
    json.dump(slots, open(os.path.join(OUT, "image-slots.state.json"), "w", encoding="utf-8"))
    slot = open(os.path.join(SRC, "image-slot.js"), encoding="utf-8").read()
    assert "const STATE_FILE = '.image-slots.state.json';" in slot
    slot = slot.replace("const STATE_FILE = '.image-slots.state.json';", "const STATE_FILE = 'image-slots.state.json';")
    # also accept pictures served from our own img/ folder (replacement pictures), not only embedded data
    chk = "if (stored && stored.u && !/^data:image\\//i.test(stored.u)) stored = null;"
    assert slot.count(chk) == 1
    slot = slot.replace(chk, "if (stored && stored.u && !/^(data:image\\/|img\\/[\\w.-]+$)/i.test(stored.u)) stored = null;")
    open(os.path.join(OUT, "image-slot.js"), "w", encoding="utf-8").write(slot)

    s = open(os.path.join(SRC, "Arche Executive v7.dc.html"), encoding="utf-8").read()

    # 1. React from our own site
    head_add = """<script>window.__resources={"https://unpkg.com/react@18.3.1/umd/react.production.min.js":"/vendor/react.production.min.js","https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js":"/vendor/react-dom.production.min.js"};</script>
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
    assert s.count('<a href="#top">Terms of business</a>') == 1
    s = s.replace('<a href="#top">Terms of business</a>', '<a href="/terms.html">Terms of business</a>')
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
    # hero text starts just below the landing gear (fin tip at 205 px, gear bottom = 205 px + 0.302 x aircraft width); the aircraft's
    # width is also limited by the screen height so the quote form stays visible without scrolling (Morten 20 Oct 2026)
    old_pad = 'padding:calc(190px + min(600px,46vw) * 0.8) 40px 40px;display:flex;flex-direction:column;align-items:center;gap:56px'
    assert s.count(old_pad) == 1
    s = s.replace('<div style="position:relative;max-width:1440px;margin:0 auto;width:100%;box-sizing:border-box;' + old_pad,
                  '<div class="hero-content" style="position:relative;max-width:1440px;margin:0 auto;width:100%;box-sizing:border-box;'
                  'padding:calc(221px + 0.302 * clamp(420px, min(calc((100vw - 118px) * 0.803), calc((100vh - 626px) * 3.31)), 1930px)) 40px 32px;display:flex;flex-direction:column;align-items:center;gap:28px')
    # contact: no advisor portrait (Morten 20 Oct 2026: a stock face shown as "your advisor" would mislead), a plain contact panel instead
    i = s.index('<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:56px', s.index('<section id="contact"'))
    j = s.index('<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))', i)
    card = s[i:j]
    assert 'advisor-portrait' in card
    btns = card[card.index('<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">'):card.rindex('</div>', 0, card.rindex('</div>', 0, card.rindex('</div>')))]
    s = s[:i] + ('<div class="contact-panel" style="display:flex;justify-content:space-between;align-items:center;gap:32px 56px;flex-wrap:wrap;padding:40px;'
                 'border:1px solid rgba(169,189,212,0.35);background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))">'
                 '<div style="display:flex;flex-direction:column;gap:14px;max-width:620px">'
                 '<span style="font-size:12.5px;letter-spacing:0.16em;text-transform:uppercase;color:#a9bdd4">Private client desk</span>'
                 '<p style="margin:0;font-size:17px;line-height:1.7;color:#c6cbd2">One team that knows your preferences, your people and your schedule. Call or message at any hour.</p>'
                 '</div>' + btns.rstrip() + '</div></div>\n    ') + s[j:]
    # 4. sender (plain script, after the page)
    s = s.replace("</body>", """<script>
window.archeSend = function (data) {
  try { fetch('/api/enquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, page: location.pathname, consent: true }) }); } catch (e) {}
};
</script>
</body>""")
    shutil.copy(os.path.join(HERE, "site-fixes.css"), OUT)
    shutil.copy(os.path.join(HERE, "privacy.html"), OUT)
    subprocess.run([sys.executable, os.path.join(HERE, "make_terms.py")], check=True, cwd=HERE)   # Terms of business from the contract, Part B
    # hero drawing: wings 50% longer, tips about 2 cm (76 px) from the screen edge
    pass  # subprocess, sys imported at the top
    subprocess.run([sys.executable, os.path.join(HERE, "widen_wings.py")], check=True, cwd=HERE)
    old_jet = "width:min(1200px,92vw);aspect-ratio:1774/887;background:url('assets/jet-line-watermark-white.png')"
    assert s.count(old_jet) == 1
    # size kept as before the wingspan cut (0.803 = 2252/2804), so the aircraft does not grow; drawing moved up 40 px
    s = s.replace(old_jet, "width:clamp(420px, min(calc((100vw - 118px) * 0.803), calc((100vh - 626px) * 3.31)), 1930px);aspect-ratio:2252/887;background:url('assets/jet-line-watermark-wide.png')")
    old_top = 'position:absolute;left:50%;top:190px;transform:translateX(-50%);width:clamp('
    assert s.count(old_top) == 1
    s = s.replace(old_top, 'position:absolute;left:50%;top:calc(205px - 0.0471 * clamp(420px, min(calc((100vw - 118px) * 0.803), calc((100vh - 626px) * 3.31)), 1930px));transform:translateX(-50%);width:clamp(')
    # compass rose watermark: top just below the logo, full page width, fades out towards the bottom of the hero
    subprocess.run([sys.executable, os.path.join(HERE, "compass_rose.py")], check=True, cwd=HERE)
    jet_div = '<div aria-hidden="true" style="position:absolute;left:50%;top:calc(205px'
    assert s.count(jet_div) == 1
    rose = ('<div aria-hidden="true" class="arche-rose" style="position:absolute;left:0;right:0;top:200px;bottom:0;overflow:hidden;pointer-events:none;'
            'opacity:0.14;-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 45%,transparent 92%);mask-image:linear-gradient(180deg,#000 0%,#000 45%,transparent 92%)">'
            '<img src="assets/compass-rose.svg" alt="" style="display:block;width:100%;height:auto"></div>')
    s = s.replace(jet_div, rose + jet_div)
    # search and speed basics (seo.py): title, description, link previews, business description, fonts, images, robots, sitemap
    s = text_fixes.page(s)   # brand spelling and typos in the page text
    import langs
    s = langs.patch_runtime(s)   # page starts in its own language; language buttons move between /, /th, /zh, /ja
    import seo
    s = seo.apply(s, OUT, HERE)
    import sections
    s = polish.apply(s)   # fewer words, larger headlines and more space, metallic labels and dividers (23 Oct 2026)
    s = sections.apply(s)   # photo breaks, "What every trip includes", background one tone lighter (Morten 21 Oct 2026)
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(s)
    langs.build(OUT, seo.SITE_URL)   # th.html, zh.html, ja.html and the ready-made page copy in all four
    print("built", os.path.join(OUT, "index.html"), len(s))
    if not BANGKOK_OFFICE:
        import singapore_only; singapore_only.run()
    for f in ("privacy.html", "terms.html"):   # same lighter background on the legal pages
        fp = os.path.join(OUT, f)
        if os.path.exists(fp):   # read first: opening for writing empties the file (this emptied both pages until 26 Oct 2026)
            t = open(fp, encoding="utf-8").read()
            if t.strip(): open(fp, "w", encoding="utf-8").write(sections.tone(t))
    import company; company.run()   # name, address and registration number on every page
    import site_fixes; site_fixes.run()   # one office, notice, payment line, contact routes (26 Oct 2026)
    sys.path.insert(0, os.path.join(HERE, 'content')); import build_content; build_content.run()   # verified content pages (27 Oct 2026)
    import seo_security; seo_security.run()   # search, speed, security headers, statistics (26 Oct 2026)


if __name__ == "__main__":
    build()
