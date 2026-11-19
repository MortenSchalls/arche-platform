/* ---------- Full trial booking (Morten, 19 Nov 2026: "I would need to have a trial booking feature to train total booking
   flow up to Avinode and after Avinode to combine all our details in one booking that will be sent to client"; "yes" to
   one full trial booking that guides and scores every step to the last landing and follow-up; manual 3.24, H.38).
   One more Booking practice exercise. Steps 0 to 6 are the usual ones (brief to training authorisation); after that it
   goes on through the steps after Avinode, each checked and scored: Request to Book and the operator's hold; the
   operator's own contract checked against its quote and our insurance minimum, not signed yet; the charter
   confirmation with this booking's payment schedule (BP.schedule) and cancellation charges (BP.cancelTable); the client
   signs and pays through the secure payment request; the operator's contract signed (BP.maySign) and the operator paid
   (BP.mayPay) only from cleared client money; the flight followed with block times in UTC; follow-up within 24 hours
   and the rating. Training data only, under train/<uid>/runs like every other run: nothing is real, sent or counted. ---------- */
const TB_STEPS = ["Brief","Enquiry","Avinode","Requests and extras","Price","Checks","Authorisation","Request to Book","Operator contract","Charter confirmation","Client signs and pays","Operator signed and paid","Flight following","Follow-up and rating"];
const TB_TERMS = {pay: [{days: "booking", pct: 30}, {days: 10, pct: 70}], cancel: [{days: "booking", pct: 20}, {days: 14, pct: 50}, {days: 3, pct: 100}]};
TR_SC.push({id: "s7", full: true, steps: TB_STEPS, title: "Full trial booking: Singapore to Tokyo", level: "Full flow",
  brief: c => `A Singapore family office books Singapore to Tokyo Haneda on ${fmtD(c.date)}, departing 08:30, for 7 passengers, one way. Super-midsize or heavy jet. They would like a Japanese breakfast on board, and they pay themselves. This exercise goes all the way: after authorisation you book the aircraft with the operator, issue the confirmation, take the client's payment, sign and pay the operator, follow the flight and follow up with the client.`,
  client: "Marina Bay Family Office (training)", country: "Singapore", date: () => plusDays(30), time: "08:30",
  from: ["WSSS","WSSL"], to: ["RJTT","RJAA"], pax: 7, cats: ["Super-midsize jet","Heavy jet"],
  need: [{sec: "requests", cat: "Catering", why: "A Japanese breakfast on board was requested."}],
  offers: [{op: "Lion City Jets Pte Ltd", st: "Singapore", type: "Challenger 350", cat: "Super-midsize jet", seats: 9, yom: 2018, rating: "ARGUS Platinum", reg: "9V-TRA"},
    {op: "Peninsula Air Charter Sdn Bhd", st: "Malaysia", type: "Falcon 2000LXS", cat: "Heavy jet", seats: 10, yom: 2016, rating: "Wyvern Wingman", reg: "9M-TRB"},
    {op: "Harbour Wings Ltd", st: "Hong Kong", type: "Praetor 600", cat: "Super-midsize jet", seats: 9, yom: 2020, rating: "ARGUS Gold", trap: "gold", k: 0.85, reg: "B-TRC"},
    {op: "Kanto Business Jet KK", st: "Japan", type: "Phenom 300E", cat: "Light jet", seats: 6, yom: 2021, rating: "ARGUS Platinum", trap: "tooSmall", reg: "JA-TRD"}]});

