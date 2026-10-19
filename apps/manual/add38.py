# Manual v3.8 additions. apply(s, brand) works on body3.js (brand='Arche') and manual37.js (brand='Archē').
import re
def J(x): return '`'+x.replace('`',"'")+'`'
def arr(lst): return '['+','.join(J(x) for x in lst)+']'
def rows(rs): return '[\n'+',\n'.join(' ['+','.join(J(c) for c in r)+']' for r in rs)+',\n]'

STAGES_OLD = [
 ("['4. Shadowing','Follow a senior broker on live trips from enquiry to closed file; visit one FBO or handler and one operator','8 complete trips shadowed; both visits done'],",
  "['4. Shadowing','Follow a senior broker on live trips from enquiry to closed file, including the follow-up after the flight; visit one FBO or handler and one operator; two live negotiation lab sessions with a senior broker (Module 14.4); practise with the AI practice partner (Module 14.5)','8 complete trips shadowed; both visits done; two lab sessions recorded'],"),
 ("['5. Practical exam','Run a mock trip from enquiry to signed confirmation, with a role-played client and operator','No critical error; no more than 3 minor errors'],",
  "['5. Practical exam','Run a mock trip from enquiry to signed confirmation, with a role-played client and operator, and a scored live negotiation lab with the director (Module 14.4)','No critical error; no more than 3 minor errors; lab score 70 or more with no rule broken'],"),
 ("['6. Supervised','Run your own bookings; the director or a senior broker checks every quote and contract before it is sent','10 bookings with no critical error'],",
  "['6. Supervised','Run your own bookings; the director or a senior broker checks every quote and contract before it is sent; a post-trip debrief after every booking (Module 14.6)','10 bookings with no critical error; 10 debriefs signed by trainee, mentor and operations'],"),
]

AFTER_OLD = "push(BL(['Collect the operator\\'s final invoice and receipts for items charged at cost.','Recharge the client within 7 days of the flight, with copies, through Paynode.','Ask for feedback; record it in the CRM.','Close the file once all payments are settled.']));"
def after_new(B):
    return ("push(P("+J(f"A trip is not finished when the aircraft takes off. The broker who sold it follows it to the last landing and then follows up with the client. A file is closed only when every step below is done.")+"));\n"
    "push(H3('Follow the trip to the last leg'));\n"
    "push(BL("+arr([
     "Watch every leg in the portal under Flight following: departed, landed, delayed, diverted or cancelled, with the local time. The operator or its trip support gives the times; the 24/7 desk covers the hours you are off duty.",
     "Tell the client at once about any delay, diversion or change, with what happens next (Module 11.3).",
     "The trip counts as flown only when the last leg has landed and the passengers have left the aircraft. Operations then records the flight."])+"));\n"
    "push(H3('Follow up with the client'));\n"
    "push(BL("+arr([
     "Within 24 hours of the last landing, the broker calls or messages the client or the assistant personally: was everything as promised, and is anything still open. Log it in the portal (Aftercare).",
     "At the same time, send the client the rating request from the portal (template B.10). It asks for a score from 1 to 5 for the trip overall, the aircraft, the crew and the broker, and for any comment. The client answers with one click from the email; nothing is required.",
     "Record the answer in the portal when it arrives. A score of 3 or less, or any complaint, starts service recovery: the broker calls the client within 1 working day, the director is told the same day, and anything about the operator is recorded for the operator scorecard.",
     "Ratings feed the broker's service score and the operator scorecard in Control, so we book the operators our clients rate highest. Never publish a client's rating or words without the client's written consent, and never write, offer a reward for or edit a review."])+"));\n"
    "push(H3('Settle and close'));\n"
    "push(BL("+arr([
     "Collect the operator's final invoice and receipts for items charged at cost.",
     "Recharge the client within 7 days of the flight, with copies, through Paynode.",
     "Close the file only when all payments are settled, the follow-up is logged and the rating request has been sent."])+"));")

Q11_ADD = (" ['When may you close a trip file?',['When the aircraft takes off','When the client has paid','When all payments are settled, the follow-up is logged and the rating request has been sent','After 30 days'],'c'],\n"
 " ['A client rates the trip 2 out of 5. What happens?',['Nothing, it is optional','Service recovery: the broker calls within 1 working day and the director is told the same day','The rating is deleted','The client is offered a discount on the next trip at once'],'b'],\n"
 " ['How soon after the last landing does the broker follow up personally?',['Within 24 hours','Within 7 days','Only if the client complains','Never; the operator does it'],'a'],\n")

