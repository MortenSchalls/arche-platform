"""Spelling, brand and translation fixes applied by build.py (Morten, 20 Oct 2026).

The Design file stays the master for layout; these fixes are applied on top of it at build time.
  - brand: "Archē Executive" in visible text (the legal name "Arche Executive Pte. Ltd." is left alone)
  - typos in the Why Archē card 01
  - translations (TH / ZH-Hans / JA) for text that was changed in the Design file after translation, and for new text
  - a few translation corrections
Translations are drafts until a native speaker has checked them (see PRELAUNCH.md).
"""
import json, re

CARD1_OLD = ("We scrutinize every available source and&nbsp; look at how each operator manages safety, how reliably they are, "
             "their on- time reliablity, to ensure your aircraft is truly airworthy in practice as well as on paper")
CARD1_NEW = ("We scrutinise every available source and look at how each operator manages safety and how reliably its aircraft "
             "leave on time, to make sure your aircraft is airworthy in practice as well as on paper")

def brand(s):
    """Arche -> Archē in readable text; never in the legal name, e-mail addresses, handles or file names."""
    s = re.sub(r"\bArche Executive(?! Pte)", "Archē Executive", s)
    for a, b in (("Why Arche", "Why Archē"), ("your Arche advisor", "your Archē advisor"), ("; Arche stays on call", "; Archē stays on call"),
                 ("ทำไมต้อง Arche", "ทำไมต้อง Archē"), ("为何选择 Arche", "为何选择 Archē"), ("Arche が選ばれる理由", "Archē が選ばれる理由"),
                 ("ที่ปรึกษา Arche ", "ที่ปรึกษา Archē "), ("您的 Arche 顾问", "您的 Archē 顾问"), ("お客様と Arche の", "お客様と Archē の"),
                 ("ทำการบิน Arche ", "ทำการบิน Archē "), ("执飞，Arche 随时", "执飞，Archē 随时"), ("運航会社、Arche は", "運航会社、Archē は")):
        s = s.replace(a, b)
    return s

def page(s):
    """Fix the English page text (index.html before SEO tags are added)."""
    n = s.count(CARD1_OLD); assert n == 1, "Why card 01 text changed in the Design file; update text_fixes.py"
    s = s.replace(CARD1_OLD, CARD1_NEW)
    return brand(s)