const tbAdd = (s, k) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const tbFull = r => !!(r && (trSc(r.sc) || {}).full);
/* the figures of this run: price, schedule, cancellation charges, the operator's hold */
function tbFigs(r){
  const o = r.offers[r.pick], issue = (r.started || now()).slice(0, 10), dep = ((r.enq || {}).legs || [{}])[0].date || r.expDate;
  const cc = CONF.evaluate(JSON.parse(JSON.stringify(_trConfData(r)))).cc, O = o.price, D = num(r.direct);
  const sched = BP.schedule({P: cc.price, F: cc.fixed, O, dep, issue, scale: TB_TERMS.cancel, pay: TB_TERMS.pay});
  const cancel = BP.cancelTable(cc.price, O, D, TB_TERMS.cancel), deposit = sched.length ? sched[0].amount : 0;
  return {o, O, D, P: cc.price, total: cc.total, issue, dep, hold: tbAdd(issue, 3), sched, cancel, deposit, opSign: Math.ceil(O * 30 / 100)};
}
const _trConfData = trConfData;
trConfData = function(r){ const data = _trConfData(r); if (!tbFull(r) || r.pick == null || !r.cf) return data;
  const f = tbFigs(r), o = f.o; data.plan = {sched: f.sched, cancel: f.cancel}; data.opScale = false;
  if (r.cf.valid) data.valid = {date: r.cf.valid, time: "18:00", tz: "Singapore (UTC+8)"};
  data.op.state = o.st; data.ac.seats = String(o.seats); data.ac.audit = `${o.rating}. All aircraft, passenger and third-party insurance is the operator's: passenger liability USD 50,000,000, certificate valid on the flight date, aircraft on it, confirmed with the insurer`;
  return data; };

/* the questions of each step: [key, question, options [value, label], right value, why] */
const TB_Q = {
  rtb: [["tail", "The aircraft and registration exactly as quoted", true], ["legs", "The leg, date, local time and 7 passengers", true], ["opp", "The operator's own quoted price", true], ["req", "The client's requests (the Japanese breakfast)", true],
    ["cp", "Our client price", false, "The operator never sees our client price or our fee."], ["pp", "The passengers' passport numbers", false, "Names and passports come with the signed confirmation; Archē never stores ID numbers."]],
  ocLines: o => [["ac", "Aircraft and registration", `${o.type} · ${o.reg}`, "ok"], ["legs", "Leg, date and passengers", "As requested", "ok"],
    ["price", "Price", `${usd(o.price + 1800)}, including a handling surcharge of USD 1,800`, "bad", `The operator quoted ${usd(o.price)}. Ask it to correct the contract to its quote; never add the difference to the client price without telling the client.`],
    ["pay", "Payment terms", "30% when the contract is signed, 70% 10 days before departure", "ok", "Earlier than our 7 days, which is allowed: the client then pays earlier, and the confirmation prints this booking's own schedule (A3)."],
    ["cancel", "Cancellation charges", "20% from signing, 50% under 14 days, 100% under 72 hours", "ok", "Allowed: the client pays the higher of our scale (A9) and the operator's charge plus our fee, shown on the confirmation."],
    ["ins", "Insurance certificate", "Passenger liability USD 25,000,000, valid past the flight date, aircraft on it", "bad", "A jet needs at least USD 50M (25M is the turboprop minimum). Ask for a certificate of at least USD 50M, valid on the flight date, with the aircraft and route covered, confirmed with the insurer or its broker."]],
  ocDec: [["sign", "Sign it now, so the aircraft is secured"], ["fix", "Ask the operator to correct the price to its quote and send a certificate of at least USD 50M confirmed with the insurer; record its terms; sign only once the client has signed and paid what the operator wants at that point"], ["pass", "Accept it and add the USD 1,800 to the client price"]],
  cfWhy: [["new", "The client is new to Archē"], ["op", "The operator wants 30% of its price when its contract is signed, and Archē never pre-funds the operator"], ["fee", "Archē's fee is higher on this trip"]],
  cfInc: [["op", "The operator, its country and its safety line", true], ["ac", "The aircraft and registration", true], ["legs", "The leg with date, time and passengers", true], ["one", "One price", true],
    ["sched", "This booking's payment schedule", true], ["canc", "This booking's cancellation charges", true], ["card", "A card fee on top of the price", false, "Card fees are a direct trip cost inside the price: one price, nothing on top."], ["bank", "Our bank details", false, "Never: the client pays only through the secure payment request."], ["opp", "The operator's price", false, "The client sees one price, never the operator's price or our fee."]],
  cpHow: [["pr", "A secure payment request from our payment provider"], ["bank", "Our bank details in an email"], ["phone", "Card details taken over the phone"]],
  cpRec: [["told", "When the client says the money has been sent"], ["clear", "When the money has cleared"], ["fly", "After the flight"]],
  cpPax: [["copy", "Keep copies of the passports in the trip file"], ["chk", "Check each traveller's name and passport against the sanctions lists and record that it was done, never the passport number"], ["skip", "Nothing: the operator checks passengers"]],
  osLate: [["advance", "Pay the operator from Archē's own money and collect from the client later"], ["chase", "Remind the client at once; if the money has not cleared before the operator's next payment or charge, cancel with the operator before it rises"], ["wait", "Wait until the day of departure"]],
  fuWhen: [["24", "Within 24 hours of the last landing"], ["week", "Within a week"], ["next", "When the client books again"]],
  fuLow: [["rec", "Start service recovery: call the client, find out what went wrong, put it right and tell the Director"], ["none", "Nothing: a 3 is an average score"], ["op", "Forward the rating to the operator and close the trip"]],
  fuQuote: [["yes", "Yes, ratings may always be quoted"], ["consent", "Only with the client's written consent"], ["anon", "Yes, if the name is left out"]]};

