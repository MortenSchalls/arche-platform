"""Home-page additions approved by Morten on 27 Oct 2026 ("yes go ahead"), after the review against regional and
international peers (docs/WEBSITE-REVIEW-2026-10-27.md). Layout, colours, fonts and watermarks are the Design file's;
these blocks reuse its styles.
  1. a broker line under the hero text
  2. "Our standard": the operator safety standard (manual Module 8), linking to the full guide
  3. "Destinations": regions and cities, linking to the content pages (approved pages only once the site is launched)
  4. "Dates ahead": the next three officially dated events (content/events.json), past ones drop at every build
  5. quote form step 2: "Flown privately before?" and a separate, unticked opt-in for empty-leg alerts and news
  6. empty-leg alerts: a sign-up in the contact section (no list of legs, no prices)
Run by build.py after the content pages are built. Idempotent: every block is replaced on each build."""
import os, re, json, html, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site"); CONTENT = os.path.join(HERE, "content")
import company

EYE = "font-size:12.5px;letter-spacing:0.16em;text-transform:uppercase;color:#a9bdd4"
H2 = "margin:14px 0 18px;font-family:Prata,Georgia,serif;font-weight:400;font-size:clamp(28px,3.4vw,44px);line-height:1.15;color:#f3f5f8"
TXT = "margin:0 0 12px;font-size:16px;line-height:1.7;color:#c6cbd2;max-width:760px"
CARD = "display:block;padding:20px 22px;border:1px solid rgba(243,245,248,0.14);background:rgba(243,245,248,0.03);color:#c6cbd2;text-decoration:none"
WRAP = "max-width:1440px;margin:0 auto;padding:clamp(56px,6vw,96px) 40px;box-sizing:border-box"
LINE = "border-top:1px solid rgba(243,245,248,0.12)"

def _pages():
    built = json.load(open(os.path.join(CONTENT, "built.json"))) if os.path.exists(os.path.join(CONTENT, "built.json")) else []
    pub = {b["path"] for b in built if company.LAUNCHED is False or not b["draft"]}
    P = []
    for f in sorted(os.listdir(os.path.join(CONTENT, "pages"))):
        if not f.endswith(".json"): continue
        p = json.load(open(os.path.join(CONTENT, "pages", f), encoding="utf-8"))
        if p["path"] in pub: P.append(p)
    return P

def standard():
    return f'''<!--ae:home--><section id="standard" data-ae="home" style="{LINE}"><div style="{WRAP}">
<span style="{EYE}">Our standard</span><h2 style="{H2}">Every operator checked before you see a quote.</h2>
<p style="{TXT}">We accept an operator without further approval only when the certificate that flies your trip holds a current ARGUS Platinum or Platinum Elite rating, WYVERN Wingman or Wingman PRO, or IS-BAO registration at Stage 2 or 3, checked in the auditor's own registry for every booking.</p>
<p style="{TXT}">Any other operator needs our owner's approval for your trip, and you are told in writing before you sign. For every operator: two pilots on every jet flight, passenger liability insurance of at least USD 50 million for a jet, and five years without a fatal accident, serious incident or sanction.</p>
<p style="margin:18px 0 0"><a href="/guides/operator-safety-audits/" style="font-size:12.5px;letter-spacing:0.18em;text-transform:uppercase;color:#f3f5f8;border-bottom:1px solid rgba(243,245,248,0.4);padding-bottom:4px">Read the full standard</a></p>
</div></section><!--/ae:home-->'''

def destinations(P):
    short = lambda h: re.sub(r"^Private flights (to and from |to |in (the )?)", "", h)
    regs = sorted([p for p in P if p["type"] == "region"], key=lambda p: short(p["h1"]))
    cities = sorted([p for p in P if p["type"] == "city"], key=lambda p: short(p["h1"]))
    if not regs and not cities: return ""
    card = lambda p, t: f'<a href="{p["path"]}" style="{CARD}"><span style="display:block;color:#f3f5f8;font-family:Prata,Georgia,serif;font-size:19px;line-height:1.3">{html.escape(t)}</span></a>'
    short = lambda h: re.sub(r"^Private flights (to and from |to |in (the )?)", "", h)
    grid = "display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:12px;margin:0 0 16px"
    return f'''<!--ae:home--><section id="destinations" data-ae="home" style="{LINE}"><div style="{WRAP}">
<span style="{EYE}">Destinations</span><h2 style="{H2}">Any aircraft, any route, upon availability.</h2>
<p style="{TXT}">We are a broker, not an airline: we have no fixed routes. Our guides set out what a private flight involves in each place: airports, permits, night rules and customs, each fact with its official source and the date we checked it.</p>
<div style="{grid}">{"".join(card(p, short(p["h1"])) for p in regs)}</div>
<div style="{grid}">{"".join(card(p, short(p["h1"])) for p in cities)}</div>
<p style="margin:8px 0 0"><a href="/destinations/" style="font-size:12.5px;letter-spacing:0.18em;text-transform:uppercase;color:#f3f5f8;border-bottom:1px solid rgba(243,245,248,0.4);padding-bottom:4px">All destinations and guides</a></p>
</div></section><!--/ae:home-->'''