def m14(B):
    lab_rows=[
     ["AOG: the booked aircraft is unserviceable 6 hours before departure","Calm, facts first; the operator's written replacement options; extra cost approved by the director, never promised on the call (Module 11.3)"],
     ["The assistant refuses the 25% deposit and wants to pay after the flight","Explain the booking terms (Module 10.6) and why the operator must be secured; offer Paynode card or bank options; no exceptions without the director"],
     ["The principal insists on a domestic leg on a foreign-registered aircraft","Explain cabotage in plain words; offer a local operator for that leg or a new routing; never sell it (Module 2.4)"],
     ["\"Another broker quoted 15% less\"","Compare like for like (aircraft, year, operator, rating, inclusions); offer two or three options; margin below 7% only with director approval (Module 12.6)"],
     ["A passenger is added on the day","Names to the operator at once; permits, insurance and seats confirmed in writing before you agree"],
     ["The client wants to bring a dog to a strict-entry country","Destination rules and the operator's written acceptance first; offer a route and airport that work (Appendix G.4)"],
     ["De-icing delays departure and the client is angry about the charge","Safety is the crew's decision; the charge is at cost with the receipt, as the confirmation says (Module 9.2)"],
     ["The client asks to pay into a personal account or sends new bank details by chat","Stop: Paynode only; treat as fraud until proven otherwise (Module 3.5)"],
     ["The client asks to leave a passenger's name off the manifest","Refuse politely; tell the director (Module 2.4)"],
     ["Screening shows a possible sanctions match on the payer","Pause without accusing; say you need a short internal check; tell the director (Module 3.2)"],
     ["The client demands a guaranteed departure time in winter","Promise only what the operator confirms in writing; explain de-icing and slots (Module 6.4)"],
     ["Complaint after the flight about catering and a late car","Listen, apologise for the experience, agree what happens and by when, record it; service recovery steps in Module 11.5"],
    ]
    sheet=[["Calm and courteous under pressure","20",""],["Correct rule, explained in plain words","30","Yes: a wrong rule fails the lab"],["Options offered instead of a flat no","20",""],["No promise the operator has not confirmed in writing","pass / fail","Yes: any such promise fails the lab"],["Escalates when the rules say so","15",""],["Written follow-up within 1 hour","15",""]]
    s=""
    s+="push(H2('14.4 Live negotiation and objection lab'));\n"
    s+="push(P("+J("Knowing the rules is not enough: UHNW clients and their assistants test a broker's calm and judgement under pressure. The lab practises this out loud. A senior broker or the director plays the client, the assistant or the operator; the trainee does not see the script. Each session takes about 30 minutes and covers two or three scenarios.")+"));\n"
    s+="push(BL("+arr(["Stage 4 (shadowing): two practice sessions, recorded on the scoring sheet but not graded.","Stage 5 (practical exam): one scored session with the director. Pass: 70 or more out of 100, and neither critical point broken.","Annual refresher: one session for every certified broker."])+"));\n"
    s+="push(H3('Scenario bank'));\n"
    s+="push(T([['Scenario',4300],['What a good answer does',5340]],"+rows(lab_rows)+",{size:16}));\n"
    s+="push(sp());\n"
    s+="push(H3('Scoring sheet'));\n"
    s+="push(T([['Criterion',5000],['Points',1700],['Critical',2940]],"+rows(sheet)+"));\n"
    s+="push(sp());\n"
    s+="push(note("+J("Template B.11 is the printable scoring sheet. The director may add new scenarios at any time; they go into the bank and into the AI practice partner.")+"));\n"
    s+="push(H2('14.5 AI practice partner in the portal'));\n"
    s+="push(P("+J("Under Training, Roleplay lab, the portal's AI plays any client, assistant, family-office manager or operator, at an easy, normal or hard level, for any scenario in the bank or one you describe yourself. You speak (where the browser supports it) or type. When you end the session, the AI scores it against the same sheet, quotes the moments that cost points and shows a model answer.")+"));\n"
    s+="push(BL("+arr(["Use it as often as you like before stages 4 and 5; at least five sessions are recommended before the practical exam.","It is a practice partner, not an examiner: the AI can misjudge. Certification is decided only by the director's scored lab, the practical exam and the supervised bookings.","Sessions are saved to your training record; the director sees the number of sessions and the average score.","Never enter real client names or details: invent them, as in all training."])+"));\n"
    s+="push(H2('14.6 Post-trip debrief'));\n"
    s+="push(P("+J("Every supervised booking (stage 6) ends with a short debrief between the trainee, the mentor and operations, within 3 working days of the last landing. It is recorded in the portal (template B.9). A supervised booking counts towards sign-off only when all three have completed their part.")+"));\n"
    s+="push(T([['Measure',3400],['Scored 1 to 5 on',6240]],"+rows([
       ["Pre-issue checks","How completely and how quickly the pre-issue checklist (Appendix A.1) was done, with evidence on file"],
       ["Extras and changes","How clearly operational extras (de-icing, FBO and handling fees, parking) and any changes were explained to the client before and after the flight"],
       ["Client satisfaction","The client's rating and comments from the follow-up (Module 11.5)"]])+"));\n"
    s+="push(sp());\n"
    s+="push(BL("+arr(["Errors: list any critical or minor error found (critical errors are defined in How to use this manual).","What went well, what to do differently, and one action with an owner and a date.","The mentor and operations sign; the trainee confirms they have read the result."])+"));\n"
    return s

