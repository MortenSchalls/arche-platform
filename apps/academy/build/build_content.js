// Builds the full course content from the Master Training Manual source (manual.json) plus the hand-built Modules 0 and 2, lab and practical.
const fs = require('fs'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('content.js','utf8') + ';this.L=L;this.MODS=MODS;this.ISSUES=ISSUES;this.LAB=LAB;this.BOOK=BOOK;', ctx);
const {L, ISSUES, LAB, BOOK} = ctx; const MODS = ctx.MODS;
Object.assign(L, {
  wyv:["Wyvern","https://www.wyvern.aero/"],
  isbao:["IS-BAO (International Business Aviation Council)","https://www.ibac.org/is-bao"],
  acsf:["Air Charter Safety Foundation","https://www.acsf.aero/"],
  tmVid:["Trip Manager training videos (Avinode)","https://help.avinodegroup.com/hc/en-us/articles/16390512030491-Training-Videos"],
  quote:["Creating a professional quote (Avinode)","https://help.avinodegroup.com/hc/en-us/articles/9957467128603-Creating-a-Professional-Quote"],
  payReq:["How to create a Paynode payment request","https://help.avinodegroup.com/hc/en-us/articles/7937852877467-How-to-Create-a-Payment-Request"],
  sendPay:["Paynode: overview of sending payments","https://help.avinodegroup.com/hc/en-us/articles/11978769793563-Payment-Guide-Overview-of-Sending-Payments"],
  card:["Paynode: overview of card payments","https://help.avinodegroup.com/hc/en-us/articles/7937973595035-Overview-of-card-payments"],
  wire:["Paynode: match a wire transfer to a trip","https://help.avinodegroup.com/hc/en-us/articles/19699527102235-Match-a-Wire-Transfer-to-your-Trip-using-a-Payment-Request"],
  white:["Paynode white paper: payment security","https://avinode.com/white-paper-payment-security-for-air-charter/"],
  acaTr:["Air Charter Association: training","https://www.theaircharterassociation.aero/training/"],
  wx:["Aviation Weather Center (METAR and TAF)","https://aviationweather.gov/"],
  easaIce:["EU CAT.OP.MPA.250: ice and other contaminants, ground procedures","https://regulatorylibrary.caa.co.uk/air-operations-pre-30-october-2025/Content/Document%20Structure/04%20CAT/2%20Regs/07560_CATOPMPA250_Ice_and_other_contaminants_ground_procedures.htm"],
  faaIce:["US 14 CFR 135.227: icing conditions","https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-135/subpart-D/section-135.227"],
  faaRest:["US 14 CFR 135.267: flight time and rest, unscheduled crews","https://www.law.cornell.edu/cfr/text/14/135.267"],
  icaoIce:["ICAO Doc 9640: ground de-icing and anti-icing","https://store.icao.int/en/manual-of-aircraft-ground-de-icing-anti-icing-operations-doc-9640"],
});
const C = JSON.parse(fs.readFileSync('manual.json','utf8')).filter(c => c && c.k);