def dates(P):
    f = os.path.join(CONTENT, "events.json")
    if not os.path.exists(f): return ""
    F = json.load(open(os.path.join(CONTENT, "facts.json"), encoding="utf-8")); today = datetime.date.today().isoformat()
    city = {p.get("events"): p for p in P if p.get("events")}
    ev = sorted([e for e in json.load(open(f, encoding="utf-8"))["events"] if e["end"] >= today and e["city"] in city], key=lambda e: e["start"])
    seen, top = set(), []
    for e in ev:
        if e["name"] in seen: continue
        seen.add(e["name"]); top.append(e)
        if len(top) == 3: break
    if not top: return ""
    item = lambda e: f'<a href="{city[e["city"]]["path"]}" style="{CARD}"><span style="{EYE};font-size:11.5px">{html.escape(F[e["key"]]["v"])}</span><span style="display:block;margin-top:8px;color:#f3f5f8;font-family:Prata,Georgia,serif;font-size:19px;line-height:1.3">{html.escape(e["name"])}</span><span style="display:block;margin-top:4px;font-size:14px">{html.escape(re.sub(r"^Private flights (to and from |to )", "", city[e["city"]]["h1"]))}</span></a>'
    return f'''<!--ae:home--><section id="dates" data-ae="home" style="{LINE}"><div style="{WRAP}">
<span style="{EYE}">Dates ahead</span><h2 style="{H2}">Events fill airports and parking early.</h2>
<p style="{TXT}">The next dates confirmed by the organisers. If you plan to travel for one of them, tell us early.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px">{"".join(item(e) for e in top)}</div>
<p style="margin:14px 0 0;font-size:13px;color:#a3a9b1">Dates from each organiser; the source is on the city page.</p>
</div></section><!--/ae:home-->'''

def alerts():
    inp = "flex:1 1 220px;min-height:44px;background:none;border:0;border-bottom:1px solid rgba(243,245,248,0.3);color:#f3f5f8;font-size:16px;padding:6px 0;outline:none"
    return f'''<!--ae:home--><div id="alerts" data-ae="home" style="margin-top:32px;padding:clamp(22px,4vw,32px) clamp(20px,4vw,40px);border:1px solid rgba(169,189,212,0.25);background:rgba(255,255,255,0.02)">
<span style="{EYE}">Empty-leg alerts</span>
<p style="margin:12px 0 18px;font-size:16px;line-height:1.7;color:#c6cbd2;max-width:720px">An empty leg is an aircraft flying anyway, without passengers. Tell us where you fly often and we email you when one fits. Dates can change or be cancelled by the operator. You can unsubscribe at any time.</p>
<form data-ae-alert style="display:flex;gap:16px 24px;flex-wrap:wrap;align-items:flex-end">
<input name="email" type="email" required placeholder="Your email" aria-label="Your email" style="{inp}">
<input name="route" placeholder="Routes, e.g. Singapore to Phuket" aria-label="Routes you fly" style="{inp}">
<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
<button type="submit" style="min-height:48px;padding:0 28px;border:1px solid rgba(243,245,248,0.4);background:none;color:#f3f5f8;font-size:12.5px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer">Send me alerts</button>
</form>
<p data-ae-alert-msg style="margin:12px 0 0;font-size:13px;color:#a3a9b1">We use your email only for these alerts. <a href="/privacy.html" style="color:#c6cbd2;text-decoration:underline">Privacy notice</a></p>
</div><!--/ae:home-->'''

ALERT_JS = """<!--ae:home--><script data-ae="home">
document.addEventListener('submit', function (e) {
  var f = e.target.closest && e.target.closest('form[data-ae-alert]'); if (!f) return; e.preventDefault();
  var em = (f.email.value || '').trim(), m = document.querySelector('[data-ae-alert-msg]');
  if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(em)) { if (m) m.textContent = 'Please enter a valid email.'; return; }
  window.archeSend && window.archeSend({ type: 'alert', email: em, route: f.route.value, website: f.website.value, lang: document.documentElement.lang || 'en' });
  f.reset(); if (m) m.textContent = 'Thank you. We will email you when an empty leg fits. You can unsubscribe at any time.';
});
</script><!--/ae:home-->"""

