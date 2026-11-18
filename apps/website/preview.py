"""Public preview before the launch (Morten, 17 Nov 2026: "ok for me, do it and show me", on the proposal to open the site
early because the banks and Avinode require a website, with a "Remove before flight" tag and the forms off).

With company.PREVIEW = True (and company.LAUNCHED = False) every built page gets:
  - a small red "REMOVE BEFORE FLIGHT" tag hooked on the Archē name in the top bar (Morten, 17 Nov 2026: "attached to the name"), at a slight angle, tilted
    left, 30% larger than first drawn, so it stays with the bar while the page scrolls (Morten, 17 Nov 2026); our own drawing, CSS only, no script; it is removed at launch, as the tag is before a flight;
  - one quiet line fixed at the bottom of the screen: Archē Executive opens for bookings soon, with the enquiry email;
  - no forms and no trip requests (Morten, 18 Nov 2026, after a test trip request arrived by email from the preview:
    "only email should be through the contact@arche until we go live as we have agreed several times"): the quote form
    (route, date, passengers) is replaced by "We are not taking trip requests yet. Bookings open with our launch." and
    the plain address; the call-back and the empty-leg sign-up become a line with the address; "Request a quote"
    buttons read "Contact us"; the journey map has no quote button; no email is written for the visitor; the page's
    sender does nothing.
Search engines stay shut out (noindex, robots closed: company.LAUNCHED = False) and drafts are not published
(company.PUBLIC). The site goes public only when Morten turns off the Vercel login for the website after the preview
gate items are done (launch_blockers.preview_blockers, docs/LAUNCH-BLOCKERS.md). At launch: PREVIEW = False, LAUNCHED = True.
"""
import os, re, json
import company

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, "site")
SKIP = ("portal-preview",)
MAIL = company.EMAIL

T = {   # the visitor's language; the site's other translations are marked as drafts for native review (i18n.js)
    "strip": {"en": "Archē Executive opens for bookings soon. Until then, write to",
              "th": "Archē Executive จะเปิดรับการจองเร็ว ๆ นี้ ระหว่างนี้ ติดต่อเราได้ที่",
              "zh": "Archē Executive 即将开放预订。在此之前，请联系",
              "ja": "Archē Executive はまもなくご予約の受付を開始します。それまでは、こちらへご連絡ください："},
}
ROWS = [   # runtime translations for the text inside the page's forms (same table as the rest of the site)
    ("Online requests open with our launch.", "คำขอออนไลน์จะเปิดเมื่อเราเปิดให้บริการ", "我们正式开业后即可在线提交需求。", "オンラインでのご依頼は開業と同時に受付を開始します。"),
    ("Until then, send this trip by email and an advisor replies within the hour.",
     "ระหว่างนี้ ส่งรายละเอียดการเดินทางนี้ทางอีเมล แล้วที่ปรึกษาจะตอบกลับภายในหนึ่งชั่วโมง",
     "在此之前，请通过电子邮件发送此行程，顾问将在一小时内回复。",
     "それまでは、この旅程をメールでお送りください。アドバイザーが1時間以内にご返信します。"),
    ("Call-backs open with our launch. Until then, email",
     "บริการโทรกลับจะเปิดเมื่อเราเปิดให้บริการ ระหว่างนี้ ส่งอีเมลถึง",
     "回电服务将于正式开业后开放。在此之前，请发送电子邮件至",
     "折り返しのお電話は開業と同時に開始します。それまでは、こちらへメールでご連絡ください："),
    ("Empty-leg alerts start with our launch. Until then, email us the routes you fly:",
     "การแจ้งเตือนเที่ยวบินขาเปล่าจะเริ่มเมื่อเราเปิดให้บริการ ระหว่างนี้ ส่งเส้นทางที่คุณบินบ่อยมาที่",
     "空机航段提醒将于正式开业后启动。在此之前，请将您常飞的航线发送至",
     "エンプティレッグのお知らせは開業と同時に開始します。それまでは、よくご利用のルートをこちらへメールでお知らせください："),
]