# [English (after the fixes above), Thai, Chinese, Japanese]
NEW_ROWS = [
    ["We have spent more than thirty years in aviation, and we care about it deeply. Over that time we have watched the industry grow comfortable with doing things the way they have always been done. We believe our clients deserve fresh ideas and better options, so we started Archē Executive to offer the pinnacle of both.",
     "เราอยู่ในวงการการบินมากว่าสามสิบปี และผูกพันกับงานนี้อย่างลึกซึ้ง ตลอดเวลาที่ผ่านมา เราเห็นอุตสาหกรรมนี้เคยชินกับการทำสิ่งต่างๆ แบบเดิมที่เคยทำมา เราเชื่อว่าลูกค้าของเราควรได้รับแนวคิดใหม่และทางเลือกที่ดีกว่า เราจึงก่อตั้ง Archē Executive เพื่อมอบสิ่งที่ดีที่สุดของทั้งสองอย่าง",
     "我们在航空业深耕三十余年，对这个行业怀有深厚的感情。这些年里，我们看着行业逐渐安于现状、墨守成规。我们相信客户值得拥有新的思路和更好的选择，于是创立了 Archē Executive，把两者都做到极致。",
     "私たちは航空業界に三十年以上携わり、この仕事を心から大切にしてきました。その間、業界が昔ながらのやり方に安住していく姿を見てきました。お客様には新しい発想とより良い選択肢がふさわしい。そう信じて、その両方を最高の形でお届けするために Archē Executive を立ち上げました。"],
    ["We own no aircraft. That keeps our advice honest: our only job is to find the right aircraft and the right operator for your trip. We serve business leaders, family offices, private travellers, public figures, corporate groups and government delegations, and we treat every one of them the way we would want our own families treated.",
     "เราไม่มีเครื่องบินเป็นของตนเอง ซึ่งทำให้คำแนะนำของเราตรงไปตรงมา หน้าที่เดียวของเราคือหาเครื่องบินและผู้ให้บริการที่เหมาะสมที่สุดสำหรับการเดินทางของท่าน เราดูแลผู้บริหารธุรกิจ แฟมิลีออฟฟิศ ผู้เดินทางส่วนบุคคล บุคคลสาธารณะ กลุ่มองค์กร และคณะผู้แทนรัฐบาล และปฏิบัติต่อทุกท่านเหมือนที่เราอยากให้ครอบครัวของเราได้รับ",
     "我们不拥有任何飞机，这让我们的建议始终保持客观：我们唯一的职责，是为您的行程找到合适的飞机和合适的运营商。我们服务企业领袖、家族办公室、私人旅客、公众人物、企业团体及政府代表团，并像对待自己的家人一样对待每一位客户。",
     "私たちは機材を一切保有していません。だからこそ助言は公正です。私たちの仕事はただ一つ、お客様の旅に最適な機材と運航会社を見つけることです。経営者、ファミリーオフィス、個人のお客様、著名人、法人グループ、政府代表団まで、どなたにも自分の家族にしてほしいのと同じ姿勢で向き合います。"],
    ["So that when you step on board, you know you are in the right hands.",
     "เพื่อให้ทุกครั้งที่ท่านก้าวขึ้นเครื่อง ท่านมั่นใจได้ว่าอยู่ในมือที่ไว้วางใจได้",
     "让您每一次登机，都确信自己托付对了人。",
     "機内へ一歩踏み出すとき、確かな手に委ねていると感じていただくために。"],
    ["Many brokers offer whatever is available and leave the rest to chance. We do not work that way.",
     "นายหน้าหลายรายเสนอเครื่องบินที่ว่างอยู่ แล้วปล่อยที่เหลือให้เป็นเรื่องของโชค เราไม่ทำงานแบบนั้น",
     "很多经纪人有什么就推荐什么，其余听天由命。我们不这样做。",
     "多くのブローカーは空いている機材を紹介し、あとは運任せです。私たちはそのようには働きません。"],
    ["Before we recommend an aircraft, we take the time to understand who will fly it, how it is maintained, and exactly what you are paying for.",
     "ก่อนแนะนำเครื่องบินใด เราใช้เวลาทำความเข้าใจว่าใครเป็นผู้ทำการบิน เครื่องบินได้รับการซ่อมบำรุงอย่างไร และท่านกำลังจ่ายเพื่ออะไรอย่างแท้จริง",
     "在推荐任何一架飞机之前，我们都会花时间弄清楚：由谁执飞、飞机如何维护，以及您究竟为什么付费。",
     "機材をご提案する前に、誰が運航するのか、どのように整備されているのか、そして何に対して支払うのかを、時間をかけて確かめます。"],
    ["Every charter and every piece of advice rests on our own checks, not just what a booking screen shows. " + CARD1_NEW + ".",
     "ทุกการเช่าเหมาลำและทุกคำแนะนำ ตั้งอยู่บนการตรวจสอบของเราเอง ไม่ใช่เพียงสิ่งที่หน้าจอการจองแสดง เราตรวจสอบทุกแหล่งข้อมูลที่มี และพิจารณาว่าผู้ให้บริการแต่ละรายบริหารความปลอดภัยอย่างไร และเครื่องบินออกตรงเวลาเพียงใด เพื่อให้มั่นใจว่าเครื่องบินของท่านพร้อมบินจริง ทั้งในทางปฏิบัติและบนเอกสาร",
     "每一次包机、每一条建议，都基于我们自己的核查，而不仅仅是预订系统上显示的信息。我们仔细审查所有可获得的信息来源，考察每家运营商如何管理安全、其飞机准点起飞的可靠程度，以确保您的飞机不仅在文件上、而且在实际中真正适航。",
     "すべてのチャーターと助言は、予約画面の情報だけでなく、私たち自身の確認に基づいています。入手できるあらゆる情報を精査し、各運航会社の安全管理と定時出発の確かさを確認して、ご利用の機材が書類上だけでなく実際にも耐空性を備えていることを確かめます。"],
    ["Private client desk", "ฝ่ายดูแลลูกค้าส่วนบุคคล", "私人客户服务台", "プライベートクライアント・デスク"],
    ["One team that knows your preferences, your people and your schedule. Call or message at any hour.",
     "ทีมเดียวที่รู้จักความชอบ ผู้ร่วมเดินทาง และตารางเวลาของท่าน โทรหรือส่งข้อความได้ทุกเวลา",
     "由同一支团队了解您的偏好、随行人员和日程安排。任何时候都可致电或发消息。",
     "お客様のご希望、ご同行の方々、ご予定を把握した一つのチームが対応します。いつでもお電話・メッセージでどうぞ。"],
    ["Message on WhatsApp", "ส่งข้อความทาง WhatsApp", "通过 WhatsApp 发消息", "WhatsApp でメッセージ"],
    ["Broker login", "เข้าสู่ระบบสำหรับโบรกเกอร์", "经纪人登录", "ブローカー・ログイン"],
    ["Privacy notice", "ประกาศความเป็นส่วนตัว", "隐私声明", "プライバシー通知"],
    ["We use your details only to answer this request.", "เราใช้ข้อมูลของท่านเพื่อตอบคำขอนี้เท่านั้น", "我们仅将您的信息用于回复此请求。", "いただいた情報は、このご依頼への回答にのみ使用します。"],
]
NEW_RX = "  [/^Call direct · (.+)$/, { th: 'โทรตรง · $1', zh: '直接致电 · $1', ja: '直通電話 · $1' }],\n"

