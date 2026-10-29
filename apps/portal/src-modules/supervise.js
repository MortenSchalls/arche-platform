/* ---------- Supervised steps (Morten, 26 Oct 2026) ----------
   While a member is supervised, each gated step waits for the owner's OK before it moves on. The owner releases
   each step separately per member in Team once satisfied ("let loose"); supervision can be switched back on at any
   time. Requests live in step_requests (SQL 0011): the member can ask and amend while pending; only an owner decides.
   Until the SQL has run, nothing is gated and the owner's task list shows the SQL step. */
const GATES = {
  quote:    {who:"broker", label:"Quote to client", desc:"Each quote waits for your OK before it goes to the client, and cannot go to operations until approved."},
  take:     {who:"broker", label:"Taking an enquiry", desc:"Taking an enquiry from the pool waits for your OK. Your OK assigns it to them."},
  contact:  {who:"broker", label:"First contact with a new prospect", desc:"The planned first contact with each new lead (channel and message) waits for your OK."},
  pay:      {who:"ops", label:"Recording payments", desc:"Client and operator payments are recorded only after your OK."},
  supplier: {who:"ops", label:"Supplier quotes", desc:"Sending a quote request to a supplier, and awarding a quote, wait for your OK."}
};
const GATE_KEYS = Object.keys(GATES);
if (!S.reqs) S.reqs = {};

function rosterOf(uid){ return (S.roster || {})[uid] || (uid === S.uid ? S.myRoster : null) || {}; }
function gateApplies(key, uid){ const r = rosterOf(uid), g = GATES[key]; return g.who === "ops" ? r.role === "ops" : (r.role === "broker" || r.role === "consultant" || !!r.book); }
function gated(key, uid = S.uid){
  if (!S.reqReady || S.preview) return false;
  const r = rosterOf(uid); if (r.role === "owner" || (uid === S.uid && S.isOwner)) return false;
  return !!r.supervised && !(r.released || {})[key] && gateApplies(key, uid);
}
function reqList(uid){ return Object.entries(S.reqs[uid] || {}).map(([id, d]) => ({id, uid, ...d})).sort((a, b) => (a.at < b.at ? 1 : -1)); }
function gateReq(uid, key, ref){ return reqList(uid).find(r => r.key === key && (r.ref === ref || (r.refs || []).includes(ref))) || null; }

/* subscribe: members to their own requests, owners to everyone's */
function gateWatch(){
  if (!S.db || !S.uid || !S.role || S.role === "loading" || S.role === "pending") return;
  const ids = S.isOwner ? Object.keys(S.roster || {}).filter(id => id !== S.uid) : [S.uid];
  ids.forEach(uid => { const path = `req/${uid}/items`; if (S.subs[path]) return;
    S.subs[path] = S.db.collection(path).onSnapshot(snap => { const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.reqs[uid] = o; if (!S.reqReady) S.reqReady = true; render(); }, e => { S.reqErr = e && e.code; }); });
}
setInterval(() => gateWatch(), 2000);

async function gateAsk(key, ref, fp, title, detail, extra = {}){
  const cur = gateReq(S.uid, key, ref), id = cur && cur.status === "pending" ? cur.id : `${key}-${String(ref).replace(/[^\w-]/g, "").slice(0, 40)}-${Date.now().toString(36)}`;
  const body = {key, ref, fp, title, detail, status: "pending", at: now(), by: S.uid, ...extra};
  await S.db.doc(`req/${S.uid}/items/${id}`).set(body);
  S.reqs[S.uid] = {...(S.reqs[S.uid] || {}), [id]: body};
  audit("Asked for the director's OK", `${GATES[key].label}: ${title}`);
}
/* true = stop here (the step waits for the owner); false = go ahead */
async function gateHold(key, ref, fp, title, detail, extra){
  if (!gated(key)) return false;
  const r = gateReq(S.uid, key, ref);
  if (r && r.status === "approved" && r.fp === fp) return false;
  if (r && r.status === "pending" && r.fp === fp) { toast("Still waiting for the director's OK."); return true; }
  try { await gateAsk(key, ref, fp, title, detail, extra); toast("Sent to the director for OK. You will see the answer here."); } catch(e){ toast("Could not send the request. Try again."); }
  render(); return true;
}