BROKER = '<!--ae:home--><p data-ae="home" style="margin:10px 0 0;font-size:13px;letter-spacing:0.08em;color:#a3a9b1">A broker, not an airline: we find and check the operator; the operator flies your trip.</p><!--/ae:home-->'

# quote form, step 2 (template source only): "flown before" chips and a separate opt-in
STATE_OLD = "reply: 'WhatsApp', detailsError: false,"
STATE_NEW = "reply: 'WhatsApp', flown: '', news: false, detailsError: false,"
OPTS_OLD = "      replyVia: s.reply,"
OPTS_NEW = """      flownOpts: [['yes', 'Yes'], ['no', 'No, first time']].map(([v, l]) => ({
        label: l, bg: s.flown === v ? '#f3f5f8' : 'transparent', fg: s.flown === v ? '#2c2f34' : '#f3f5f8',
        line: s.flown === v ? '#f3f5f8' : 'rgba(243,245,248,0.3)', onClick: () => this.setState({ flown: s.flown === v ? '' : v }),
      })),
      newsOn: s.news, newsTick: s.news ? '✓' : '', newsBox: s.news ? '#f3f5f8' : 'transparent', toggleNews: () => this.setState({ news: !s.news }),
      replyVia: s.reply,"""
SEND_OLD = "reply: s.reply, lang: s.lang });"
SEND_NEW = "reply: s.reply, flown: s.flown, news: s.news, lang: s.lang });"
UI_ANCHOR = '<button onClick="{{ submit }}"'
UI_NEW = '''<!--ae:home--><div data-ae="home" style="grid-column:1/-1;display:flex;gap:14px 32px;flex-wrap:wrap;align-items:center;padding:12px 18px;border-top:1px solid rgba(243,245,248,0.12)">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="font-size:11px;letter-spacing:0.16em;color:#a9bdd4;text-transform:uppercase">Flown privately before?</span>
            <sc-for list="{{ flownOpts }}" as="o" hint-placeholder-count="2"><button onClick="{{ o.onClick }}" style="padding:4px 10px;border:1px solid {{ o.line }};background:{{ o.bg }};color:{{ o.fg }};font-size:12px;cursor:pointer">{{ o.label }}</button></sc-for></div>
          <button onClick="{{ toggleNews }}" style="display:flex;gap:10px;align-items:center;border:0;background:none;color:#c6cbd2;font-size:13px;cursor:pointer;padding:6px 0;text-align:left"><span style="width:18px;height:18px;flex:none;border:1px solid rgba(243,245,248,0.5);background:{{ newsBox }};color:#2c2f34;font-size:13px;line-height:18px;text-align:center">{{ newsTick }}</span>Also send me empty-leg alerts and occasional news (optional)</button>
        </div><!--/ae:home-->
          '''

