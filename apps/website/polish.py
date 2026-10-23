"""Premium polish (Morten, 23 Oct 2026, items 2, 3 and 5): fewer words, more breathing room with a larger headline
scale, and one fine metallic detail on section labels and dividers. Live from 23 Oct 2026.
Shorter texts carry Thai, Chinese and Japanese rows for the translation file (added at go-live).
"""
import os

# (old English, new English, Thai, Chinese, Japanese)
TEXTS = [
    ("Many brokers offer whatever is available and leave the rest to chance. We do not work that way.",
     "Many brokers sell whatever is available. We don’t.",
     "นายหน้าหลายรายขายสิ่งที่มีอยู่ แต่เราไม่ทำเช่นนั้น", "许多经纪商有什么就卖什么。我们不这样做。", "多くのブローカーは空いている機体をそのまま売ります。私たちは違います。"),
    ("Before we recommend an aircraft, we take the time to understand who will fly it, how it is maintained, and exactly what you are paying for.",
     "Before we recommend an aircraft, we know who flies it, how it is maintained and what you are paying for.",
     "ก่อนแนะนำเครื่องบิน เรารู้ว่าใครเป็นผู้บิน ดูแลรักษาอย่างไร และคุณจ่ายเงินเพื่ออะไร",
     "在推荐任何飞机之前，我们清楚由谁执飞、如何维护，以及您所支付的每一项费用。",
     "機体をおすすめする前に、誰が運航し、どう整備され、何に対してお支払いいただくのかを把握しています。"),
    ("Every charter and every piece of advice rests on our own checks, not just what a booking screen shows. We scrutinise every available source and look at how each operator manages safety and how reliably its aircraft leave on time, to make sure your aircraft is airworthy in practice as well as on paper.",
     "Every recommendation rests on our own checks, not a booking screen: how each operator manages safety, how reliably it flies on time, and whether the aircraft is airworthy in practice, not just on paper.",
     "ทุกคำแนะนำมาจากการตรวจสอบของเราเอง ไม่ใช่แค่หน้าจอการจอง ทั้งวิธีที่ผู้ให้บริการบริหารความปลอดภัย ความตรงต่อเวลา และความพร้อมบินของเครื่องบินในความเป็นจริง ไม่ใช่แค่บนเอกสาร",
     "每一项建议都基于我们自己的核查，而非预订系统上的信息：运营商如何管理安全、准点是否可靠，以及飞机是否真正适航，而不仅是纸面合规。",
     "すべてのご提案は予約画面ではなく、私たち自身の確認に基づいています。運航会社の安全管理、定時性、そして書類上だけでなく実際に耐空性があるかどうか。"),
    ("We have no fleet to fill and no one else’s interests to protect. For companies and family offices, that independence also means privacy, flexible terms, and none of your capital tied up in aircraft.",
     "We have no fleet to fill and no one else’s interests to protect. For companies and family offices, that means privacy, flexible terms and no capital tied up in aircraft.",
     "เราไม่มีฝูงบินที่ต้องหาลูกค้า และไม่มีผลประโยชน์ของผู้อื่นที่ต้องปกป้อง สำหรับบริษัทและแฟมิลีออฟฟิศ นั่นหมายถึงความเป็นส่วนตัว เงื่อนไขที่ยืดหยุ่น และไม่ต้องผูกเงินทุนไว้กับเครื่องบิน",
     "我们没有需要填满的机队，也不代表任何他方利益。对企业和家族办公室而言，这意味着隐私、灵活的条款，且无需将资本投入飞机。",
     "埋めるべき自社機材も、守るべき他者の利害もありません。企業やファミリーオフィスにとっては、プライバシー、柔軟な条件、そして機体に資本を拘束されないことを意味します。"),
    ("Your name, your plans and who travels with you go only to the people who need them to fly you safely. We don’t talk about our clients. We never will.",
     "Your plans and your guests are shared only with those who fly you. We never talk about our clients.",
     "แผนการเดินทางและผู้ร่วมเดินทางของคุณ จะแจ้งเฉพาะผู้ที่ดูแลเที่ยวบินของคุณเท่านั้น เราไม่เคยพูดถึงลูกค้าของเรา",
     "您的行程与同行人员信息，仅提供给为您执飞的人员。我们从不谈论我们的客户。",
     "ご予定や同行者の情報は、運航に必要な関係者にのみ共有します。お客様について口外することはありません。"),
    ("Senior people with decades in aviation run each trip from the first call to landing. If anything changes, you hear it from us first, along with a clear way forward.",
     "Senior aviation people run every trip from first call to landing. If anything changes, you hear it from us first, with a way forward.",
     "ผู้เชี่ยวชาญด้านการบินอาวุโสดูแลทุกเที่ยวบินตั้งแต่การติดต่อครั้งแรกจนถึงการลงจอด หากมีสิ่งใดเปลี่ยนแปลง คุณจะได้ทราบจากเราก่อน พร้อมทางเลือกที่ชัดเจน",
     "资深航空人士全程负责每一次行程，从第一通电话到落地。如有任何变化，我们会第一时间告知，并提供解决方案。",
     "経験豊富な航空のプロが、最初のご連絡から着陸まですべてのフライトを担当します。変更があれば、まず私たちから、解決策とともにお知らせします。"),
    ("Call, message or use the form. Give us the route, the dates and who is travelling. If something matters to you, such as a pet, a medical need or oversized luggage, tell us at the start and we plan around it.",
     "Call, message or use the form with the route, dates and who is travelling. Mention pets, medical needs or large luggage at the start.",
     "โทร ส่งข้อความ หรือใช้แบบฟอร์ม แจ้งเส้นทาง วันที่ และผู้เดินทาง หากมีสัตว์เลี้ยง ความต้องการทางการแพทย์ หรือสัมภาระขนาดใหญ่ โปรดแจ้งตั้งแต่ต้น",
     "致电、发消息或填写表格，告诉我们航线、日期和出行人员。如有宠物、医疗需求或大件行李，请一开始就告知。",
     "お電話、メッセージ、またはフォームで、ルート、日程、ご搭乗者をお知らせください。ペット、医療上のご要望、大型のお荷物は最初にお伝えください。"),
    ("We go to the whole market, not to a preferred fleet. Each option is checked for operator certification, aircraft age and maintenance history, crew experience and safety audits before we show it to you. Every quote names the operator.",
     "We search the whole market, not a preferred fleet, and check each operator’s certificate, aircraft, crew and safety audits. Every quote names the operator.",
     "เราค้นหาทั้งตลาด ไม่จำกัดเฉพาะฝูงบินใด และตรวจสอบใบรับรอง เครื่องบิน ลูกเรือ และผลการตรวจสอบความปลอดภัยของผู้ให้บริการทุกราย ทุกใบเสนอราคาระบุชื่อผู้ให้บริการ",
     "我们面向整个市场寻找，而非特定机队，并核查每家运营商的资质、飞机、机组和安全审计。每份报价均注明运营商。",
     "特定の機材に限らず市場全体から探し、運航会社の証明、機体、乗務員、安全監査を確認します。すべてのお見積りに運航会社名を明記します。"),
    ("You get one all-in price and one invoice from us. The charter agreement names the operating carrier, and the payment terms and cancellation conditions are written out before you commit.",
     "One all-in price and one invoice. The agreement names the operator and sets out payment and cancellation terms before you commit.",
     "ราคาเดียวรวมทุกอย่างและใบแจ้งหนี้ฉบับเดียว สัญญาระบุชื่อผู้ให้บริการ พร้อมเงื่อนไขการชำระเงินและการยกเลิก ก่อนที่คุณจะตัดสินใจ",
     "一个全包价格，一张发票。协议注明运营商，并在您确认前列明付款和取消条款。",
     "すべて込みの料金と、一通の請求書。契約書には運航会社名と、ご確定前のお支払い・キャンセル条件を明記します。"),
    ("Catering, cars, FBO access, passports and manifests. If the weather, slots or routing change, we tell you straight away and give you the options.",
     "Catering, cars, FBO, passports and manifests. If weather, slots or routing change, we tell you at once, with options.",
     "อาหาร รถรับส่ง FBO หนังสือเดินทาง และรายชื่อผู้โดยสาร หากสภาพอากาศ สล็อต หรือเส้นทางเปลี่ยน เราแจ้งคุณทันทีพร้อมทางเลือก",
     "餐饮、用车、FBO、护照和乘客名单。如天气、时刻或航路有变，我们会立即告知并提供选择。",
     "ケータリング、送迎車、FBO、パスポート、搭乗者名簿。天候、スロット、ルートに変更があれば、選択肢とともにすぐにお知らせします。"),
    ("The operator flies the aircraft and keeps operational control. We stay reachable the whole way and check in after you land.",
     "The operator flies the aircraft and keeps operational control. We stay reachable throughout and check in after you land.",
     "ผู้ให้บริการเป็นผู้บินและควบคุมการปฏิบัติการ เราพร้อมติดต่อได้ตลอดเส้นทาง และติดต่อคุณหลังลงจอด",
     "由运营商执飞并保持运行控制。我们全程可随时联系，并在您落地后回访。",
     "運航会社が機体を運航し、運航管理を担います。私たちは道中いつでも連絡が取れ、ご到着後にもご連絡します。"),
]

