// Builds the external (sellable) edition of the course content from content.full.js:
// removes Arche-only parts, rewrites Arche policy wording as general practice, and fails if anything Arche-specific is left.
const fs = require('fs'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('content.full.js','utf8') + ';this.o={L,COURSE,PATHS,PILOT_REQ,MODS,REF,ISSUES,LAB,BOOK};', ctx);
const O = JSON.parse(JSON.stringify(ctx.o));
const log = [];

/* ---- 1. parts removed in the external edition (each is listed in the edition map) ---- */
const PARTS = [
 {id:"who-we-are", t:"Module 1.1 Who we are (Arche company profile)", sec:["m1","1.1"]},
 {id:"ramp", t:"Module 1.5 The booking ramp and booking units", sec:["m1","1.5"]},
 {id:"navoryx", t:"Navoryx fleet-hours rule (Module 1.2 and its question)", item:"Navoryx", quiz:"A client asks to charter an aircraft owned by Navoryx"},
 {id:"units-q", t:"Booking-unit question (Module 1)", quiz:"A trip billed at USD 135,000"},
 {id:"us-policy", t:"Arche policy: no US domestic flights until US counsel confirms", row:"Any US domestic flight, even on a US operator", item:"Arche policy: no US domestic flights"},
 {id:"oncall", t:"Arche desk plan (on-call rota months 1 to 8, four-person desk from month 9)", item:"From month 9:"},
 {id:"thai", t:"Appendix F Thai summary of Arche's critical rules", ref:"rthai"},
 {id:"portal", t:"Module 1.8 The Arche portal (leads, prospects, booking rights) and its questions", sec:["m1","1.8"], quiz:"You have not contacted a new lead", item:"First contact within 48 hours and follow-up every 14 days"},
 {id:"portal-q2", t:"Booking-rights question (Module 1)", quiz:"A broker with booking rights sells a trip"},
 {id:"portal-book", t:"Module 10.7 How to book in the Arche portal", sec:["m10","10.7"]},
];
const dropSec = (m, num) => { const M = O.MODS[m]; const i = M.secs.findIndex(s => s.h.startsWith(num + " ")); if (i >= 0) { M.secs.splice(i, 1); log.push(`removed ${m} ${num}`); } };
for (const p of PARTS) {
  if (p.sec) dropSec(p.sec[0], p.sec[1]);
  if (p.ref) { delete O.REF[p.ref]; log.push('removed reference ' + p.ref); }
  if (p.quiz) for (const M of Object.values(O.MODS)) { const n = M.quiz.length; M.quiz = M.quiz.filter(q => !q.q.startsWith(p.quiz)); if (M.quiz.length < n) log.push('removed question: ' + p.quiz); }
}
const itemDrops = PARTS.filter(p => p.item).map(p => p.item), rowDrops = PARTS.filter(p => p.row).map(p => p.row);
const prune = o => {
  if (Array.isArray(o)) return o;
  if (o && typeof o === 'object') {
    for (const k of Object.keys(o)) {
      const v = o[k];
      if ((k === 'list' || k === 'olist') && Array.isArray(v)) o[k] = v.filter(x => !(typeof x === 'string' && itemDrops.some(d => x.includes(d))));
      else if (k === 'table' && v && v.rows) v.rows = v.rows.filter(r => !rowDrops.some(d => String(r[0]).startsWith(d)));
      else if (k === 'take' && Array.isArray(v)) o[k] = v.filter(x => !itemDrops.some(d => x.includes(d)));
      else prune(v);
      if (Array.isArray(v)) v.forEach(prune);
    }
  }
  return o;
};
prune(O);
for (const M of Object.values(O.MODS)) for (const S of M.secs) { const i = S.b.findIndex(x => x && x.h3 && x.h3.startsWith("Arche sponsorship")); if (i >= 0) { let j = i + 1; while (j < S.b.length && !S.b[j].h3 && !S.b[j].links && !S.b[j].p) j++; S.b.splice(i, j - i); log.push('removed Arche sponsorship of external courses'); } }