I18N = [
    ("A broker, not an airline: we find and check the operator; the operator flies your trip.", "เราเป็นนายหน้า ไม่ใช่สายการบิน: เราค้นหาและตรวจสอบผู้ให้บริการ และผู้ให้บริการเป็นผู้ทำการบิน", "我们是包机经纪人，而非航空公司：我们寻找并审核运营商，由运营商执飞您的航班。", "私たちは航空会社ではなくブローカーです。運航会社を探して確認し、運航会社がフライトを運航します。"),
    ("Our standard", "มาตรฐานของเรา", "我们的标准", "私たちの基準"),
    ("Every operator checked before you see a quote.", "ผู้ให้บริการทุกรายได้รับการตรวจสอบก่อนที่คุณจะได้รับใบเสนอราคา", "在您收到报价之前，每家运营商都已经过审核。", "見積もりをお送りする前に、すべての運航会社を確認します。"),
    ("Read the full standard", "อ่านมาตรฐานฉบับเต็ม", "阅读完整标准", "基準の全文を読む"),
    ("Destinations", "จุดหมายปลายทาง", "目的地", "目的地"),
    ("Any aircraft, any route, upon availability.", "เครื่องบินทุกลำ ทุกเส้นทาง ตามความพร้อมให้บริการ", "任何机型，任何航线，视供应情况而定。", "あらゆる機体、あらゆるルートに、空き状況に応じて対応します。"),
    ("All destinations and guides", "จุดหมายปลายทางและคู่มือทั้งหมด", "所有目的地与指南", "すべての目的地とガイド"),
    ("Dates ahead", "วันสำคัญที่กำลังจะมาถึง", "近期日期", "今後の日程"),
    ("Events fill airports and parking early.", "งานใหญ่ทำให้สนามบินและที่จอดเครื่องบินเต็มเร็ว", "大型活动会让机场和停机位提前满档。", "大きなイベントの時期は、空港と駐機場が早く埋まります。"),
    ("The next dates confirmed by the organisers. If you plan to travel for one of them, tell us early.", "วันที่ผู้จัดงานยืนยันแล้ว หากคุณวางแผนเดินทางไปร่วมงาน โปรดแจ้งเราล่วงหน้า", "以下是主办方已确认的日期。如果您计划出行参加，请尽早告诉我们。", "主催者が確定した次の日程です。参加のご予定があれば、お早めにお知らせください。"),
    ("Dates from each organiser; the source is on the city page.", "วันที่จากผู้จัดงานแต่ละราย แหล่งที่มาอยู่ในหน้าของเมือง", "日期来自各主办方；来源见城市页面。", "日程は各主催者によるもので、出典は各都市のページにあります。"),
    ("Empty-leg alerts", "การแจ้งเตือนเที่ยวบินเปล่า", "空程航班提醒", "空レッグのお知らせ"),
    ("Send me alerts", "ส่งการแจ้งเตือนให้ฉัน", "向我发送提醒", "お知らせを受け取る"),
    ("Flown privately before?", "เคยบินส่วนตัวมาก่อนหรือไม่?", "以前乘坐过私人飞机吗？", "プライベートジェットのご利用経験は？"),
    ("No, first time", "ไม่เคย ครั้งแรก", "没有，第一次", "いいえ、初めてです"),
    ("Also send me empty-leg alerts and occasional news (optional)", "ส่งการแจ้งเตือนเที่ยวบินเปล่าและข่าวสารเป็นครั้งคราวให้ฉันด้วย (ไม่บังคับ)", "同时向我发送空程航班提醒和不定期资讯（可选）", "空レッグのお知らせと時々のニュースも受け取る（任意）"),
]

def run(verbose=True):
    P = _pages()
    blocks_fleet = standard()
    blocks_journey = destinations(P) + dates(P)
    for f in ("index.html", "th.html", "zh.html", "ja.html"):
        p = os.path.join(SITE, f)
        if not os.path.exists(p): continue
        s = open(p, encoding="utf-8").read()
        s = re.sub(r'<!--ae:home-->.*?<!--/ae:home-->\s*', "", s, flags=re.S)
        # 1. broker line after the hero text (prerendered and template)
        s = re.sub(r'(<p[^>]*>For people whose time is not negotiable\.[^<]*</p>)', lambda m: m.group(1) + BROKER, s)
        # 2. standard before the aircraft finder; 3-4. destinations and dates before "How it works"
        s = re.sub(r'(<section(?: data-dc-tpl="\d+")? id="fleet")', lambda m: blocks_fleet + m.group(1), s)
        s = re.sub(r'(<section(?: data-dc-tpl="\d+")? id="journey")', lambda m: blocks_journey + m.group(1), s)
        # 6. alerts at the end of the contact section (prerendered and template)
        for m in reversed(list(re.finditer(r'<section(?: data-dc-tpl="\d+")? id="contact"', s))):
            j = s.index("</section>", m.start())
            s = s[:j] + alerts() + s[j:]
        s = s.replace("</body>", ALERT_JS + "</body>", 1)
        # 5. quote form step 2 (template source)
        if STATE_OLD in s: s = s.replace(STATE_OLD, STATE_NEW, 1)
        if OPTS_OLD in s and "flownOpts:" not in s: s = s.replace(OPTS_OLD, OPTS_NEW, 1)
        if SEND_OLD in s: s = s.replace(SEND_OLD, SEND_NEW, 1)
        if UI_ANCHOR in s: s = s.replace(UI_ANCHOR, UI_NEW + UI_ANCHOR, 1)
        open(p, "w", encoding="utf-8").write(s)
    p = os.path.join(SITE, "i18n.js")
    if os.path.exists(p):
        t = open(p, encoding="utf-8").read(); add = ""
        for row in I18N:
            if "['" + row[0].replace("'", "\\'") + "'," not in t: add += "\n[" + ",".join("'" + x.replace("'", "\\'") + "'" for x in row) + "],"
        anchor = "['How it works','ขั้นตอนการให้บริการ','服务流程','ご利用の流れ'],"
        if add and anchor in t: open(p, "w", encoding="utf-8").write(t.replace(anchor, anchor + add, 1))
    if verbose: print(f"  home: standard, {len([x for x in P if x['type'] in ('region','city')])} destinations, dates, alerts, quote form step 2")

if __name__ == "__main__": run()