METAL = "linear-gradient(100deg,#eef2f6 0%,#ffffff 25%,#b9c5d2 55%,#e4ebf2 80%,#ffffff 100%)"
CSS = """<style id="arche-polish-css">
/* 3. breathing room and a larger headline scale */
section:not(#top) h2{font-size:clamp(30px,4.3vw,62px) !important;line-height:1.08 !important;letter-spacing:-0.01em !important}
@media (min-width:1025px){
  section[data-screen-label="Intro"]{padding-top:190px !important;padding-bottom:190px !important}
  section#services,section#why{padding-bottom:200px !important}
  section#fleet,section#journey,section#contact{padding-top:150px !important;padding-bottom:150px !important}
  .ar-trio{padding-bottom:200px !important}
}
/* 5. one fine metallic detail: section labels and dividers */
section span[style*="uppercase"][style*="0.16em"], .ar-trio .ar-k{background:%(metal)s;-webkit-background-clip:text;background-clip:text;color:transparent !important;display:inline-flex;align-items:center;gap:14px}
section span[style*="uppercase"][style*="0.16em"]::before, .ar-trio .ar-k::before{content:"";width:34px;height:1px;background:linear-gradient(90deg,rgba(185,197,210,0),#dfe6ee);flex:none}
[style*="border-image"]{border-image:linear-gradient(90deg,rgba(185,197,210,0) 0%,rgba(223,230,238,.55) 35%,rgba(255,255,255,.75) 50%,rgba(223,230,238,.55) 65%,rgba(185,197,210,0) 100%) 1 !important}
</style>
""".replace("%(metal)s", METAL)


