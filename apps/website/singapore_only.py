"""Singapore only until the Bangkok office opens (Morten, 26 Oct 2026).
Archē is a Singapore company. Until a Bangkok office exists, no page says Bangkok office, shows a Bangkok address or
a Thai phone number, or presents Bangkok as a base. Routes and airports in Thailand stay (they are destinations).
Run by build.py on every build; can also be run on its own:  python3 apps/website/singapore_only.py
To bring Bangkok back when the office opens: set BANGKOK_OFFICE = True in build.py and rebuild."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
PAIRS = [
    # titles and descriptions
    ("Private jet charter · Singapore and Bangkok", "Private jet charter · Singapore · Worldwide"),
    ("Private jet charter from Singapore and Bangkok, worldwide.", "Private jet charter from Singapore, worldwide."),
    ("Private jet charter · Singapore · Bangkok", "Private jet charter · Singapore · Worldwide"),
    ("Singapore · Bangkok", "Singapore · Worldwide"),
    ("เช่าเหมาลำเครื่องบินส่วนตัว · สิงคโปร์และกรุงเทพฯ", "เช่าเหมาลำเครื่องบินส่วนตัว · สิงคโปร์ · ทั่วโลก"),
    ("จากสิงคโปร์และกรุงเทพฯ สู่ทุกที่ทั่วโลก", "จากสิงคโปร์ สู่ทุกที่ทั่วโลก"),
    ("สิงคโปร์ · กรุงเทพฯ", "สิงคโปร์ · ทั่วโลก"),
    ("私人飞机包机 · 新加坡与曼谷", "私人飞机包机 · 新加坡 · 全球"),
    ("从新加坡和曼谷出发", "从新加坡出发"),
    ("新加坡 · 曼谷", "新加坡 · 全球"),
    ("シンガポール・バンコク", "シンガポール・世界各地"),
    ("シンガポールとバンコクから世界各地へ", "シンガポールから世界各地へ"),
    ("シンガポール · バンコク", "シンガポール · 世界各地"),
    # the Bangkok office in the page script
    ("    { city: 'Bangkok', entity: '[Legal entity, Co., Ltd.]', address: '[Office address, Bangkok]', phone: '+66 0 0000 0000' },\n", ""),
]
# the Bangkok office tab and address in the ready-made page copy (any language)
CITY = r"(?:Bangkok|กรุงเทพฯ|曼谷|バンコク)"
RX = [re.compile(r'<button[^>]*>\s*<span class="sc-interp">' + CITY + r'</span>\s*</button>'),
      re.compile(r'<div style="display:flex;flex-direction:column;gap:4px"><span[^>]*>' + CITY + r'</span><span>\[Office address\]</span></div>')]
def apply_text(t):
    for a, b in PAIRS: t = t.replace(a, b)
    for rx in RX: t = rx.sub("", t)
    return t
def run(paths=None):
    paths = paths or [os.path.join(HERE, "site", f) for f in os.listdir(os.path.join(HERE, "site")) if f.endswith((".html", ".js"))]
    changed = []
    for p in paths:
        t = open(p, encoding="utf-8").read(); n = apply_text(t)
        if n != t: open(p, "w", encoding="utf-8").write(n); changed.append(os.path.basename(p))
    return changed
if __name__ == "__main__":
    print("changed:", run())
