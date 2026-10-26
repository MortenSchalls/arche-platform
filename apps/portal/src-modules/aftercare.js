/* ---------- Beta 20: flight following, aftercare and rating, post-trip debrief, roleplay lab, reference cards, operator scorecard (manual v3.8: 11.5, 14.4–14.6, Appendix J) ---------- */
const LEG_ST = [["","Scheduled"],["dep","Departed"],["land","Landed"],["delay","Delayed"],["div","Diverted"],["canc","Cancelled"]];
const AC_CH = ["Call","Message","Email","Meeting"];
const DB_M = [["m1","Pre-issue checks (A.1)"],["m2","Extras and changes explained to the client"],["m3","Client satisfaction"]];
const addH = (iso, h) => new Date(new Date(iso).getTime() + h * 3600000).toISOString();
const workDayAfter = iso => { const d = new Date(iso); do { d.setDate(d.getDate() + 1); } while ([0,6].includes(d.getDay())); return d.toISOString(); };
const isSup = bid => !!((S.roster[bid] || (bid === S.uid ? S.myRoster : null) || {}).supervised);
function legsOf(t){ return ((t.d.trip || {}).legs) || []; }
function legSt(t){ const st = t.st || {}; const ls = st.legStatus || []; return legsOf(t).map((l, i) => ls[i] || {}); }
function allLanded(t){ const ls = legSt(t); return ls.length > 0 && ls.every(x => x.s === "land" || x.s === "canc") && ls.some(x => x.s === "land"); }
function lastLanding(t){ const ls = legSt(t).filter(x => x.s === "land" && x.at); return ls.length ? ls.map(x => x.at).sort().slice(-1)[0] : null; }
function acStatus(t){
  const d = t.d, st = t.st || {}; if (t.stage !== "flown") return null;
  const base = lastLanding(t) || (st.flownDate ? st.flownDate + "T12:00:00Z" : null);
  const due = base ? addH(base, 24) : null;
  const r = d.rating || null, fu = d.followUp || null, rq = d.ratingReq || null;
  const low = r && num(r.overall) > 0 && num(r.overall) <= 3, rec = d.recovery || null;
  const sup = isSup(t.bid), db = {t: d.debrief || null, m: (st.debrief || {}).mentor || null, o: (st.debrief || {}).ops || null};
  const dbDone = !sup || (db.t && db.m && db.o);
  const paid = !!(st.clientPaid && st.operatorPaid);
  return {due, fu, rq, r, low, rec, sup, db, dbDone, paid, overdue: !fu && due && new Date(due) < new Date(), closed: paid && !!fu && !!rq && (!low || !!rec) && dbDone};
}
function rateMail(t){
  const d = t.d, st = t.st || {}, c = d.client || {}, co = S.company || {}, ref = st.ref || t.did;
  const legs = legsOf(t), route = legs.map(l => l.from).concat(legs.length ? [legs[legs.length - 1].to] : []).join("–"), date = legs[0] ? fmtD(legs[0].date) : "";
  const me = (S.roster[t.bid] || {}).contractName || (t.bid === S.uid ? (S.myName || "") : nm(t.bid));
  const to = co.email || "";
  const link = n => `mailto:${to}?subject=${encodeURIComponent(`Rating ${n} – ${ref}`)}`;
  const body = [`Dear ${c.name || "Sir or Madam"},`, "", "Welcome back. Thank you for flying with Archē Executive. I hope everything was as you expected.", "",
    `If anything was not right, please reply to this email${co.phone ? " or call " + co.phone : ""}; I will deal with it personally.`, "",
    ...(to ? ["Would you rate your trip? One click is enough:", `5 Excellent: ${link(5)}`, `4 Good: ${link(4)}`, `3 Fair: ${link(3)}`, `2 Poor: ${link(2)}`, `1 Very poor: ${link(1)}`] : ["Would you rate your trip? Simply reply with a number from 5 (excellent) to 1 (very poor)."]), "",
    "You may add a comment for the aircraft, the crew or me.", "",
    "We use ratings only to improve our service and choose our operators. We never publish your rating or words without your written permission.", "",
    "Kind regards,", me, "Archē Executive"].join("\n");
  const cc = to ? `&cc=${encodeURIComponent(to)}` : "";
  return `mailto:${encodeURIComponent(c.email || "")}?subject=${encodeURIComponent(`Your flight ${route}${date ? ", " + date : ""} – how did we do?`)}${cc}&body=${encodeURIComponent(body)}`;
}
function scoreSel(id, v){ return `<select id="${id}" style="width:auto">${["","5","4","3","2","1"].map(x => `<option value="${x}" ${String(v ?? "") === x ? "selected" : ""}>${x || "–"}</option>`).join("")}</select>`; }

/* flight following: every leg until the last landing */
function followBlock(t){
  if (!["issued","clientPaid","flown"].includes(t.stage)) return "";
  const legs = legsOf(t); if (!legs.length) return "";
  const ls = legSt(t), canEdit = isStaff() && acting() !== "broker" && !ownTrip(t) && !S.preview;
  const rows = legs.map((l, i) => { const x = ls[i] || {}, lab = (LEG_ST.find(s => s[0] === (x.s || "")) || LEG_ST[0])[1];
    return `<tr><td><b>${esc(l.from)} → ${esc(l.to)}</b><br><span class="muted small">${fmtD(l.date)} ${esc(l.time || "")}</span></td>
      <td>${canEdit ? `<select id="lg_s${i}" style="width:auto" aria-label="Status, leg ${i + 1}">${LEG_ST.map(s => `<option value="${s[0]}" ${(x.s || "") === s[0] ? "selected" : ""}>${s[1]}</option>`).join("")}</select>` : `<span class="chip ${x.s === "land" ? "c-flown" : x.s === "delay" || x.s === "div" ? "c-review" : x.s === "canc" ? "c-cancelled" : x.s === "dep" ? "c-quoted" : "c-enquiry"}">${lab}</span>`}</td>
      <td>${canEdit ? `<input id="lg_t${i}" type="datetime-local" style="width:auto" value="${esc((x.at || "").slice(0, 16))}" aria-label="Time, leg ${i + 1}">` : (x.at ? `<span class="small">${fmtT(x.at)}</span>` : `<span class="muted small">–</span>`)}</td>
      <td>${canEdit ? `<input id="lg_n${i}" value="${esc(x.note || "")}" placeholder="Note to the broker" aria-label="Note, leg ${i + 1}">` : `<span class="small">${esc(x.note || "")}</span>`}</td></tr>`; }).join("");
  const done = allLanded(t), st = t.st || {};
  return `<div class="panel stack" id="followPanel"><h3 style="margin:0">Flight following</h3><p class="small muted">Follow every leg until the last passenger has landed (manual 11.5). Operations or the 24/7 desk enters the operator's times; tell the client at once about any change.</p>
    <div class="tbl"><table class="small"><thead><tr><th scope=col>Leg</th><th scope=col>Status</th><th scope=col>Local time</th><th scope=col>Note</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${canEdit ? `<div class="row"><button class="btn small" type="button" data-ac="legSave">Save leg status</button>${done && st.clientPaid && !st.flownDate ? `<button class="btn small primary" type="button" data-ac="legFlown">Last leg landed: record flight</button>` : ""}</div>` : ""}
    ${done && !st.flownDate ? `<p class="small">All legs landed${st.clientPaid ? "" : "; record the client payment first, then the flight"}.</p>` : ""}</div>`;
}