/* explanations for each module check question */
const WHY = {
 "1.1":"While the charter sales agreement for Navoryx aircraft is in force, we do not sell their flight hours. The director handles any such request.",
 "1.2":"One booking unit is USD 45,000 billed to the client. 135,000 divided by 45,000 is 3 units.",
 "1.3":"Arche sells whole-aircraft charters to one client. Selling seats needs public-charter or airline authority.",
 "3.1":"A third-party payer in another country is a money-laundering warning sign. Identify the payer, record the reason and get the director's approval.",
 "3.2":"A close match means stop. Take no payment, keep the screening record and let the director decide.",
 "3.3":"Cash to speed up a permit is a bribe under laws such as the US FCPA and UK Bribery Act. Refuse and report.",
 "3.4":"Passport copies are personal data. They stay in Avinode and the Arche CRM, never in email or chat apps.",
 "4.1":"Discretion: send trip details only to the people the client agreed in writing.",
 "4.2":"Say no early and clearly, and offer a legal alternative such as a local operator for the domestic leg.",
 "5.1":"The never-sell check and the trip risk screen come before sourcing, so we never spend time on a flight we cannot sell.",
 "5.2":"A booking is confirmed only when KYC and sanctions are done, the confirmation is signed and payment is received as agreed.",
 "6.1":"Range depends on load, winds and season. Only the operator can confirm non-stop for this trip.",
 "6.2":"Dangerous goods such as spare lithium batteries are the operator's decision under its rules.",
 "6.3":"Patients needing care in flight need an air-ambulance operator. We refer through the director.",
 "7.1":"Specifications come from the aircraft's Avinode listing and the manufacturer, and the operator confirms them for the trip.",
 "7.2":"On a long night flight, beds, crew rest and confirmed non-stop range for the load matter most.",
 "8.1":"ARGUS Gold Plus, Platinum and Platinum Elite, or Wyvern Wingman, are accepted. ARGUS Gold or no rating needs director approval.",
 "8.2":"An unrated operator needs director approval, and its AOC, insurance, history and references are checked.",
 "8.3":"Operators on the EU Air Safety List are banned or restricted in Europe.",
 "9.1":"Client price is the operator price divided by 0.91. 60,000 divided by 0.91 is 65,934.07, rounded up to 65,935. Never round down.",
 "9.2":"Never guess a cost. Ask the operator for a written estimate and pass it on as the operator's estimate.",
 "9.3":"The 9% margin applies to the operator price and to confirmed supplier items Arche buys.",
 "9.4":"140,000 plus 2,500 is 142,500. Divided by 0.91 that is 156,593.41, rounded up to 156,594.",
 "10.1":"If the operator's terms are stricter than Part A, Arche carries the gap. The director decides before the confirmation is issued.",
 "10.2":"Client and operator payments run through Paynode. Only Arche's margin reaches Arche's own account.",
 "11.1":"A file closes only when payments are settled, the personal follow-up is logged and the rating request has gone out, plus service recovery for any low score.",
 "11.2":"A score of 3 or less starts service recovery: the broker calls within 1 working day and the director is told the same day.",
 "11.3":"The broker follows up personally within 24 hours of the last landing, while the trip is fresh and any problem can still be put right.",
 "11.4":"Extra cost after an aircraft goes technical (AOG) is approved by the director.",
 "11.5":"Safety decisions belong to the captain. Our job is to look after the client.",
 "11.6":"Every shift ends with a written handover in the desk log, so nothing is lost overnight.",
 "14.1":"The lab pass mark is 70 out of 100, and the critical points (the correct rule, no unconfirmed promise) must not be broken whatever the total.",
 "14.2":"The director certifies, on the scored lab, the practical exam and the supervised bookings. The AI practice partner never decides.",
 "14.3":"A supervised booking counts only when trainee, mentor and operations have each completed their part of the post-trip debrief.",
 "12.1":"Check the national do-not-call register and record any opt-out before calling.",
 "12.2":"First compare like for like: aircraft age, operator safety rating, inclusions and what is charged at cost.",
 "0.7":"A flight between two points inside a foreign country on its own is the 9th freedom, cabotage. Most countries refuse it to foreign operators.",
 "0.8":"Never criticise another product. Compare on what matters to the client: flexibility, total trip cost and aircraft choice.",
 "1.4":"A principal buys the flight and resells it in its own name, and takes on responsibility to the client.",
 "2.9":"Under the Montreal Convention, baggage claims on an international flight lie against the carrier, the operator.",
 "2.10":"We arrange flights on aircraft run by certified operators. Never write \"our fleet\" or claim a rating for aircraft we have not checked.",
 "5.3":"Groups with tight schedules strain crew duty limits and slots, and heavy equipment changes weight and volume.",
 "6.4":"The crew and operator decide on weather. We warn the client early and arrange what they need.",
 "8.4":"Record the operator's liability cover and ask for the client and Arche to be added as additional insured where possible.",
 "9.5":"Using real flexibility to save positioning is fair negotiation. Fake quotes or pressure on safety never are.",
 "12.3":"Offer options at different prices and sell the value, rather than cutting the margin.",
 "1.5":"Every new lead needs first contact within 48 hours, logged in the portal. Otherwise the next assignment round moves it, with its history, to another broker.",
 "1.6":"Separate duties: nobody confirms, prices or records payment on their own booking. Another operations member or the director issues it.",
 "5.4":"Both are client requests: what the client asks for. Each is confirmed with its supplier in writing, with how it is charged.",
 "6.5":"No take-off with ice or snow on the aircraft (EU CAT.OP.MPA.250, US 14 CFR 135.227). De-icing depends on the day, so it is charged at cost after the flight with the receipt.",
 "6.6":"Airports publish their hours and night restrictions. Only the operator can say whether an out-of-hours opening is possible and what it costs.",
 "6.7":"Duty and rest limits come from the operator's authority, for example 14 CFR 135.267 in the US. The operator plans the crew; we ask for the plan in writing.",
 "9.6":"Fixed supplier items carry the 9% margin like any item Arche buys: 1,200 ÷ 0.91 = 1,318.68, rounded up to 1,319.",
 "9.7":"De-icing depends on the day: it is invoiced after the flight with the receipt, without margin (Part A, A7).",
 "10.3":"Part A, A3: a booking made less than 7 days before departure is paid in full on signature.",
 "10.4":"Part A, A3: the balance, including fixed-price extras, is due 7 calendar days before the first scheduled departure.",
};
/* what each module teaches (shown on the first screen) and its key points (shown before the check) */
const OBJ = {
 m0:["Name who does what on a charter flight","Read airport codes and convert local time to UTC","Explain positioning, empty legs, permits, slots and crew duty","Use the market figures and the ways people fly privately correctly","Explain the freedoms of the air and why cabotage matters"],
 m1:["Describe what Arche sells and how it earns","Explain the three ways a broker can work","Apply the booking ramp and the professional standards","Work in the Arche portal: leads, prospects and separate duties"],
 m2:["Give every client the required disclosures","Recognise the flights we never sell","Apply the rules by region and spot cabotage","Run the trip risk screen","Explain passenger liability and advertising rules"],
 m3:["Run KYC for each client type","Screen names against the official sanctions lists","Spot money-laundering, fraud and bribery risks","Handle personal data correctly"],
 m4:["Work with principals, assistants and family offices","Keep discretion","Say no clearly and offer a legal alternative"],
 m5:["Follow the booking life cycle","Capture a complete enquiry and qualify it","Recognise mission types and what each needs","Separate client requests from operational needs"],
 m6:["Ask the operator the right feasibility questions","Choose a suitable airport","Recognise long over-water routes and weather risks","Explain the rules behind de-icing, airport hours, slots, customs, crew duty and permits"],
 m7:["Know the long-range aircraft families","Compare aircraft for a client using sourced data"],
 m8:["Source on Avinode and compare quotes like for like","Vet an operator against the Arche standard","Check crew and insurance"],
 m9:["Get every price from a written source","Price with the 9% formula and round up","Handle costs that cannot be fixed","Negotiate fairly with operators","Price requests and extras: included, fixed or at cost"],
 m10:["Issue the confirmation back to back with the operator","Explain how money moves through Paynode","Keep financial controls and a complete booking file","Follow the booking timeline from quote to final invoice"],
 m11:["Prepare and run the day of flight","Handle disruption and the 24/7 desk","Answer sustainability questions honestly"],
 m12:["Meet the Arche service standard on every call","Answer common objections","Manage accounts, follow-ups and negotiation with clients"],
 m13:["Apply the whole manual to six real-world trips"],
 m14:["Know how you are assessed and certified","Plan your Avinode, Paynode and external training"],
};
const TAKE = {
 m0:["The operator flies and is responsible for safety; Arche finds, checks, prices, contracts and looks after the client.","Confirm airport, date and time zone in writing, always.","Positioning is usually paid by the client; empty legs can be cancelled.","Use market figures only with their source and date.","Cabotage is the 8th and 9th freedom, and most countries refuse it to foreign operators."],
 m1:["We sell whole-aircraft charters and empty legs at a 9% margin.","No Navoryx fleet hours while the charter sales agreement is in force.","Never sell a flight before an operator has confirmed it in writing.","First contact within 48 hours and follow-up every 14 days, or the lead moves on."],
 m2:["Every client receives the five disclosures in writing before signing.","Never sell anything on the never-sell list, including US domestic legs on non-US operators.","Amber means confirm in writing first; red means stop and escalate.","Liability for the flight lies with the operator; never advertise \"our fleet\"."],
 m3:["KYC and sanctions screening come before any contract.","A possible match means stop, no payment, report to the director.","Payments only through Paynode; bank details never by email or chat.","Personal data stays in Avinode and the CRM."],
 m4:["Discretion is part of the product.","Send details only to people agreed in writing.","Say no early, politely, with an alternative."],
 m5:["Check the never-sell list and run the risk screen before sourcing.","Qualify early: who flies, who pays, who decides.","Match the planning to the mission type."],
 m6:["Every feasibility answer comes from the operator in writing.","The airport must suit the aircraft: hours, customs, fire cover, runway.","The crew decides on weather; we warn the client early.","De-icing, out-of-hours fees and crew nights depend on the day: ask before promising a time, and charge them at cost."],
 m7:["Never quote range, speed or seats from memory.","Compare cabins, beds, age and confirmed range for the actual load."],
 m8:["Compare all-in quotes like for like.","ARGUS Gold Plus or higher, or Wyvern Wingman; otherwise director approval.","Check the aircraft is on the AOC and the insurance covers commercial passengers."],
 m9:["Client price = Arche cost ÷ 0.91, rounded up.","Costs that depend on the day are charged at cost with receipts.","Negotiate with flexibility, never with fake quotes or pressure on safety.","Fixed extras: supplier price ÷ 0.91; extras at cost: receipts, no margin."],
 m10:["Our terms are never softer than the operator's.","Client money and operator money run through Paynode; only our margin reaches Arche's account.","No flight departs until paid in full.","Deposit 25% (at least USD 2,500); balance 7 days before; under 7 days, pay in full on signature."],
 m11:["Keep the client informed before they need to ask.","Extra cost after an AOG needs the director's approval.","Every desk shift ends with a written handover."],
 m12:["Answer the same business day and confirm everything in writing.","Compare like for like before discussing price.","Track every enquiry through the pipeline and follow up every quote."],
 m13:["Work each case yourself before opening the model answer."],
 m14:["80% in the exam and every critical-rule question right.","Then systems training, shadowing with two site visits, the practical exam and 10 supervised bookings."],
};
/* questions that test a critical rule: all must be right in the written exam */
const CRIT = new Set(["9.6","10.3","1.3","2.1","2.3","2.4","2.5","2.7","2.8","3.1","3.2","3.3","3.4","8.1","8.2","8.3","9.1","9.4","10.2"]);
/* official and industry sources placed where they are used */
const LINKS = {
 "3.1":[L.mas], "3.2":[L.un,L.ofac,L.eumap,L.uks,L.mas], "3.3":[L.ofac], "3.5":[L.white,L.payNo], "3.6":[],
 "6.1":[L.uwThai,L.caat,L.caas,L.tim,L.czib,L.faa,L.safe],
 "7.1":[L.gulf,L.bomb,L.dass],
 "8.1":[L.avStart,L.avBroker], "8.2":[L.argus,L.wyv,L.isbao], "8.3":[L.acsf,L.argus], "8.4":[L.asl,L.caa],
 "9.1":[L.quote,L.tmVid], "9.6":[L.quote],
 "10.2":[L.payReq,L.sendPay,L.card,L.wire,L.payNo], "10.3":[L.card],
 "11.3":[L.czib,L.faa,L.safe],
 "12.1":[L.nbaaCG], "14.3":[L.acaTr], "6.5":[L.easaIce,L.faaIce,L.icaoIce,L.faaRest],
};