/* member side: what the director said, shown where the work is */
function gateLine(r){
  if (!r) return "";
  if (r.status === "pending") return `<div class="note info small"><b>Waiting for the director's OK:</b> ${esc(GATES[r.key].label)}. ${r.key === "quote" ? "Do not send the quote to the client yet." : ""} Asked ${fmtT(r.at)}.</div>`;
  if (r.status === "approved") return `<div class="note ok small"><b>Approved</b> by the director ${fmtT(r.decidedAt)}${r.note ? `: ${esc(r.note)}` : "."}</div>`;
  return `<div class="note bad small"><b>Changes asked</b> by the director ${fmtT(r.decidedAt)}: ${esc(r.note || "")}. Make the change and ask again.</div>`;
}
const quoteFp = t => { const q = t.d.quote || {}; return `${num(q.opPrice)}|${num(q.direct)}`; };
function gateTripNote(t){
  if (!t) return "";
  const out = [];
  if (gated("quote", t.bid) || gateReq(t.bid, "quote", t.did)) { const r = gateReq(t.bid, "quote", t.did); if (r && (r.status !== "approved" || r.fp === quoteFp(t))) out.push(gateLine(r)); else if (num((t.d.quote || {}).opPrice) && gated("quote", t.bid)) out.push(`<div class="note info small"><b>Quote needs the director's OK</b> before it goes to the client. Save the quote to ask.</div>`); }
  ["client", "operator"].forEach(w => { const r = gateReq(S.uid, "pay", t.did + "-" + w); if (r && r.status !== "approved") out.push(gateLine(r)); });
  return out.join("");
}
function myReqPanel(){
  const mine = reqList(S.uid).filter(r => r.status !== "approved" || Date.now() - Date.parse(r.decidedAt || 0) < 3 * 864e5).slice(0, 8);
  const sup = GATE_KEYS.filter(k => gated(k));
  if (!mine.length && !sup.length) return "";
  return `<div class="panel" style="margin-bottom:16px"><h2>Supervised steps</h2><p class="small muted">${sup.length ? `Until the director releases them, these steps wait for an OK: ${sup.map(k => esc(GATES[k].label.toLowerCase())).join(", ")}.` : "The director has released all your steps."}</p>
    ${mine.map(r => `<div class="flag"><span class="sev ${r.status === "pending" ? "med" : r.status === "approved" ? "low" : "high"}" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc(GATES[r.key].label)}</b>: ${esc(r.title)}</p>${gateLine(r)}</div></div>`).join("")}</div>`;
}

/* owner side: decide on Today */
function reqPending(){ return Object.keys(S.reqs).flatMap(uid => reqList(uid)).filter(r => r.status === "pending").sort((a, b) => (a.at > b.at ? 1 : -1)); }
function reqTodayPanel(asSupervisor){
  if ((!S.isOwner && !asSupervisor) || S.preview || !S.reqReady) return "";
  const ps = reqPending().filter(r => r.uid !== S.uid); if (!ps.length) return "";
  return `<div class="panel" style="margin-bottom:16px" id="reqPanel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Requests waiting for your OK (${ps.length})</h2>${S.isOwner ? `<button class="btn small" type="button" data-view="team">Supervision in Team</button>` : ""}</div>
    ${ps.map(r => `<div class="flag"><span class="sev med" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc(nm(r.uid))}</b> · ${esc(GATES[r.key].label)} · <span class="muted">${fmtT(r.at)}</span></p><p>${esc(r.title)}</p>${r.detail ? `<p class="small muted" style="white-space:pre-wrap">${esc(r.detail)}</p>` : ""}
      ${r.tripBid && r.tripDid && isStaff() ? `<p class="small"><a href="#" data-open="${r.tripBid}|${r.tripDid}" data-goto="trips">Open the trip</a></p>` : ""}
      <label class="f" for="rq_n_${r.id}" style="margin-top:6px">Note to ${esc(nm(r.uid))} (needed when asking for changes)<input id="rq_n_${r.id}"></label>
      <div class="row" style="margin-top:6px"><button class="btn small primary" type="button" data-gate="ok" data-uid="${r.uid}" data-id="${r.id}">Approve</button><button class="btn small" type="button" data-gate="changes" data-uid="${r.uid}" data-id="${r.id}">Ask for changes</button></div></div></div>`).join("")}</div>`;
}
async function reqDecide(uid, id, ok){
  const r = (S.reqs[uid] || {})[id]; if (!r) return;
  if (uid === S.uid || !(S.isOwner || canRight("supervise"))) { toast("You cannot decide on your own request."); return; }
  const note = (($("rq_n_" + id) || {}).value || "").trim();
  if (!ok && note.length < 5) { toast("Write what should change, so they can fix it."); return; }
  const body = {...r, status: ok ? "approved" : "changes", decidedAt: now(), decidedBy: S.uid, note};
  try {
    if (ok && r.key === "take") {
      let e = (S.pool || {})[r.ref]; if (!e) { try { const d = await S.db.doc("pool/" + r.ref).get(); e = d.exists ? d.data() : null; } catch(x){} }
      if (!e || e.status !== "released") { toast("That enquiry is no longer open. Asking for changes instead is clearer for them."); return; }
      await S.db.doc("pool/" + r.ref).set({...e, status: "claimed", claimedBy: uid, claimedAt: now(), how: "approved", assignedBy: S.uid});
    }
    await S.db.doc(`req/${uid}/items/${id}`).set(body);
    S.reqs[uid] = {...(S.reqs[uid] || {}), [id]: body};
    audit(ok ? (S.isOwner ? "Supervised step approved" : "Supervised step approved by supervisor") : "Supervised step: changes asked", `${nm(uid)} · ${GATES[r.key].label}: ${r.title}${note ? " · " + note : ""}`);
    toast(ok ? (r.key === "take" ? "Approved and assigned." : "Approved.") : "Sent back with your note."); render();
  } catch(e){ toast("Could not save. Try again."); }
}

