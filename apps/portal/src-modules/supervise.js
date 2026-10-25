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
function gateReq(uid, key, ref){ return reqList(uid).find(r => r.key === key && r.ref === ref) || null; }

/* subscribe: members to their own requests, owners to everyone's */
function gateWatch(){
  if (!S.db || !S.uid || !S.role || S.role === "loading" || S.role === "pending") return;
  const ids = S.isOwner ? Object.keys(S.roster || {}).filter(id => id !== S.uid) : [S.uid];
  ids.forEach(uid => { const path = `req/${uid}/items`; if (S.subs[path]) return;
    S.subs[path] = S.db.collection(path).onSnapshot(snap => { const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.reqs[uid] = o; if (!S.reqReady) S.reqReady = true; render(); }, e => { S.reqErr = e && e.code; }); });
}
setInterval(gateWatch, 2000);

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
function reqTodayPanel(){
  if (!S.isOwner || S.preview || !S.reqReady) return "";
  const ps = reqPending(); if (!ps.length) return "";
  return `<div class="panel" style="margin-bottom:16px" id="reqPanel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Requests waiting for your OK (${ps.length})</h2><button class="btn small" type="button" data-view="team">Supervision in Team</button></div>
    ${ps.map(r => `<div class="flag"><span class="sev med" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc(nm(r.uid))}</b> · ${esc(GATES[r.key].label)} · <span class="muted">${fmtT(r.at)}</span></p><p>${esc(r.title)}</p>${r.detail ? `<p class="small muted" style="white-space:pre-wrap">${esc(r.detail)}</p>` : ""}
      ${r.tripBid && r.tripDid ? `<p class="small"><a href="#" data-open="${r.tripBid}|${r.tripDid}" data-goto="trips">Open the trip</a></p>` : ""}
      <label class="f" for="rq_n_${r.id}" style="margin-top:6px">Note to ${esc(nm(r.uid))} (needed when asking for changes)<input id="rq_n_${r.id}"></label>
      <div class="row" style="margin-top:6px"><button class="btn small primary" type="button" data-gate="ok" data-uid="${r.uid}" data-id="${r.id}">Approve</button><button class="btn small" type="button" data-gate="changes" data-uid="${r.uid}" data-id="${r.id}">Ask for changes</button></div></div></div>`).join("")}</div>`;
}
async function reqDecide(uid, id, ok){
  const r = (S.reqs[uid] || {})[id]; if (!r) return;
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
    audit(ok ? "Supervised step approved" : "Supervised step: changes asked", `${nm(uid)} · ${GATES[r.key].label}: ${r.title}${note ? " · " + note : ""}`);
    toast(ok ? (r.key === "take" ? "Approved and assigned." : "Approved.") : "Sent back with your note."); render();
  } catch(e){ toast("Could not save. Try again."); }
}

/* owner side: supervision and release in Team */
function gateStats(uid, key){ const xs = reqList(uid).filter(r => r.key === key && r.status !== "pending"); return {ok: xs.filter(r => r.status === "approved").length, ch: xs.filter(r => r.status === "changes").length}; }
function supervisionPanel(){
  const ros = Object.entries(S.roster || {}).filter(([id, p]) => id !== S.uid && p.role !== "owner" && p.active !== false);
  const head = `<div class="panel tbl" style="margin-bottom:16px" id="supPanel"><h2>Supervision</h2><p class="small muted">While someone is supervised, each step below waits for your OK on Today. Release a step when you are satisfied; you can supervise it again at any time. New people start supervised. The count shows your decisions so far: approved first time, and sent back for changes.</p>
    ${S.reqReady ? "" : `<div class="note info small">Step approval starts once the SQL step "supervised steps (0011)" above has run. Until then nothing is held back.</div>`}`;
  if (!ros.length) return head + `<p class="small muted">Nobody approved yet.</p></div>`;
  return head + `<table class="small"><thead><tr><th scope=col>Name</th><th scope=col>Supervised</th>${GATE_KEYS.map(k => `<th scope=col>${esc(GATES[k].label)}</th>`).join("")}</tr></thead><tbody>
    ${ros.map(([id, p]) => `<tr><td>${esc(p.contractName || nm(id))}<br><span class="muted">${esc(p.role === "ops" ? "Operations" : p.role === "consultant" ? "Charter consultant" : "Broker")}</span></td>
      <td><label class="check" style="margin:0"><input type="checkbox" data-supall="${id}" ${p.supervised ? "checked" : ""}><span class="small">${p.supervised ? "Yes" : "No"}</span></label></td>
      ${GATE_KEYS.map(k => { if (!gateApplies(k, id)) return `<td class="muted">–</td>`; const s = gateStats(id, k), rel = !!(p.released || {})[k];
        return `<td>${!p.supervised ? `<span class="chip c-flown">Free</span>` : rel ? `<span class="chip c-flown">Released</span>` : `<span class="chip c-review">Needs your OK</span>`}<br><span class="muted">${s.ok} approved · ${s.ch} changes</span>${p.supervised ? `<br><button class="btn small" type="button" data-gate="${rel ? "resup" : "release"}" data-uid="${id}" data-key="${k}">${rel ? "Supervise again" : "Release"}</button>` : ""}</td>`; }).join("")}</tr>`).join("")}
  </tbody></table><details class="small" style="margin-top:8px"><summary>What each step means</summary><ul style="margin:6px 0 0;padding-left:18px">${GATE_KEYS.map(k => `<li><b>${esc(GATES[k].label)}</b> (${GATES[k].who === "ops" ? "operations" : "brokers"}): ${esc(GATES[k].desc)}</li>`).join("")}</ul></details></div>`;
}
async function gateRelease(uid, key, on){
  const p = (S.roster || {})[uid]; if (!p) return;
  const released = {...(p.released || {})}; if (on) released[key] = {at: now(), by: S.uid}; else delete released[key];
  try { await S.db.doc("roster/" + uid).update({released}); p.released = released; audit(on ? "Supervised step released" : "Supervised step supervised again", `${nm(uid)} · ${GATES[key].label}`); toast(on ? "Released." : "Supervised again."); render(); }
  catch(e){ toast("Could not save."); }
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-gate]"); if (!b || !S.isOwner) return; e.preventDefault();
  const a = b.dataset.gate;
  if (a === "ok" || a === "changes") reqDecide(b.dataset.uid, b.dataset.id, a === "ok");
  else if (a === "release" || a === "resup") gateRelease(b.dataset.uid, b.dataset.key, a === "release");
});
/* member's dashboard: their supervised steps and the director's answers */
(function(){ const _vHome = vHome; vHome = function(){ const h = _vHome(), k = h.trimStart().startsWith('<div class="head">') ? h.indexOf('</div></div>') + 12 : 0; return h.slice(0, k) + myReqPanel() + h.slice(k); }; })();
document.addEventListener("change", async e => {
  const id = e.target.dataset && e.target.dataset.supall; if (!id || !S.isOwner) return;
  try { await S.db.doc("roster/" + id).update({supervised: e.target.checked}); audit(e.target.checked ? "Supervision started" : "Supervision ended: all steps free", nm(id)); toast("Saved."); } catch(err){ toast("Could not change."); }
});
