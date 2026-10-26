/* ---------- Broker intake and leaving (Morten, 26 Oct 2026) ----------
   - Ready to sign: no agreement is sent until company, bank, client payments and Avinode are ticked (insurance is
     being arranged; clause 8.9 says so).
   - Supervision limit: at most N people supervised at once (default 6); others wait.
   - Country check: a candidate from a country Archē has no broker in needs a counsel check before the agreement.
   - Assessment list: candidates name 10–20 organisations they can reach; they become their own leads at countersignature.
   - Leaving: one tick ends the engagement (now, or after 30 days' notice), takes access away, frees their enquiries and
     leads, removes rights and alerts, and asks them to confirm deletion of Archē data within 7 days (clause 8.5).
   - I'm unavailable: alerts go to a backup person for a set time.
   - 24-hour contacts: operator operations line and handler phone on every trip before the confirmation.
   Settings live in config/intake (owner writes). */
const INTAKE_READY = {company: "Company formed (UEN)", bank: "Business bank account open", payments: "Client payments working (provider live)", avinode: "Avinode subscription active"};
const intakeCfg = () => S.intake || {};
const intakeCap = () => Number(intakeCfg().cap) || 6;
function intakeWatch(){ if (!S.db || S.subs["config/intake"]) return; watchDoc("config/intake", snap => { S.intake = snap.exists ? snap.data() : {}; render(); }); }
setInterval(intakeWatch, 2000);
async function intakeSave(patch, line){
  const next = {...intakeCfg(), ...patch};
  try { await S.db.doc("config/intake").set(next); S.intake = next; if (line) audit("Intake settings", line); render(); } catch(e){ toast("Could not save."); }
}
const intakeReady = () => Object.keys(INTAKE_READY).every(k => (intakeCfg().ready || {})[k]);
function supervisedNow(){
  const ros = Object.entries(S.roster || {}).filter(([, p]) => p.active !== false && p.role !== "owner" && p.supervised).length;
  const pending = Object.values(S.agrs || {}).filter(a => a && (a.status === "sent" || a.status === "signed")).length;
  return ros + pending;
}
const countryKey = c => String(c || "").trim().toLowerCase();
function countryChecked(c){
  const k = countryKey(c); if (!k) return false;
  if (((intakeCfg().countries || {})[k])) return true;
  return Object.values(S.roster || {}).some(p => p.active !== false && p.role !== "owner" && countryKey(p.base) === k);
}
/* the check before an agreement goes out; returns a reason or "" */
function intakeBlock(id){
  if (!intakeReady()) return "Not ready to sign brokers yet: tick company, bank, client payments and Avinode in Team > Ready to sign brokers.";
  const j = (S.joins || {})[id] || {};
  if (!countryChecked(j.base)) return `${j.base || "This country"} is new for Archē: tick the counsel check on the request first.`;
  if (supervisedNow() >= intakeCap()) return `Supervision is full (${supervisedNow()} of ${intakeCap()}). Release someone, or raise the limit in Team.`;
  return "";
}
/* extras on each request in Team (owner and assessors) */
function intakeJoinExtras(id, j){
  const orgs = j.orgs || [], newC = !countryChecked(j.base), full = supervisedNow() >= intakeCap();
  return `${orgs.length ? `<details class="small" style="margin:4px 0"><summary>Organisations they can reach (${orgs.length})</summary><ul style="margin:4px 0 0;padding-left:18px">${orgs.map(o => `<li>${esc(o)}</li>`).join("")}</ul></details>` : `<p class="small muted">No list of organisations given.</p>`}
    ${newC ? `<div class="note info small">New country for Archē (${esc(j.base || "not stated")}): a short counsel check on local rules is needed before the agreement.${S.isOwner ? ` <button class="btn small" type="button" data-intake="country" data-c="${esc(j.base || "")}">Counsel checked ${esc(j.base || "")}</button>` : ""}</div>` : ""}
    ${full ? `<p class="small"><span class="chip c-review">Waiting list</span> Supervision is full (${supervisedNow()} of ${intakeCap()}).</p>` : ""}`;
}
/* Team: ready to sign, limit, leavers */
function intakeTeamPanel(){
  if (!S.isOwner || S.preview) return "";
  const R = intakeCfg().ready || {}, n = supervisedNow(), cap = intakeCap();
  const leavers = Object.entries(S.roster || {}).filter(([, p]) => p.offboard && !(p.offboard.closed));
  return `<div class="panel" style="margin-bottom:16px" id="intakePanel"><h2>Ready to sign brokers</h2>
    <p class="small muted">Candidates can register, read the offer and do the academy at any time. Agreements go out only when all four are ticked.</p>
    ${Object.entries(INTAKE_READY).map(([k, l]) => `<label class="check" for="ir_${k}"><input type="checkbox" id="ir_${k}" data-intake="ready" data-k="${k}" ${R[k] ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}
    <label class="check" for="ir_ins"><input type="checkbox" id="ir_ins" data-intake="ready" data-k="insurance" ${R.insurance ? "checked" : ""}><span>Insurance in place (optional now; when ticked, tell signed brokers in writing, as clause 8.9 promises)</span></label>
    <p class="small">${intakeReady() ? `<span class="chip c-flown">Ready</span> Agreements can be sent.` : `<span class="chip c-review">Not ready</span> Agreements are held back.`}</p>
    <div class="row"><label class="f" for="ir_cap" style="max-width:280px">People in supervision at the same time (now ${n})<input id="ir_cap" type="number" min="1" max="50" value="${cap}"></label><button class="btn small" type="button" data-intake="cap">Save limit</button></div>
    ${leavers.length ? `<h3 style="margin:12px 0 4px">Leaving</h3>${leavers.map(([id, p]) => offboardCard(id, p)).join("")}` : ""}
    ${S.offboardId ? offboardForm(S.offboardId) : ""}</div>`;
}

/* ---------- leaving: one tick ---------- */
const OFF_EXT = {mailbox: "Archē mailbox suspended", whatsapp: "Removed from Archē WhatsApp groups", avinode: "Avinode access removed (if any)"};
function offboardForm(id){
  const p = (S.roster || {})[id] || {};
  return `<form id="offForm" class="stack" style="border-top:1px solid var(--line);padding-top:10px;margin-top:10px"><h3 style="margin:0">End the engagement of ${esc(p.contractName || nm(id))}</h3>
    <label class="f" for="off_mode">How<select id="off_mode"><option value="notice">30 days' notice (clause 8.2): access ends on the end date</option><option value="agreed">Today, by agreement</option><option value="breach">Today, for breach (clause 8.3)</option></select></label>
    <label class="f" for="off_why">Reason (kept in the record)<input id="off_why" required minlength="5"></label>
    <p class="small muted">One tick: access ends (now or on the end date), their open enquiries go back to the pool, prospects assigned to them go back into rotation, their own leads come to you, supervisor rights and alerts are removed, and they are asked to confirm deleting all Archē data within 7 days. Open trips stay with you to finish (clause 8.4).</p>
    <div class="row"><button class="btn small danger" type="submit">End engagement</button><button class="btn small" type="button" data-intake="offCancel">Cancel</button></div></form>`;
}
function offboardCard(id, p){
  const o = p.offboard, ext = o.ext || {}, conf = o.confirmedAt, late = !conf && o.deleteBy && Date.now() > Date.parse(o.deleteBy);
  return `<div class="flag"><span class="sev ${late ? "high" : "med"}" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc(p.contractName || nm(id))}</b> · ${o.mode === "notice" ? `notice given ${fmtD(o.at)}, ends ${fmtD(o.endDate)}` : `ended ${fmtD(o.endDate)}`} · <span class="muted">${esc(o.reason || "")}</span></p>
    <p class="small">${o.openTrips ? `${o.openTrips} open trip${o.openTrips === 1 ? "" : "s"} for you to finish · ` : ""}${o.leadsMoved || 0} own leads moved to you · ${o.poolFreed || 0} enquiries back in the pool · ${o.prospectsFreed || 0} prospects back in rotation</p>
    <p class="small">${conf ? `<span class="chip c-flown">Deletion confirmed ${fmtT(conf)}</span>` : late ? `<span class="chip c-returned">Deletion not confirmed: due ${fmtD(o.deleteBy)}</span>` : `<span class="chip c-review">Deletion confirmation due by ${fmtD(o.deleteBy)}</span>`}</p>
    ${Object.entries(OFF_EXT).map(([k, l]) => `<label class="check" for="ox_${k}_${id}"><input type="checkbox" id="ox_${k}_${id}" data-intake="ext" data-uid="${id}" data-k="${k}" ${ext[k] ? "checked" : ""}><span class="small">${esc(l)}</span></label>`).join("")}
    ${conf && Object.keys(OFF_EXT).every(k => ext[k]) ? `<div class="row"><button class="btn small" type="button" data-intake="close" data-uid="${id}">Close the file</button></div>` : ""}</div></div>`;
}
async function offboardRun(id, mode, reason){
  const p = (S.roster || {})[id]; if (!p) return;
  const at = now(), end = mode === "notice" ? new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) : at.slice(0, 10);
  const deleteBy = new Date(Date.parse(end + "T23:59:00Z") + 7 * 864e5).toISOString();
  let poolFreed = 0, prospectsFreed = 0, leadsMoved = 0;
  try {
    // enquiries they hold but have not turned into a trip go back to the pool
    try { const q = await S.db.collection("pool").get(); for (const d of q.docs) { const e = d.data(); if (e.claimedBy === id && e.status === "claimed" && !e.tripDid) { await S.db.doc("pool/" + d.id).set({...e, status: "released", claimedBy: null, releasedAt: at, releasedBy: S.uid, note: "Freed when the broker left"}); poolFreed++; } } } catch(e){}
    if (mode !== "notice") {
      // prospects back into rotation; their own leads to the owner
      for (const [pid, pr] of Object.entries(S.prospects || {})) if (pr.assignedTo === id) { try { await S.db.doc("prospects/" + pid).set({...pr, assignedTo: null, history: [...(pr.history || []), {t: at, by: S.uid, note: "Broker left: back to rotation"}]}); prospectsFreed++; } catch(e){} }
      try { const q = await S.db.collection(`leads/${id}/items`).get(); for (const d of q.docs) { const l = d.data(); if (l.own) { await S.db.doc(`leads/${S.uid}/items/${d.id}`).set({...l, sourcedBy: l.sourcedBy || id, assignedAt: at, log: [...(l.log || []), {t: at, by: S.uid, channel: "Other", outcome: l.status || "new", note: "Moved from a broker who left"}]}); leadsMoved++; } } } catch(e){}
    }
    const openTrips = allTrips().filter(t => t.bid === id && !["flown", "cancelled"].includes(t.stage)).length;
    // alerts and rights
    try { const A = S.alerts || (await S.db.doc("alerts/settings").get()).data() || {}; if ((A.recipients || []).some(r => r.uid === id)) await S.db.doc("alerts/settings").set({...A, recipients: A.recipients.filter(r => r.uid !== id)}); } catch(e){}
    const off = {at, by: S.uid, mode, reason, endDate: end, deleteBy, poolFreed, prospectsFreed, leadsMoved, openTrips, ext: {}};
    await S.db.doc("roster/" + id).update({...(mode === "notice" ? {} : {active: false, endedAt: at}), rights: {}, supervised: false, offboard: off});
    audit(mode === "notice" ? "Notice given: engagement ends" : "Engagement ended", `${nm(id)} · ${mode} · ${reason}`);
    toast(mode === "notice" ? `Notice recorded. Access ends on ${fmtD(end)}.` : "Engagement ended. Access is off.");
    S.offboardId = null; render();
  } catch(e){ toast("Could not end the engagement. Try again."); }
}
/* notice periods that have run out: switch access off (owner's portal checks on every visit) */
async function offboardSweep(){
  if (!S.isOwner || S.preview || S.offSweep) return; S.offSweep = true;
  for (const [id, p] of Object.entries(S.roster || {})) {
    const o = p.offboard; if (!o || p.active === false || o.mode !== "notice" || Date.parse(o.endDate + "T23:59:00Z") > Date.now()) continue;
    await offboardRun(id, "agreed", (o.reason || "") + " (notice period ended)");
  }
  setTimeout(() => { S.offSweep = false; }, 10 * 60e3);
}
/* the person who left: one screen to confirm deletion (clause 8.5) */
function vLeaving(){
  if (S.db && !S.subs["join/" + S.uid]) watchDoc("join/" + S.uid, snap => { S.myJoin = snap.exists ? snap.data() : null; render(); });
  const o = (S.myRoster || {}).offboard || {}, done = ((S.myLeave || S.myJoin || {}).kind === "leaving") ? (S.myLeave || S.myJoin).confirmedAt : null;
  return `<div class="panel stack" style="max-width:640px"><h1>Your engagement has ended</h1>
    <p>Your agreement with Archē Executive ended on ${fmtD(o.endDate)}. Thank you for your work.</p>
    <p class="small">Under clause 8.5, return or delete all Archē information and client data you hold (emails, notes, files, contacts, messages) by ${fmtD(o.deleteBy)}, and confirm it here. Commission on bookings approved before the end date is paid as clause 8.4 sets out.</p>
    ${done ? `<div class="note ok small">Confirmed ${fmtT(done)}. Nothing else is needed.</div>` : `<label class="check" for="lv_ok"><input type="checkbox" id="lv_ok"><span>I have returned or deleted all Archē information and client data, and kept no copies.</span></label><div class="row"><button class="btn primary" type="button" data-intake="leaveOk">Confirm</button></div>`}</div>`;
}
/* ---------- I'm unavailable: alerts go to a backup ---------- */
function awayBlock(){
  if (!S.isOwner || S.preview || !S.alerts) return "";
  const A = S.alerts, me = ((A.away || {})[S.uid]) || null, on = me && Date.parse(me.until) > Date.now();
  const backups = (A.recipients || []).filter(r => r.uid && r.uid !== S.uid && r.active !== false);
  if (on) return `<div class="note info small" style="margin-bottom:16px"><b>You are unavailable until ${fmtT(me.until)}.</b> Alerts go to ${esc(me.backupName || "the next person")} first. <button class="btn small" type="button" data-intake="awayOff">I'm back</button></div>`;
  return `<div class="row" style="margin-bottom:12px"><button class="btn small" type="button" data-intake="awayForm">I'm unavailable…</button>${S.awayForm ? `<label class="f" for="aw_until" style="max-width:220px">Until<input id="aw_until" type="datetime-local"></label><label class="f" for="aw_b" style="max-width:220px">Alerts go to<select id="aw_b">${backups.length ? backups.map(r => `<option value="${r.uid}">${esc(r.name)}</option>`).join("") : `<option value="">Nobody else on the alert list yet</option>`}</select></label><button class="btn small primary" type="button" data-intake="awayOn">Set</button>` : ""}</div>`;
}
/* ---------- first contact: one OK for a batch of new leads ---------- */
function contactBatchBlock(){
  if (typeof gated !== "function" || !gated("contact")) return "";
  const asked = new Set(reqList(S.uid).filter(r => r.key === "contact" && r.status !== "changes").flatMap(r => [r.ref, ...(r.refs || [])]));
  const fresh = Object.entries(S.leads || {}).filter(([id, l]) => !(l.log || []).length && !["dnc", "duplicate"].includes(l.status) && !asked.has(id));
  if (!fresh.length) return "";
  return `<div class="note info small" style="margin-bottom:12px">First contact with each new lead needs the director's OK while you are supervised. ${fresh.length} new lead${fresh.length === 1 ? "" : "s"} not asked for yet. <button class="btn small primary" type="button" data-intake="batch">Ask OK to contact all ${fresh.length}</button></div>`;
}
async function contactBatch(){
  const asked = new Set(reqList(S.uid).filter(r => r.key === "contact" && r.status !== "changes").flatMap(r => [r.ref, ...(r.refs || [])]));
  const fresh = Object.entries(S.leads || {}).filter(([id, l]) => !(l.log || []).length && !["dnc", "duplicate"].includes(l.status) && !asked.has(id));
  if (!fresh.length) return;
  try { await gateAsk("contact", "batch-" + Date.now().toString(36), "first", `First contact with ${fresh.length} new lead${fresh.length === 1 ? "" : "s"}`, fresh.map(([, l]) => `${l.org}${l.country ? " (" + l.country + ")" : ""}`).join("\n"), {refs: fresh.map(([id]) => id)}); toast("Sent to the director for one OK."); render(); }
  catch(e){ toast("Could not send. Try again."); }
}
/* ---------- 24-hour contacts on every trip ---------- */
function tripContactsBlock(t){
  if (!t || !isStaff() || S.preview || ["cancelled"].includes(t.stage)) return "";
  const st = t.st || {}, c = st.contacts24 || {};
  return `<div class="panel stack small" style="margin:8px 0"><h3 style="margin:0">24-hour contacts</h3><p class="muted" style="margin:0">Who the client and Archē call at night if the broker or the director cannot be reached. Needed before the confirmation is issued.</p>
    <div class="fgrid"><label class="f" for="c24_op">Operator operations, 24 hours<input id="c24_op" value="${esc(c.op || "")}" placeholder="Name of desk and phone"></label><label class="f" for="c24_h">Handler at departure<input id="c24_h" value="${esc(c.handler || "")}" placeholder="Handler and phone"></label></div>
    <div class="row"><button class="btn small" type="button" data-intake="c24">Save contacts</button></div></div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-intake]"); if (!b) return;
  const a = b.dataset.intake;
  if (a === "leaveOk") { e.preventDefault(); if (!($("lv_ok") || {}).checked) { toast("Tick the box first."); return; } try { const body = {kind: "leaving", confirmedAt: now(), contractName: (S.myRoster || {}).contractName || ""}; await S.db.doc("join/" + S.uid).set(body); S.myLeave = body; toast("Confirmed. Thank you."); render(); } catch(err){ toast("Could not save. Try again."); } return; }
  if (a === "batch") { e.preventDefault(); contactBatch(); return; }
  if (a === "c24") { e.preventDefault(); const t = tripById(S.sel); if (!t) return; const op = $("c24_op").value.trim(), h = $("c24_h").value.trim(); if (!op || !h) { toast("Fill in both."); return; } try { await statusWrite(t, {contacts24: {op, handler: h, at: now(), by: S.uid}}, "24-hour contacts saved"); toast("Saved."); } catch(err){ toast("Could not save."); } return; }
  if (!S.isOwner) return; if (b.tagName !== "INPUT") e.preventDefault();
  if (a === "ready") { const R = {...(intakeCfg().ready || {})}; R[b.dataset.k] = b.checked ? {at: now(), by: S.uid} : undefined; Object.keys(R).forEach(k => R[k] === undefined && delete R[k]); return intakeSave({ready: R}, `${b.dataset.k} ${b.checked ? "ticked" : "unticked"}`); }
  if (a === "cap") { const c = Math.max(1, Math.min(50, +($("ir_cap") || {}).value || 6)); return intakeSave({cap: c}, `Supervision limit ${c}`); }
  if (a === "country") { const k = countryKey(b.dataset.c); if (!k) { toast("The candidate has not stated a country."); return; } return intakeSave({countries: {...(intakeCfg().countries || {}), [k]: {at: now(), by: S.uid, name: b.dataset.c}}}, `Counsel check done: ${b.dataset.c}`); }
  if (a === "offCancel") { S.offboardId = null; render(); return; }
  if (a === "ext" || a === "close") { const id = b.dataset.uid, p = (S.roster || {})[id]; if (!p || !p.offboard) return; const o = {...p.offboard, ext: {...(p.offboard.ext || {})}}; if (a === "ext") o.ext[b.dataset.k] = b.checked ? now() : undefined; else o.closed = now();
    try { await S.db.doc("roster/" + id).update({offboard: JSON.parse(JSON.stringify(o))}); if (a === "close") audit("Leaving file closed", nm(id)); render(); } catch(err){ toast("Could not save."); } return; }
  if (a === "awayForm") { S.awayForm = !S.awayForm; render(); return; }
  if (a === "awayOn" || a === "awayOff") { const A = {...(S.alerts || {recipients: []})}, away = {...(A.away || {})};
    if (a === "awayOff") delete away[S.uid]; else { const u = ($("aw_until") || {}).value, bu = ($("aw_b") || {}).value; if (!u || Date.parse(u) <= Date.now()) { toast("Choose when you are back."); return; } if (!bu) { toast("Add someone else to the alert list first."); return; } away[S.uid] = {until: new Date(u).toISOString(), backup: bu, backupName: ((A.recipients || []).find(r => r.uid === bu) || {}).name || ""}; }
    S.awayForm = false; return alertSave({...A, away}, a === "awayOff" ? "Back from unavailable" : "Unavailable set"); }
});
document.addEventListener("click", e => { const b = e.target.closest("[data-offboard]"); if (!b || !S.isOwner) return; e.preventDefault(); S.offboardId = b.dataset.offboard; render(); const el = document.getElementById("intakePanel"); if (el) el.scrollIntoView({behavior: "smooth"}); });
document.addEventListener("submit", e => { if (e.target.id !== "offForm") return; e.preventDefault(); const why = $("off_why").value.trim(); if (why.length < 5) { toast("Write the reason."); return; } offboardRun(S.offboardId, $("off_mode").value, why); });

/* owner: leaving confirmations arrive as the person's own join row (the only thing they can still write) */
async function leaveConfirmSweep(){
  if (!S.isOwner || S.preview) return;
  for (const [id, l] of Object.entries(S.leaves || {})) {
    const p = (S.roster || {})[id]; if (!p || !p.offboard || p.offboard.confirmedAt || !l.confirmedAt) continue;
    try { await S.db.doc("roster/" + id).update({offboard: {...p.offboard, confirmedAt: l.confirmedAt}}); await S.db.doc("join/" + id).delete(); audit("Leaver confirmed deleting Archē data", nm(id)); } catch(e){}
  }
}
setInterval(() => { leaveConfirmSweep(); offboardSweep(); }, 15000);
/* Today: what leaving files need from the owner */
function leaveTodayFlags(){
  if (!S.isOwner) return [];
  return Object.entries(S.roster || {}).filter(([, p]) => p.offboard && !p.offboard.closed).flatMap(([id, p]) => {
    const o = p.offboard, out = [];
    if (!o.confirmedAt && o.deleteBy && Date.now() > Date.parse(o.deleteBy)) out.push(`${p.contractName || nm(id)} has not confirmed deleting Archē data (due ${fmtD(o.deleteBy)}). Remind them in writing (clause 8.5).`);
    if (Object.keys(OFF_EXT).some(k => !(o.ext || {})[k]) && (p.active === false)) out.push(`${p.contractName || nm(id)} left: tick the mailbox, WhatsApp and Avinode steps in Team.`);
    return out;
  });
}

/* the confirmation needs the 24-hour contacts */
(function(){ if (typeof issueConf !== "function") return; const _ic2 = issueConf; issueConf = async function(btn){ const t = tripById(S.sel), c = t && t.st && t.st.contacts24; if (t && !(c && c.op && c.handler)) { toast("Add the 24-hour contacts (operator operations and handler) on the trip first."); return; } return _ic2(btn); }; })();