const tbRadio = (name, opts, val) => opts.map(([v, l]) => `<label class="check" for="${name}_${v}"><input type="radio" name="${name}" id="${name}_${v}" value="${v}" ${val === v ? "checked" : ""}><span>${esc(l)}</span></label>`).join("");
const tbVal = name => (document.querySelector(`input[name="${name}"]:checked`) || {}).value || "";
const tbNote = (ok, t) => `<div class="note ${ok ? "ok" : "bad"} small">${ok ? "Correct" : "Not right"}: ${esc(t)}</div>`;
const tbRow = (r, k, label) => { const done = (r[k] || {}).checked; return `<div class="row">${done ? `<button class="btn primary" type="button" data-tr="next">${esc(label)}</button>` : `<button class="btn primary" type="button" data-tr="tb" data-tbs="${k}">Check</button>`}</div>`; };
const tbAns = (list, v) => (list.find(x => x[0] === v) || [, ""])[1];

function tbView(r){
  const st = r.done ? 99 : (r.step || 0), f = tbFigs(r), o = f.o;
  if (st === 7) { const a = r.rtb || {}, inc = a.inc || {};
    return `<h3>Request to Book (Avinode, training)</h3><p class="small muted">Authorised. Now book the aircraft: send the operator a Request to Book on Avinode for ${esc(o.op)}'s ${esc(o.type)} ${esc(o.reg)}. Tick what goes in it.</p>
    ${TB_Q.rtb.map(([k, l]) => `<label class="check" for="tb_r_${k}"><input type="checkbox" id="tb_r_${k}" data-tbi="${k}" ${inc[k] ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}
    <div class="note info small" style="margin-top:8px"><b>Operator's answer on Avinode (training):</b> "Request to Book received. We hold ${esc(o.reg)} for you until ${fmtD(f.hold)}, 18:00 Singapore time. Our contract follows."</div>
    <label class="f" for="tb_hold" style="max-width:320px">The operator holds the aircraft until<input type="date" id="tb_hold" value="${esc(a.hold || "")}"></label>
    ${a.checked ? TB_Q.rtb.map(([k, l, want, why]) => (!!inc[k] === want) ? "" : tbNote(false, want ? `"${l}" belongs in the Request to Book.` : why)).join("") + tbNote(a.holdOk, `Record the hold: ${fmtD(f.hold)}. Your offer to the client must end no later than that.`) + (a.incOk ? tbNote(true, "The Request to Book carries the aircraft, the leg, the operator's price and the client's requests.") : "") : ""}
    ${tbRow(r, "rtb", "Next: the operator's contract")}`; }
  if (st === 8) { const a = r.oc || {}, lines = TB_Q.ocLines(o), ln = a.lines || {};
    return `<h3>The operator's contract (training)</h3><p class="small muted">${esc(o.op)} sends its own contract. Check every line against its quote and our rules. Mark each line fine or a problem.</p>
    <div class="tbl"><table class="small"><thead><tr><th scope=col>Line</th><th scope=col>In the contract</th><th scope=col>Fine</th><th scope=col>Problem</th></tr></thead><tbody>
    ${lines.map(([k, l, v]) => `<tr><td>${esc(l)}</td><td>${esc(v)}</td><td><input type="radio" name="tb_oc_${k}" value="ok" ${ln[k] === "ok" ? "checked" : ""} aria-label="${esc(l)}: fine"></td><td><input type="radio" name="tb_oc_${k}" value="bad" ${ln[k] === "bad" ? "checked" : ""} aria-label="${esc(l)}: problem"></td></tr>`).join("")}</tbody></table></div>
    <h3>What do you do now?</h3>${tbRadio("tb_ocd", TB_Q.ocDec, a.dec)}
    ${a.checked ? lines.map(([k, l, v, want, why]) => tbNote(ln[k] === want, `${l}: ${want === "ok" ? "fine" : "a problem"}.${why ? " " + why : ""}`)).join("") + tbNote(a.dec === "fix", "The operator's contract is signed only after the client has signed the confirmation and paid what the operator wants at that point. First the contract must match the quote and our insurance minimum.") + `<div class="note info small"><b>Operator (training):</b> "Corrected: price ${usd(o.price)} as quoted. Renewed certificate attached: passenger liability USD 50,000,000, ${esc(o.reg)} on it, valid past your flight date, confirmed by our insurance broker." Its payment terms and cancellation charges are now recorded on the trip.</div>` : ""}
    ${tbRow(r, "oc", "Next: the charter confirmation")}`; }
  if (st === 9) { const a = r.cf || {}, inc = a.inc || {};
    return `<h3>Charter confirmation (training)</h3><p class="small muted">The confirmation is the one document the client receives. Client price ${usd(f.P)}${f.total !== f.P ? ` (total with fixed extras ${usd(f.total)})` : ""}, confirmation dated ${fmtD(f.issue)}, first departure ${fmtD(f.dep)}. The operator wants 30% of its price (${usd(f.O)}) when its contract is signed and 70% 10 days before departure; its cancellation charges: 20% from signing, 50% under 14 days, 100% under 72 hours.</p>
    <div class="fgrid"><label class="f" for="tb_dep">Due on signature (USD)<input id="tb_dep" inputmode="decimal" value="${esc(a.dep || "")}"></label><label class="f" for="tb_valid">Offer valid until<input type="date" id="tb_valid" value="${esc(a.valid || "")}"></label></div>
    <h3>Why is more than 25% due on signature?</h3>${tbRadio("tb_cfw", TB_Q.cfWhy, a.why)}
    <h3>What does the confirmation show?</h3>${TB_Q.cfInc.map(([k, l]) => `<label class="check" for="tb_c_${k}"><input type="checkbox" id="tb_c_${k}" data-tbc="${k}" ${inc[k] ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}
    ${a.checked ? tbNote(a.depOk, `Due on signature: ${usd(f.deposit)}, at least the 30% the operator wants when its contract is signed (${usd(f.opSign)}), more than 25% of the price (A3).`) + tbNote(a.whyOk, tbAns(TB_Q.cfWhy, "op") + ".") + tbNote(a.validOk, `The offer ends no later than the operator's hold, ${fmtD(f.hold)}.`) + TB_Q.cfInc.map(([k, l, want, why]) => (!!inc[k] === want) ? "" : tbNote(false, want ? `The confirmation shows ${l.toLowerCase()}.` : why)).join("") + (a.incOk ? tbNote(true, "Operator, aircraft, leg, one price, this booking's schedule and cancellation charges, the safety and insurance line.") : "")
      + `<p class="small muted" style="margin-top:8px">This is the confirmation the Director would issue, with this booking's own payment schedule and cancellation charges. In training it is never issued.</p><div class="trconf">${sheetsHtml(trConfData(r), true)}</div>` : ""}
    ${tbRow(r, "cf", "Next: the client signs and pays")}`; }
  if (st === 10) { const a = r.cp || {};
    return `<h3>The client signs and pays (training)</h3><p class="small muted">The client has signed the confirmation (simulated) and sends the travellers' names and passports with it. ${usd(f.deposit)} is due now.</p>
    <h3>How does the client pay?</h3>${tbRadio("tb_cph", TB_Q.cpHow, a.how)}<h3>When do you record the payment?</h3>${tbRadio("tb_cpr", TB_Q.cpRec, a.rec)}<h3>What do you do with the passports?</h3>${tbRadio("tb_cpp", TB_Q.cpPax, a.pax)}
    ${a.checked ? tbNote(a.how === "pr", "Only through the secure payment request from Archē's payment provider. Never print or send bank details, never take card details by hand.") + tbNote(a.rec === "clear", "Record client money only once it has cleared: the operator is paid only from cleared money.") + tbNote(a.pax === "chk", "Every traveller is checked against the sanctions lists on every trip; Archē stores no ID numbers.") + `<div class="note info small"><b>Payment provider (training):</b> ${usd(f.deposit)} received and cleared.</div>` : ""}
    ${tbRow(r, "cp", "Next: the operator")}`; }
  if (st === 11) { const a = r.os || {};
    return `<h3>The operator: sign and pay (training)</h3><p class="small muted">Cleared client money held: ${usd(f.deposit)}. The operator wants 30% of ${usd(f.O)} when its contract is signed; from signing its cancellation charge is 20%.</p>
    <h3>May the operator's contract be signed now?</h3>${tbRadio("tb_oss", [["yes", "Yes"], ["no", "No"]], a.sign)}
    <label class="f" for="tb_osp" style="max-width:320px">Pay the operator now (USD)<input id="tb_osp" inputmode="decimal" value="${esc(a.amt || "")}"></label>
    <h3>12 days before departure the operator wants the other 70%, but the client's next payment has not cleared. What do you do?</h3>${tbRadio("tb_osl", TB_Q.osLate, a.late)}
    ${a.checked ? tbNote(a.signOk, `Yes: the cleared ${usd(f.deposit)} covers the ${usd(f.opSign)} the operator wants at signing and its 20% cancellation charge.`) + tbNote(a.amtOk, `Pay ${usd(f.opSign)}, what its terms want now: only from cleared client money, never more than received and never more than the operator price.`) + tbNote(a.late === "chase", "Archē never pre-funds. The client pays earlier than the operator wants (the schedule allows two days); if the money is not there, cancel with the operator before its charge rises.") : ""}
    ${tbRow(r, "os", "Next: the flight")}`; }
  if (st === 12) { const a = r.ff || {};
    return `<h3>Flight following (training)</h3><p class="small muted">Follow the flight to the last landing. The operator's messages (training):</p>
    <div class="note info small">"${esc(o.reg)} off blocks Singapore 08:40 local time (UTC+8)." · "On blocks Tokyo Haneda 16:45 local time (UTC+9). No fuel stop." · Filed route (training): via the Singapore, Manila, Taipei and Fukuoka flight information regions.</div>
    <p class="small muted">After the flight the trip's broker records each leg for the route library: the filed route, off-block and on-block in UTC, any fuel stop.</p>
    <div class="fgrid"><label class="f" for="tb_off">Off-block (UTC)<input type="time" id="tb_off" value="${esc(a.off || "")}"></label><label class="f" for="tb_on">On-block (UTC)<input type="time" id="tb_on" value="${esc(a.on || "")}"></label><label class="f" for="tb_route">Filed route<input id="tb_route" value="${esc(a.route || "")}" placeholder="As in the operator's flight plan"></label><label class="f" for="tb_stop">Fuel stop<select id="tb_stop"><option value=""></option>${["None", "Manila", "Taipei"].map(x => `<option ${a.stop === x ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
    ${a.checked ? tbNote(a.offOk, "Off-block 00:40 UTC (08:40 in Singapore, UTC+8).") + tbNote(a.onOk, "On-block 07:45 UTC (16:45 in Tokyo, UTC+9).") + tbNote(a.routeOk, "Route as filed and no fuel stop.") : ""}
    ${tbRow(r, "ff", "Next: follow-up and rating")}`; }
  if (st === 13) { const a = r.fu || {}, price = f.P, gp = price - f.O - f.D;
    return `<h3>Follow-up and rating (training)</h3><p class="small muted">The flight has landed. You own the trip until the final follow-up.</p>
    <h3>When do you follow up with the client?</h3>${tbRadio("tb_fuw", TB_Q.fuWhen, a.when)}
    <div class="note info small"><b>Client rating (training):</b> 3 of 5. "The breakfast was not loaded at Seletar; the crew were kind about it."</div>
    <h3>What do you do?</h3>${tbRadio("tb_ful", TB_Q.fuLow, a.low)}<h3>May the client's rating be quoted on our website?</h3>${tbRadio("tb_fuq", TB_Q.fuQuote, a.quote)}
    ${a.checked ? tbNote(a.when === "24", "The broker follows up within 24 hours of the last landing and sends the rating request.") + tbNote(a.low === "rec", "A score of 3 or less starts service recovery.") + tbNote(a.quote === "consent", "Ratings are quoted publicly only with the client's written consent; never write, buy or reward reviews.")
      + `<div class="price"><span>Client price</span><span class="mono">${usd(price)}</span><span>Operator price and direct costs</span><span class="mono">${usd(f.O + f.D)}</span><span class="tot">Archē fee</span><span class="tot mono">${usd(gp)}</span><span>Your commission at ${(S.terms.rate1 * 100).toFixed(0)}% (first ${S.terms.threshold} bookings a month)</span><span class="mono">${usd(gp * S.terms.rate1)}</span></div><p class="small muted">Training only: this is not counted anywhere.</p>` : ""}
    <div class="row">${a.checked ? `<button class="btn primary" type="button" data-tr="finish">See your score</button>` : `<button class="btn primary" type="button" data-tr="tb" data-tbs="fu">Check</button>`}</div>`; }
  const s = r.scores || trScore(r);
  return `<h3>Your score: ${s.total} of 100</h3><table class="small"><tbody>${TB_PARTS.map(([k, l, m]) => `<tr><td>${l}</td><td class="n">${s[k] ?? 0} / ${m}</td></tr>`).join("")}</tbody></table>
    <p class="small muted">${s.total >= 80 ? "Ready for a real booking from the first enquiry to the last landing." : "Run it again: the operators and figures stay the same, so you can see what you missed."} Your scores are visible to the Director.</p><div class="row"><button class="btn primary" type="button" data-tr="start" data-sc="${r.sc}">Try again</button></div>`;
}
const TB_PARTS = [["enquiry","Enquiry",15],["operator","Operator choice",20],["requests","Requests and extras",15],["price","Price",10],["checks","Checks and decision",15],["firstTime","Right first time",10],
  ["rtb","Request to Book",10],["oc","Operator contract",15],["cf","Charter confirmation",15],["cp","Client signs and pays",10],["os","Operator signed and paid",15],["ff","Flight following",10],["fu","Follow-up and rating",10]];

/* grading: what the trainee answered the first time stays in the score */
function tbCheck(r, k){
  const f = tbFigs(r), o = f.o;
  if (k === "rtb") { const inc = {}; document.querySelectorAll("[data-tbi]").forEach(el => inc[el.dataset.tbi] = el.checked); const hold = $("tb_hold").value;
    const incOk = TB_Q.rtb.every(([q, , want]) => !!inc[q] === want), holdOk = hold === f.hold;
    return {inc, hold, incOk, holdOk, pts: (incOk ? 6 : 0) + (holdOk ? 4 : 0)}; }
  if (k === "oc") { const lines = {}, L = TB_Q.ocLines(o); L.forEach(([q]) => lines[q] = tbVal("tb_oc_" + q)); const dec = tbVal("tb_ocd");
    if (L.some(([q]) => !lines[q]) || !dec) return {err: "Mark every line and choose what you do."};
    return {lines, dec, pts: L.filter(([q, , , want]) => lines[q] === want).length * 2 + (dec === "fix" ? 3 : 0)}; }
  if (k === "cf") { const inc = {}; document.querySelectorAll("[data-tbc]").forEach(el => inc[el.dataset.tbc] = el.checked);
    const dep = num($("tb_dep").value), valid = $("tb_valid").value, why = tbVal("tb_cfw"); if (!dep || !valid || !why) return {err: "Fill in what is due on signature, the offer's end and why."};
    const depOk = dep === f.deposit, validOk = valid >= f.issue && valid <= f.hold, whyOk = why === "op", incOk = TB_Q.cfInc.every(([q, , want]) => !!inc[q] === want);
    return {inc, dep, valid, why, depOk, validOk, whyOk, incOk, pts: (depOk ? 5 : 0) + (whyOk ? 3 : 0) + (validOk ? 3 : 0) + (incOk ? 4 : 0)}; }
  if (k === "cp") { const how = tbVal("tb_cph"), rec = tbVal("tb_cpr"), pax = tbVal("tb_cpp"); if (!how || !rec || !pax) return {err: "Answer all three."};
    return {how, rec, pax, pts: (how === "pr" ? 4 : 0) + (rec === "clear" ? 3 : 0) + (pax === "chk" ? 3 : 0)}; }
  if (k === "os") { const sign = tbVal("tb_oss"), amt = num($("tb_osp").value), late = tbVal("tb_osl"); if (!sign || !amt || !late) return {err: "Answer all three."};
    const may = BP.maySign({O: f.O, scale: TB_TERMS.cancel, pay: TB_TERMS.pay, received: f.deposit, daysLeft: (Date.parse(f.dep) - Date.parse(f.issue)) / 864e5});
    const signOk = (sign === "yes") === may.ok, amtOk = amt === f.opSign && BP.mayPay({O: f.O, received: f.deposit, paid: 0, amount: amt}).ok;
    return {sign, amt, late, signOk, amtOk, pts: (signOk ? 5 : 0) + (amtOk ? 5 : 0) + (late === "chase" ? 5 : 0)}; }
  if (k === "ff") { const off = $("tb_off").value, on = $("tb_on").value, route = $("tb_route").value.trim(), stop = $("tb_stop").value; if (!off || !on || !stop) return {err: "Fill in both block times and the fuel stop."};
    const offOk = off === "00:40", onOk = on === "07:45", routeOk = !!route && stop === "None";
    return {off, on, route, stop, offOk, onOk, routeOk, pts: (offOk ? 4 : 0) + (onOk ? 4 : 0) + (routeOk ? 2 : 0)}; }
  if (k === "fu") { const when = tbVal("tb_fuw"), low = tbVal("tb_ful"), quote = tbVal("tb_fuq"); if (!when || !low || !quote) return {err: "Answer all three."};
    return {when, low, quote, pts: (when === "24" ? 3 : 0) + (low === "rec" ? 4 : 0) + (quote === "consent" ? 3 : 0)}; }
  return {err: "Unknown step."};
}

const _trRunView = trRunView;
trRunView = function(r){
  if (!tbFull(r) || ((r.step || 0) < 7 && !r.done)) { const h = _trRunView(r); return tbFull(r) ? h.replace(">See the confirmation<", ">Next: Request to Book<") : h; }
  const sc = trSc(r.sc);
  return `<div class="panel stack trpanel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(sc.title)}</h2><span class="chip c-review">Training</span></div>${trStepper(r)}${tbView(r)}</div>`;
};
const _trScore = trScore;
trScore = function(r){ const s = _trScore(r); if (!tbFull(r)) return s;
  const out = {}; ["enquiry","operator","requests","price","checks","firstTime"].forEach(k => out[k] = s[k]);
  ["rtb","oc","cf","cp","os","ff","fu"].forEach(k => out[k] = (r[k] || {}).pts || 0);
  const max = TB_PARTS.reduce((a, p) => a + p[2], 0), got = TB_PARTS.reduce((a, [k]) => a + (out[k] || 0), 0);
  out.total = Math.round(got * 100 / max); return out; };
const _trAct = trAct;
trAct = async function(a, el){
  if (a !== "tb") return _trAct(a, el);
  const r = trRun(); if (!r || !tbFull(r)) return; const k = el.dataset.tbs;
  try { if ((r[k] || {}).checked) return; const res = tbCheck(r, k); if (res.err) { toast(res.err); return; }
    S.dirty.clear(); await trSave(r, {[k]: {...res, checked: true}}); }
  catch(e){ console.warn(e); toast("Could not save the training step. Try again."); }
};