CSS = """
/* Public preview before the launch (preview.py, 17 Nov 2026): removed at launch */
.ae-nav-brand{position:relative}
.ae-rbf{position:absolute;top:calc(100% + 4px);left:calc(100% - 14px);z-index:2;width:30px;height:180px;pointer-events:none;transform:rotate(9deg) scale(1.3);transform-origin:50% 0}
.ae-rbf::before{content:"";position:absolute;left:50%;top:-14px;width:18px;height:18px;margin-left:-9px;border:2px solid #b9c0c8;border-radius:50%;box-sizing:border-box}
.ae-rbf b{position:absolute;inset:6px 0 0;display:flex;align-items:center;justify-content:center;background:#b3121f;border-radius:2px;box-shadow:0 6px 16px rgba(0,0,0,0.35);outline:1px dashed rgba(255,255,255,0.45);outline-offset:-4px;writing-mode:vertical-rl;transform:rotate(180deg);font:700 11px/1 'Hanken Grotesk',system-ui,sans-serif;letter-spacing:0.12em;color:#fff;white-space:nowrap}
.ae-pv{position:fixed;left:0;right:0;bottom:0;z-index:1001;padding:10px 20px;background:rgba(40,43,48,0.96);border-top:1px solid rgba(243,245,248,0.12);text-align:center;font:400 13.5px/1.5 'Hanken Grotesk',system-ui,sans-serif;color:#c6cbd2}
.ae-pv a{color:#f3f5f8;text-decoration:underline;text-underline-offset:3px}
html body{padding-bottom:46px!important}
.side{position:static!important}   /* the page's side box stays in place during the preview, so the opening line never covers it */
@media (max-width:600px){.ae-rbf{top:calc(100% + 2px);left:calc(100% - 12px);width:24px;height:140px}.ae-rbf b{font-size:9px}.ae-pv{padding:9px 16px;font-size:13px}html body{padding-bottom:64px!important}}
@media print{.ae-rbf,.ae-pv{display:none}}
"""

TAG = '<!--ae:preview--><div class="ae-rbf" aria-hidden="true"><b>REMOVE BEFORE FLIGHT</b></div><!--/ae:preview-->'

def strip(lang):
    return (f'<!--ae:preview--><div class="ae-pv" role="note">{T["strip"].get(lang, T["strip"]["en"])} '
            f'<a href="mailto:{MAIL}">{MAIL}</a></div><!--/ae:preview-->')

def block(s, start):
    """the <sc-if ...> element that starts at index start, to its matching </sc-if>"""
    i, depth = start, 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", s[start:]):
        depth += 1 if m.group(0) != "</sc-if>" else -1
        if depth == 0: return s[start:start + m.end()]
    raise ValueError("unclosed sc-if")

NOTE = ('<div data-ae-preview="quote" style="display:flex;flex-direction:column;gap:6px;padding:18px 0;max-width:640px">'
        '<span style="font-size:17px;color:#f3f5f8">We are not taking trip requests yet. Bookings open with our launch.</span>'
        f'<span style="font-size:14px;line-height:1.6;color:#c6cbd2">Until then, write to <a href="mailto:{MAIL}" style="color:#f3f5f8;'
        f'text-decoration:underline;text-underline-offset:3px">{MAIL}</a></span></div>')

def child_blocks(t, start):
    """the direct child <div> blocks of the element whose open tag starts at `start` (divs only, as in the hero)"""
    i = t.index(">", start) + 1; out = []; depth = 0; cs = None
    for m in re.finditer(r"<div\b[^>]*>|</div>", t[i:]):
        j = i + m.start()
        if m.group(0).startswith("<div"):
            if depth == 0: cs = j
            depth += 1
        else:
            depth -= 1
            if depth == 0: out.append((cs, i + m.end()))
            if depth < 0: break
    return out