/* owner side: supervision and release in Team */
function gateStats(uid, key){ const xs = reqList(uid).filter(r => r.key === key && r.status !== "pending"); return {ok: xs.filter(r => r.status === "approved").length, ch: xs.filter(r => r.status === "changes").length}; }
function supervisionPanel(){
  const ros = Object.entries(S.roster || {}).filter(([id, p]) => id !== S.uid && p.role !== "owner" && p.active !== false);
  const head = `<div class="panel tbl" style="margin-bottom:16px" id="supPanel"><h2>Supervision and supervisor rights</h2><p class="small muted">While someone is supervised, each step below waits for your OK on Today. Release a step when you are satisfied; you can supervise it again at any time. New people start supervised. The count shows your decisions so far: approved first time, and sent back for changes.</p>
    ${S.reqReady ? "" : `<div class="note info small">Step approval starts once the SQL step "supervised steps (0011)" above has run. Until then nothing is held back.</div>`}`;
  if (!ros.length) return head + `<p class="small muted">Nobody approved yet.</p></div>`;
  return head + `<table class="small"><thead><tr><th scope=col>Name</th><th scope=col>Supervised</th><th scope=col>Supervisor</th>${GATE_KEYS.map(k => `<th scope=col>${esc(GATES[k].label)}</th>`).join("")}<th scope=col>Supervisor rights</th></tr></thead><tbody>
    ${ros.map(([id, p]) => `<tr><td>${esc(p.contractName || nm(id))}<br><span class="muted">${esc(p.role === "ops" ? "Operations" : p.role === "consultant" ? "Charter consultant" : "Broker")}</span></td>
      <td><label class="check" style="margin:0"><input type="checkbox" data-supall="${id}" ${p.supervised ? "checked" : ""}><span class="small">${p.supervised ? "Yes" : "No"}</span></label></td><td>${supAssignCell(id, p)}</td>
      ${GATE_KEYS.map(k => { if (!gateApplies(k, id)) return `<td class="muted">–</td>`; const s = gateStats(id, k), rel = !!(p.released || {})[k];
        return `<td>${!p.supervised ? `<span class="chip c-flown">Free</span>` : rel ? `<span class="chip c-flown">Released</span>` : `<span class="chip c-review">Needs your OK</span>`}<br><span class="muted">${s.ok} approved · ${s.ch} changes</span>${p.supervised ? `<br><button class="btn small" type="button" data-gate="${rel ? "resup" : "release"}" data-uid="${id}" data-key="${k}">${rel ? "Supervise again" : "Release"}</button>` : ""}</td>`; }).join("")}<td>${S.rightsReady === false ? `<span class="muted">After SQL 0012</span>` : rightsCells(id, p)}</td></tr>`).join("")}
  </tbody></table><p class="small muted" style="margin:8px 0 0"><b>Supervisor</b> gives the three rights supervise steps, assess new people, and train and share screen in one go; untick single rights if needed.</p><details class="small" style="margin-top:8px"><summary>What each step and right means</summary><ul style="margin:6px 0 0;padding-left:18px">${GATE_KEYS.map(k => `<li><b>${esc(GATES[k].label)}</b> (${GATES[k].who === "ops" ? "operations" : "brokers"}): ${esc(GATES[k].desc)}</li>`).join("")}${Object.keys(RIGHTS).map(r => `<li><b>${esc(RIGHTS[r].label)}</b> (supervisor right): ${esc(RIGHTS[r].desc)}</li>`).join("")}</ul><p class="muted" style="margin:6px 0 0">Releasing steps, giving rights and countersigning stay with you. Every supervisor decision is in the audit log with their name.</p></details></div>`;
}
async function gateRelease(uid, key, on){
  const p = (S.roster || {})[uid]; if (!p) return;
  const released = {...(p.released || {})}; if (on) released[key] = {at: now(), by: S.uid}; else delete released[key];
  try { await S.db.doc("roster/" + uid).update({released}); p.released = released; audit(on ? "Supervised step released" : "Supervised step supervised again", `${nm(uid)} · ${GATES[key].label}`); toast(on ? "Released." : "Supervised again."); render(); }
  catch(e){ toast("Could not save."); }
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-gate]"); if (!b) return; e.preventDefault();
  const a = b.dataset.gate;
  if ((a === "ok" || a === "changes") && (S.isOwner || canRight("supervise"))) reqDecide(b.dataset.uid, b.dataset.id, a === "ok");
  else if ((a === "release" || a === "resup") && S.isOwner) gateRelease(b.dataset.uid, b.dataset.key, a === "release");
});
/* member's dashboard: their supervised steps and the director's answers */
(function(){ const _vHome = vHome; vHome = function(){ const h = _vHome(), k = h.trimStart().startsWith('<div class="head">') ? h.indexOf('</div></div>') + 12 : 0; return h.slice(0, k) + myReqPanel() + h.slice(k); }; })();
document.addEventListener("change", async e => {
  const id = e.target.dataset && e.target.dataset.supall; if (!id || !S.isOwner) return;
  try { await S.db.doc("roster/" + id).update({supervised: e.target.checked}); audit(e.target.checked ? "Supervision started" : "Supervision ended: all steps free", nm(id)); toast("Saved."); } catch(err){ toast("Could not change."); }
});

