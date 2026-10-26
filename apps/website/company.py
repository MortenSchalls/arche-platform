"""Company details on the website (Morten, 26 Oct 2026). Change them here only; build.py applies them on every build.
UEN: add the registration number when corporate services sends it, then run  python3 apps/website/company.py"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
NAME = "Arche Executive Pte. Ltd."
ADDRESS = "20 Collyer Quay, #09-01, Singapore 049319"
UEN = ""   # registration number, e.g. "202612345A"
EMAIL = "contact@archeaviation.com"   # public enquiry address (Morten, 26 Oct 2026; was charter@archeexecutive.com)
def pairs():
    line = " · ".join(x for x in (NAME, ("UEN " + UEN) if UEN else "", ADDRESS) if x)
    return [
        ("[Legal entity name · registration no. · registered address]", line),
        ("[Legal entity, Pte. Ltd.]", NAME),
        ("[Office address, Singapore]", ADDRESS),
        ('font-size:11.5px">Singapore</span><span>[Office address]</span>', 'font-size:11.5px">Singapore</span><span>' + ADDRESS + '</span>'),
        ("[registered address, Singapore]", ADDRESS),
        ("charter@archeexecutive.com", EMAIL), ("[privacy contact email]", EMAIL),
        # the translated placeholders: a legal name and address stay as written in every language
        ("[ชื่อนิติบุคคล, Pte. Ltd.]", NAME), ("[法人名称, Pte. Ltd.]", NAME), ("[法人名, Pte. Ltd.]", NAME),
        ("[ที่อยู่สำนักงาน สิงคโปร์]", ADDRESS), ("[办公地址，新加坡]", ADDRESS), ("[オフィス所在地（シンガポール）]", ADDRESS),
        ("[ชื่อนิติบุคคล · เลขทะเบียน · ที่อยู่จดทะเบียน]", line), ("[法人名称 · 注册号 · 注册地址]", line), ("[法人名 · 登録番号 · 登記住所]", line),
    ] + ([("[registration number]", "UEN " + UEN)] if UEN else [])
def run():
    out, changed = os.path.join(HERE, "site"), []
    for f in os.listdir(out):
        p = os.path.join(out, f)
        if not f.endswith((".html", ".js")) or not os.path.isfile(p): continue
        t = open(p, encoding="utf-8").read(); n = t
        for a, b in pairs(): n = n.replace(a, b)
        if n != t: open(p, "w", encoding="utf-8").write(n); changed.append(f)
    return changed
if __name__ == "__main__":
    print("changed:", run())
