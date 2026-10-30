"""Home page, the client's feel (Morten, 30 Oct 2026: "navigate the GlobalJet page and see what they have under each menu
and section and update our page to be better than this. BUT do not introduce new services we don't have ... specially
look at the luxury feel a client gets when looking at each menu").
What GlobalJet does well and we answer here, with our own three services only and nothing we do not do:
  1. each service explained in detail (they give every service its own page) -> "Each service, in detail" after Services
  2. the cabin experience (their reviews talk about catering, amenities, care on board) -> "On board, as you wish":
     the details we already arrange (journey step 4: catering, cars, FBO, passports and manifests), always through the
     operator and confirmed before departure. No reviews (CLAUDE.md), no partner companies, no prices, no fleet.
  3. their "any plane, any time, any place" line -> our slogan "Any aircraft. Any hour. One advisor." (Morten's choice,
     30 Oct 2026) in large type before Contact, with the rule line "Any aircraft, any route, upon availability." under it.
Layout, colours and fonts are the Design file's (Prata headings, Hanken Grotesk text, the same thin rules); no images,
no scripts. Runs after home_extras.py. Idempotent: every block is replaced on each build.
Translations: i18n_luxury.json (Thai, Chinese, Japanese), one row per text, checked on every build."""
import os, re, json
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site")

EYE = "font-size:12.5px;letter-spacing:0.16em;text-transform:uppercase;color:#a9bdd4"
H2 = "margin:14px 0 18px;font-family:Prata,Georgia,serif;font-weight:400;font-size:clamp(28px,3.4vw,44px);line-height:1.15;color:#f3f5f8"
TXT = "margin:0;font-size:17px;line-height:1.7;color:#c6cbd2;max-width:760px"
WRAP = "max-width:1440px;margin:0 auto;padding:clamp(56px,6vw,96px) 40px;box-sizing:border-box"
LINE = "border-top:1px solid rgba(243,245,248,0.12)"
NUM = "display:block;font-size:12.5px;font-weight:500;letter-spacing:0.22em;color:#a9bdd4"
H3 = "margin:10px 0 0;font-family:'Hanken Grotesk',system-ui,sans-serif;font-weight:400;font-size:clamp(21px,1.8vw,24px);line-height:1.2;letter-spacing:-0.01em;color:#f3f5f8"   # sub-headings in the Design file's sans, like the service cards
ITEM = "display:block;padding:12px 0;border-bottom:1px solid rgba(243,245,248,0.08);font-size:16.5px;line-height:1.6;color:#c6cbd2"

SERVICES = [
    ("01", "Private Charter", "One trip or a full season of travel.", "#svc-charter", [
        "The whole market searched for your dates, not a preferred fleet.",
        "Every operator checked against our standard before you see a quote.",
        "One all-in price and one invoice, with the operator named.",
        "Catering, cars, private terminal, passports and manifests arranged.",
        "Your advisor reachable throughout, and a call after you land.",
    ]),
    ("02", "Aviation Advisory", "For flight departments, family offices and principals.", "#svc-advisory", [
        "Which aircraft suits the way you travel, and why.",
        "Which operators to trust, from our own checks.",
        "What a trip should really cost, before you commit.",
        "Straight answers in plain words, with nothing to sell you.",
    ]),
    ("03", "Fleet Coordination", "For owners who want their aircraft to earn its keep.", "#svc-fleet", [
        "Your own flights planned first.",
        "Sensible scheduling around maintenance and crew.",
        "Charter placed with care, on terms you agree.",
        "Fewer surprises, and plain answers when plans change.",
    ]),
]

ONBOARD = [
    ("Catering", "Ordered to your taste, from a light breakfast to a full dinner, with every dietary need noted."),
    ("Cars", "A car to and from the private terminal, timed to your flight."),
    ("Private terminal", "A quiet private terminal where the airport has one, with passports and manifests sent ahead."),
    ("Pets", "Welcome when the operator agrees and the destination's rules are met. Tell us at the start."),
    ("Luggage and equipment", "Golf bags, skis or large cases checked against the aircraft's hold before you book."),
    ("Occasions", "Flowers, a cake or a favourite bottle on board for a birthday or a celebration."),
]

def services_detail():
    col = lambda n, name, lead, href, items: (
        f'<div style="padding-top:22px;border-top:1px solid rgba(243,245,248,0.3)"><span style="{NUM}">{n}</span>'
        f'<h3 style="{H3}">{name}</h3><p style="margin:8px 0 14px;font-size:16px;line-height:1.6;color:#b1b6bd;font-style:italic">{lead}</p>'
        + "".join(f'<span style="{ITEM}">{x}</span>' for x in items) + '</div>')
    return f'''<!--ae:lux--><section id="services-detail" data-ae="lux" style="{LINE}"><div style="{WRAP}">
<span style="{EYE}">Each service, in detail</span><h2 style="{H2}">What you can expect from us.</h2>
<p style="{TXT}">Three services, each run by senior aviation people. This is what each one means in practice.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:40px 48px;margin:40px 0 0">{"".join(col(*s) for s in SERVICES)}</div>
</div></section><!--/ae:lux-->'''