ESS_OLD_START = "push(P('The Air Charter Association\\'s Air Charter Essentials Certificate is a one-day"
def ess_new(B):
    return ("push(P("+J("The Air Charter Association's Air Charter Essentials Certificate is a one-day introduction for new staff with limited or no aviation background: air charter roles, the commercial process, aviation geography, flight routing, time zones, airport operations and aircraft knowledge, with an assessment and a certificate for those who pass. It is open to non-members. As at October 2026 it runs in person at London Gatwick (next date 3 February 2027) and an online version is announced for January 2027. Published fees: USD 680 (GBP 495) for non-members; USD 405 (GBP 295) for staff of member companies and for people aged 18 to 25.")+"));\n"
    "push(H3('"+B+" sponsorship (proposed)'));\n"
    "push(BL("+arr([
      "Who: brokers and consultants who have passed the written exam (stage 2) and completed 3 supervised bookings, or earlier for a trainee the director nominates.",
      "What: "+B+" pays the course fee directly to the ACA. Book the online course when it opens (January 2027); the in-person course only when a trainee is in the UK anyway.",
      "Repayment: if the broker's agreement ends within 12 months of the course, the broker repays 100% within 6 months and 50% between 6 and 12 months. This must be written into the broker agreement first; confirm the wording with counsel.",
      "Record: the certificate goes into the training record. It is an external credential only: "+B+"'s own rules, pricing and procedures stay in this manual and are not shared with outside courses.",
      "Next step: when "+B+" joins the ACA, high-potential brokers can add the Broker Qualification Level 1, and member rates apply to Essentials."])+"));\n"
    "push(LK2('ACA: Air Charter Essentials Certificate','https://www.theaircharterassociation.aero/the-air-charter-essentials-certificate/','Dates, fees and booking'));")

A4 = ("push(H2('A.4 After-flight checklist'));\n"
 "push(BL("+arr(["Every leg followed to landing in the portal; changes told to the client at once","Follow-up call or message within 24 hours of the last landing, logged","Rating request sent (B.10); answer recorded when it arrives","Score of 3 or less or a complaint: service recovery started, director told","Operator invoice and receipts collected; items at cost recharged within 7 days through Paynode","Supervised booking: debrief (B.9) completed by trainee, mentor and operations","All payments settled; file closed"])+".map(t=>'☐  '+t)));")

def B_new(B):
    s=("push(H2('B.9 Post-trip debrief form'));\n"
    "push(box('Debrief (supervised bookings)',"+arr(["Trip reference: [ref]   Last landing: [date]   Trainee: [name]   Mentor: [name]   Operations: [name]",
      "1. Pre-issue checks (A.1): score 1–5 [ ]  Evidence on file: yes / no  Comment: [ ]",
      "2. Extras and changes explained to the client: score 1–5 [ ]  Comment: [ ]",
      "3. Client satisfaction: client rating [ ] / 5  Comment from the follow-up: [ ]",
      "Errors found: critical [list or none]  minor [list or none]",
      "What went well: [ ]   What to do differently: [ ]",
      "Action: [what] by [who] by [date]",
      "Signed: mentor [ ]  operations [ ]  trainee has read [ ]"])+"));\n"
    "push(H2('B.10 Follow-up message and rating request'));\n"
    "push(box('Text',"+arr(["Subject: Your flight [route], [date] – how did we do?",
      "Dear [name], welcome back. Thank you for flying with "+B+" Executive. I hope everything was as you expected.",
      "If anything was not right, please reply to this email or call me on [number]; I will deal with it personally.",
      "Would you rate your trip? One click is enough: 5 Excellent · 4 Good · 3 Fair · 2 Poor · 1 Very poor. You may add a comment for the aircraft, the crew or me.",
      "We use ratings only to improve our service and choose our operators. We never publish your rating or words without your written permission.",
      "Kind regards, [broker name], "+B+" Executive"])+"));\n"
    "push(H2('B.11 Live negotiation lab scoring sheet'));\n"
    "push(box('Scoring',"+arr(["Trainee: [ ]   Assessor: [ ]   Date: [ ]   Scenarios: [ ]",
      "Calm and courteous under pressure: [ ] / 20",
      "Correct rule, explained in plain words: [ ] / 30   (wrong rule = fail)",
      "Options offered instead of a flat no: [ ] / 20",
      "No unconfirmed promise: pass / fail   (any = fail)",
      "Escalates when the rules say so: [ ] / 15",
      "Written follow-up within 1 hour: [ ] / 15",
      "Total: [ ] / 100   Result: pass (70+, no critical) / not yet",
      "Best moment: [ ]   To practise: [ ]"])+"));\n")
    return s

