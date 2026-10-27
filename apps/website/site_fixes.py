"""Website fixes kept on every build (Morten, 26 Oct 2026: "we need it to be perfect").
- One office: the city shows once (as the office name); the heading over the address reads "Registered office".
- Jurisdictional notice: factual Singapore wording instead of the placeholder (to be confirmed by counsel).
- Payment line: "a secure payment link"; no payment provider is named on the site (Morten, 26 Oct 2026).
- Phone, WhatsApp, LINE and WeChat come from company.py. Until a value is set, the LINE and WeChat cards are left out,
  and the phone stays a placeholder that check_site.py reports, so the site is not made public with it.
Run by build.py after company.py; can also be run on its own:  python3 apps/website/site_fixes.py"""
import os, re, json
import company
HERE = os.path.dirname(os.path.abspath(__file__))
NOTICE_OLD = {
  "en": "[Placeholder] Singapore and Thailand disclosure wording to be confirmed against CAAS and CAAT requirements before launch.",
}
NOTICE = ["Archē Executive is a private company registered in Singapore. It arranges charter flights as its clients’ agent and is not an air operator. Each flight is operated under the Air Operator Certificate of the operator named in your quotation, under the rules of that operator’s aviation authority.",
  "Archē Executive เป็นบริษัทเอกชนที่จดทะเบียนในสิงคโปร์ ทำหน้าที่จัดเที่ยวบินเช่าเหมาลำในฐานะตัวแทนของลูกค้า และไม่ใช่ผู้ดำเนินการเดินอากาศ ทุกเที่ยวบินดำเนินการภายใต้ใบรับรองผู้ดำเนินการเดินอากาศ (AOC) ของผู้ให้บริการที่ระบุในใบเสนอราคาของท่าน และอยู่ภายใต้กฎของหน่วยงานการบินของผู้ให้บริการนั้น",
  "Archē Executive 是一家在新加坡注册的私营公司，以客户代理人的身份安排包机航班，并非航空运营人。每个航班均依据您报价单中所列运营商的航空运营人合格证（AOC）执飞，并受该运营商所属航空主管机构的规则约束。",
  "Archē Executive はシンガポールで登記された民間企業で、お客様の代理人としてチャーター便を手配します。航空運送事業者ではありません。各フライトは、お見積書に記載された運航会社の航空運送事業許可（AOC）のもと、その運航会社を所管する航空当局の規則に従って運航されます。"]
PAY = []   # the source texts (sections.py) already say "a secure payment link"
PRIVACY_DATE = "26 October 2026"   # change when the privacy notice text changes
CITY = r"(?:Singapore|สิงคโปร์|新加坡|シンガポール)"
EXCL = json.load(open(os.path.join(HERE, "content", "excluded.json"), encoding="utf-8"))
def drop_excluded_airports(t):
    """The quote form's airport list: no airports in sanctioned countries (Morten, 27 Oct 2026)."""
    def clean(m):
        rows = m.group(1).split("\\n")
        keep = [r for r in rows if not (len(r.split("|")) > 2 and (r.split("|")[2] in EXCL["airports_iata"] or r.split("|")[1] in EXCL["countries"]))]
        return 'airports = "' + "\\n".join(keep) + '";'
    return re.sub(r'airports = "(.*?)";', clean, t, flags=re.S)

def fix(t, name):
    t = drop_excluded_airports(t)
    # office heading: "Registered office" instead of repeating the city
    t = t.replace('<span style="font-size:13px;letter-spacing:0.3em;text-transform:uppercase;color:#f3f5f8">{{ office.city }}</span>', '<span style="font-size:13px;letter-spacing:0.3em;text-transform:uppercase;color:#f3f5f8">{{ office.label }}</span>')
    t = t.replace("      office: this.offices[s.office],", "      office: { ...this.offices[s.office], label: this.offices.length > 1 ? this.offices[s.office].city : 'Registered office' },")
    t = re.sub(r'(<span data-dc-tpl="377"[^>]*><span class="sc-interp">)' + CITY + r'(</span></span>)', r'\1Registered office\2', t)
    t = re.sub(r'(<span style="font-size:9px;letter-spacing:0.16em;color:#a9bdd4;text-transform:uppercase;font-size:11.5px">)' + CITY + r'(</span><span>' + re.escape(company.ADDRESS) + ')', r'\1Registered office\2', t)
    # long email address fits the card at phone width
    t = re.sub(r'(font-size: ?)20\.8px(;[^"]*"[^>]*>' + re.escape(company.EMAIL) + ')', r'\1clamp(16px, 4.4vw, 20.8px)\2', t)
    # privacy notice header: no empty registration number, a real date
    if not company.UEN: t = t.replace(" · [registration number] · ", " · ")
    t = t.replace("Last updated [date]", "Last updated " + PRIVACY_DATE)
    # notice and payment line
    t = t.replace(NOTICE_OLD["en"], NOTICE[0])
    for a, b in PAY: t = t.replace(a, b)
    # LINE label without a country
    t = t.replace("LINE · Thailand", "LINE")
    # contact routes from company.py
    if company.PHONE:
        digits = re.sub(r"\D", "", company.PHONE)
        t = t.replace("[+65 0000 0000]", company.PHONE).replace("+65 0000 0000", company.PHONE).replace("tel:+6500000000", "tel:+" + digits).replace("wa.me/6500000000", "wa.me/" + digits)
    for card, val in (("LINE", company.LINE_ID), ("WeChat", company.WECHAT_ID)):
        default = "@archeexecutive" if card == "LINE" else "ArcheExecutive"
        if val: t = t.replace(">" + default + "<", ">" + val + "<")
        else:   # leave the card out until the account exists
            if card == "LINE": t = t.replace("['WhatsApp', 'Phone', 'Email', 'LINE']", "['WhatsApp', 'Phone', 'Email']")
            t = re.sub(r'<a[^>]*href="#contact"[^>]*>\s*<span[^>]*>' + card + r'(?: · [^<]*)?</span>\s*<span[^>]*>' + re.escape(default) + r'</span>\s*<span[^>]*>[^<]*</span>\s*</a>', "", t)
    return t
def fix_i18n(t):
    t = t.replace("['LINE · Thailand','LINE · ประเทศไทย','LINE · 泰国','LINE · タイ'],", "")
    t = re.sub(r'\["\[Placeholder\] Singapore and Thailand disclosure[^\n]*\],?\n', json_row(NOTICE) + ",\n", t)
    if "'Registered office'" not in t and '"Registered office"' not in t:
        t = t.replace("['Bangkok','กรุงเทพฯ','曼谷','バンコク'],", "['Bangkok','กรุงเทพฯ','曼谷','バンコク'],\n['Registered office','สำนักงานจดทะเบียน','注册办事处','登記上の事務所'],", 1)
    return t
def json_row(vals):
    import json; return json.dumps(vals, ensure_ascii=False)
def run():
    out, changed = os.path.join(HERE, "site"), []
    for f in os.listdir(out):
        p = os.path.join(out, f)
        if not os.path.isfile(p): continue
        if f.endswith(".html"): t = open(p, encoding="utf-8").read(); n = fix(t, f)
        elif f == "i18n.js": t = open(p, encoding="utf-8").read(); n = fix_i18n(t)
        else: continue
        if n != t: open(p, "w", encoding="utf-8").write(n); changed.append(f)
    return changed
if __name__ == "__main__":
    print("changed:", run())