/* ---- 2. passages rewritten as general practice ---- */
const EXACT = {"Broker (Arche)":"Broker","Arche Executive":"The broker","Arche":"The broker"};
const PREFIX = [["In the Arche portal the trip file suggests", "Booking systems can suggest operational needs from the trip itself: de-icing for winter dates, out-of-hours handling for night departures, crew hotel and parking when the aircraft waits between legs, or a private terminal and customs on international arrivals. A suggestion is a prompt to ask the operator, never a fact."],["The client signs the Arche charter confirmation", "The client signs your company's charter confirmation with its booking terms and standard conditions. It is issued only when the pre-issue checklist (Appendix A) is complete."],["All bookings run through Avinode, and all client and operator payments run through Paynode", "Use only your company's approved charter confirmation and terms, never your own wording, and never agree to change liability, cancellation or payment terms. Many brokers run bookings through Avinode and payments through a secure platform such as Paynode, so that client and operator money never passes through the broker's own account. This course uses that set-up as its standard."]];
const OVR = [
 ["Watch every leg in the portal under Flight following:", "Watch every leg in your booking system or flight-tracking tool:"],
 ["Log it in the portal (Aftercare).", "Log it in the trip file."],
 ["send the client the rating request from the portal (template B.10)", "send the client the rating request (template B.10)"],
 ["The client answers with one click from the email; nothing is required.", "The client answers by reply; nothing is required."],
 ["Record the answer in the portal when it arrives.", "Record the answer in the trip file when it arrives."],
 ["14.5 AI practice partner in the portal", "14.5 AI practice partner"],
 ["Under Training, Roleplay lab, the portal's AI plays any client", "An AI roleplay tool can play any client"],
 ["It is recorded in the portal (template B.9).", "It is recorded on template B.9."],
 ["Every leg followed to landing in the portal;", "Every leg followed to landing;"],
 ["Sessions are saved to your training record; the director sees the number of sessions and the average score.", "Keep a note of your sessions and scores for your manager."],
 ["Work in the Arche portal: leads, prospects and separate duties", "Keep selling and confirming as separate duties"],
 ["Separate duties: nobody confirms, prices or records payment on their own booking. Another operations member or the director issues it.", "Separate duties: the person who sold a trip never issues its confirmation or records its payments."],
 ["optional, not an Arche requirement", "optional, not a requirement of this course"],
 ["Part A Key Booking Terms and Part B Standard Conditions", "booking terms and standard conditions"],
 ["the Arche charter confirmation", "your company's charter confirmation"], ["against the Arche standard", "against the course standard"],
 ["The online marketplace where operators list aircraft and brokers request and compare quotes. Arche books every trip through it.", "The online marketplace where operators list aircraft and brokers request and compare quotes. This course uses it as the standard sourcing tool."],
 ["Intercontinental trips (our focus)", "Intercontinental trips"],
 ["What it means for us: most flights happen in North America, but the fastest growth is in Africa, Latin America, the Middle East and Asia, where many of our clients live.", "What it means for brokers: most flights happen in North America, but the fastest growth is in Africa, Latin America, the Middle East and Asia."],
 ["Flexible trips, no commitment; what Arche sells", "Flexible trips, no commitment; what charter brokers sell"],
 ["Flexible clients who accept the risk; Arche sells these too (Module 9.5)", "Flexible clients who accept the risk; brokers sell these too (Module 9.5)"],
 ["Safety culture at Arche", "Safety culture"],
 ["Every person at Arche is expected", "Everyone in a brokerage is expected"],
 ["Arche sells worldwide, so we meet many sets of rules.", "Brokers who sell worldwide meet many sets of rules."],
 ["Singapore (our home)", "Singapore"], ["Thailand (our Asian hub)", "Thailand"],
 ["Singapore company, tax and data-protection law apply to Arche.", "Singapore company, tax and data-protection law apply to brokers established there."],
 ["Use a US operator for the whole trip, subject to Arche's US policy.", "Use a US operator for the whole trip."],
 ["payer or operator in a country Paynode cannot serve", "payer or operator in a country your payment platform cannot serve"],
 ["Paynode limits", "Payment platform limits"], ["Paynode cannot pay to or from some countries", "Payment platforms such as Paynode cannot pay to or from some countries"],
 ["1.3 How we earn", "1.3 How brokers earn"],
 ["Our margin is 7% of the price the client pays (Module 9). The operator receives the rest through Paynode. Only our margin flows into Arche's own bank account.", "A broker earns a margin or a commission on each charter. This course uses a margin of 7% of the client price as its example (Module 9); your company sets its own. Client and operator money should never pass through the broker's own bank account."],
 ["Arche's legal position is being settled with counsel (Module 2.3). Until then, never describe our role in your own words: use the wording in the approved Arche charter confirmation.", "Know which model your company uses, and never describe your role in your own words: use the wording in your company's approved charter confirmation."],
 ["Describe what Arche sells and how it earns", "Describe what a charter broker sells and how it earns"],
 ["Apply the booking ramp and the professional standards", "Apply the professional standards"],
 ["We sell whole-aircraft charters and empty legs at a 7% margin.", "Brokers sell whole-aircraft charters and empty legs, never individual seats."],
 ["Approves exceptions, compliance decisions and disputes; owns this manual", "Approves exceptions, compliance decisions and disputes; owns the company's procedures"],
 ["Singapore's Personal Data Protection Act applies to Arche; local laws such as Thailand's Personal Data Protection Act", "Laws such as Singapore's Personal Data Protection Act, Thailand's Personal Data Protection Act"],
 ["a completed Arche operator questionnaire", "a completed operator questionnaire"],
 ["9.3 The Arche price formula", "9.3 The price formula"],
 ["Our margin is 7% of the price the client pays. Because it is a share of the selling price, divide the cost by 0.93; do not add 7% to the cost.", "This course uses a margin of 7% of the price the client pays; your company sets its own rate. Because the margin is a share of the selling price, divide the cost by 0.93 for 7%; do not add 7% to the cost."],
 ["The client signs the Arche charter confirmation: booking details, Part A Key Booking Terms and Part B Standard Conditions.", "The client signs your company's charter confirmation with its booking terms and standard conditions."],
 ["Arche's margin is transferred to Arche's operating account at Citi Singapore (account being set up)", "The broker's margin is transferred to the broker's own operating account"],
 ["Citi Singapore", "Broker's bank"],
 ["Which money enters Arche's Citi account?", "Which money enters the broker's own bank account?"],
 ["Months 1 to 8: brokers share an on-call rota set by the director; the on-call broker answers the client line and operator calls out of office hours.", "Until a 24-hour desk is in place, brokers share an on-call rota set by your manager; the on-call broker answers the client line and operator calls out of office hours."],
 ["12.1 The Arche standard", "12.1 The service standard"], ["The Arche standard", "The service standard"],
 ["Meet the Arche service standard on every call", "Meet the service standard on every call"],
 ["After the exam: Avinode and Paynode training, 8 shadowed trips, the practical exam with the director, and 10 supervised bookings. The director signs your training record when all stages are complete.", "After the exam, your employer completes your practical training: Avinode and payment-platform training, shadowing on live trips, a practical exam and supervised bookings."],
 ["Avinode's core broker course for Paynode members; this is the Arche set-up", "Avinode's core broker course for Paynode members; the set-up this course uses"],
 ["The only way a client pays Arche", "How a client pays through Paynode"],
 ["Arche modules that prepare for it", "Modules that prepare for it"],
 ["The mapping is Arche's own guide to preparation; the ACA sets its own syllabus.", "The mapping is this course's own guide to preparation; the ACA sets its own syllabus."],
 ["This manual is the single standard for every Arche Executive broker and charter consultant.", "This course is a complete standard for charter brokers and charter consultants."],
 ["6. Payment taken outside Paynode, or bank details sent by email or chat.", "6. Payment taken outside the company's secure payment platform, or bank details sent by email or chat."],
 ["Because every Arche payment runs through Paynode, a payer", "Where payments run through Paynode, a payer"],
 ["The director's watchlist (Appendix G)", "The watchlist (Appendix G)"],
 ["Arche Executive acts as charter broker", "[Company] acts as charter broker"],
 ["\"Arche Executive, [name] speaking.", "\"[Company], [name] speaking."],
 ["from Arche Executive, a private jet charter broker", "from [Company], a private jet charter broker"],
 ["Arche cost", "Broker cost"], ["Arche margin", "Broker margin"],
 ["supplier items Arche buys", "supplier items the broker buys"], ["bought by Arche", "bought by the broker"],
 ["Arche's Paynode account", "the broker's Paynode account"], ["Arche's own", "the broker's own"], ["Only Arche's margin", "Only the broker's margin"], ["only our margin reaches Arche's account", "only the broker's margin reaches its own account"],
 ["Every Arche confirmation", "Every confirmation"], ["the Arche CRM", "the company CRM"], ["Arche CRM", "company CRM"],
 ["Arche's record-keeping rule", "your company's record-keeping rule"], ["Arche charter confirmation", "your company's charter confirmation"],
];
/* ---- 3. general wording: the company and its manager ---- */
const RX = [
 [/\bArche Executive's\b/g, "your company's"], [/\bArche's\b/g, "your company's"], [/\bArche Executive\b/g, "your company"], [/\bArche\b/g, "your company"],
 [/\bPart A\b/g, "the booking terms"], [/\bPart B\b/g, "the standard conditions"],
 [/\bThe director's\b/g, "Your manager's"], [/\bthe director's\b/g, "your manager's"], [/\bThe director\b/g, "Your manager"], [/\bthe director\b/g, "your manager"],
 [/\bDirector(?!s)\b/g, "Manager"], [/(?<!['’]s )\bdirector(?!s)\b/g, "manager"],
 [/(^|[.!?:]\s+|^"|\(\s*)your (company|manager)/g, (m, a, b) => a + "Your " + b],
];
const fix = s => {
  if (/^https?:/.test(s)) return s;
  if (EXACT[s]) return EXACT[s];
  for (const [a, b] of PREFIX) if (s.startsWith(a)) return b;
  for (const [a, b] of OVR) if (s.includes(a)) s = s.split(a).join(b);
  for (const [r, b] of RX) s = s.replace(r, b);
  return s;
};
const walk = o => { if (Array.isArray(o)) return o.map(x => typeof x === 'string' ? fix(x) : walk(x)); if (o && typeof o === 'object') { for (const k of Object.keys(o)) o[k] = typeof o[k] === 'string' ? fix(o[k]) : walk(o[k]); } return o; };
walk(O.MODS); walk(O.REF); walk(O.BOOK); walk(O.LAB); walk(O.COURSE);

/* course and paths without the removed parts */
O.COURSE.forEach(c => { if (c.id === 'm1') c.t = "The broker's role"; });
O.PATHS.consultant = O.PATHS.consultant.filter(id => O.MODS[id] || ['lab','book','exam'].includes(id));

/* ---- 3b. the missing topics take the place of the removed Arche material ---- */
{ const X = require('./ext_module.js')(O.L), M = X.mod;
  M.quiz.forEach(q => q.crit = false);
  M.min = Math.max(5, Math.round(JSON.stringify(M.secs).split(/\s+/).length/170 + M.quiz.length*0.7 + M.secs.length*0.5));
  O.MODS.m15 = M;
  O.COURSE.splice(O.COURSE.findIndex(c => c.id === 'exam'), 0, {id:'m15', n:'15', t:X.t, live:true});
  O.PATHS.broker.splice(O.PATHS.broker.indexOf('exam'), 0, 'm15');
  log.push('added Module 15 ' + X.t); }
/* ---- 4. nothing Arche-specific may remain ---- */
const left = []; const scan = (o, p) => { if (typeof o === 'string') { if ((/Arche|Navoryx|Citi\b/.test(o) || /\bdirector\b(?!s)/i.test(o)) && !/^https?:/.test(o)) left.push(p + ' :: ' + o.slice(0, 140)); } else if (Array.isArray(o)) o.forEach((x, i) => scan(x, p + '[' + i + ']')); else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => scan(v, p + '.' + k)); };
scan({MODS:O.MODS, REF:O.REF, BOOK:O.BOOK, LAB:O.LAB, COURSE:O.COURSE}, '');
const allowed = left.filter(x => /insurer['’]s (manager|director)/.test(x));
const bad = left.filter(x => !allowed.includes(x));
const J = JSON.stringify;
fs.writeFileSync('content.ext.full.js', `/* External edition: generated from the Arche course by ext.js */\n` + ['L','COURSE','PATHS','PILOT_REQ','MODS','REF','ISSUES','LAB','BOOK'].map(k => `const ${k} = ${J(k === 'PILOT_REQ' ? O.PATHS.broker : O[k])};`).join('\n'));
fs.writeFileSync('edition_map.json', J({removed: PARTS.map(p => p.t), rewritten: OVR.length, log}, null, 1));
let qn = 0; Object.values(O.MODS).forEach(m => qn += m.quiz.length);
console.log('external edition: questions', qn, '| removed parts', PARTS.length, '| Arche mentions left', bad.length);
bad.slice(0, 40).forEach(x => console.log('  LEFT', x));
if (bad.length) process.exit(1);