def onboard():
    tile = lambda i, t, d: (f'<div style="padding:26px 0 0;border-top:1px solid rgba(243,245,248,0.18)"><span style="{NUM}">{i:02d}</span>'
                            f'<h3 style="{H3}">{t}</h3><p style="margin:10px 0 0;font-size:16.5px;line-height:1.7;color:#c6cbd2">{d}</p></div>')
    return f'''<!--ae:lux--><section id="onboard" data-ae="lux" style="{LINE}"><div style="{WRAP}">
<span style="{EYE}">On board</span><h2 style="{H2}">The flight, arranged around you.</h2>
<p style="{TXT}">Tell us once how you like to travel. We arrange the details with the operator and confirm them with you before departure.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:40px 56px;margin:40px 0 0">{"".join(tile(i + 1, *o) for i, o in enumerate(ONBOARD))}</div>
<p style="margin:36px 0 0;font-size:14px;line-height:1.7;color:#b1b6bd;max-width:760px">Every request depends on the aircraft, the operator, the airport and local rules. Any cost is agreed with you before departure.</p>
</div></section><!--/ae:lux-->'''

def statement():
    return f'''<!--ae:lux--><section id="statement" data-ae="lux" style="{LINE}"><div style="{WRAP};text-align:center">
<span style="{EYE}">Archē Executive</span>
<p style="margin:18px auto 0;max-width:900px;font-family:Prata,Georgia,serif;font-size:clamp(32px,5vw,68px);line-height:1.15;letter-spacing:0.01em;color:#f3f5f8">Any aircraft. Any hour. One advisor.</p>
<p style="margin:22px auto 0;max-width:620px;font-size:13px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#a9bdd4">Any aircraft, any route, upon availability.</p>
</div></section><!--/ae:lux-->'''

def _after_section(s, sid, block):
    for m in reversed(list(re.finditer(rf'<section(?: data-dc-tpl="\d+")? id="{sid}"', s))):
        j = s.index("</section>", m.start()) + len("</section>")
        s = s[:j] + block + s[j:]
    return s

def js(x): return "'" + x.replace("\\", "\\\\").replace("'", "\\'") + "'"

def texts():
    out = ["Each service, in detail", "What you can expect from us.", "Three services, each run by senior aviation people. This is what each one means in practice.",
           "On board", "The flight, arranged around you.", "Tell us once how you like to travel. We arrange the details with the operator and confirm them with you before departure.",
           "Every request depends on the aircraft, the operator, the airport and local rules. Any cost is agreed with you before departure.",
           "Any aircraft. Any hour. One advisor."]
    for _, _, lead, _, items in SERVICES: out += [lead] + items
    for t, d in ONBOARD: out += [t, d]
    return out

def run(verbose=True):
    for f in ("index.html", "th.html", "zh.html", "ja.html"):
        p = os.path.join(SITE, f)
        if not os.path.exists(p): continue
        s = open(p, encoding="utf-8").read()
        s = re.sub(r'<!--ae:lux-->.*?<!--/ae:lux-->\s*', "", s, flags=re.S)
        s = _after_section(s, "services", services_detail())
        s = re.sub(r'(<!--ae:home--><section id="standard")', lambda m: onboard() + m.group(1), s)
        s = re.sub(r'(<section(?: data-dc-tpl="\d+")? id="contact")', lambda m: statement() + m.group(1), s)
        assert s.count('id="onboard"') == 2 and s.count('id="services-detail"') == 2 and s.count('id="statement"') == 2, f"luxury blocks not placed in {f}"
        open(p, "w", encoding="utf-8").write(s)
    p = os.path.join(SITE, "i18n.js")
    if os.path.exists(p):
        rows = json.load(open(os.path.join(HERE, "i18n_luxury.json"), encoding="utf-8"))["rows"]
        have = {r[0] for r in rows}
        for r in rows: assert len(r) == 4 and all(x.strip() for x in r), r
        missing = [x for x in texts() if x not in have]
        assert not missing, f"luxury: no translation for {missing}"
        t = open(p, encoding="utf-8").read()
        t = re.sub(r"// ae:lux[^\n]*\n.*?// /ae:lux\n", "", t, flags=re.S)
        block = "// ae:lux rows (luxury.py, from i18n_luxury.json)\n" + "".join("[" + ",".join(js(x) for x in r) + "],\n" for r in rows) + "// /ae:lux\n"
        t = t.replace("const ROWS = [\n", "const ROWS = [\n" + block, 1)
        open(p, "w", encoding="utf-8").write(t)
    if verbose: print("  home: services in detail, on board, statement")

if __name__ == "__main__": run()