# existing rows: (English key, column 1-3, wrong text, corrected text)
CORRECTIONS = [
    ("Four zones, low cabin altitude", "สี่โซน ความดันห้องโดยสารต่ำ", "สี่โซน ระดับความสูงห้องโดยสารต่ำ"),   # "low cabin pressure" was the opposite meaning
    ("Terms of business", "ข้อกำหนดทางธุรกิจ", "เงื่อนไขการให้บริการ"),
    ("Broker disclosure", "经纪人声明", "经纪服务声明"),
]

def i18n(t):
    """Fix the translation file (site/i18n.js)."""
    for key, wrong, right in CORRECTIONS:
        row_start = t.index("['" + key + "'")
        row_end = t.index("],", row_start)
        row = t[row_start:row_end]; assert wrong in row, key
        t = t[:row_start] + row.replace(wrong, right) + t[row_end:]
    t = brand(t)
    rows = "".join("[" + ",".join(json.dumps(c, ensure_ascii=False) for c in r) + "],\n" for r in NEW_ROWS)
    assert t.count("\n];\nconst RX = [\n") == 1
    t = t.replace("\n];\nconst RX = [\n", "\n" + rows + "];\nconst RX = [\n" + NEW_RX)
    return t

# ---- "Who is behind Archē": the founder stays anonymous, and the discretion becomes the selling point (Morten, 20 Oct 2026).
# Every fact below must stay true of the people running Archē. Names, photos and company histories stay off the site;
# credentials are shared privately on request.
BEHIND = {
    "label": "Who is behind Archē",
    "title": "You won't find our names here. That is the point.",
    "lead": "Many of our clients would rather not be seen, so we hold ourselves to the same rule: no names, no faces and no client stories on this website. You meet the people who run Archē when you call, and they stay with your trip until you land.",
    "cards": [
        ("More than thirty years", "In aviation, from the hangar floor to the boardroom."),
        ("Engineers first", "Our leadership began as licensed aircraft engineers, so we read maintenance records and operator approvals the way an auditor does."),
        ("Inside the system", "We have run maintenance organisations approved by European, UK, Middle Eastern and Indian regulators. We know what a well-run operator looks like from the inside."),
        ("Based in the region", "Fifteen years living and working in Southeast Asia, where most of our flying begins."),
    ],
    "close": "Ask us, and we will share our credentials in confidence before you book.",
}
BEHIND_TR = [
    ["Who is behind Archē", "ใครอยู่เบื้องหลัง Archē", "Archē 的幕后团队", "Archē を率いる人々"],
    ["You won't find our names here. That is the point.", "ท่านจะไม่พบชื่อของเราที่นี่ และนั่นคือความตั้งใจ", "您在这里找不到我们的名字。这正是我们的用意。", "ここに私たちの名前はありません。それこそが私たちの姿勢です。"],
    ["Many of our clients would rather not be seen, so we hold ourselves to the same rule: no names, no faces and no client stories on this website. You meet the people who run Archē when you call, and they stay with your trip until you land.",
     "ลูกค้าของเราหลายท่านไม่ต้องการเป็นที่สังเกต เราจึงถือกฎเดียวกันกับตัวเอง ไม่มีชื่อ ไม่มีใบหน้า และไม่มีเรื่องราวของลูกค้าบนเว็บไซต์นี้ ท่านจะได้พบผู้ที่บริหาร Archē เมื่อท่านโทรหาเรา และพวกเขาจะดูแลการเดินทางของท่านจนกว่าจะลงจอด",
     "我们的许多客户不愿引人注目，因此我们对自己也遵守同样的原则：本网站不出现姓名、不出现面孔，也不讲述客户故事。当您致电时，接待您的就是 Archē 的负责人，他们会一路跟进您的行程，直至落地。",
     "私たちのお客様の多くは、人目に触れることを望まれません。ですから私たちも同じルールを守ります。このサイトには名前も顔写真も、お客様のエピソードも載せません。お電話をいただければ Archē を率いる者が直接対応し、着陸までご旅程に寄り添います。"],
    ["More than thirty years", "กว่าสามสิบปี", "三十余年", "三十年以上"],
    ["In aviation, from the hangar floor to the boardroom.", "ในวงการการบิน ตั้งแต่โรงซ่อมเครื่องบินจนถึงห้องประชุมผู้บริหาร", "深耕航空业，从机库一线到董事会。", "航空の世界で、格納庫の現場から経営の場まで。"],
    ["Engineers first", "เริ่มต้นจากวิศวกร", "工程师出身", "原点はエンジニア"],
    ["Our leadership began as licensed aircraft engineers, so we read maintenance records and operator approvals the way an auditor does.",
     "ผู้บริหารของเราเริ่มต้นจากการเป็นวิศวกรอากาศยานที่มีใบอนุญาต เราจึงอ่านประวัติการซ่อมบำรุงและใบอนุญาตของผู้ให้บริการได้อย่างผู้ตรวจสอบ",
     "我们的管理层出身于持照飞机工程师，因此我们像审计员一样审阅维修记录和运营商资质。",
     "経営陣はライセンスを持つ航空整備士として出発しました。だからこそ、整備記録や運航会社の認可を監査人の目で読み解きます。"],
    ["Inside the system", "รู้จากภายใน", "深谙行业内部", "業界を内側から知る"],
    ["We have run maintenance organisations approved by European, UK, Middle Eastern and Indian regulators. We know what a well-run operator looks like from the inside.",
     "เราเคยบริหารองค์กรซ่อมบำรุงที่ได้รับการรับรองจากหน่วยงานกำกับดูแลของยุโรป สหราชอาณาจักร ตะวันออกกลาง และอินเดีย เราจึงรู้ว่าผู้ให้บริการที่บริหารงานดีเป็นอย่างไรจากภายใน",
     "我们曾管理获得欧洲、英国、中东和印度监管机构批准的维修机构，深知一家运营良好的运营商从内部看是什么样子。",
     "欧州、英国、中東、インドの当局から承認を受けた整備組織を運営してきました。優れた運航会社が内側からどう見えるかを知っています。"],
    ["Based in the region", "อยู่ในภูมิภาค", "扎根本地区", "この地域に根ざして"],
    ["Fifteen years living and working in Southeast Asia, where most of our flying begins.", "สิบห้าปีที่ใช้ชีวิตและทำงานในเอเชียตะวันออกเฉียงใต้ ซึ่งเป็นจุดเริ่มต้นของเที่ยวบินส่วนใหญ่ของเรา", "在东南亚生活和工作十五年，我们的大多数航程正是从这里出发。", "東南アジアで十五年暮らし、働いてきました。私たちのフライトの多くはここから始まります。"],
    ["Ask us, and we will share our credentials in confidence before you book.", "หากท่านต้องการ เราพร้อมแจ้งคุณสมบัติของเราเป็นการส่วนตัวก่อนท่านจอง", "如您需要，我们会在您预订前私下提供我们的资历。", "ご希望があれば、ご予約前に私たちの経歴を内々にお伝えします。"],
]
NEW_ROWS += BEHIND_TR