def appJ(B):
    cards=[
     ("J.1 Europe: EU, EEA, Switzerland and the United Kingdom",
      [["Green","Whole aircraft from an EU/EEA/UK operator with a checked AOC; international or same-carrier-country flights; clean screening"],
       ["Amber","Non-EU operator into or within Europe (needs an EASA third-country operator authorisation and each state's permits, confirmed in writing); any leg that may be domestic, including territories (G.1); package with hotel or event (ATOL in the UK); de-icing season"],
       ["Red","Leg inside the EU on a non-EU operator without written permission; Russian national (including dual) or company controlled by one with any EU point, or a Russian-registered aircraft; operator on the EU Air Safety List; seats sold individually; payer or operator in a G.7 country"]],
      "Modules 2.4, 2.5, 2.9; Appendix G.1, G.2, G.7"),
     ("J.2 Middle East and Africa",
      [["Green","Experienced operator with permits handled through its trip support; whole aircraft; clean screening"],
       ["Amber","Landing and overflight permits, sponsor rules and lead times vary by state: operator confirms in writing; routes near FAA or EASA conflict-zone notices (G.3); PEP clients; third-party payers"],
       ["Red","Embargoed destination or sanctions match; payer or operator in a G.7 country (for example Libya, South Sudan, Sudan, Syria); lead time impossible to meet"]],
      "Modules 2.5, 2.9, 3.2; Appendix G.2, G.3, G.7"),
     ("J.3 Asia-Pacific: Singapore, Thailand and the region",
      [["Green","International flight on an operator with the needed permits; Singapore slot and Air Transport Permit planned (Changi slot at least 72 hours ahead); clean screening"],
       ["Amber","Thailand: CAAT permits, slots and parking approval at the main Bangkok airports and Phuket, full passenger and crew details; China, India and Russian airspace (strict permit regimes, G.5); Hong Kong and Macau regime with mainland China (G.1); pets into Singapore, Japan, Australia or New Zealand (G.4)"],
       ["Red","Domestic leg on a foreign-registered aircraft (cabotage is closely enforced in Thailand); North Korea; payer or operator in a G.7 country (for example Myanmar, Kazakhstan); lead time impossible to meet"]],
      "Modules 2.5, 2.6, 2.9; Appendix G.1, G.4, G.5, G.7"),
     ("J.4 Americas: United States, Canada and Latin America",
      [["Green","International flight on a US or foreign operator holding the needed authority; whole aircraft; clean screening; US broker disclosures made (14 CFR Part 295)"],
       ["Amber","Foreign operator to or from the US (needs US authority); US federal excise tax when acting as principal (G.6); Canada and Latin America domestic legs reserved for local carriers; FAA security notices (for example Haiti, Central America, Colombia, Ecuador, Mexico, Panama)"],
       ["Red","Any US domestic leg (both airports in the US, including Alaska, Hawaii and territories): never on a non-US operator, and on any operator only after US counsel confirms "+B+"'s position; Cuba with a US-made aircraft; Venezuela (Paynode cannot pay)"]],
      "Modules 2.4, 2.5, 2.9; Appendix G.1, G.3, G.6, G.7"),
    ]
    s=("push(H1('Appendix J  Regional quick-reference cards',true));\n"
    "push(P("+J("One card per region, for live enquiries: green means proceed, amber means the operator or its trip support confirms in writing before we quote, red means stop and tell the director. The cards summarise Module 2, the trip risk screen (Module 2.9) and the watchlist (Appendix G); they never replace them, and the trip risk screen is still recorded for every enquiry.")+"));\n"
    "push(T([['Item',2600],['Detail',7040]],"+rows([
      ["Cards version","1.0, October 2026"],
      ["Last verified","October 2026, by the director, against the official sources in Appendix G.8 and D.4"],
      ["How the cards stay current","The portal's intelligence run checks the official sources and proposes changes; the AI never changes a card. The director checks each proposal against the official source and approves it; only then does the card change, with the new date. In the portal, every card shows its sources and the date it was last verified."]])+"));\n"
    "push(sp());\n")
    for title,rs,src in cards:
        s+="push(H2("+J(title)+"));\n"
        s+="push(T([['Colour',1300],['Triggers',8340]],"+rows(rs)+",{size:16}));\n"
        s+="push(note("+J("Source sections: "+src+".")+"));\n"
    return s