/* ---------- Supervisor rights (Morten, 26 Oct 2026) ----------
   The owner ticks rights per member in Team once they have the experience: supervise (decide on others' supervised
   steps), assess (assess new people and send their agreement; countersigning stays with the owner) and approve
   (approve bookings; operations members only). Never on their own work. Rights need SQL 0012. */
const RIGHTS = {
  supervise: {label: "Supervise steps", desc: "Approve or send back supervised steps of others."},
  assess: {label: "Assess new people", desc: "See requests to join and academy progress, and send the agreement after a passed assessment. You countersign."},
  approve: {label: "Approve bookings", desc: "Approve bookings before the confirmation is issued (operations only). Never their own trips, and someone else issues."},
  train: {label: "Train and share screen", desc: "Run live training: share their own screen with the people they choose (Training → Live training), follow the syllabus and mark lessons done, and see the team's training results."}
};
/* a supervisor (Morten, 29 Oct 2026: "the supervisor to be able to do assessments and training, as well as sharing the
   screens during bookings"): one switch in Team gives supervise, assess and train together */
const SUP_SET = ["supervise", "assess", "train"];
function canRight(r){ if (S.isOwner) return true; const me = rosterOf(S.uid); return me.active !== false && !!(me.rights || {})[r]; }
const hasAnyRight = () => !S.isOwner && Object.keys(RIGHTS).some(canRight);
function rightApplies(r, id){ return r === "approve" ? rosterOf(id).role === "ops" : true; }

/* supervisors subscribe to everyone's requests (the roster they can now read) */
const _gateWatch = gateWatch;
gateWatch = function(){
  _gateWatch();
  if (S.isOwner || !canRight("supervise") || !S.db) return;
  Object.keys(S.roster || {}).filter(id => id !== S.uid).forEach(uid => { const path = `req/${uid}/items`; if (S.subs[path]) return;
    S.subs[path] = S.db.collection(path).onSnapshot(snap => { const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.reqs[uid] = o; if (!S.reqReady) S.reqReady = true; render(); }, () => {}); });
};
function reqForMe(){ return reqPending().filter(r => r.uid !== S.uid && (S.isOwner || canRight("supervise"))); }
function assessForMe(){ return canRight("assess") ? Object.entries(S.joins || {}).filter(([id]) => id !== S.uid) : []; }
function approveForMe(){ return canRight("approve") && typeof apNeeds === "function" ? allTrips().filter(t => apNeeds(t) && t.bid !== S.uid) : []; }