const txt = runs => runs.map(r => r.t || (r.link ? r.link[0] : "")).join("").replace(/\s+/g," ").trim();
function convert(blocks){
  const out = []; let list = null, olist = null, links = null;
  const flush = () => { if (list) out.push({list}); if (olist) out.push({olist}); if (links) out.push({links}); list = olist = links = null; };
  for (const b of blocks) {
    if (b.k === 'li') { if (!list) { flush(); list = []; } list.push(txt(b.runs)); continue; }
    if (b.k === 'nli') { if (!olist) { flush(); olist = []; } olist.push(txt(b.runs)); continue; }
    if (b.k === 'p' && b.runs.some(r => r.link)) { const l = b.runs.find(r => r.link).link, why = b.runs.filter(r => !r.link).map(r => r.t).join("").trim(); if (!links) { flush(); links = []; } links.push(why ? [l[0], l[1], why] : [l[0], l[1]]); continue; }
    flush();
    if (b.k === 'p') { const t = txt(b.runs); if (t) out.push({p:t}); }
    else if (b.k === 'note') out.push({p:b.t});
    else if (b.k === 'h3') out.push({h3:b.t.replace(/\s{2,}/g,": ")});
    else if (b.k === 'table') out.push({table:{cols:b.cols, rows:b.rows.map(r => r.map(String))}});
    else if (b.k === 'box') out.push({box:{t:b.t, l:b.l}});
  }
  flush(); return out;
}
/* split the manual into chapters */
const chapters = []; let cur = null;
for (const c of C) { if (c.k === 'h1') { cur = {title:c.t, items:[]}; chapters.push(cur); } else if (cur) cur.items.push(c); }
const byTitle = t => chapters.find(ch => ch.title.startsWith(t));