/* aftercare: follow-up, rating, service recovery, debrief, closing */
function aftercareBlock(t){
  const a = acStatus(t); if (!a) return "";
  const mine = t.bid === S.uid || S.isOwner, staff = isStaff() && !S.preview, d = t.d, r = a.r || {};
  const chips = [["Payments settled", a.paid], ["Follow-up logged", !!a.fu], ["Rating request sent", !!a.rq], ...(a.low ? [["Service recovery done", !!a.rec]] : []), ...(a.sup ? [["Debrief signed", a.dbDone]] : [])];
  const fu = a.fu ? `<p class="small"><b>Follow-up:</b> ${esc(a.fu.ch)} on ${fmtT(a.fu.at)} by ${esc(nm(a.fu.by))}${a.fu.note ? " · " + esc(a.fu.note) : ""}</p>` : (mine ? `<div class="fgrid"><label class="f" for="ac_ch">How<select id="ac_ch">${AC_CH.map(x => `<option>${x}</option>`).join("")}</select></label><label class="f" for="ac_nt">What the client said<input id="ac_nt" placeholder="Short note, no personal details beyond the trip"></label></div><div class="row"><button class="btn small primary" type="button" data-ac="fuSave">Log follow-up</button></div>` : `<p class="small muted">Waiting for the broker's follow-up.</p>`);
  const rq = a.rq ? `<p class="small"><b>Rating request:</b> sent ${fmtT(a.rq.at)}</p>` : (mine ? `<div class="row"><a class="btn small" href="${esc(rateMail(t))}" data-ac="rateSent">Email the rating request</a></div><p class="small muted">Opens your email with template B.10 and one-click 1–5 links that reply to ${esc((S.company || {}).email || "the bookings address in Settings")}.</p>` : "");
  const rt = a.r ? `<p class="small"><b>Rating:</b> overall ${esc(r.overall)}/5${r.aircraft ? ` · aircraft ${esc(r.aircraft)}` : ""}${r.crew ? ` · crew ${esc(r.crew)}` : ""}${r.broker ? ` · broker ${esc(r.broker)}` : ""}${r.comment ? `<br>“${esc(r.comment)}”` : ""}${r.consent ? ` <span class="chip c-flown">May be quoted</span>` : ""}</p>`
    : ((mine || staff) && a.rq ? `<div class="fgrid"><label class="f" for="rt_o">Overall${scoreSel("rt_o")}</label><label class="f" for="rt_a">Aircraft${scoreSel("rt_a")}</label><label class="f" for="rt_c">Crew${scoreSel("rt_c")}</label><label class="f" for="rt_b">Broker${scoreSel("rt_b")}</label><label class="f wide" for="rt_m">Comment<textarea id="rt_m"></textarea></label></div><label class="check" for="rt_ok"><input type="checkbox" id="rt_ok"><span>The client has agreed in writing that we may quote this</span></label><div class="row"><button class="btn small" type="button" data-ac="rateSave">Record rating</button></div>` : "");
  const rec = a.low ? (a.rec ? `<div class="note ok small"><b>Service recovery done</b> ${fmtT(a.rec.at)}: ${esc(a.rec.note || "")}</div>` : `<div class="note bad small"><b>Service recovery.</b> Score of 3 or less: call the client by ${fmtT(workDayAfter(r.at || now()))}; the director has been told.${mine ? `<label class="f" for="rc_n" style="margin-top:6px">What was agreed with the client<input id="rc_n"></label><div class="row"><button class="btn small" type="button" data-ac="recSave">Recovery done</button></div>` : ""}</div>`) : "";
  return `<div class="panel stack" id="acPanel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Aftercare</h3><span class="chip ${a.closed ? "c-flown" : a.overdue ? "c-returned" : "c-review"}">${a.closed ? "File closed" : a.overdue ? "Follow-up overdue" : "Open"}</span></div>
    <p class="small muted">Personal follow-up within 24 hours of the last landing${a.due ? ` (by ${fmtT(a.due)})` : ""}, the rating request at the same time, and service recovery for any score of 3 or less (manual 11.5). The file closes when every item is done.</p>
    <div class="row" style="gap:6px">${chips.map(([l, ok]) => `<span class="chip ${ok ? "c-flown" : "c-enquiry"}">${ok ? "✓ " : ""}${l}</span>`).join("")}</div>
    ${fu}${rq}${rt}${rec}${a.sup ? debriefBlock(t, a) : ""}</div>`;
}
function dbPart(key, who, v, can){
  if (v) return `<div><p class="small"><b>${who}</b> · signed ${fmtT(v.at)} by ${esc(nm(v.by))}</p><p class="small">${DB_M.map(([k, l]) => v[k] ? `${l}: ${esc(v[k])}/5` : "").filter(Boolean).join(" · ")}</p>${v.err ? `<p class="small">Errors: ${esc(v.err)}</p>` : ""}${v.well ? `<p class="small">Went well: ${esc(v.well)}</p>` : ""}${v.change ? `<p class="small">Do differently: ${esc(v.change)}</p>` : ""}${v.action ? `<p class="small">Action: ${esc(v.action)}</p>` : ""}</div>`;
  if (!can) return `<p class="small muted">${who}: not signed yet.</p>`;
  return `<div class="stack"><p class="small"><b>${who}</b></p><div class="fgrid">${DB_M.map(([k, l]) => `<label class="f" for="db_${key}_${k}">${l}${scoreSel(`db_${key}_${k}`)}</label>`).join("")}
    <label class="f wide" for="db_${key}_err">Errors found (critical / minor, or none)<input id="db_${key}_err"></label><label class="f" for="db_${key}_well">What went well<input id="db_${key}_well"></label><label class="f" for="db_${key}_change">What to do differently<input id="db_${key}_change"></label><label class="f wide" for="db_${key}_action">Action, owner and date<input id="db_${key}_action"></label></div>
    <div class="row"><button class="btn small" type="button" data-ac="dbSave" data-part="${key}">Sign ${who.toLowerCase()} part</button></div></div>`;
}
function debriefBlock(t, a){
  const staff = isStaff() && !S.preview && t.bid !== S.uid;
  return `<div class="stack" style="border-top:1px solid var(--line);padding-top:10px"><h3 style="margin:0">Post-trip debrief (supervised booking)</h3><p class="small muted">Trainee, mentor and operations each score the three measures within 3 working days of the last landing (manual 14.6, template B.9). The booking counts towards sign-off only when all three have signed.</p>
    ${dbPart("t", "Trainee", a.db.t, t.bid === S.uid)}${dbPart("m", "Mentor", a.db.m, staff && (S.isOwner || S.role === "ops"))}${dbPart("o", "Operations", a.db.o, staff && (S.role === "ops" || S.isOwner))}</div>`;
}