def apply(s,B):
    for a,b in STAGES_OLD:
        assert a in s, a[:40]; s=s.replace(a,b)
    assert AFTER_OLD in s; s=s.replace(AFTER_OLD, after_new(B))
    # quiz 11 additions
    k=s.index("push(quiz(11,[\n")+len("push(quiz(11,[\n"); s=s[:k]+Q11_ADD+s[k:]
    # 14.1 assessment bullet
    a="'Practical exam: a mock trip from enquiry to signed confirmation; no critical error and no more than 3 minor errors (critical errors are listed in \"How to use this manual\").']));"
    assert a in s; s=s.replace(a, a[:-4]+",'Live negotiation lab: scored by the director at stage 5; 70 or more out of 100 with no critical point broken (14.4).','Post-trip debrief: required after every supervised booking (14.6).']));")
    # Essentials paragraph replacement
    i=s.index(ESS_OLD_START); j=s.index("\n",i); s=s[:i]+ess_new(B)+s[j:]
    # insert 14.4-14.6 before Appendix A
    anchor="// ================= APPENDIX A\n"; assert anchor in s
    q14=("push(quiz(14,[\n ['What does a trainee need to pass the live negotiation lab at stage 5?',['Any score','70 or more out of 100 with no critical point broken','A perfect score','The AI practice partner\\'s approval'],'b'],\n"
         " ['Who decides certification?',['The AI practice partner','The director, through the scored lab, the practical exam and the supervised bookings','The client','The operator'],'b'],\n"
         " ['When does a supervised booking count towards sign-off?',['When it is quoted','When the client pays','When the trainee, mentor and operations have completed the post-trip debrief','After 30 days'],'c'],\n]));\n")
    s=s.replace(anchor, m14(B)+q14+"\n"+anchor)
    # A.4 after A.3
    a3="push(H2('A.3 Pre-flight checklist'));"; i=s.index(a3); j=s.index("\n",s.index("\n",i)+1); s=s[:j+1]+A4+"\n"+s[j+1:]
    # B.9-B.11 before Appendix C
    anc="push(H1('Appendix C  Answer key',false));"; assert anc in s; s=s.replace(anc, B_new(B)+anc)
    # Appendix J at the end of body (before doc creation or end)
    if "const doc=new Document" in s: s=s.replace("const doc=new Document", appJ(B)+"\nconst doc=new Document",1)
    else: s=s+"\n"+appJ(B)
    # contents list
    s=s.replace("'Appendix I  Portal FAQ'].forEach","'Appendix I  Portal FAQ','Appendix J  Regional quick-reference cards'].forEach")
    # version line
    old=re.search(r"\['Version','3\.7, 18 October 2026",s)
    if old: s=s.replace("['Version','3.7, 18 October 2026","['Version','3.8, 19 October 2026: live negotiation lab and AI practice partner (14.4, 14.5), post-trip debrief (14.6), following every trip to the last leg with follow-up and client rating (11.5, A.4, B.10), ACA Essentials sponsorship (14.3) and Appendix J regional quick-reference cards. 3.7, 18 October 2026",1)
    # Thai summary: one rule added
    th="'ทุกคำขอต้องผ่านการคัดกรองความเสี่ยงของเที่ยวบิน 6 ข้อ"
    if th in s:
        i=s.index(th); j=s.index("']",i)
        s=s[:j+2]+",\n 'ติดตามทุกเที่ยวบินจนถึงขาสุดท้าย โทรหรือส่งข้อความติดตามลูกค้าภายใน 24 ชั่วโมงหลังลงจอด และส่งแบบประเมินความพึงพอใจ ปิดงานได้เมื่อทำครบทุกขั้นตอนแล้วเท่านั้น'"+s[j+2:]
    return s