/* the supervisor's own page */
function vSupervise(){
  const rq = reqForMe(), as = assessForMe(), ap = approveForMe();
  if (canRight("assess") && typeof agrWatchOwner === "function") agrWatchOwner();
  const rights = Object.keys(RIGHTS).filter(canRight);
  return `<div class="head"><div><h1>Supervision</h1><p class="muted small">The director has given you these rights: ${rights.map(r => esc(RIGHTS[r].label.toLowerCase())).join(", ")}. Decide only on others' work, never your own. Every decision is logged with your name and seen by the director.</p></div></div>
    ${canRight("supervise") ? (rq.length ? reqTodayPanel(true) : `<div class="panel" style="margin-bottom:16px"><h2>Supervised steps</h2><p class="small muted">Nothing waiting.</p></div>`) : ""}
    ${canRight("approve") ? `<div class="panel" style="margin-bottom:16px"><h2>Bookings to approve${ap.length ? ` (${ap.length})` : ""}</h2>${ap.length ? ap.map(t => apCard(t, true)).join("") : `<p class="small muted">Nothing waiting.</p>`}</div>` : ""}
    ${canRight("assess") ? `<div class="panel" style="margin-bottom:16px"><h2>Waiting for assessment</h2>${as.length ? as.map(([id, j]) => obJoinCard(id, j)).join("") : `<p class="small muted">No requests waiting.</p>`}</div>` : ""}`;
}
function supPrompt(){
  if (!hasAnyRight()) return "";
  const n = reqForMe().length + assessForMe().length + approveForMe().length; if (!n) return "";
  return `<div class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${n} waiting for your decision as supervisor</h2><button class="btn small primary" type="button" data-view="supervise">Open Supervision</button></div></div>`;
}
(function(){
  const _nav = navItems;
  navItems = function(){ const items = _nav(); if (hasAnyRight() && !items.some(x => x[0] === "supervise")) items.splice(1, 0, ["supervise", "Supervision"]); return items; };
  const _vHome2 = vHome;
  vHome = function(){ const h = _vHome2(), k = h.trimStart().startsWith('<div class="head">') ? h.indexOf('</div></div>') + 12 : 0; return h.slice(0, k) + supPrompt() + h.slice(k); };
})();