function buildModule(n){
  const ch = byTitle(`Module ${n} `); const title = ch.title.replace(/^Module \d+\s+/, "");
  const secs = []; let pre = [], sec = null, quiz = [];
  for (const it of ch.items) {
    if (it.k === 'quiz') { quiz = it.items.map((q,i) => ({q:q[0], o:q[1], a:'abcd'.indexOf(q[2]), why:WHY[`${n}.${i+1}`] || "", crit:CRIT.has(`${n}.${i+1}`)})); continue; }
    if (it.k === 'h2') { if (/^Check your understanding/.test(it.t)) continue; sec = {h:it.t.replace(/\s{2,}/g,": "), raw:[]}; secs.push(sec); continue; }
    (sec ? sec.raw : pre).push(it);
  }
  let intro = ""; if (pre.length && pre[0].k === 'p' && !pre[0].runs.some(r => r.link)) intro = txt(pre.shift().runs);
  if (pre.length) secs.unshift({h:"Overview", raw:pre});
  secs.forEach(s => {
    s.b = convert(s.raw); delete s.raw;
    const num = (s.h.match(/^(\d+\.\d+)/) || [])[1]; const extra = (num && LINKS[num]) || (s.h === "Overview" && LINKS[String(n)]) || [];
    if (extra.length) { const lb = s.b.find(b => b.links); if (lb) extra.forEach(l => { if (!lb.links.some(x => x[1] === l[1])) lb.links.push(l); }); else s.b.push({links:extra}); }
  });
  return {intro, secs, quiz, title};
}
const TITLES = {};
for (const n of [1,3,4,5,6,7,8,9,10,11,12,13,14]) { const m = buildModule(n); TITLES['m'+n] = m.title; MODS['m'+n] = {intro:m.intro, secs:m.secs, quiz:m.quiz}; }
/* hand-built Modules 0 and 2: add the sections and questions the manual gained later */
for (const n of [0,2]) {
  const m = buildModule(n), id = 'm'+n, have = new Set(MODS[id].secs.map(s => (s.h.match(/^(\d+\.\d+)/)||[])[1]));
  m.secs.filter(s => { const k = (s.h.match(/^(\d+\.\d+)/)||[])[1]; return k && !have.has(k); }).forEach(s => {
    const i = MODS[id].secs.findIndex(x => x.h.startsWith(n+".9")); MODS[id].secs.splice(i+1 > 0 ? (n===0 ? MODS[id].secs.length : i) : MODS[id].secs.length, 0, s);
  });
  m.quiz.slice(-2).forEach((q,i) => { q.why = WHY[`${n}.${n===0 ? 7+i : 9+i}`]; MODS[id].quiz.push(q); });
}
/* order Module 2 sections by number, and Module 0 */
for (const id of ['m0','m2']) MODS[id].secs.sort((a,b) => { const f = h => { const x = (h.match(/^(\d+)\.(\d+)/)||[0,0,99]); return +x[2]; }; return f(a.h) - f(b.h); });
/* hand-built modules: flag critical questions */
MODS.m2.quiz.forEach((q,i) => q.crit = CRIT.has(`2.${i+1}`));
MODS.m0.quiz.forEach(q => q.crit = false);
/* Module 13: point to the lab; Module 14: the exam follows */
MODS.m13.secs = MODS.m13.secs.filter(s => !/^13\.7/.test(s.h));
MODS.m13.secs.forEach(s => { const i = s.b.findIndex(x => x.p === "Model answer"); if (i >= 0) s.b = s.b.slice(0,i).concat([{reveal:{t:"Show the model answer", b:s.b.slice(i+1)}}]); });
MODS.m13.secs.forEach(s => { if (s.b[0] && s.b[0].p) s.b[0].p = s.b[0].p.replace(/^Situation\.\s*/, ""); s.b.unshift({p:"Work out how you would handle this trip before you open the model answer."}); });
MODS.m13.secs.push({h:"Spot the problem", b:[{p:"The twelve spot-the-problem trips are in the trip risk screen lab after Module 2. Go back to it any time to practise."}]});
MODS.m14.secs = MODS.m14.secs.filter(s => !/^14\.1/.test(s.h));
MODS.m14.secs.unshift({h:"The written exam", b:[{p:"The written exam follows this module. It draws questions from every module check in your path. To pass you need 80% or more, and every question on a critical rule must be right."},{p:"After the exam: Avinode and Paynode training, 8 shadowed trips, the practical exam with the director, and 10 supervised bookings. The director signs your training record when all stages are complete."}]});