def behind_section():
    b = BEHIND
    cards = "".join(
        '<div style="display:flex;flex-direction:column;gap:14px;border-top:1px solid #a9bdd4;padding-top:24px">'
        f'<span style="font-family:var(--sans,\'Hanken Grotesk\'),system-ui,sans-serif;font-size:22.4px;line-height:1.15;color:#f3f5f8;font-weight:400;letter-spacing:-0.01em">{t}</span>'
        f'<p style="margin:0;font-size:16px;line-height:1.7;color:#c6cbd2">{p}</p></div>' for t, p in b["cards"])
    return ('<section id="behind" data-screen-label="Who is behind Archē" style="max-width:1440px;margin:0 auto;padding:0 40px 140px">'
            '<div style="border-top:1px solid rgba(243,245,248,0.12);border-image:linear-gradient(90deg,rgba(243,245,248,0) 0%,rgba(243,245,248,0.34) 50%,rgba(243,245,248,0) 100%) 1;padding-top:56px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:64px">'
            '<div style="display:flex;flex-direction:column;gap:28px">'
            f'<span style="font-size:12.5px;letter-spacing:0.16em;text-transform:uppercase;color:#a9bdd4">{b["label"]}</span>'
            '<h2 style="margin:0;font-family:var(--serif,\'Prata\'),Georgia,serif;font-weight:400;font-size:clamp(30px,3.2vw,46px);line-height:1.18;background:linear-gradient(176deg,#ffffff 0%,#eef2f6 40%,#b4c0cd 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-wrap:balance;max-width:560px">'
            f'{b["title"]}</h2></div>'
            '<div style="padding-top:44px;font-family:var(--sans,\'Hanken Grotesk\'),system-ui,sans-serif;font-weight:300;letter-spacing:-0.01em;font-size:clamp(19px,1.6vw,23px);line-height:1.55;color:#f3f5f8;text-wrap:pretty">'
            f'<p style="margin:0">{b["lead"]}</p></div></div>'
            f'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:48px;margin-top:80px">{cards}</div>'
            f'<p style="margin:56px 0 0;font-size:16px;line-height:1.7;color:#a9bdd4">{b["close"]}</p>'
            '</section>\n')

_page = page
def page(s):
    s = _page(s)
    anchor = '<section id="fleet"'
    assert s.count(anchor) == 1
    return s.replace(anchor, behind_section() + anchor)