/* owner: give or take rights in Team */
function isSupervisor(p){ return SUP_SET.every(r => !!((p || {}).rights || {})[r]); }
function rightsCells(id, p){
  const on = isSupervisor(p);
  return `<label class="check" style="margin:0 0 6px"><input type="checkbox" data-supmake="${id}" ${on ? "checked" : ""}><span class="small"><b>Supervisor</b></span></label>` + Object.keys(RIGHTS).map(r => rightApplies(r, id) ? `<label class="check" style="margin:0 0 4px"><input type="checkbox" data-right="${r}" data-uid="${id}" ${(p.rights || {})[r] ? "checked" : ""}><span class="small">${esc(RIGHTS[r].label)}</span></label>` : "").join("") + `<button class="btn small" type="button" data-suptext="${id}" style="margin-top:4px">Text to send</button>`;
}
/* the explanation to send to a new supervisor (copy into WhatsApp or email) */
function supText(id){
  const p = (S.roster || {})[id] || {}, first = (p.contractName || nm(id)).split(" ")[0], rt = (S.terms || {}).supRate;
  const r = Object.keys(RIGHTS).filter(k => (p.rights || {})[k] && rightApplies(k, id)), list = r.length ? r : SUP_SET;
  const lines = {
    supervise: "Supervise steps: while a new broker is supervised, some steps wait for an OK (quote to client, taking an enquiry, first contact with a prospect, and for operations payments and supplier quotes). You approve the step or send it back with a note.",
    assess: "Assess new people: you see requests to join and academy progress, and send the agreement after a passed assessment. I countersign.",
    approve: "Approve bookings: you approve bookings before the confirmation is issued, never your own trips.",
    train: "Train: in Training → Live training you share your own screen in the portal with the people you choose, follow the training syllabus and mark lessons done. Talk over the phone or Teams at the same time. Contact details are hidden on the shared screen. You also see the team's training results."
  };
  const pay = supRate() > 0 ? `Pay: ${supPts(supRate())} of the gross profit on each booking approved while a broker you supervise is supervised and you are named as their supervisor, on top of your own commission${rt == null ? " (as in the agreement)" : ""}. I can forfeit it on a booking where a step you approved broke the rules.`
    : "Pay for supervising: to be agreed with me in writing.";
  return `Hi ${first},

I would like you to be a supervisor at Archē Executive. What it means:

${list.map(k => "- " + lines[k]).join("\n")}
- You never decide on your own work. Every decision is logged with your name and I see it.

${pay}

You find it all under Supervision in the portal menu: ${location.origin}

${S.myName || "Morten"}`;
}
function supTextPanel(){
  const id = S.supTextFor; if (!id || !(S.roster || {})[id]) return "";
  return `<div class="panel" id="supTextPanel" style="margin-bottom:16px"><h2>Text to send to ${esc((S.roster[id].contractName || nm(id)))}</h2><p class="small muted">Copy it into WhatsApp or an email. It lists the rights this person has now (all three supervisor rights if none are given yet) and the pay setting below.</p>
    <textarea id="supTextBox" rows="16" readonly style="width:100%;font:inherit">${esc(supText(id))}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn small primary" type="button" data-supcopy="1">Copy</button><button class="btn small" type="button" data-supclose="1">Close</button></div></div>`;
}
/* the supervisor's pay: a setting the owner fills in when decided */
function supPayPanel(){
  const t = S.terms || {}, set = t.supRate != null && t.supRate !== "", v = set ? +(Number(t.supRate) * 100).toFixed(2) : "";
  return `<div class="panel" id="supPay" style="margin-bottom:16px"><h2>Supervisor pay</h2><p class="small muted">Points of the gross profit on each booking approved while a supervised person has a named supervisor, on top of the supervisor's own commission. The agreement (Schedule 1) says ${supPts(SUP_RATE)}; ${set ? `now set to ${supRate() ? supPts(supRate()) : "0: to be agreed, no share is recorded"}` : "that rate applies now"}. Leave the box empty to use the agreement; 0 means to be agreed. A change applies to bookings approved from then on; for people who signed with ${supPts(SUP_RATE)}, agree the change in writing first.</p>
    <div class="row"><label class="f" for="supRateIn" style="max-width:220px">Points of gross profit<input id="supRateIn" type="number" min="0" max="10" step="0.5" value="${v}" placeholder="${+(SUP_RATE * 100)} (agreement)"></label><button class="btn small primary" type="button" data-suprate="save">Save</button>${set ? `<button class="btn small" type="button" data-suprate="reset">Back to the agreement (${supPts(SUP_RATE)})</button>` : ""}</div></div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-suptext],[data-supcopy],[data-supclose],[data-suprate]"); if (!b || !S.isOwner) return;
  if (b.dataset.suptext) { S.supTextFor = b.dataset.suptext; render(); setTimeout(() => { const x = $("supTextPanel"); if (x) x.scrollIntoView({block: "start"}); }, 50); return; }
  if (b.dataset.supclose) { S.supTextFor = null; render(); return; }
  if (b.dataset.supcopy) { const x = $("supTextBox"); try { await navigator.clipboard.writeText(x.value); toast("Copied."); } catch(err){ x.focus(); x.select(); toast("Selected: press Ctrl+C (or Cmd+C) to copy."); } return; }
  if (b.dataset.suprate) {
    const raw = b.dataset.suprate === "reset" ? null : (($("supRateIn") || {}).value || "").trim();
    const val = raw === null || raw === "" ? null : Number(raw) / 100;
    if (val !== null && !(val >= 0 && val <= 0.1)) { toast("Use 0 to 10 points."); return; }
    const t = {...(S.terms || {})}; if (val === null) delete t.supRate; else t.supRate = val;
    try { await S.db.doc("config/terms").set(t); S.terms = t; audit("Supervisor pay changed", val === null ? `back to the agreement (${supPts(SUP_RATE)})` : val ? supPts(val) : "0: to be agreed"); toast("Saved."); render(); } catch(err){ toast("Could not save."); }
  }
});
document.addEventListener("change", async e => {
  const id = e.target.dataset && e.target.dataset.supmake; if (!id || !S.isOwner) return;
  const p = (S.roster || {})[id]; if (!p) return;
  const rights = {...(p.rights || {})}; SUP_SET.forEach(r => { if (e.target.checked) rights[r] = true; else delete rights[r]; });
  try { await S.db.doc("roster/" + id).update({rights}); p.rights = rights; audit(e.target.checked ? "Made supervisor" : "Supervisor role taken back", `${nm(id)} · ${SUP_SET.map(r => RIGHTS[r].label).join(", ")}`); toast(e.target.checked ? "Saved. Use \"Text to send\" to tell them." : "Saved."); render(); }
  catch(err){ toast("Could not save."); }
});
document.addEventListener("change", async e => {
  const r = e.target.dataset && e.target.dataset.right; if (!r || !S.isOwner) return;
  const id = e.target.dataset.uid, p = (S.roster || {})[id]; if (!p) return;
  const rights = {...(p.rights || {})}; if (e.target.checked) rights[r] = true; else delete rights[r];
  try { await S.db.doc("roster/" + id).update({rights}); p.rights = rights; audit(e.target.checked ? "Supervisor right given" : "Supervisor right taken back", `${nm(id)} · ${RIGHTS[r].label}`); toast("Saved."); render(); }
  catch(err){ toast("Could not save."); }
});

/* members with rights who are not staff: read the roster and requests to join (allowed by SQL 0012) */
setInterval(() => {
  if (!S.db || S.isOwner || S.canEdit || !hasAnyRight()) return;
  if (!S.subs["roster"]) watchCol("roster", snap => { const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.roster = o; render(); });
  if (canRight("assess") && !S.subs["join"]) watchCol("join", snap => { S.joins = {}; snap.docs.forEach(d => S.joins[d.id] = d.data()); render(); });
}, 2500);

/* ---------- Supervision share (Schedule 1; Morten, 26 Oct 2026) ----------
   While someone is supervised and has a named supervisor, 3 points of the gross profit on each booking approved in
   that time go to the supervisor (to Archē when an owner supervises). Recorded on the trip at approval. The owner can
   forfeit a supervisor's share on a booking where they approved a step that broke the rules. No automatic end:
   it stops when supervision is switched off. */
const SUP_RATE = 0.03;   // the agreed rate (agreement Schedule 1); the owner can change it in Team (terms.supRate)
const supRate = () => { const v = (S.terms || {}).supRate; return v == null || v === "" || !isFinite(Number(v)) ? SUP_RATE : Math.max(0, Math.min(0.1, Number(v))); };
// 0 points = to be agreed: no share is recorded
const supPts = r => `${+(r * 100).toFixed(2)} point${r === 0.01 ? "" : "s"}`;
function ownerIds(){ return [...new Set([...(S.isOwner ? [S.uid] : []), ...Object.entries(S.roster || {}).filter(([, p]) => p.role === "owner").map(([id]) => id)])]; }
function supShareFor(bid){
  const r = rosterOf(bid); if (!r || !r.supervised || !r.supervisor || r.supervisor === bid) return null;
  const sup = r.supervisor, sr = (S.roster || {})[sup], isOwnerSup = ownerIds().includes(sup) || (sr && sr.role === "owner");
  if (!supRate() && !isOwnerSup) return null;
  return {uid: sup, rate: supRate(), toArche: !!isOwnerSup, at: now()};
}
function supCandidates(id){
  const owners = ownerIds().map(o => [o, o === S.uid ? (S.myName || "You") + " (owner)" : nm(o) + " (owner)"]);
  const members = Object.entries(S.roster || {}).filter(([o, p]) => o !== id && p.active !== false && p.role !== "owner" && (p.rights || {}).supervise).map(([o, p]) => [o, p.contractName || nm(o)]);
  return [...owners, ...members];
}
function supAssignCell(id, p){
  if (!p.supervised) return `<span class="muted">–</span>`;
  const c = supCandidates(id);
  return `<select data-supby="${id}" aria-label="Supervisor for ${esc(p.contractName || nm(id))}" style="width:auto"><option value="">Not named</option>${c.map(([o, n]) => `<option value="${o}" ${p.supervisor === o ? "selected" : ""}>${esc(n)}</option>`).join("")}</select><br><span class="muted">${p.supervisor ? (ownerIds().includes(p.supervisor) ? supPts(supRate()) + " to Archē" : supPts(supRate()) + " to the supervisor") : "No share until named"}</span>`;
}
document.addEventListener("change", async e => {
  const id = e.target.dataset && e.target.dataset.supby; if (!id || !S.isOwner) return;
  const v = e.target.value || null;
  try { await S.db.doc("roster/" + id).update({supervisor: v}); (S.roster[id] || {}).supervisor = v; audit(v ? "Supervisor named" : "Supervisor removed", `${nm(id)}${v ? " · " + nm(v) : ""}`); toast("Saved."); render(); } catch(err){ toast("Could not save."); }
});
/* on the trip: who gets the share, and the owner's forfeit */
function supShareBlock(t){
  const sh = t && t.st && t.st.supShare; if (!sh || !(isStaff() || sh.uid === S.uid) || S.preview) return "";
  const gp = num(t.st.price) - num(t.st.opPrice) - num(t.st.direct), amt = gp * num(sh.rate == null ? SUP_RATE : sh.rate);
  return `<div class="note ${sh.forfeited ? "bad" : "info"} small"><b>Supervision share</b> (${supPts(num(sh.rate == null ? SUP_RATE : sh.rate))}, ${usd(amt)}): ${sh.toArche ? "stays with Archē (an owner supervised)" : sh.forfeited ? `forfeited ${fmtT(sh.forfeited.at)}: ${esc(sh.forfeited.reason || "")}` : `to ${esc(nm(sh.uid))}`}.
    ${S.isOwner && !sh.toArche && !sh.forfeited ? `<div class="row" style="margin-top:6px"><input id="sf_why" placeholder="Rule broken (for the record)" style="max-width:320px"><button class="btn small danger" type="button" data-supfo="${t.did}">Forfeit the share</button></div>` : ""}</div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-supfo]"); if (!b || !S.isOwner) return; e.preventDefault();
  const t = tripById(b.dataset.supfo), why = (($("sf_why") || {}).value || "").trim(); if (!t) return;
  if (why.length < 5) { toast("Write which rule was broken."); return; }
  try { await statusWrite(t, {supShare: {...t.st.supShare, forfeited: {at: now(), by: S.uid, reason: why}}}, `Supervision share forfeited: ${why}`); audit("Supervision share forfeited", `${(t.st || {}).ref || t.did} · ${nm(t.st.supShare.uid)} · ${why}`); toast("Forfeited: the share stays with Archē."); } catch(err){ toast("Could not save."); }
});
/* supervisors who are not staff: read the trips that pay them a share (SQL 0016) */
setInterval(() => {
  if (!S.db || S.isOwner || isStaff() || typeof canRight !== "function" || !canRight("supervise")) return;
  Object.keys(S.roster || {}).filter(id => id !== S.uid).forEach(bid => { const path = `status/${bid}/deals`; if (S.subs[path]) return;
    S.subs[path] = S.db.collection(path).onSnapshot(snap => { const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.status[bid] = o; render(); }, () => {}); });
}, 3000);
/* supervisors (Morten, 29 Oct 2026): pay and the text to send sit with the rights in Team; supervisors with the
   train or assess right see the team's training results (read through /api/live, which checks the right) */