/* figures placed in the section they explain (drawn in the page) */
const FIG = {"0.1":"who","0.2":"cats","0.4":"utc","0.5":"pos","0.10":"market","0.12":"freedoms","2.4":"never","2.6":"cabo","2.9":"rag","3.2":"screen","5.1":"cycle","6.2":"airport","8.2":"vet","9.3":"price","9.4":"ex","10.2":"money","11.2":"day","12.5":"funnel","2.10":"montreal"};
for (const [id,M] of Object.entries(MODS)) {
  M.obj = OBJ[id] || []; M.take = TAKE[id] || [];
  M.secs.forEach(s => { const k = (s.h.match(/^(\d+\.\d+)/)||[])[1]; if (k && FIG[k]) { const at = s.b.findIndex(b => b.p); s.b.splice(at >= 0 ? at+1 : 0, 0, {fig:FIG[k]}); } });
  const words = JSON.stringify(M.secs).split(/\s+/).length; M.min = Math.max(5, Math.round(words/170 + M.quiz.length*0.7 + M.secs.length*0.5));
}
/* photographs (freely licensed, credits on the Photo credits page) */
const PHOTO = {"0.2":["cat_tp","cat_light","cat_mid","cat_smid","cat_heavy","cat_ulr","cat_vip"], "7.1":["cat_ulr","fam_g650","fam_f8x"], "7.2":["cabin_lt","cabin_lg","cabin_ulr"], "6.4":["deice"]};
for (const M of Object.values(MODS)) M.secs.forEach(s => { const k = (s.h.match(/^(\d+\.\d+)/)||[])[1]; if (k && PHOTO[k]) { const at = s.b.findIndex(b => b.table || b.list); s.b.splice(at >= 0 ? at+1 : s.b.length, 0, {photos:PHOTO[k]}); } });
/* reference pages (no answer key) */
const REF = {};
const refPage = (id, t, title) => { const ch = byTitle(t); REF[id] = {t:title, b:convert(ch.items.filter(i => i.k !== 'h2' || true).map(i => i.k === 'h2' ? {k:'h3', t:i.t} : i))}; };
refPage("rhow","How to use this manual","Training path and rules");
refPage("rchk","Appendix A","Checklists");
refPage("rtpl","Appendix B","Templates");
refPage("rlib","Appendix D","Self-study library");
refPage("rglo","Appendix E","Glossary");
refPage("rwat","Appendix G","Watchlist");
refPage("rthai","Appendix F","สรุปกฎสำคัญ (Thai summary)");
{ const meta = JSON.parse(fs.readFileSync('img/meta.json','utf8'));
  REF.rcred = {t:"Photo credits", b:[{p:"The photographs in this course are freely licensed from Wikimedia Commons. They were resized for the course. Each is used under the licence shown; follow the link for the original."},
    {table:{cols:["Photo","Photographer","Licence"], rows:Object.values(meta).map(m => [m.what, m.artist, m.lic])}},
    {links:Object.values(meta).map(m => [m.what + " (original)", m.page])}]}; }

