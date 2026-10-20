// Draft translations (TH / ZH-Hans / JA). Must be reviewed by native translators before launch.
const ROWS = [
['Menu','เมนู','菜单','メニュー'],
['✕ Close','✕ ปิด','✕ 关闭','✕ 閉じる'],
['Services','บริการ','服务','サービス'],
['Aircraft','เครื่องบิน','机型','機材'],
['How it works','ขั้นตอนการให้บริการ','服务流程','ご利用の流れ'],
['Why Arche','ทำไมต้อง Arche','为何选择 Arche','Arche が選ばれる理由'],
['Contact','ติดต่อเรา','联系我们','お問い合わせ'],
['Singapore','สิงคโปร์','新加坡','シンガポール'],
['Bangkok','กรุงเทพฯ','曼谷','バンコク'],
['Email','อีเมล','电子邮件','メール'],
['Request a quote','ขอใบเสนอราคา','获取报价','お見積り依頼'],
['Private jet charter · Singapore · Bangkok','เช่าเหมาลำเครื่องบินส่วนตัว · สิงคโปร์ · กรุงเทพฯ','私人飞机包机 · 新加坡 · 曼谷','プライベートジェット・チャーター · シンガポール · バンコク'],
['Private aviation, handled with','การบินส่วนตัว ที่ดูแลด้วย','私人航空，','プライベート・アビエーションを、'],
['Private aviation,','การบินส่วนตัว','私人航空，','プライベート・アビエーションを、'],
['handled with','ที่ดูแลด้วย','',''],
['care and precision.','ความใส่ใจและความแม่นยำ','以用心与精准相待。','細やかさと正確さで。'],
['For people whose time is not negotiable. We find the right aircraft, check the operator behind it, and stay with you until you land.','สำหรับผู้ที่เวลาไม่อาจต่อรองได้ เราคัดสรรเครื่องบินที่เหมาะสม ตรวจสอบผู้ให้บริการการบินเบื้องหลัง และอยู่เคียงข้างท่านจนกว่าจะลงจอด','为时间不容妥协的您而来。我们为您甄选合适的飞机，审核其背后的运营商，并全程陪伴，直至您安全落地。','時間に妥協を許さない方のために。最適な機材を選び、その運航会社を確かめ、着陸まで責任を持って寄り添います。'],
['One way','เที่ยวเดียว','单程','片道'],
['Return','ไป-กลับ','往返','往復'],
['Multi-leg','หลายเส้นทาง','多段行程','複数区間'],
['Add a departure and destination.','กรุณาระบุต้นทางและปลายทาง','请填写出发地和目的地。','出発地と目的地を入力してください。'],
['From','ต้นทาง','出发地','出発地'],
['To','ปลายทาง','目的地','目的地'],
['Date','วันที่','日期','日付'],
['Time','เวลา','时间','時刻'],
['Passengers','ผู้โดยสาร','乘客人数','搭乗人数'],
["No match in our list. Type it in full and we'll find the nearest suitable airport for you.",'ไม่พบในรายการของเรา กรุณาพิมพ์ชื่อเต็ม แล้วเราจะหาสนามบินที่เหมาะสมใกล้ที่สุดให้ท่าน','列表中暂无匹配项。请输入完整名称，我们将为您寻找最近的合适机场。','該当する候補がありません。正式名称をご入力いただければ、最寄りの適切な空港をお探しします。'],
['Remove leg','ลบเส้นทาง','删除此段','区間を削除'],
['Get quotes','ขอราคา','获取报价','見積りを依頼'],
['+ Add a leg','+ เพิ่มเส้นทาง','+ 添加航段','+ 区間を追加'],
['Edit trip','แก้ไขการเดินทาง','修改行程','行程を編集'],
['Name','ชื่อ','姓名','お名前'],
['Phone or email','โทรศัพท์หรืออีเมล','电话或电子邮件','電話番号またはメール'],
['Reply by','ช่องทางตอบกลับ','回复方式','ご希望の連絡方法'],
['Phone','โทรศัพท์','电话','電話'],
['Send request','ส่งคำขอ','提交需求','送信する'],
['Add your name and a phone number or email.','กรุณาระบุชื่อ และหมายเลขโทรศัพท์หรืออีเมล','请填写您的姓名及电话或电子邮件。','お名前と、電話番号またはメールアドレスをご入力ください。'],
['Thank you,','ขอบคุณ คุณ','感谢您，','ありがとうございます、'],
['.','','。','様。'],
['An advisor will reply by','ที่ปรึกษาของเราจะตอบกลับทาง','顾问将通过','担当アドバイザーより'],
['with aircraft options, usually within the hour. For departures in the next 24 hours, please call.','พร้อมตัวเลือกเครื่องบิน โดยปกติภายในหนึ่งชั่วโมง หากต้องการออกเดินทางภายใน 24 ชั่วโมง กรุณาโทรหาเรา','向您发送机型方案，通常在一小时内。如需在 24 小时内出发，请直接致电。','にて機材のご提案をお送りします。通常1時間以内にご連絡いたします。24時間以内のご出発はお電話ください。'],
['Plan another trip','วางแผนการเดินทางใหม่','规划新的行程','別の行程を計画する'],
['Accreditations held by','การรับรองที่ได้รับโดย','资质认证 ·','取得認証 ·'],
['Pending confirmation','รอการยืนยัน','待确认','確認中'],
['Who we are','เกี่ยวกับเรา','关于我们','私たちについて'],
['Thirty years in this industry taught us what clients deserve.','สามสิบปีในอุตสาหกรรมนี้ สอนให้เรารู้ว่าลูกค้าควรได้รับสิ่งใด','三十年的行业经历，让我们明白客户真正应得的是什么。','この業界での三十年が、お客様が本当に受けるべきものを教えてくれました。'],
['We have spent more than thirty years in private aviation, and we care about it deeply. Over that time we have watched the industry grow comfortable with doing things the way they have always been done. We believe our clients deserve fresh ideas and better options, so we started Arche Executive to offer both.','เราอยู่ในวงการการบินส่วนตัวมากว่าสามสิบปี และผูกพันกับมันอย่างลึกซึ้ง ตลอดเวลาที่ผ่านมา เราเห็นอุตสาหกรรมนี้เคยชินกับการทำสิ่งเดิมๆ แบบที่เคยทำมา เราเชื่อว่าลูกค้าของเราควรได้รับแนวคิดใหม่และทางเลือกที่ดีกว่า เราจึงก่อตั้ง Arche Executive เพื่อมอบทั้งสองสิ่งนี้','我们在私人航空领域深耕三十余年，对这个行业怀有深厚的感情。这些年里，我们看着行业逐渐安于现状、墨守成规。我们相信客户值得拥有新的思路和更好的选择，于是创立了 Arche Executive，致力于二者兼得。','私たちはプライベート・アビエーションに三十年以上携わり、この仕事を心から大切にしてきました。その間、業界が昔ながらのやり方に安住していく姿を見てきました。お客様には新しい発想とより良い選択肢がふさわしい。そう信じて、Arche Executive を立ち上げました。'],
['We own no aircraft. That keeps our advice honest: our only job is to find the right aircraft and the right operator for your trip. We fly business leaders, family offices, private travellers, public figures, corporate groups and government delegations, and we treat every one of them the way we would want our own families treated.','เราไม่มีเครื่องบินเป็นของตนเอง ซึ่งทำให้คำแนะนำของเราตรงไปตรงมา หน้าที่เดียวของเราคือหาเครื่องบินและผู้ให้บริการที่เหมาะสมที่สุดสำหรับการเดินทางของท่าน เราดูแลผู้บริหารธุรกิจ แฟมิลีออฟฟิศ ผู้เดินทางส่วนบุคคล บุคคลสาธารณะ กลุ่มองค์กร และคณะผู้แทนรัฐบาล และปฏิบัติต่อทุกท่านเหมือนที่เราอยากให้ครอบครัวของเราได้รับ','我们不拥有任何飞机，这让我们的建议始终保持客观：我们唯一的职责，是为您的行程找到合适的飞机和合适的运营商。我们服务企业领袖、家族办公室、私人旅客、公众人物、企业团体及政府代表团，并像对待自己的家人一样对待每一位客户。','私たちは機材を一切保有していません。だからこそ助言は公正です。私たちの仕事はただ一つ、お客様の旅に最適な機材と運航会社を見つけることです。経営者、ファミリーオフィス、個人のお客様、著名人、法人グループ、政府代表団まで、どなたにも自分の家族にしてほしいのと同じ姿勢で向き合います。'],
['What we do for you.','สิ่งที่เราทำเพื่อท่าน','我们为您做什么。','私たちがお手伝いできること。'],
['Private Charter','เช่าเหมาลำส่วนตัว','私人包机','プライベート・チャーター'],
['One trip or a full season of travel. We find the aircraft, check the operator and look after every detail until you land.','ไม่ว่าจะเป็นการเดินทางครั้งเดียวหรือตลอดทั้งฤดูกาล เราจัดหาเครื่องบิน ตรวจสอบผู้ให้บริการ และดูแลทุกรายละเอียดจนกว่าท่านจะลงจอด','无论是单次出行还是整季行程，我们都会为您寻找飞机、审核运营商，并照料每一个细节，直至您落地。','一度きりのご旅行から、ひと季節分のご移動まで。機材を探し、運航会社を確認し、着陸までのすべてを整えます。'],
['Aviation Advisory','ที่ปรึกษาด้านการบิน','航空咨询','航空アドバイザリー'],
['Straight answers for flight departments, family offices and principals: what to fly, who to trust and what it should really cost.','คำตอบที่ตรงไปตรงมาสำหรับฝ่ายการบิน แฟมิลีออฟฟิศ และผู้บริหาร ว่าควรใช้เครื่องบินแบบใด ควรไว้วางใจใคร และค่าใช้จ่ายที่แท้จริงควรเป็นเท่าใด','为飞行部门、家族办公室和决策者提供直截了当的答案：该选什么机型、该信任谁、真实成本应是多少。','運航部門、ファミリーオフィス、オーナーの皆様へ率直にお答えします。どの機材を選ぶべきか、誰を信頼すべきか、本来いくらかかるべきか。'],
['Fleet Coordination','บริหารจัดการฝูงบิน','机队协调','フリート・コーディネーション'],
['For owners who want their aircraft to earn its keep, with sensible scheduling, careful charter placement and fewer surprises.','สำหรับเจ้าของที่ต้องการให้เครื่องบินสร้างรายได้คุ้มค่า ด้วยการจัดตารางที่เหมาะสม การนำไปให้เช่าเหมาลำอย่างรอบคอบ และเรื่องไม่คาดคิดที่น้อยลง','为希望飞机物尽其用的机主服务：合理排期、审慎安排包机，减少意外。','機材をしっかり稼働させたいオーナー様へ。無理のない運用計画、慎重なチャーター運用、そして想定外の少ない毎日を。'],
["Many brokers pass along whatever happens to be available that day and hope for the best. We can't work that way. Before we put your name on a booking, we want to know who is flying you, how that aircraft is looked after, and exactly what you are paying for.",'นายหน้าหลายรายส่งต่อสิ่งที่บังเอิญว่างในวันนั้นแล้วหวังว่าทุกอย่างจะดี เราทำงานแบบนั้นไม่ได้ ก่อนที่เราจะใส่ชื่อท่านลงในการจองใด เราต้องรู้ว่าใครเป็นผู้ทำการบิน เครื่องบินลำนั้นได้รับการดูแลอย่างไร และท่านกำลังจ่ายเพื่ออะไรอย่างแท้จริง','很多经纪人只是把当天碰巧能订到的飞机转手给客户，然后听天由命。我们做不到这样。在以您的名义预订之前，我们必须清楚：谁在为您执飞，这架飞机如何维护，以及您究竟为什么付费。','多くのブローカーは、その日たまたま空いている機材をそのまま紹介し、あとは運任せです。私たちにはそれができません。お客様のお名前で予約する前に、誰が操縦するのか、その機材がどう整備されているのか、そして何に対して支払うのかを必ず確かめます。'],
['We check what others take on trust','เราตรวจสอบสิ่งที่ผู้อื่นเพียงแค่เชื่อตาม','别人默认可信的，我们逐一核实','他社が鵜呑みにすることを、私たちは確かめます'],
['Every charter and every piece of advice rests on our own checks, not just what a booking screen shows. We look at how each operator manages safety, how reliably their aircraft leave on time, and whether an aircraft is truly airworthy in practice as well as on paper.','ทุกการเช่าเหมาลำและทุกคำแนะนำ ตั้งอยู่บนการตรวจสอบของเราเอง ไม่ใช่เพียงสิ่งที่หน้าจอการจองแสดง เราพิจารณาว่าผู้ให้บริการแต่ละรายบริหารความปลอดภัยอย่างไร เครื่องบินออกตรงเวลาเพียงใด และเครื่องบินพร้อมบินจริงทั้งในทางปฏิบัติและบนเอกสารหรือไม่','每一次包机、每一条建议，都基于我们自己的核查，而不仅仅是预订系统上显示的信息。我们考察每家运营商如何管理安全、其飞机准点起飞的可靠程度，以及飞机是否不仅在文件上、而且在实际中真正适航。','すべてのチャーターと助言は、予約画面の情報だけでなく、私たち自身の確認に基づいています。各運航会社の安全管理、定時出発の確かさ、そして書類上だけでなく実際に耐空性が保たれているかを確かめます。'],
['We answer only to you','เรารับผิดชอบต่อท่านเพียงผู้เดียว','我们只对您负责','私たちが責任を負うのはお客様だけです'],
["We have no fleet to fill and no one else’s interests to protect. For companies and family offices, that independence also means privacy, flexible terms, and none of your capital tied up in aircraft.",'เราไม่มีฝูงบินที่ต้องหาผู้โดยสารมาเติม และไม่มีผลประโยชน์ของผู้ใดต้องปกป้อง สำหรับองค์กรและแฟมิลีออฟฟิศ ความเป็นอิสระนี้ยังหมายถึงความเป็นส่วนตัว เงื่อนไขที่ยืดหยุ่น และไม่ต้องผูกเงินทุนไว้กับเครื่องบิน','我们没有需要填满的机队，也没有要维护的他方利益。对企业和家族办公室而言，这种独立性还意味着隐私、灵活的条款，以及无需把资金压在飞机上。','埋めるべき自社機材も、守るべき他者の利害もありません。企業やファミリーオフィスにとって、この独立性はプライバシー、柔軟な条件、そして機材に資本を縛られないことを意味します。'],
['What you tell us stays with us','สิ่งที่ท่านบอกเรา จะอยู่กับเราเท่านั้น','您告诉我们的，只留在我们这里','お伺いしたことは、外に出ません'],
["Your name, your plans and who travels with you go only to the people who need them to fly you safely. We don’t talk about our clients. We never will.",'ชื่อ แผนการเดินทาง และผู้ร่วมเดินทางของท่าน จะส่งถึงเฉพาะผู้ที่จำเป็นต้องรู้เพื่อให้ท่านเดินทางได้อย่างปลอดภัย เราไม่พูดถึงลูกค้าของเรา และจะไม่มีวันทำ','您的姓名、行程以及同行人员，只会告知为保障您安全飞行而必须知情的人。我们从不谈论客户，今后也不会。','お名前、ご予定、ご同行の方の情報は、安全な運航に必要な方にだけお伝えします。私たちはお客様のことを口外しません。これからも決して。'],
['We see every trip through','เราดูแลทุกการเดินทางจนจบ','每一段行程，我们全程负责','すべての旅を最後まで見届けます'],
['Senior people with decades in aviation run each trip from the first call to landing. If anything changes, you hear it from us first, along with a clear way forward.','ผู้เชี่ยวชาญที่มีประสบการณ์ด้านการบินหลายสิบปี ดูแลทุกการเดินทางตั้งแต่สายแรกจนถึงการลงจอด หากมีสิ่งใดเปลี่ยนแปลง ท่านจะได้ทราบจากเราเป็นคนแรก พร้อมทางออกที่ชัดเจน','每段行程都由拥有数十年航空经验的资深人员负责，从第一通电话到落地。一旦有任何变化，您会第一时间从我们这里得知，同时获得清晰的应对方案。','航空業界で数十年の経験を持つスタッフが、最初のお電話から着陸まで担当します。変更があれば、明確な対応策とともに、まず私たちからお知らせします。'],
['Suggested aircraft · upon availability','เครื่องบินที่แนะนำ · ขึ้นอยู่กับความพร้อม','推荐机型 · 视可用情况而定','おすすめ機材 · 空き状況によります'],
['Find the aircraft that fits the trip.','ค้นหาเครื่องบินที่เหมาะกับการเดินทาง','找到适合此行的飞机。','旅に合う機材を見つける。'],
["These are suggestions to help you plan, not aircraft we hold. Tell us how many are flying and how far, and we'll suggest a category. Then we check which aircraft are actually free on your dates and vet each operator before anything reaches you.",'นี่คือคำแนะนำเพื่อช่วยวางแผน ไม่ใช่เครื่องบินที่เราถือครอง บอกเราว่ามีผู้โดยสารกี่ท่านและเดินทางไกลเพียงใด เราจะแนะนำประเภทเครื่องบินให้ จากนั้นเราจะตรวจสอบว่าเครื่องใดว่างจริงในวันที่ท่านต้องการ และตรวจสอบผู้ให้บริการทุกรายก่อนนำเสนอ','以下仅为协助规划的建议，并非我们持有的飞机。告诉我们乘机人数和航程，我们会推荐合适的机型类别。随后我们会核实您出行日期内真正可用的飞机，并在向您推荐之前审核每一家运营商。','こちらは計画のための参考であり、当社が保有する機材ではありません。搭乗人数と距離をお知らせいただければ、適したクラスをご提案します。そのうえで、ご希望日に実際に空いている機材を確認し、各運航会社を審査してからご案内します。'],
['Nonstop distance','ระยะทางบินตรง','直飞距离','直行距離'],
['Suggested category · upon availability','ประเภทที่แนะนำ · ขึ้นอยู่กับความพร้อม','推荐类别 · 视可用情况而定','おすすめクラス · 空き状況によります'],
['Suggested','แนะนำ','推荐','おすすめ'],
['Light jet','ไลท์เจ็ท','轻型公务机','ライトジェット'],
['Midsize jet','มิดไซส์เจ็ท','中型公务机','ミッドサイズジェット'],
['Super-midsize','ซูเปอร์มิดไซส์','超中型公务机','スーパーミッドサイズ'],
['Heavy jet','เฮฟวี่เจ็ท','大型公务机','ヘビージェット'],
['Ultra-long-range','พิสัยไกลพิเศษ','超远程公务机','超長距離機'],
['Suggested · upon availability','แนะนำ · ขึ้นอยู่กับความพร้อม','推荐 · 视可用情况而定','おすすめ · 空き状況によります'],
['Range','พิสัยการบิน','航程','航続距離'],
['Cabin','ห้องโดยสาร','客舱','キャビン'],
['Nonstop example','ตัวอย่างเส้นทางบินตรง','直飞示例','直行ルート例'],
['Regional charter supply','ความพร้อมให้เช่าในภูมิภาค','区域包机供应','地域のチャーター供給'],
['Check availability','ตรวจสอบความพร้อม','查询可用情况','空き状況を確認'],
["All aircraft shown are suggestions, offered upon availability. Arche Executive does not own or hold any of these aircraft. Specifications are indicative: range is the manufacturer's figure with a light load, and seating reflects common cabin layouts. Real figures depend on configuration, payload, winds and reserves, and the operator confirms them in your quote. Regional supply notes draw on Asian Sky Group's Asia-Pacific Charter Report 2025 and Business Jet Fleet Report YE 2025, and describe the market in general, not guaranteed availability.",'เครื่องบินทั้งหมดที่แสดงเป็นเพียงคำแนะนำ และขึ้นอยู่กับความพร้อม Arche Executive ไม่ได้เป็นเจ้าของหรือถือครองเครื่องบินเหล่านี้ ข้อมูลจำเพาะเป็นเพียงค่าประมาณ พิสัยการบินเป็นตัวเลขจากผู้ผลิตเมื่อบรรทุกเบา และจำนวนที่นั่งอ้างอิงจากรูปแบบห้องโดยสารทั่วไป ตัวเลขจริงขึ้นอยู่กับการจัดวาง น้ำหนักบรรทุก ลม และน้ำมันสำรอง ซึ่งผู้ให้บริการจะยืนยันในใบเสนอราคา ข้อมูลความพร้อมในภูมิภาคอ้างอิงจาก Asia-Pacific Charter Report 2025 และ Business Jet Fleet Report YE 2025 ของ Asian Sky Group และเป็นภาพรวมตลาด ไม่ใช่การรับประกันความพร้อม','所示飞机均为推荐，视可用情况提供。Arche Executive 不拥有或持有其中任何飞机。规格仅供参考：航程为制造商在轻载条件下的数据，座位数基于常见客舱布局。实际数据取决于客舱配置、载荷、风况及备份油量，并由运营商在报价中确认。区域供应说明参考 Asian Sky Group 的《2025 亚太包机报告》及《2025 年末公务机机队报告》，仅反映整体市场情况，不代表保证可用。','表示している機材はすべて参考であり、空き状況に応じてのご提供となります。Arche Executive はこれらの機材を保有していません。仕様は目安です。航続距離は軽積載時のメーカー公表値、座席数は一般的なキャビン仕様に基づきます。実際の数値は仕様、搭載量、風、予備燃料によって異なり、運航会社がお見積りで確定します。地域の供給状況は Asian Sky Group の「Asia-Pacific Charter Report 2025」および「Business Jet Fleet Report YE 2025」に基づく市場全体の傾向であり、空きを保証するものではありません。'],
['From first message to landing.','ตั้งแต่ข้อความแรกจนถึงการลงจอด','从第一条消息，到安全落地。','最初のご連絡から、着陸まで。'],
['Step','ขั้นตอนที่','第','ステップ'],
['of 5','จาก 5','步，共 5 步','/ 5'],
['Who is responsible','ผู้รับผิดชอบ','责任方','担当'],
['Tell us the trip','แจ้งรายละเอียดการเดินทาง','告诉我们您的行程','ご旅程をお聞かせください'],
['Minutes','ไม่กี่นาที','几分钟','数分'],
['Call, message or use the form. Give us the route, the dates and who is travelling. If something matters to you, such as a pet, a medical need or oversized luggage, tell us at the start and we plan around it.','โทร ส่งข้อความ หรือใช้แบบฟอร์ม แจ้งเส้นทาง วันที่ และผู้เดินทาง หากมีสิ่งสำคัญสำหรับท่าน เช่น สัตว์เลี้ยง ความต้องการทางการแพทย์ หรือสัมภาระขนาดใหญ่ โปรดแจ้งตั้งแต่ต้น แล้วเราจะวางแผนให้สอดคล้อง','致电、发消息或填写表单均可。告诉我们航线、日期和出行人员。如有特别在意的事项，例如宠物、医疗需求或超大行李，请一开始就告诉我们，我们会据此安排。','お電話、メッセージ、またはフォームでどうぞ。ルート、日程、ご搭乗の方をお知らせください。ペット、医療上のご要望、大きなお荷物など大切なことがあれば、最初にお伝えください。それに合わせて計画します。'],
['You and your Arche advisor','ท่านและที่ปรึกษา Arche ของท่าน','您与您的 Arche 顾问','お客様と Arche のアドバイザー'],
['We source and vet','เราจัดหาและตรวจสอบ','我们寻源并审核','機材の手配と審査'],
['Within the hour','ภายในหนึ่งชั่วโมง','一小时内','1時間以内'],
['We go to the whole market, not to a preferred fleet. Each option is checked for operator certification, aircraft age and maintenance history, crew experience and safety audits before we show it to you. Every quote names the operator.','เราค้นหาจากทั้งตลาด ไม่ใช่จากฝูงบินที่เราเลือกไว้ ทุกตัวเลือกผ่านการตรวจสอบใบรับรองผู้ให้บริการ อายุและประวัติการซ่อมบำรุงของเครื่องบิน ประสบการณ์ของลูกเรือ และผลการตรวจสอบความปลอดภัย ก่อนนำเสนอท่าน ทุกใบเสนอราคาระบุชื่อผู้ให้บริการ','我们面向整个市场寻源，而不是只看某个合作机队。每个方案在呈现给您之前，都会核查运营商资质、机龄与维修记录、机组经验以及安全审计。每份报价都会写明运营商。','特定の機材に偏らず、市場全体から探します。ご案内の前に、運航会社の認証、機齢と整備履歴、乗員の経験、安全監査をすべて確認します。お見積りには必ず運航会社名を明記します。'],
['Arche Executive, on your behalf','Arche Executive ในนามของท่าน','Arche Executive，代表您','Arche Executive がお客様に代わって'],
['You confirm','ท่านยืนยัน','您确认','ご確定'],
['Same day','ภายในวันเดียวกัน','当天','当日'],
['You get one all-in price and one invoice from us. The charter agreement names the operating carrier, and the payment terms and cancellation conditions are written out before you commit.','ท่านได้รับราคาเดียวที่รวมทุกอย่างและใบแจ้งหนี้เพียงใบเดียวจากเรา สัญญาเช่าเหมาลำระบุชื่อผู้ให้บริการที่ทำการบิน พร้อมเงื่อนไขการชำระเงินและการยกเลิกที่เขียนไว้ชัดเจนก่อนท่านตัดสินใจ','您将获得一个全包价格，并只收到我们开具的一张发票。包机合同写明实际承运的运营商，付款条款和取消条件在您确认之前均以书面列明。','一括料金と、当社からの請求書一通のみ。チャーター契約には運航会社名が明記され、お支払い条件とキャンセル規定はご確定前に書面でお示しします。'],
['You, with the named operator','ท่าน กับผู้ให้บริการที่ระบุชื่อ','您与指定运营商','お客様と、明記された運航会社'],
['We handle the details','เราดูแลทุกรายละเอียด','细节由我们打理','細部はお任せください'],
['Before departure','ก่อนออกเดินทาง','出发之前','ご出発前'],
['Catering, cars, FBO access, passports and manifests. If the weather, slots or routing change, we tell you straight away and give you the options.','อาหาร รถรับส่ง การใช้บริการ FBO หนังสือเดินทาง และรายชื่อผู้โดยสาร หากสภาพอากาศ ช่วงเวลาขึ้นลง หรือเส้นทางเปลี่ยนแปลง เราจะแจ้งท่านทันทีพร้อมทางเลือก','机上餐食、用车、FBO 通行、护照与乘客名单。如天气、时刻或航路有变，我们会第一时间告知您并提供可选方案。','機内食、送迎車、FBO の手配、パスポートと搭乗者名簿。天候、発着枠、ルートに変更があれば、すぐにお知らせし、選択肢をご提示します。'],
['Arche Executive and the operator','Arche Executive และผู้ให้บริการ','Arche Executive 与运营商','Arche Executive と運航会社'],
['You fly','ท่านออกเดินทาง','您启程','ご搭乗'],
['Day of travel','วันเดินทาง','出行当日','ご搭乗日'],
['The operator flies the aircraft and keeps operational control. We stay reachable the whole way and check in after you land.','ผู้ให้บริการเป็นผู้ทำการบินและมีอำนาจควบคุมการปฏิบัติการ เราพร้อมติดต่อได้ตลอดเส้นทาง และสอบถามท่านอีกครั้งหลังลงจอด','由运营商执飞并保有运行控制权。我们全程保持联络，并在您落地后回访。','運航会社が機材を運航し、運航管理の責任を負います。私たちは道中ずっと連絡が取れる状態でおり、ご到着後にもご連絡します。'],
['The operator flies; Arche stays on call','ผู้ให้บริการทำการบิน Arche พร้อมดูแลตลอด','运营商执飞，Arche 随时待命','運航は運航会社、Arche は常に待機'],
['Reach an advisor, any hour.','ติดต่อที่ปรึกษาได้ทุกเวลา','随时联系顾问。','いつでもアドバイザーへ。'],
['We speak English, Thai, Mandarin and Japanese. Use whichever channel suits you.','เราสื่อสารได้ทั้งภาษาอังกฤษ ไทย จีนกลาง และญี่ปุ่น เลือกช่องทางที่สะดวกสำหรับท่าน','我们可使用英语、泰语、普通话和日语沟通。请选择您方便的方式。','英語、タイ語、中国語、日本語で対応いたします。ご都合のよい方法でどうぞ。'],
['24/7 charter desk','ฝ่ายเช่าเหมาลำ 24 ชั่วโมง','24 小时包机服务台','24時間チャーターデスク'],
['For departures in the next 24 hours.','สำหรับการออกเดินทางภายใน 24 ชั่วโมง','适用于 24 小时内出发。','24時間以内のご出発に。'],
['Message an advisor','ส่งข้อความถึงที่ปรึกษา','给顾问发消息','アドバイザーにメッセージ'],
['Send a route and date; we reply with options.','ส่งเส้นทางและวันที่ เราจะตอบกลับพร้อมตัวเลือก','发送航线和日期，我们回复可选方案。','ルートと日程を送っていただければ、選択肢をお返しします。'],
['LINE · Thailand','LINE · ประเทศไทย','LINE · 泰国','LINE · タイ'],
['Thai and English.','ภาษาไทยและภาษาอังกฤษ','泰语和英语。','タイ語・英語。'],
['Itineraries, groups and corporate accounts.','แผนการเดินทาง กลุ่มผู้เดินทาง และบัญชีองค์กร','行程安排、团体出行及企业账户。','旅程、団体、法人アカウント。'],
['Request a callback','ขอให้โทรกลับ','预约回电','折り返しのお電話'],
['Call me','โทรหาฉัน','请致电我','電話をください'],
['An advisor calls back within 15 minutes.','ที่ปรึกษาจะโทรกลับภายใน 15 นาที','顾问将在 15 分钟内回电。','15分以内にアドバイザーからお電話します。'],
["We'll call",'เราจะโทรหาท่านที่หมายเลข','我们将很快致电','まもなく'],
['shortly.','ในไม่ช้า','。','へお電話いたします。'],
['Mandarin and English.','ภาษาจีนกลางและภาษาอังกฤษ','普通话和英语。','中国語・英語。'],
['Terms of business','ข้อกำหนดทางธุรกิจ','业务条款','取引条件'],
['Privacy','ความเป็นส่วนตัว','隐私政策','プライバシー'],
['Broker disclosure','การเปิดเผยข้อมูลนายหน้า','经纪人声明','ブローカーに関する開示'],
['Arche Executive acts solely as agent for its clients and does not own or operate any aircraft. All flights are operated by third-party air operators holding the appropriate Air Operator Certificate, who retain full operational control of each flight. The operator for your flight is named in your quotation and charter agreement before you confirm.','Arche Executive ทำหน้าที่เป็นตัวแทนของลูกค้าเท่านั้น และไม่ได้เป็นเจ้าของหรือดำเนินการเครื่องบินใดๆ เที่ยวบินทั้งหมดดำเนินการโดยผู้ให้บริการการบินบุคคลที่สามซึ่งถือใบรับรองผู้ดำเนินการเดินอากาศ (AOC) ที่เหมาะสม และมีอำนาจควบคุมการปฏิบัติการของแต่ละเที่ยวบินอย่างเต็มที่ ผู้ให้บริการสำหรับเที่ยวบินของท่านจะระบุชื่อในใบเสนอราคาและสัญญาเช่าเหมาลำก่อนท่านยืนยัน','Arche Executive 仅作为客户的代理人，不拥有也不运营任何飞机。所有航班均由持有相应航空运营人合格证（AOC）的第三方运营商执飞，并由其对每个航班保有完全的运行控制权。您航班的运营商将在您确认之前，于报价单和包机合同中列明。','Arche Executive はお客様の代理人としてのみ行動し、航空機を保有・運航することはありません。すべてのフライトは、適切な航空運送事業許可（AOC）を持つ第三者の運航会社が運航し、各フライトの運航管理の全責任を負います。ご利用便の運航会社は、ご確定前にお見積書とチャーター契約書に明記されます。'],
['Jurisdictional notices','ประกาศตามเขตอำนาจศาล','司法辖区声明','法域別の告知'],
['Singapore · Bangkok','สิงคโปร์ · กรุงเทพฯ','新加坡 · 曼谷','シンガポール · バンコク'],
['City, airport or code','เมือง สนามบิน หรือรหัส','城市、机场或代码','都市・空港・コード'],
['Your number','หมายเลขของท่าน','您的电话号码','お電話番号'],
['1.45 m high','สูง 1.45 ม.','高 1.45 米','高さ 1.45 m'],
['1.50 m high','สูง 1.50 ม.','高 1.50 米','高さ 1.50 m'],
['Flat floor, 1.55 m high','พื้นเรียบ สูง 1.55 ม.','平地板，高 1.55 米','フラットフロア、高さ 1.55 m'],
['Stand-up, 1.73 m','ยืนได้ 1.73 ม.','可站立，1.73 米','立って歩ける高さ 1.73 m'],
['Stand-up, flat floor','ยืนได้ พื้นเรียบ','可站立，平地板','立って歩ける、フラットフロア'],
['Wide cabin, stand-up','ห้องโดยสารกว้าง ยืนได้','宽敞客舱，可站立','ワイドキャビン、立って歩ける'],
['Three zones, stand-up','สามโซน ยืนได้','三个区域，可站立','3ゾーン、立って歩ける'],
['Four zones, low cabin altitude','สี่โซน ความดันห้องโดยสารต่ำ','四个区域，低座舱高度','4ゾーン、低いキャビン高度'],
['Four living spaces, private suite','สี่พื้นที่ใช้สอย พร้อมห้องส่วนตัว','四个起居空间，私人套房','4つの居住空間、プライベートスイート'],
['Singapore – Bangkok','สิงคโปร์ – กรุงเทพฯ','新加坡 – 曼谷','シンガポール – バンコク'],
['Bangkok – Hong Kong','กรุงเทพฯ – ฮ่องกง','曼谷 – 香港','バンコク – 香港'],
['Singapore – Bali','สิงคโปร์ – บาหลี','新加坡 – 巴厘岛','シンガポール – バリ'],
['Bangkok – Phuket – Singapore','กรุงเทพฯ – ภูเก็ต – สิงคโปร์','曼谷 – 普吉 – 新加坡','バンコク – プーケット – シンガポール'],
['Singapore – Tokyo','สิงคโปร์ – โตเกียว','新加坡 – 东京','シンガポール – 東京'],
['Singapore – Sydney (in good conditions)','สิงคโปร์ – ซิดนีย์ (ในสภาพอากาศดี)','新加坡 – 悉尼（条件良好时）','シンガポール – シドニー（好条件時）'],
['Singapore – London','สิงคโปร์ – ลอนดอน','新加坡 – 伦敦','シンガポール – ロンドン'],
['Bangkok – Geneva','กรุงเทพฯ – เจนีวา','曼谷 – 日内瓦','バンコク – ジュネーブ'],
['Hong Kong – New York (ER)','ฮ่องกง – นิวยอร์ก (ER)','香港 – 纽约（ER）','香港 – ニューヨーク（ER）'],
['Hong Kong – New York','ฮ่องกง – นิวยอร์ก','香港 – 纽约','香港 – ニューヨーク'],
['Limited in Southeast Asia, often flown in from elsewhere','มีจำกัดในเอเชียตะวันออกเฉียงใต้ มักต้องบินมาจากที่อื่น','东南亚供应有限，常需从其他地区调机','東南アジアでは少なく、他地域から回航することが多い'],
['Available in region, limited','มีในภูมิภาค แต่จำนวนจำกัด','区域内可提供，数量有限','地域内で手配可能、ただし限定的'],
['Limited: most in the region are privately owned','มีจำกัด: ส่วนใหญ่ในภูมิภาคเป็นของเอกชน','有限：区域内多为私人自用','限定的：地域内の多くは個人所有'],
['Regularly available in Asia-Pacific','มีให้บริการสม่ำเสมอในเอเชียแปซิฟิก','亚太地区供应稳定','アジア太平洋で安定して手配可能'],
['An economical choice for small groups on short regional flights. Few are based in Southeast Asia, so one may need to fly in from elsewhere.','ตัวเลือกที่คุ้มค่าสำหรับกลุ่มเล็กบนเที่ยวบินระยะสั้นในภูมิภาค มีประจำการในเอเชียตะวันออกเฉียงใต้ไม่มาก จึงอาจต้องบินมาจากที่อื่น','适合小团体区域短途飞行的经济之选。东南亚常驻数量少，可能需从其他地区调机。','少人数での近距離移動に適した経済的な選択です。東南アジアを拠点とする機体は少なく、他地域から回航する場合があります。'],
['The best-selling light jet worldwide: quick, quiet and roomy for its size. Charter supply in Southeast Asia is thin.','ไลท์เจ็ทที่ขายดีที่สุดในโลก รวดเร็ว เงียบ และกว้างขวางเมื่อเทียบกับขนาด ความพร้อมให้เช่าในเอเชียตะวันออกเฉียงใต้มีน้อย','全球最畅销的轻型公务机：速度快、噪音低，同级中空间宽敞。东南亚包机供应较少。','世界で最も売れているライトジェット。速く、静かで、クラス以上の広さ。東南アジアでのチャーター供給は少なめです。'],
['Certified for short and unpaved runways, which opens up smaller island and resort airfields. Most regional charter PC-24s are based in India and Australia.','ได้รับการรับรองให้ใช้รันเวย์สั้นและไม่ลาดยาง จึงเข้าถึงสนามบินบนเกาะและรีสอร์ตขนาดเล็กได้ PC-24 ที่ให้เช่าในภูมิภาคส่วนใหญ่ประจำการในอินเดียและออสเตรเลีย','获准使用短跑道和非铺装跑道，可抵达较小的海岛和度假地机场。区域内可包租的 PC-24 大多驻于印度和澳大利亚。','短い滑走路や未舗装滑走路での運用が認められており、小さな島やリゾートの飛行場にも降りられます。地域のチャーター用 PC-24 の多くはインドとオーストラリアが拠点です。'],
['A stand-up cabin on a proven airframe, and the most widely offered midsize charter jet in Asia-Pacific. Most are based in India and Australia.','ห้องโดยสารที่ยืนได้บนลำตัวเครื่องที่พิสูจน์แล้ว และเป็นมิดไซส์เจ็ทที่มีให้เช่ามากที่สุดในเอเชียแปซิฟิก ส่วนใหญ่ประจำการในอินเดียและออสเตรเลีย','成熟机体，客舱可站立，是亚太地区供应最广的中型包机。大多驻于印度和澳大利亚。','実績ある機体に立って歩けるキャビン。アジア太平洋で最も多く提供されているミッドサイズのチャーター機で、多くはインドとオーストラリアが拠点です。'],
['A wide, quiet cabin with enough range for long regional flights without a fuel stop.','ห้องโดยสารกว้างและเงียบ พร้อมพิสัยการบินเพียงพอสำหรับเที่ยวบินระยะไกลในภูมิภาคโดยไม่ต้องแวะเติมน้ำมัน','客舱宽敞安静，航程足以完成区域长途飞行而无需经停加油。','広く静かなキャビンと、給油なしで地域内の長距離を飛べる航続距離。'],
['A generous cabin for groups who want room to work, dine and rest on longer flights.','ห้องโดยสารกว้างขวาง สำหรับกลุ่มที่ต้องการพื้นที่ทำงาน รับประทานอาหาร และพักผ่อนบนเที่ยวบินที่ยาวขึ้น','客舱宽裕，适合希望在较长航程中办公、用餐和休息的团体。','長めのフライトで、仕事、食事、休息の場を求めるグループにゆとりあるキャビンを。'],
['Three engines, long range and the ability to use demanding airports that larger jets cannot.','สามเครื่องยนต์ พิสัยไกล และสามารถใช้สนามบินที่มีข้อจำกัดซึ่งเครื่องบินขนาดใหญ่กว่าใช้ไม่ได้','三发布局、航程远，并能起降更大机型无法使用的高难度机场。','3発エンジン、長い航続距離、そして大型機では使えない難しい空港にも対応できる能力。'],
['One of the two most chartered long-range jets in Asia-Pacific, with a strong reliability record and a cabin suited to family and delegation travel.','หนึ่งในสองเครื่องบินพิสัยไกลที่ถูกเช่ามากที่สุดในเอเชียแปซิฟิก มีประวัติความน่าเชื่อถือสูง และห้องโดยสารเหมาะกับการเดินทางของครอบครัวและคณะผู้แทน','亚太地区包租最多的两款远程公务机之一，可靠性记录出色，客舱适合家庭及代表团出行。','アジア太平洋で最も多くチャーターされている長距離機の一つ。高い信頼性の実績と、ご家族や代表団の移動に適したキャビン。'],
['The most chartered long-range jet in Asia-Pacific. Fast and very quiet. Range shown is the ER; the standard G650 flies about 12,960 km.','เครื่องบินพิสัยไกลที่ถูกเช่ามากที่สุดในเอเชียแปซิฟิก รวดเร็วและเงียบมาก พิสัยที่แสดงเป็นรุ่น ER ส่วน G650 รุ่นมาตรฐานบินได้ประมาณ 12,960 กม.','亚太地区包租最多的远程公务机，速度快且极为安静。所示航程为 ER 型，标准型 G650 约为 12,960 公里。','アジア太平洋で最も多くチャーターされている長距離機。速く、非常に静かです。表示は ER の航続距離で、標準の G650 は約 12,960 km です。'],
['One of the longest-range business jets flying, with a private bedroom suite and a full crew rest area. Charter availability in the region is limited.','หนึ่งในเครื่องบินธุรกิจที่มีพิสัยไกลที่สุด พร้อมห้องนอนส่วนตัวและพื้นที่พักลูกเรือเต็มรูปแบบ ความพร้อมให้เช่าในภูมิภาคมีจำกัด','现役航程最远的公务机之一，配备私人卧室套房和完整的机组休息区。区域内包机供应有限。','現役で最も航続距離の長いビジネスジェットの一つ。専用ベッドルームスイートと乗員休憩室を備えます。地域でのチャーター供給は限られています。'],
];
const RX = [
  [/^Leg (\d+) · From$/, { th: 'ขาที่ $1 · ต้นทาง', zh: '第 $1 程 · 出发地', ja: '区間 $1 · 出発地' }],
  [/^(\d+) aircraft$/, { th: '$1 ลำ', zh: '$1 款机型', ja: '$1 機種' }],
  [/^(\S+) typical · max (\d+)$/, { th: 'ปกติ $1 · สูงสุด $2', zh: '常规 $1 · 最多 $2', ja: '通常 $1 名 · 最大 $2 名' }],
  [/^(.*→.*) · (\d+) passengers?$/, { th: (m, a, n) => `${a.replace(', return ', ', ขากลับ ')} · ผู้โดยสาร ${n} ท่าน`, zh: (m, a, n) => `${a.replace(', return ', '，返程 ')} · ${n} 位乘客`, ja: (m, a, n) => `${a.replace(', return ', '、復路 ')} · ${n} 名` }],
];
const norm = s => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const D = new Map(ROWS.map(([en, th, zh, ja]) => [norm(en), { th, zh, ja }]));
let lang = 'en', busy = false, obs = null, queued = false;
const origT = new WeakMap(), wrT = new WeakMap(), origP = new WeakMap(), wrP = new WeakMap();
function tr(s) {
  const k = norm(s); if (!k) return null;
  const d = D.get(k); if (d) return d[lang];
  for (const [re, m] of RX) if (re.test(k)) return typeof m[lang] === 'function' ? k.replace(re, m[lang]) : k.replace(re, m[lang]);
  return null;
}
function out(o) {
  if (lang === 'en') return o;
  const t = tr(o); if (t == null) return o;
  return o.match(/^\s*/)[0] + t + o.match(/\s*$/)[0];
}
function pass() {
  busy = true;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode?.nodeName) ? 2 : 1 });
  for (let n; (n = w.nextNode());) {
    if (!origT.has(n) || n.data !== wrT.get(n)) origT.set(n, n.data);
    const v = out(origT.get(n)); wrT.set(n, v); if (n.data !== v) n.data = v;
  }
  document.querySelectorAll('input[placeholder]').forEach(el => {
    const cur = el.getAttribute('placeholder');
    if (!origP.has(el) || cur !== wrP.get(el)) origP.set(el, cur);
    const v = out(origP.get(el)); wrP.set(el, v); if (cur !== v) el.setAttribute('placeholder', v);
  });
  obs && obs.takeRecords();
  busy = false;
}
export function apply(l) {
  lang = l || 'en';
  document.documentElement.lang = { en: 'en', th: 'th', zh: 'zh-Hans', ja: 'ja' }[lang];
  if (!obs) {
    obs = new MutationObserver(() => { if (busy || queued) return; queued = true; requestAnimationFrame(() => { queued = false; pass(); }); });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
  }
  pass();
}