/* task list for Today and the dashboard */
function acTasks(all){
  const out = [];
  for (const t of allTrips()) {
    if (!all && t.bid !== S.uid) continue;
    const a = acStatus(t); if (!a || a.closed) continue;
    const who = all ? ` · ${nm(t.bid)}` : "", ref = (t.st && t.st.ref) || t.did, cl = (t.d.client && (t.d.client.company || t.d.client.name)) || "";
    if (!a.fu) out.push([a.overdue ? "high" : "med", `${a.overdue ? "Overdue: follow up" : "Follow up"} ${cl}${who}`, t, ref]);
    else if (!a.rq) out.push(["med", `Send the rating request to ${cl}${who}`, t, ref]);
    if (a.low && !a.rec) out.push(["high", `Service recovery: ${cl} rated ${a.r.overall}/5${who}`, t, ref]);
    if (a.sup && !a.dbDone) out.push(["low", `Debrief to sign: ${ref}${who}`, t, ref]);
  }
  return out;
}
function acTaskPanel(all){
  const ts = acTasks(all); if (!ts.length) return "";
  return `<div class="panel" style="margin-bottom:16px"><h2>Aftercare</h2>${ts.slice(0, 12).map(([s, txt, t, ref]) => `<div class="flag"><span class="sev ${s}" aria-hidden="true"></span><div><p>${esc(txt)}</p><p class="small muted"><span class="mono">${esc(ref)}</span> · <a href="#" data-open="${t.bid}|${t.did}" data-goto="trips">Open trip</a></p></div></div>`).join("")}</div>`;
}