def quote_widget(t):
    """Morten, 18 Nov 2026 (after a test trip request by email from the preview): "only email should be through the
    contact@arche until we go live": the quote form (route, date, passengers) is taken out of the preview, in the
    page template and in the pre-drawn copy, and replaced by a note with the plain address"""
    n = 0; pos = 0
    while True:
        c = t.find('class="hero-content"', pos)
        if c < 0: break
        k = t.rfind("<", 0, c)
        for a, b in child_blocks(t, k):
            if 'City, airport or code' in t[a:b] or '{{ stepRoute }}' in t[a:b]:
                t = t[:a] + NOTE + t[b:]; n += 1; break
        pos = c + 20   # past this element's class, which may come after a long style
    return t, n

def forms(t):
    n = 0
    t, c = quote_widget(t); n += c
    # call-back: the email address instead of the phone field
    k = t.find('<sc-if value="{{ cbOpen }}"')
    if k >= 0:
        b = block(t, k); head = b[:b.index(">") + 1]
        t = t.replace(b, head + f'<span style="font-size:14px;line-height:1.6;color:#c6cbd2">Call-backs open with our launch. Until then, write to '
                         f'<a href="mailto:{MAIL}" style="color:#f3f5f8;text-decoration:underline">{MAIL}</a></span></sc-if>', 1); n += 1
    # the pre-drawn copy of the call-back (first paint and visitors without script) has its own phone field
    t, c = re.subn(r'<div[^>]*>\s*<input[^>]*placeholder="Your number".*?</label>',
                   f'<span style="font-size:14px;line-height:1.6;color:#c6cbd2">Call-backs open with our launch. Until then, write to '
                   f'<a href="mailto:{MAIL}" style="color:#f3f5f8;text-decoration:underline">{MAIL}</a></span>', t, flags=re.S); n += c
    # empty-leg alerts sign-up
    t, c = re.subn(r"<form data-ae-alert\b.*?</form>",
                   f'<p style="margin:0;font-size:15px;line-height:1.7;color:#c6cbd2">Empty-leg alerts start with our launch. Until then, write to '
                   f'<a href="mailto:{MAIL}" style="color:#f3f5f8;text-decoration:underline">{MAIL}</a></p>', t, flags=re.S); n += c
    t = re.sub(r'<p data-ae-alert-msg[^>]*></p>', "", t)
    t = re.sub(r'<!--ae:home--><script data-ae="home">\s*document\.addEventListener\(\'submit\'.*?</script><!--/ae:home-->', "", t, flags=re.S)
    # no phone or WhatsApp until the Singapore number is set (company.PHONE): the placeholder number is never shown;
    # email is the one way to reach us in the preview (Morten, 18 Nov 2026: contact channels in the teaser)
    if not company.PHONE:
        t, c = re.subn(r'<a\b[^>]*href="(?:tel:\+6500000000|https://wa\.me/6500000000)"[^>]*>.*?</a>', "", t, flags=re.S); n += c
        t = t.replace("phone: '+65 0000 0000' }", "phone: '' }")
        t = re.sub(r'<span[^>]*><span class="sc-interp">\+65 0000 0000</span></span>', "", t)
        t = t.replace("Call, message or write to our private client desk, day or night, wherever you are.", "Write to our private client desk, day or night, wherever you are. We reply within the hour.")
        t = t.replace("Call or message at any hour.", "Write at any hour; we reply within the hour.")
        t = t.replace("at any hour by phone, WhatsApp or email, or ask for a call back.", "by email; we reply within the hour.")
        t = t.replace("Reach us by phone, WhatsApp or email, or ask for a call back.", "Reach us by email; we reply within the hour.")
    # no "Request a quote" while trip requests are not taken: the buttons read "Contact" (same page)
    t, c = re.subn(r'(<a\b[^>]*>)Request a quote(</a>)', r'\1Contact us\2', t); n += c
    # the sender sends nothing
    t, c = re.subn(r"window\.archeSend = function \(data\) \{.*?\n\};", "window.archeSend = function () {};   // preview: no form sends (preview.py)", t, flags=re.S); n += c
    return t, n