(function(){
  const _sp = supervisionPanel; supervisionPanel = function(){ return supTextPanel() + _sp() + supPayPanel(); };
  const _vSup = vSupervise; vSupervise = function(){ const h = _vSup(); if (!canRight("train")) return h;
    return h + `<div class="panel" style="margin-bottom:16px"><h2>Training</h2><p class="small">Train people live: open <b>Training → Live training</b>, choose who watches and which pages, and share your screen while you talk on the phone or Teams. Contact details are hidden on the shared screen. The team's results are under <b>Training → Booking practice</b>.</p><button class="btn small" type="button" data-view="training">Open Training</button></div>`; };
  const _vTrSup = vTraining; vTraining = function(){ const h = _vTrSup();
    if (isStaff() || S.preview || S.view !== "training" || (S.trTab || "course") !== "book" || !(canRight("train") || canRight("assess"))) return h;
    return h + `<div style="margin-top:16px">${trTeamPanel()}</div>`; };
  const _trLoadAll = trLoadAll; trLoadAll = async function(){
    if (isStaff() || window.__TEST_AS || !window.__sb) return _trLoadAll();
    if (S.trLoading) return; S.trLoading = true;
    try { const sess = (await window.__sb.auth.getSession()).data.session;
      const r = await fetch("/api/live", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || "")}, body: JSON.stringify({action: "progress"})});
      const j = await r.json().catch(() => ({})); (j.people || []).forEach(p => { if (p.name && !S.names[p.id]) S.names[p.id] = p.name; }); S.trAll = j.runs || {}; }
    catch(e){ S.trAll = {}; }
    S.trLoading = false; render(); };
})();