/* operator scorecard and service scores (Control) */
function scorecards(){
  const op = {}, br = {};
  for (const t of allTrips()) { const r = t.d.rating; if (!r || !num(r.overall)) continue; const o = (t.d.quote && t.d.quote.operator) || "Unknown operator";
    (op[o] = op[o] || {n:0, s:0, ac:0, an:0, cr:0, cn:0}); op[o].n++; op[o].s += num(r.overall); if (num(r.aircraft)) { op[o].ac += num(r.aircraft); op[o].an++; } if (num(r.crew)) { op[o].cr += num(r.crew); op[o].cn++; }
    (br[t.bid] = br[t.bid] || {n:0, s:0, b:0, bn:0, low:0}); br[t.bid].n++; br[t.bid].s += num(r.overall); if (num(r.broker)) { br[t.bid].b += num(r.broker); br[t.bid].bn++; } if (num(r.overall) <= 3) br[t.bid].low++; }
  const f = (a, b) => b ? (a / b).toFixed(1) : "–";
  return `<div class="grid2" style="margin-top:16px"><div class="panel tbl"><h2>Operator scorecard</h2><p class="small muted">From client ratings after each flight. Book the operators clients rate highest; review any operator averaging 3.5 or less with the director.</p><table class="small"><thead><tr><th scope=col>Operator</th><th scope=col class="n">Trips rated</th><th scope=col class="n">Overall</th><th scope=col class="n">Aircraft</th><th scope=col class="n">Crew</th></tr></thead><tbody>${Object.entries(op).sort((a, b) => b[1].s / b[1].n - a[1].s / a[1].n).map(([o, x]) => `<tr><td>${esc(o)}</td><td class="n">${x.n}</td><td class="n">${f(x.s, x.n)}</td><td class="n">${f(x.ac, x.an)}</td><td class="n">${f(x.cr, x.cn)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">No ratings yet.</td></tr>`}</tbody></table></div>
  <div class="panel tbl"><h2>Service scores</h2><table class="small"><thead><tr><th scope=col>Broker</th><th scope=col class="n">Trips rated</th><th scope=col class="n">Overall</th><th scope=col class="n">Broker score</th><th scope=col class="n">3 or less</th></tr></thead><tbody>${Object.entries(br).map(([b, x]) => `<tr><td>${esc(nm(b))}</td><td class="n">${x.n}</td><td class="n">${f(x.s, x.n)}</td><td class="n">${f(x.b, x.bn)}</td><td class="n">${x.low}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">No ratings yet.</td></tr>`}</tbody></table></div></div>`;
}

/* supervised brokers (Team) */
function supPanel(){
  const ros = Object.entries(S.roster).filter(([, p]) => p.active !== false && p.role !== "ops");
  const cnt = bid => allTrips().filter(t => t.bid === bid && t.stage === "flown").filter(t => { const a = acStatus(t); return a && a.db.t && a.db.m && a.db.o; }).length;
  return `<div class="panel tbl" style="margin-top:16px"><h2>Supervised bookings (stage 6)</h2><p class="small muted">Tick brokers who are in supervised work. Their flown trips then need a post-trip debrief signed by trainee, mentor and operations (manual 14.6). Ten signed debriefs with no critical error complete stage 6.</p><table class="small"><thead><tr><th scope=col>Name</th><th scope=col>Supervised</th><th scope=col class="n">Debriefs signed</th></tr></thead><tbody>${ros.map(([id, p]) => `<tr><td>${esc(p.contractName || nm(id))}</td><td><label class="check" style="margin:0"><input type="checkbox" data-sup="${id}" ${p.supervised ? "checked" : ""}><span class="small">In stage 6</span></label></td><td class="n">${cnt(id)} of 10</td></tr>`).join("") || `<tr><td colspan="3" class="muted">Nobody approved yet.</td></tr>`}</tbody></table></div>`;
}

/* ---------- Roleplay lab (manual 14.4–14.5) ---------- */
const RP_SC = [
 ["aog","AOG: the booked aircraft is unserviceable 6 hours before departure","Operator's written replacement options; extra cost approved by the director, never promised on the call (11.3)"],
 ["deposit","The assistant refuses the 25% deposit and wants to pay after the flight","Explain the booking terms (10.6); card or bank payment options; no exception without the director"],
 ["cabotage","The principal insists on a domestic leg on a foreign-registered aircraft","Explain cabotage plainly; local operator for that leg or a new routing; never sell it (2.4)"],
 ["cheaper","“Another broker quoted 15% less”","Compare like for like; two or three options; below 9% only with director approval (12.6)"],
 ["addpax","A passenger is added on the day","Names to the operator at once; permits, insurance and seats confirmed in writing first"],
 ["pet","The client wants to bring a dog to a strict-entry country","Destination rules and the operator's written acceptance first (G.4)"],
 ["deice","De-icing delays departure and the client is angry about the charge","Safety is the crew's decision; charged at cost with the receipt (9.2)"],
 ["bank","The client asks to pay into a personal account or sends new bank details by chat","Stop: payment request only; treat as fraud until proven otherwise (3.5)"],
 ["hide","The client asks to leave a passenger's name off the manifest","Refuse politely; tell the director (2.4)"],
 ["sanction","Screening shows a possible sanctions match on the payer","Pause without accusing; short internal check; tell the director (3.2)"],
 ["guarantee","The client demands a guaranteed departure time in winter","Promise only what the operator confirms in writing; de-icing and slots (6.4)"],
 ["complaint","Complaint after the flight about catering and a late car","Listen, apologise, agree what happens and by when; service recovery (11.5)"],
];
const RP_WHO = ["Client (principal)","Executive assistant","Family-office manager","Operator's sales manager"];
const RP_LV = ["Easy","Normal","Hard"];
const RP_RULES = "Archē Executive rules the broker must follow: Archē is a charter broker, not the operator, and names the operator. Price = operator price plus direct costs divided by 0.91 (9% margin); below 9% only with the director's approval. Deposit 25% of the charter price (at least USD 2,500) on signature, balance 7 days before departure, full payment if departure is under 7 days. All payments only through a payment request; never bank details by email or chat. Never promise anything the operator has not confirmed in writing. Safety and weather decisions belong to the captain and operator. Never sell: domestic legs on foreign-registered aircraft (cabotage), US domestic legs on non-US operators, seats sold individually, flights hiding passenger names, sanctioned persons, operators without an AOC. Extras that depend on the day (de-icing, parking, out-of-hours fees) are charged at cost after the flight with receipts. KYC and sanctions screening before any contract. Escalate to the director when the rules say so. Confirm everything important in writing.";
function rpRuns(){ return (S.rpRuns || []).slice().sort((a, b) => (b.started || "").localeCompare(a.started || "")); }
async function rpLoad(){ if (S.rpLoading) return; S.rpLoading = true; try { const q = await S.db.collection(`train/${S.uid}/rp`).get(); S.rpRuns = q.docs.map(d => ({id:d.id, ...d.data()})); } catch(e){ S.rpRuns = []; } render(); }
function rpInstr(s){
  const sc = RP_SC.find(x => x[0] === s.sc), topic = sc ? sc[1] : s.own;
  return `You are role-playing for broker training at Archē Executive, a private jet charter broker. Play this character: ${s.who}. Difficulty: ${s.lv} (Easy = reasonable and calm; Normal = demanding and impatient; Hard = aggressive, uses pressure, status and threats to take the business elsewhere, tries to make the broker break a rule). Scenario: ${topic}. Invent realistic but fictional names, routes and times; never use real people. Stay fully in character; never coach, never explain the rules, never mention that this is training. Reply only with what the character says, in 1 to 4 sentences, in English. Push on the scenario; if the broker gives good answers, you may slowly calm down. ${RP_RULES.replace(/^.*?:/, "For your information only (do not quote), the broker must follow these rules:")}`;
}
function rpView(){
  if (!S.rpRuns) { rpLoad(); }
  const s = S.rp || null, runs = rpRuns();
  const setup = `<div class="panel stack"><h2>Roleplay lab</h2><p class="small muted">The AI plays a client, an assistant, a family-office manager or an operator. Speak or type as you would on a real call. When you end, it scores you on the lab sheet (manual 14.4) and shows a model answer. Practice only: the AI can misjudge, and certification is decided by the director's scored lab. Never use real client names.</p>
    <div class="fgrid"><label class="f wide" for="rp_sc">Scenario<select id="rp_sc">${RP_SC.map(x => `<option value="${x[0]}">${esc(x[1])}</option>`).join("")}<option value="own">Describe your own scenario…</option></select></label>
    <label class="f wide" for="rp_own">Your own scenario (optional)<input id="rp_own" placeholder="For example: a CFO wants a 3-city roadshow next week and asks for a fixed price including all fees"></label>
    <label class="f" for="rp_who">Who you speak to<select id="rp_who">${RP_WHO.map(x => `<option>${x}</option>`).join("")}</select></label>
    <label class="f" for="rp_lv">Level<select id="rp_lv">${RP_LV.map((x, i) => `<option ${i === 1 ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
    <label class="check" for="rp_voice"><input type="checkbox" id="rp_voice" ${S.rpVoice ? "checked" : ""}><span>Read the other side's replies aloud</span></label>
    <div class="row"><button class="btn primary" type="button" data-rp="start">Start the call</button></div></div>`;
  const hist = `<div class="panel"><h2>Your sessions</h2>${runs.length ? `<div class="list">${runs.slice(0, 15).map(x => `<div class="item" tabindex="0" data-rp="open" data-id="${x.id}"><div class="t">${esc(x.title || "")}</div><div>${x.score ? `<span class="chip ${x.score.pass ? "c-flown" : x.score.total >= 50 ? "c-quoted" : "c-returned"}">${x.score.total}/100</span>` : `<span class="chip c-review">Not scored</span>`}</div><div class="s">${esc(x.who || "")} · ${esc(x.lv || "")} · ${fmtT(x.started)}</div><div></div></div>`).join("")}</div>` : `<p class="small muted">No sessions yet.</p>`}</div>`;
  let main = `<div class="panel empty"><p>Choose a scenario and start the call.</p></div>`;
  if (s) {
    const msgs = s.msgs.map(m => `<div class="rpmsg ${m.role === "assistant" ? "them" : "me"}"><span class="small muted">${m.role === "assistant" ? esc(s.who) : "You"}</span><p>${esc(m.content)}</p></div>`).join("");
    const sc = s.score;
    main = `<div class="panel stack"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(s.title)}</h2><span class="chip c-enquiry">${esc(s.who)} · ${esc(s.lv)}</span></div>
      <div class="rpchat" id="rpChat" aria-live="polite">${msgs}${s.busy ? `<div class="rpmsg them"><p class="muted">…</p></div>` : ""}</div>
      ${sc ? rpScoreView(sc) : `<label class="f" for="rp_in">Your answer<textarea id="rp_in" rows="3" placeholder="Type, or press Speak"></textarea></label>
      <div class="row"><button class="btn primary" type="button" data-rp="send" ${s.busy ? "disabled" : ""}>Send</button>${rpSpeechOK() ? `<button class="btn" type="button" data-rp="mic" aria-pressed="${S.rpMic ? "true" : "false"}">${S.rpMic ? "Stop listening" : "Speak"}</button>` : ""}<button class="btn" type="button" data-rp="end" ${s.msgs.length < 3 || s.busy ? "disabled" : ""}>End and score</button><button class="btn danger small" type="button" data-rp="close">Close</button></div>`}</div>`;
  }
  return `<div class="grid2 trgrid"><div class="stack">${setup}${hist}${isStaff() && !S.preview ? rpTeamPanel() : ""}</div><div>${main}</div></div>`;
}
function rpScoreView(sc){
  const row = (l, v, m) => `<tr><td>${l}</td><td class="n">${v}${m ? " / " + m : ""}</td></tr>`;
  return `<div class="note ${sc.pass ? "ok" : "warn"}"><b>${sc.total}/100 · ${sc.pass ? "Lab standard met" : "Not yet"}</b>${sc.ruleBroken ? " · a rule was broken" : ""}${sc.promise ? " · an unconfirmed promise was made" : ""}</div>
    <div class="tbl"><table class="small"><tbody>${row("Calm and courteous under pressure", sc.calm, 20)}${row("Correct rule, explained in plain words", sc.rule, 30)}${row("Options offered", sc.options, 20)}${row("No unconfirmed promise", sc.promise ? "Fail" : "Pass")}${row("Escalation", sc.escalation, 15)}${row("Written follow-up", sc.followup, 15)}</tbody></table></div>
    ${sc.summary ? `<p class="small">${esc(sc.summary)}</p>` : ""}
    ${(sc.moments || []).length ? `<h3>Moments that cost points</h3>${sc.moments.map(m => `<p class="small"><b>“${esc(m.quote)}”</b> · ${esc(m.issue)}</p>`).join("")}` : ""}
    ${sc.model ? `<h3>Model answer</h3><p class="small">${esc(sc.model)}</p>` : ""}
    <p class="small muted">Scored by AI for practice. The director's scored lab decides certification.</p><div class="row"><button class="btn" type="button" data-rp="close">Close</button></div>`;
}
function rpTeamPanel(){
  if (!S.rpAll) { rpLoadAll(); return `<div class="panel"><h2>Team roleplay</h2><p class="small muted">Loading…</p></div>`; }
  const rows = Object.entries(S.rpAll).map(([bid, xs]) => { const sc = xs.filter(x => x.score); return {bid, n: xs.length, avg: sc.length ? Math.round(sc.reduce((a, x) => a + x.score.total, 0) / sc.length) : null, pass: sc.filter(x => x.score.pass).length}; });
  return `<div class="panel tbl"><h2>Team roleplay</h2><table class="small"><thead><tr><th scope=col>Person</th><th scope=col class="n">Sessions</th><th scope=col class="n">Average</th><th scope=col class="n">At lab standard</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(nm(x.bid))}</td><td class="n">${x.n}</td><td class="n">${x.avg ?? "–"}</td><td class="n">${x.pass}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">No sessions yet.</td></tr>`}</tbody></table></div>`;
}
async function rpLoadAll(){ if (S.rpAllLoading) return; S.rpAllLoading = true; const out = {}; for (const bid of [...new Set([...Object.keys(S.roster), S.uid])]) { try { const q = await S.db.collection(`train/${bid}/rp`).get(); if (q.docs.length) out[bid] = q.docs.map(d => d.data()); } catch(e){} } S.rpAll = out; render(); }
function rpSpeechOK(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
function rpSay(text){ try { if (!S.rpVoice || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.rate = 1; window.speechSynthesis.speak(u); } catch(e){} }
async function rpTurn(){
  const s = S.rp; const sample = await claude.use("sample"); if (!sample) { toast("The AI is not available in this view."); return; }
  const turns = [{role:"user", content: rpInstr(s) + "\n\nOpen the conversation now, in character."}];
  s.msgs.forEach(m => turns.push({role: m.role === "assistant" ? "assistant" : "user", content: m.content}));
  if (turns[turns.length - 1].role !== "user") return;
  s.busy = true; render();
  const reply = {role:"assistant", content:""}; s.msgs.push(reply);
  try { const r = await sample(turns, {cache:false, onText: ({text}) => { reply.content = text; const el = document.querySelector("#rpChat .rpmsg.them:last-child p"); if (el) el.textContent = text; }}); reply.content = (r && r.text) || reply.content; rpSay(reply.content); }
  catch(e){ s.msgs.pop(); toast(e && e.code === "rate_limited" ? "The AI is busy. Try again in a minute." : "The AI could not answer. Try again."); }
  s.busy = false; render(); setTimeout(() => { const c = $("rpChat"); if (c) c.scrollTop = c.scrollHeight; const i = $("rp_in"); if (i) i.focus(); }, 30);
}
async function rpScore(){
  const s = S.rp; const sample = await claude.use("sample"); if (!sample) { toast("The AI is not available in this view."); return; }
  const tr = s.msgs.map(m => `${m.role === "assistant" ? "OTHER SIDE" : "BROKER"}: ${m.content}`).join("\n");
  const prompt = `You are the assessor for Archē Executive's live negotiation lab. Score only the BROKER's lines in this transcript against the scoring sheet. ${RP_RULES}
Scenario: ${s.title}. Counterpart: ${s.who}. Level: ${s.lv}.
Scoring sheet: calm (0-20) calm and courteous under pressure; rule (0-30) correct rule applied and explained in plain words; options (0-20) options offered instead of a flat no; promise (true if the broker promised anything the operator had not confirmed in writing, or a price, refund, time or exception the rules do not allow); escalation (0-15) escalates to the director when the rules require it, or correctly needs no escalation; followup (0-15) says the agreement will be confirmed in writing. ruleBroken is true if the broker agreed to anything the rules forbid or stated a wrong rule. total is the sum of the four scores and escalation and followup (0-100). pass is true only if total >= 70 and promise is false and ruleBroken is false.
Return JSON only: {"calm":n,"rule":n,"options":n,"promise":bool,"escalation":n,"followup":n,"ruleBroken":bool,"total":n,"pass":bool,"summary":"two sentences","moments":[{"quote":"exact broker words","issue":"what cost points"}],"model":"a model answer for the hardest moment, 2-4 sentences, in the broker's voice"}
Transcript:
${tr}`;
  s.busy = true; render();
  try {
    const j = await sample.json(prompt, {cache:false, modelTier:"default"});
    const cl = (v, m) => Math.max(0, Math.min(m, Math.round(num(v))));
    const sc = {calm: cl(j.calm, 20), rule: cl(j.rule, 30), options: cl(j.options, 20), escalation: cl(j.escalation, 15), followup: cl(j.followup, 15), promise: !!j.promise, ruleBroken: !!j.ruleBroken, summary: String(j.summary || "").slice(0, 600), model: String(j.model || "").slice(0, 900), moments: (Array.isArray(j.moments) ? j.moments : []).slice(0, 5).map(m => ({quote: String(m.quote || "").slice(0, 200), issue: String(m.issue || "").slice(0, 300)}))};
    sc.total = sc.calm + sc.rule + sc.options + sc.escalation + sc.followup; sc.pass = sc.total >= 70 && !sc.promise && !sc.ruleBroken;
    s.score = sc; s.ended = now();
    try { await S.db.doc(`train/${S.uid}/rp/${s.id}`).set({title: s.title, sc: s.sc, who: s.who, lv: s.lv, started: s.started, ended: s.ended, turns: s.msgs.length, msgs: s.msgs.slice(0, 40).map(m => ({role: m.role, content: String(m.content).slice(0, 1200)})), score: sc}); S.rpRuns = null; S.rpAll = null; S.rpAllLoading = false; } catch(e){ toast("Scored, but could not save to your record."); }
  } catch(e){ toast(e && e.code === "rate_limited" ? "The AI is busy. Try again in a minute." : "Could not score this session. Try again."); }
  s.busy = false; render();
}
function rpMic(){
  const R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) return;
  if (S.rpRec) { try { S.rpRec.stop(); } catch(e){} S.rpRec = null; S.rpMic = false; render(); return; }
  const rec = new R(); rec.lang = "en-GB"; rec.interimResults = true; rec.continuous = true; let base = ($("rp_in") || {}).value || "";
  rec.onresult = ev => { let txt = ""; for (let i = ev.resultIndex; i < ev.results.length; i++) txt += ev.results[i][0].transcript; const el = $("rp_in"); if (el) el.value = (base + " " + txt).trim(); if (ev.results[ev.results.length - 1].isFinal) base = ($("rp_in") || {}).value || base; };
  rec.onerror = () => { S.rpRec = null; S.rpMic = false; render(); toast("Speech input stopped. You can type instead."); };
  rec.onend = () => { if (S.rpRec === rec) { S.rpRec = null; S.rpMic = false; render(); } };
  try { rec.start(); S.rpRec = rec; S.rpMic = true; render(); } catch(e){ toast("Speech input is not available here. Type instead."); }
}

/* ---------- Regional quick-reference cards (manual Appendix J) ---------- */
const CARDS_DEF = {verified:"2026-10-19", by:"director", cards:[
 {id:"eu", title:"Europe: EU, EEA, Switzerland and the United Kingdom", green:"Whole aircraft from an EU/EEA/UK operator with a checked AOC; international or same-carrier-country flights; clean screening", amber:"Non-EU operator into or within Europe (EASA third-country operator authorisation and each state's permits, confirmed in writing); any leg that may be domestic, including territories (G.1); package with hotel or event (ATOL in the UK); de-icing season", red:"Leg inside the EU on a non-EU operator without written permission; Russian national (including dual) or company controlled by one with any EU point, or a Russian-registered aircraft; operator on the EU Air Safety List; seats sold individually; payer or operator in a G.7 country", src:"Modules 2.4, 2.5, 2.9; Appendix G.1, G.2, G.7"},
 {id:"mea", title:"Middle East and Africa", green:"Experienced operator with permits handled through its trip support; whole aircraft; clean screening", amber:"Landing and overflight permits, sponsor rules and lead times vary by state: operator confirms in writing; routes near FAA or EASA conflict-zone notices (G.3); PEP clients; third-party payers", red:"Embargoed destination or sanctions match; payer or operator in a G.7 country (for example Libya, South Sudan, Sudan, Syria); lead time impossible to meet", src:"Modules 2.5, 2.9, 3.2; Appendix G.2, G.3, G.7"},
 {id:"apac", title:"Asia-Pacific: Singapore, Thailand and the region", green:"International flight on an operator with the needed permits; Singapore slot and Air Transport Permit planned (Changi slot at least 72 hours ahead); clean screening", amber:"Thailand: CAAT permits, slots and parking approval at the main Bangkok airports and Phuket, full passenger and crew details; China, India and Russian airspace (strict permit regimes, G.5); Hong Kong and Macau regime with mainland China (G.1); pets into Singapore, Japan, Australia or New Zealand (G.4)", red:"Domestic leg on a foreign-registered aircraft (cabotage is closely enforced in Thailand); North Korea; payer or operator in a G.7 country (for example Myanmar, Kazakhstan); lead time impossible to meet", src:"Modules 2.5, 2.6, 2.9; Appendix G.1, G.4, G.5, G.7"},
 {id:"am", title:"Americas: United States, Canada and Latin America", green:"International flight on a US or foreign operator holding the needed authority; whole aircraft; clean screening; US broker disclosures made (14 CFR Part 295)", amber:"Foreign operator to or from the US (needs US authority); US federal excise tax when acting as principal (G.6); Canada and Latin America domestic legs reserved for local carriers; FAA security notices (for example Haiti, Central America, Colombia, Ecuador, Mexico, Panama)", red:"Any US domestic leg (both airports in the US, including Alaska, Hawaii and territories): never on a non-US operator, and on any operator only after US counsel confirms Archē's position; Cuba with a US-made aircraft; Venezuela (no payments possible)", src:"Modules 2.4, 2.5, 2.9; Appendix G.1, G.3, G.6, G.7"}]};
function cardsData(){ const c = S.cards && S.cards.cards ? S.cards : CARDS_DEF; return c; }
function cardsWatch(){ if (S.cardsW) return; S.cardsW = true; watchDoc("intel/cards", snap => { S.cards = snap.exists ? snap.data() : null; render(); }); watchDoc("intel/cardProposals", snap => { S.cardProps = snap.exists ? snap.data() : null; render(); }); }
function cardsView(){
  cardsWatch();
  const c = cardsData(), sel = S.cardSel || c.cards[0].id, cd = c.cards.find(x => x.id === sel) || c.cards[0], own = S.isOwner && !S.preview;
  const v = cd.verified || c.verified, ed = own && S.cardEdit === cd.id;
  const props = ((S.cardProps && S.cardProps.items) || []).filter(p => !p.done);
  const col = (k, l, cls) => `<tr><td><span class="chip ${cls}">${l}</span></td><td>${ed ? `<textarea id="cd_${k}" rows="3">${esc(cd[k])}</textarea>` : esc(cd[k])}</td></tr>`;
  return `<div class="grid2 trgrid"><div class="stack"><div class="panel"><h2>Regional cards</h2><p class="small muted">For live enquiries: green proceed, amber the operator confirms in writing before we quote, red stop and tell the director. The cards summarise Module 2, the trip risk screen and the watchlist; the trip risk screen is still recorded for every enquiry.</p>
    <div class="list">${c.cards.map(x => `<div class="item" tabindex="0" data-card="sel" data-id="${x.id}" aria-selected="${x.id === cd.id}"><div class="t">${esc(x.title)}</div><div><span class="chip c-enquiry">Verified ${fmtD(x.verified || c.verified)}</span></div><div class="s">${esc(x.src)}</div><div></div></div>`).join("")}</div></div>
    ${own ? `<div class="panel"><h2>Proposed changes</h2><p class="small muted">The daily intelligence run checks the official sources (Appendix G.8) and proposes changes here. The AI never changes a card: check each proposal against its source, then approve or dismiss.</p>${props.length ? props.map((p, i) => `<div class="flag"><span class="sev med" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc((c.cards.find(x => x.id === p.card) || {}).title || p.card)}</b> · ${esc(p.colour)}</p><p class="small">${esc(p.text)}</p><p class="small muted">${esc(p.reason || "")}${p.source ? ` · <a href="${esc(p.source)}" target="_blank" rel="noopener">Source</a>` : ""}</p><div class="row" style="margin-top:6px"><button class="btn small primary" type="button" data-card="approve" data-i="${i}">Approve after checking the source</button><button class="btn small" type="button" data-card="dismiss" data-i="${i}">Dismiss</button></div></div></div>`).join("") : `<p class="small muted">No proposals waiting.</p>`}</div>` : ""}</div>
    <div><div class="panel stack"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(cd.title)}</h2><span class="chip c-flown">Last verified ${fmtD(v)}</span></div>
      <div class="tbl"><table class="small"><tbody>${col("green","Green","c-flown")}${col("amber","Amber","c-review")}${col("red","Red","c-returned")}</tbody></table></div>
      <p class="small muted">Sources: ${esc(cd.src)}. Always check the current watchlist and the official source, never memory.</p>
      ${own ? `<div class="row">${ed ? `<button class="btn primary small" type="button" data-card="save">Save and mark verified today</button><button class="btn small" type="button" data-card="cancel">Cancel</button>` : `<button class="btn small" type="button" data-card="edit">Edit</button><button class="btn small" type="button" data-card="verify">Mark verified today</button>`}</div>` : ""}</div></div></div>`;
}
async function cardsWrite(mut, line){
  const c = JSON.parse(JSON.stringify(cardsData())); mut(c); c.updated = now();
  try { await S.db.doc("intel/cards").set(c); audit("Regional card updated", line); toast("Card saved."); } catch(e){ toast("Could not save the card."); }
}

/* ---------- Training tabs ---------- */
function trTabs(){
  const t = S.trTab || "book";
  return `<div class="row" role="tablist" style="margin-bottom:12px;gap:6px">${[["book","Booking practice"],["rp","Roleplay lab"],["cards","Regional cards"]].map(([k, l]) => `<button class="btn ${t === k ? "primary" : ""}" type="button" role="tab" aria-selected="${t === k}" data-trtab="${k}">${l}</button>`).join("")}</div>`;
}

function afterHead(h, add){ if (!add) return h; const i = h.indexOf('<div class="head"'); if (i < 0) return add + h; const re = /<\/?div\b/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(h))) { d += m[0][1] === "/" ? -1 : 1; if (d === 0) { const e = h.indexOf(">", m.index) + 1; return h.slice(0, e) + add + h.slice(e); } } return h + add; }
/* ---------- wiring into existing views ---------- */
(function(){
  const _vTraining = vTraining;
  vTraining = function(){
    const t = S.trTab || "book";
    if (t === "book") { const h = _vTraining(); return h.replace(/(<div class="note warn small" style="margin-bottom:12px">)/, trTabs() + "$1"); }
    const head = `<div class="head"><div><h1>Training</h1><p class="muted small">${t === "rp" ? "Practise difficult conversations out loud with an AI client, assistant or operator, then see your score on the lab sheet (manual 14.4–14.5)." : "Regional quick-reference cards for live enquiries (manual Appendix J)."}</p></div></div>`;
    return head + trTabs() + (t === "rp" ? rpView() : cardsView());
  };
  const _tripFile = tripFile;
  tripFile = function(t){ const h = _tripFile(t); const add = followBlock(t) + aftercareBlock(t); return add ? h.replace(`<div><h3>History</h3>`, add + `<div><h3>History</h3>`) : h; };
  const _vToday = vToday; vToday = function(){ return afterHead(_vToday(), acTaskPanel(true)); };
  const _vHome = vHome; vHome = function(){ return afterHead(_vHome(), acTaskPanel(acting() !== "broker" && isStaff())); };
  const _vControl = vControl; vControl = function(){ return _vControl() + scorecards(); };
  const _vTeam = vTeam; vTeam = function(){ return _vTeam() + supPanel(); };
})();

document.addEventListener("click", async e => {
  const tab = e.target.closest("[data-trtab]"); if (tab) { S.trTab = tab.dataset.trtab; render(); return; }
  const rp = e.target.closest("[data-rp]");
  if (rp) {
    const a = rp.dataset.rp;
    if (a === "start") { const scv = $("rp_sc").value, own = ($("rp_own").value || "").trim(); if (scv === "own" && own.length < 15) { toast("Describe your scenario in a sentence or two."); return; }
      S.rpVoice = $("rp_voice").checked; const sc = RP_SC.find(x => x[0] === scv);
      S.rp = {id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), sc: scv, own: own || "", title: scv === "own" ? own.slice(0, 120) : sc[1], who: $("rp_who").value, lv: $("rp_lv").value, started: now(), msgs: []};
      render(); await rpTurn(); return; }
    if (a === "send") { const v = ($("rp_in").value || "").trim(); if (!v) { toast("Type or speak your answer first."); return; } if (S.rpRec) rpMic(); S.rp.msgs.push({role:"user", content: v.slice(0, 2000)}); await rpTurn(); return; }
    if (a === "mic") { rpMic(); return; }
    if (a === "end") { if (S.rpRec) rpMic(); await rpScore(); return; }
    if (a === "close") { if (S.rpRec) rpMic(); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(_){} S.rp = null; render(); return; }
    if (a === "open") { const x = rpRuns().find(r => r.id === rp.dataset.id); if (x) { S.rp = {...x, msgs: x.msgs || [], score: x.score}; render(); } return; }
  }
  const cd = e.target.closest("[data-card]");
  if (cd) {
    const a = cd.dataset.card, c = cardsData(), sel = S.cardSel || c.cards[0].id;
    if (a === "sel") { S.cardSel = cd.dataset.id; S.cardEdit = null; render(); return; }
    if (!S.isOwner) return;
    if (a === "edit") { S.cardEdit = sel; render(); return; }
    if (a === "cancel") { S.cardEdit = null; render(); return; }
    if (a === "save") { const g = $("cd_green").value.trim(), am = $("cd_amber").value.trim(), r = $("cd_red").value.trim(); if (!g || !am || !r) { toast("Fill in all three colours."); return; }
      S.cardEdit = null; await cardsWrite(cc => { const x = cc.cards.find(y => y.id === sel); Object.assign(x, {green: g, amber: am, red: r, verified: now().slice(0, 10)}); }, (c.cards.find(y => y.id === sel) || {}).title); return; }
    if (a === "verify") { await cardsWrite(cc => { const x = cc.cards.find(y => y.id === sel); x.verified = now().slice(0, 10); }, "Verified: " + (c.cards.find(y => y.id === sel) || {}).title); return; }
    if (a === "approve" || a === "dismiss") { const items = ((S.cardProps && S.cardProps.items) || []).slice(); const open = items.filter(p => !p.done); const p = open[+cd.dataset.i]; if (!p) return;
      if (a === "approve") { const k = String(p.colour || "").toLowerCase(); if (!["green","amber","red"].includes(k)) { toast("This proposal has no valid colour."); return; }
        await cardsWrite(cc => { const x = cc.cards.find(y => y.id === p.card); if (x) { x[k] = p.text; x.verified = now().slice(0, 10); } }, `Approved proposal: ${p.card} ${k}`); }
      p.done = a; p.doneAt = now(); try { await S.db.doc("intel/cardProposals").set({...(S.cardProps || {}), items}); } catch(err){ toast("Could not update the proposals."); } return; }
  }
  const ac = e.target.closest("[data-ac]");
  if (ac) {
    const a = ac.dataset.ac, t = tripById(S.sel); if (!t) return;
    try {
      if (a === "legSave" || a === "legFlown") {
        const ls = legsOf(t).map((l, i) => { const s = ($("lg_s" + i) || {}).value || "", tm = ($("lg_t" + i) || {}).value || "", n = ($("lg_n" + i) || {}).value || ""; return {s, at: tm ? new Date(tm).toISOString() : "", note: n.slice(0, 200)}; });
        const changed = ls.map((x, i) => x.s !== ((legSt(t)[i] || {}).s || "") ? `${legsOf(t)[i].from}→${legsOf(t)[i].to} ${(LEG_ST.find(s => s[0] === x.s) || LEG_ST[0])[1]}` : "").filter(Boolean).join(", ");
        const patch = {legStatus: ls};
        if (a === "legFlown") { const last = ls.filter(x => x.s === "land" && x.at).map(x => x.at).sort().slice(-1)[0]; if (!last) { toast("Enter the landing time of the last leg."); return; } patch.state = "flown"; patch.flownDate = last.slice(0, 10); }
        await statusWrite(t, patch, a === "legFlown" ? "Last leg landed; trip flown" : `Flight following: ${changed || "times updated"}`);
        if (a === "legFlown") audit("Flight recorded", `${(t.st || {}).ref || t.did} · ${patch.flownDate}`);
        toast(a === "legFlown" ? "Flight recorded. Aftercare opens for the broker." : "Leg status saved."); return; }
      if (a === "fuSave") { const fu = {ch: $("ac_ch").value, note: ($("ac_nt").value || "").trim().slice(0, 300), at: now(), by: S.uid}; await deskWrite(t, {followUp: fu}, `Follow-up logged (${fu.ch})`); toast("Follow-up logged."); return; }
      if (a === "rateSent") { if (!(t.d.client && t.d.client.email)) toast("No client email on the trip: add it in the email before sending."); setTimeout(async () => { try { await deskWrite(t, {ratingReq: {at: now(), by: S.uid}}, "Rating request emailed"); } catch(err){} }, 50); return; }
      if (a === "rateSave") { const o = $("rt_o").value; if (!o) { toast("Choose the overall score."); return; }
        const r = {overall: +o, aircraft: +$("rt_a").value || null, crew: +$("rt_c").value || null, broker: +$("rt_b").value || null, comment: ($("rt_m").value || "").trim().slice(0, 600), consent: $("rt_ok").checked, at: now(), by: S.uid};
        if (t.bid === S.uid || S.isOwner) await deskWrite(t, {rating: r}, `Client rating ${r.overall}/5 recorded`); else { toast("The broker or the owner records the rating."); return; }
        if (r.overall <= 3) audit("Low client rating", `${(t.st || {}).ref || t.did} · ${r.overall}/5 · ${nm(t.bid)}`);
        toast(r.overall <= 3 ? "Recorded. Service recovery: call the client within 1 working day." : "Rating recorded."); return; }
      if (a === "recSave") { const n = ($("rc_n").value || "").trim(); if (n.length < 10) { toast("Write what was agreed with the client."); return; } await deskWrite(t, {recovery: {note: n.slice(0, 400), at: now(), by: S.uid}}, "Service recovery done"); audit("Service recovery done", (t.st || {}).ref || t.did); toast("Service recovery recorded."); return; }
      if (a === "dbSave") { const k = ac.dataset.part, v = {at: now(), by: S.uid}; for (const [m] of DB_M) { const x = $(`db_${k}_${m}`).value; if (!x) { toast("Score all three measures."); return; } v[m] = +x; }
        ["err","well","change","action"].forEach(f => v[f] = ($(`db_${k}_${f}`).value || "").trim().slice(0, 300)); if (!v.action) { toast("Add one action with an owner and a date."); return; }
        if (k === "t") await deskWrite(t, {debrief: v}, "Debrief signed: trainee");
        else { const cur = (t.st && t.st.debrief) || {}; await statusWrite(t, {debrief: {...cur, [k === "m" ? "mentor" : "ops"]: v}}, `Debrief signed: ${k === "m" ? "mentor" : "operations"}`); }
        toast("Debrief part signed."); return; }
    } catch(err){ console.warn(err); toast("Could not save. Try again."); }
  }
});
document.addEventListener("change", async e => {
  if (e.target.dataset && e.target.dataset.sup && S.isOwner) { const id = e.target.dataset.sup; try { await S.db.doc("roster/" + id).update({supervised: e.target.checked}); audit(e.target.checked ? "Supervised stage started" : "Supervised stage ended", nm(id)); toast("Saved."); } catch(err){ toast("Could not change."); } }
});