const COURSE = [
 {id:"m0", n:"0", t:"Aviation for brokers"},
 {id:"m1", n:"1", t:TITLES.m1},
 {id:"m2", n:"2", t:"Where we may and may not sell"},
 {id:"lab", n:"2L", t:"Lab: the trip risk screen", lab:true},
 {id:"m3", n:"3", t:"Compliance: KYC, sanctions, fraud"},
 {id:"m4", n:"4", t:TITLES.m4},
 {id:"m5", n:"5", t:TITLES.m5},
 {id:"m6", n:"6", t:TITLES.m6},
 {id:"m7", n:"7", t:"Aircraft knowledge: long-range jets"},
 {id:"m8", n:"8", t:TITLES.m8},
 {id:"m9", n:"9", t:TITLES.m9},
 {id:"m10", n:"10", t:TITLES.m10},
 {id:"book", n:"10P", t:"Practical: the booking form", lab:true},
 {id:"m11", n:"11", t:"Trip operations and the 24/7 desk"},
 {id:"m12", n:"12", t:TITLES.m12},
 {id:"m13", n:"13", t:TITLES.m13},
 {id:"m14", n:"14", t:"Assessment and certification"},
 {id:"exam", n:"EX", t:"Written exam", lab:true},
].map(c => Object.assign(c, {live:true}));
const PATHS = {
 broker: COURSE.map(c => c.id),
 consultant: ["m0","m1","m2","lab","m3","m4","m5","m12","m13","exam"],
};
const PILOT_REQ = PATHS.broker;
const J = JSON.stringify;
fs.writeFileSync('content.full.js', `/* Course content generated from the Master Training Manual ARC-MST-TRN-2026-007, October 2026 */\n` +
  [['L',L],['COURSE',COURSE],['PATHS',PATHS],['PILOT_REQ',PILOT_REQ],['MODS',MODS],['REF',REF],['ISSUES',ISSUES],['LAB',LAB],['BOOK',BOOK]].map(([k,v]) => `const ${k} = ${J(v)};`).join('\n'));
let qn = 0; Object.values(MODS).forEach(m => qn += m.quiz.length);
console.log('modules', Object.keys(MODS).length, 'questions', qn, 'critical', Object.values(MODS).reduce((a,m) => a + m.quiz.filter(q => q.crit).length, 0), 'missing why', Object.entries(MODS).flatMap(([k,m]) => m.quiz.filter(q => !q.why).map(q => k + ': ' + q.q.slice(0,40))));
console.log(Object.entries(MODS).map(([k,m]) => k + ':' + m.secs.length + 's/' + m.quiz.length + 'q').join(' '));