def texts(s):
    """English text swaps; every old text must still be on the page."""
    for old, new, *_ in TEXTS:
        for o, n in ((old, new), (old.replace("’", "'"), new.replace("’", "'"))):
            s = s.replace(o, n)
    return s


def rows():
    return [list(t[1:]) for t in TEXTS]


def add_rows(t):
    """Add the shorter texts to the translation file (site/i18n.js)."""
    import json
    new = "".join("[" + ",".join(json.dumps(c, ensure_ascii=False) for c in r) + "],\n" for r in rows())
    assert t.count("\n];\nconst RX = [\n") == 1
    return t.replace("\n];\nconst RX = [\n", "\n" + new + "];\nconst RX = [\n", 1)


def apply(s):
    """Live page (Morten 23 Oct 2026: go live): shorter texts and the polish styles."""
    missing = [t[0][:50] for t in TEXTS if t[0] not in s and t[0].replace("’", "'") not in s]
    assert not missing, missing
    return texts(s).replace("</head>", CSS + "</head>", 1)


def preview(out):
    s = open(os.path.join(out, "index.html"), encoding="utf-8").read()
    missing = [t[0][:50] for t in TEXTS if t[0] not in s and t[0].replace("’", "'") not in s]
    assert not missing, missing
    s = texts(s)
    s = s.replace('<link rel="canonical" href="https://archeaviation.com/">', '<meta name="robots" content="noindex,nofollow">', 1)
    s = s.replace("</head>", CSS + "</head>", 1)
    open(os.path.join(out, "preview.html"), "w", encoding="utf-8").write(s)
    print("preview written", len(s))


if __name__ == "__main__":
    preview(os.path.join(os.path.dirname(os.path.abspath(__file__)), "site"))