def run(verbose=True):
    if not company.PREVIEW or company.LAUNCHED: return
    css = os.path.join(SITE, "nav.css")
    c = open(css, encoding="utf-8").read()
    if "preview.py" not in c: open(css, "w", encoding="utf-8").write(c + CSS)
    i18n = os.path.join(SITE, "i18n.js"); s = open(i18n, encoding="utf-8").read()
    anchor = "['Edit trip',"
    if ROWS[0][0] not in s:
        assert s.count(anchor) == 1
        add = "".join("[" + ",".join(json.dumps(x, ensure_ascii=False) for x in r) + "],\n" for r in ROWS)
        s = s.replace(anchor, add + anchor, 1); open(i18n, "w", encoding="utf-8").write(s)
    pages = changed = 0
    for root, dirs, files in os.walk(SITE):
        if os.path.relpath(root, SITE).split(os.sep)[0] in SKIP: continue
        for fn in files:
            if not fn.endswith(".html"): continue
            p = os.path.join(root, fn); t = open(p, encoding="utf-8").read()
            if "<body" not in t or 'class="ae-nav"' not in t: continue
            t = re.sub(r"<!--ae:preview-->.*?<!--/ae:preview-->", "", t, flags=re.S)
            m = re.search(r'<html[^>]*\blang="([a-z]{2})', t); lang = m.group(1) if m else "en"
            t, n = forms(t); changed += n
            t = t.replace('<span class="x">EXECUTIVE</span></a>', '<span class="x">EXECUTIVE</span>' + TAG + '</a>', 1)   # hung from the name in the top bar
            t = t.replace("</body>", strip(lang) + "</body>", 1)
            open(p, "w", encoding="utf-8").write(t); pages += 1
    jm = os.path.join(SITE, "journey.js")
    if os.path.exists(jm):
        j = open(jm, encoding="utf-8").read()
        j2 = re.sub(r"<a class=\"btn p\" href=\"' \+ q \+ '\">Request a quote for this journey</a>", "", j)
        if j2 != j: open(jm, "w", encoding="utf-8").write(j2); changed += 1
    if verbose: print(f"  preview: tag and opening line on {pages} pages; {changed} forms and quote buttons taken out (email only)")

def problems():
    """what check_site.py fails on while the preview is on: anything left that would send a visitor's details"""
    out = []
    if not company.PREVIEW or company.LAUNCHED: return out
    for root, dirs, files in os.walk(SITE):
        if os.path.relpath(root, SITE).split(os.sep)[0] in SKIP: continue
        for fn in files:
            if not fn.endswith((".html", ".js")): continue
            if fn == "track.js": continue   # statistics: only counts sent enquiries, sends no details itself
            if fn == "i18n.js": continue   # the translation table: words for every language, not a form
            p = os.path.join(root, fn); t = open(p, encoding="utf-8").read(); rel = os.path.relpath(p, SITE)
            for bad, why in (("/api/enquiry", "sends to the enquiry inbox"), ("data-ae-alert", "alert sign-up form"),
                             ('{{ onName }}', "quote form asks for a name"), ('{{ onCbPhone }}', "call-back asks for a phone number"),
                             ('placeholder="Your number"', "call-back phone field (pre-drawn copy)"),
                             ('City, airport or code', "quote form asks for a route"), ("Get quotes", "quote form button"),
                             ("mailHref", "a trip request email written for the visitor"), ("Email this request", "trip request email button"),
                             (">Request a quote<", "Request a quote button"), ("quote for this journey", "journey map quote button")):
                if bad in t: out.append(f"{rel}: {why} (preview: forms must be off)")
            if fn.endswith(".html") and "<body" in t and 'class="ae-nav"' in t and 'class="ae-rbf"' not in t:
                out.append(f"{rel}: preview tag missing")
    return out

if __name__ == "__main__": run()
