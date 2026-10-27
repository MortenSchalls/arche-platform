/* ---------- Notices of new features and changed procedures (Morten, 26 Oct 2026) ----------
   Every new feature or revised procedure ships with a notice here. It shows at the top of each member's dashboard
   the first time they sign in after the release and stays until they confirm they have read it. The confirmation is
   kept in their own training record (train/<uid>/runs/notice-<id>), listed for the owner in Team, and counts in the
   trust matrix ("Notices confirmed within 3 days"). Add new notices at the top; never change an issued one, issue a
   new one instead. Owners do not get notices.
   Every notice here is a DRAFT until the owner publishes it in Team (Morten, 26 Oct 2026: "ask me first if it needs to
   be a notice"). Publishing or setting aside is kept in config/notices; only published notices reach members. */
const NOTICES = [
  {id:"2026-10-27-booking-safety", date:"2026-10-27", to:["broker","ops"], title:"Bookings: step-by-step guide, operator safety record, approved operators and Trip checks",
    body:["Every trip now shows \"Steps to book this trip\": what is done, what is missing, who does it, and a button that opens the field. The trip form marks the fields needed to send to operations (*).",
      "New panel on every trip: Operator safety. Accepted without approval: ARGUS Platinum or Platinum Elite, WYVERN Wingman or Wingman PRO, IS-BAO Stage 2 or 3, current on the last flight date and checked in the auditor's registry within 14 days, with the link and the proof attached as \"Safety audit\". ARGUS Gold Plus no longer exists; ARGUS Gold and Gold Certified now need the director's approval.",
      "Any other operator flies only as an Archē-approved operator (the director approves it once, for twelve months, after the checks in manual 8.3; you then quote it like an audited operator) or with the director's approval for that one trip after the five checks and the crew hours. The panel gives you one safety line for your quote; the confirmation prints it too. Every operator: two pilots on jets, insurance of at least USD 50 million (jet) or 25 million (turboprop), and five years clear of accidents and sanctions.",
      "Trip checks now show red for anything that stops a trip (sanctions, cabotage, curfew, safety) and amber for what you must confirm with the operator. Send to operations opens only when nothing is missing and nothing is red. Manual Module 8 has the full rule."]},
  {id:"2026-10-26-supervisors", date:"2026-10-26", to:["broker","ops"], title:"Supervisor rights for experienced members",
    body:["The director can give experienced members supervisor rights: deciding on other people's supervised steps, assessing new people, and (operations) approving bookings.",
      "If you have a right, a Supervision page appears in your menu, and your dashboard shows when something waits for you. Decide only on others' work, never your own. Every decision is logged with your name.",
      "Countersigning agreements and releasing supervised steps stay with the director."]},
  {id:"2026-10-26-supervised", date:"2026-10-26", to:["broker","ops"], title:"Supervised steps: some steps now wait for the director's OK",
    body:["While you are supervised, these steps wait for the director's OK before they move on. Brokers: sending a quote to a client (and to operations), taking an enquiry from the pool, and your first contact with a new prospect. Operations: recording client and operator payments, and sending or awarding supplier quotes.",
      "The portal asks for you when you take the step. You see the answer on your dashboard and on the trip: approved, or changes asked with a note. Do not send a quote to the client before it is approved.",
      "The director releases each step separately when satisfied. New people start supervised."]},
  {id:"2026-10-26-notices", date:"2026-10-26", to:["broker","ops"], title:"Notices like this one: read and confirm",
    body:["Every new feature or change to a procedure appears here the first time you sign in after it is released. Read it and press \"I have read this\".",
      "Your confirmations are recorded and seen by the director. Confirming within 3 days counts towards your trust score."]}
];
const NOTICE_DAYS = 3;
if (!S.noticeRead) S.noticeRead = {};
const noticeFor = (n, role) => n.to.includes("all") || n.to.includes(role === "consultant" ? "broker" : role);
function noticeRole(uid){ const r = rosterOf(uid); return r.role === "ops" ? "ops" : r.role === "owner" ? "owner" : "broker"; }
/* notices a member must confirm: issued for their role; those issued before they joined still apply (they are the current procedures) */
const noticePub = id => ((S.noticeCfg || {}).published || {})[id] || null;
const noticeSkip = id => ((S.noticeCfg || {}).skipped || {})[id] || null;
function noticesFor(uid){ const role = noticeRole(uid); return role === "owner" ? [] : NOTICES.filter(n => noticePub(n.id) && noticeFor(n, role)); }
function noticeWatch(){
  if (!S.db || !S.uid || !S.role || ["loading", "pending"].includes(S.role)) return;
  const ids = S.isOwner ? Object.keys(S.roster || {}).filter(id => id !== S.uid) : [S.uid];
  ids.forEach(uid => { const path = `train/${uid}/runs`; const key = "nt:" + path; if (S.subs[key]) return;
    S.subs[key] = S.db.collection(path).onSnapshot(snap => { const o = {}; snap.docs.forEach(d => { if (d.id.startsWith("notice-")) o[d.id.slice(7)] = d.data(); }); S.noticeRead[uid] = o; render(); }, () => {}); });
}
setInterval(() => { noticeWatch(); if (S.db && S.uid && !S.subs["config/notices"]) watchDoc("config/notices", snap => { S.noticeCfg = snap.exists ? snap.data() : {}; render(); }); }, 2000);
function noticePanel(){
  if (S.isOwner || S.preview || !S.noticeRead[S.uid] || S.noticeCfg === undefined) return "";
  const open = noticesFor(S.uid).filter(n => !S.noticeRead[S.uid][n.id]); if (!open.length) return "";
  return `<div class="panel stack" style="margin-bottom:16px;border-left:4px solid var(--steel)" id="noticePanel"><h2 style="margin:0">New: please read and confirm (${open.length})</h2>
    ${open.map(n => `<div class="stack" style="border-top:1px solid var(--line);padding-top:10px"><p style="margin:0"><b>${esc(n.title)}</b> <span class="small muted">· ${fmtD((noticePub(n.id) || {}).at || n.date)}</span></p>${n.body.map(x => `<p class="small" style="margin:0">${esc(x)}</p>`).join("")}
      <div class="row"><button class="btn small primary" type="button" data-notice="${n.id}">I have read this</button></div></div>`).join("")}</div>`;
}
async function noticeConfirm(id){
  const n = NOTICES.find(x => x.id === id); if (!n) return;
  const body = {notice: id, title: n.title, issued: n.date, readAt: now()};
  try { await S.db.doc(`train/${S.uid}/runs/notice-${id}`).set(body); S.noticeRead[S.uid] = {...(S.noticeRead[S.uid] || {}), [id]: body}; audit("Notice confirmed", n.title); toast("Thank you. Confirmed."); render(); }
  catch(e){ toast("Could not save. Try again."); }
}
document.addEventListener("click", e => { const b = e.target.closest("[data-notice]"); if (!b) return; e.preventDefault(); noticeConfirm(b.dataset.notice); });

/* due date: 3 days after the later of the issue date and the day the member joined */
function noticeDue(n, uid){ const since = Date.parse(rosterOf(uid).since || 0) || 0, pub = Date.parse((noticePub(n.id) || {}).at || n.date + "T00:00:00Z"); return Math.max(pub, since) + NOTICE_DAYS * 864e5; }
/* trust measure: confirmed within 3 days, out of the notices now due */
function noticeScore(uid){
  const read = S.noticeRead[uid]; if (!read) return {v: null, txt: "not loaded"};
  const due = noticesFor(uid).filter(n => read[n.id] || Date.now() > noticeDue(n, uid));
  const onTime = due.filter(n => read[n.id] && Date.parse(read[n.id].readAt) <= noticeDue(n, uid));
  return {v: due.length ? onTime.length / due.length : null, txt: `${onTime.length} of ${due.length} confirmed within ${NOTICE_DAYS} days`};
}
/* owner: drafts to publish or set aside, and who has read what (Team) */
function noticeDrafts(){ return NOTICES.filter(n => !noticePub(n.id) && !noticeSkip(n.id)); }
function noticeTeamPanel(){
  const ros = Object.entries(S.roster || {}).filter(([id, p]) => id !== S.uid && p.role !== "owner" && p.active !== false);
  const drafts = noticeDrafts(), pub = NOTICES.filter(n => noticePub(n.id)), skipped = NOTICES.filter(n => noticeSkip(n.id) && !noticePub(n.id));
  const who = n => n.to.includes("all") ? "everyone" : n.to.map(x => x === "ops" ? "operations" : "brokers").join(" and ");
  return `<div class="panel tbl" style="margin-bottom:16px" id="noticeTeam"><h2>Notices</h2><p class="small muted">A notice shows on members' dashboards until they confirm they have read it; confirming within ${NOTICE_DAYS} days counts in the trust matrix. Nothing goes out until you publish it.</p>
    ${drafts.length ? `<h3 style="margin:8px 0 4px">Drafts for your decision (${drafts.length})</h3>${drafts.map(n => `<div class="flag"><span class="sev med" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc(n.title)}</b> <span class="small muted">· for ${who(n)}</span></p>${n.body.map(x => `<p class="small" style="margin:0 0 4px">${esc(x)}</p>`).join("")}
      <div class="row" style="margin-top:6px"><button class="btn small primary" type="button" data-ntc="pub" data-id="${n.id}">Publish to ${who(n)}</button><button class="btn small" type="button" data-ntc="skip" data-id="${n.id}">Not a notice</button></div></div></div>`).join("")}` : `<p class="small muted">No drafts waiting.</p>`}
    ${pub.length && ros.length ? `<h3 style="margin:12px 0 4px">Read by</h3><table class="small"><thead><tr><th scope=col>Notice</th>${ros.map(([id, p]) => `<th scope=col>${esc(p.contractName || nm(id))}</th>`).join("")}</tr></thead><tbody>
    ${pub.map(n => `<tr><td><b>${esc(n.title)}</b><br><span class="muted">Published ${fmtD(noticePub(n.id).at)}</span></td>${ros.map(([id]) => { if (!noticesFor(id).includes(n)) return `<td class="muted">–</td>`; const r = (S.noticeRead[id] || {})[n.id];
      return `<td>${r ? `<span class="chip ${Date.parse(r.readAt) <= noticeDue(n, id) ? "c-flown" : "c-review"}">Read</span><br><span class="muted">${fmtT(r.readAt)}</span>` : Date.now() > noticeDue(n, id) ? `<span class="chip c-returned">Overdue</span>` : `<span class="chip c-enquiry">Not yet</span>`}</td>`; }).join("")}</tr>`).join("")}</tbody></table>` : pub.length ? `<p class="small muted">Published: ${pub.map(n => esc(n.title)).join(" · ")}. Nobody to show them to yet.</p>` : ""}
    ${skipped.length ? `<details class="small" style="margin-top:8px"><summary class="muted">Set aside (${skipped.length})</summary><ul style="margin:6px 0 0;padding-left:18px">${skipped.map(n => `<li>${esc(n.title)} <a href="#" data-ntc="unskip" data-id="${n.id}">bring back</a></li>`).join("")}</ul></details>` : ""}</div>`;
}
function noticePrompt(){
  if (!S.isOwner || S.preview || S.noticeCfg === undefined) return "";
  const d = noticeDrafts(); if (!d.length) return "";
  return `<div class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${d.length} notice draft${d.length === 1 ? "" : "s"}: publish or set aside</h2><button class="btn small primary" type="button" data-view="team">Open in Team</button></div></div>`;
}
async function noticeDecide(a, id){
  const n = NOTICES.find(x => x.id === id); if (!n || !S.isOwner) return;
  const cfg = {published: {...((S.noticeCfg || {}).published || {})}, skipped: {...((S.noticeCfg || {}).skipped || {})}};
  if (a === "pub") cfg.published[id] = {at: now(), by: S.uid}; else if (a === "skip") cfg.skipped[id] = {at: now(), by: S.uid}; else if (a === "unskip") delete cfg.skipped[id];
  try { await S.db.doc("config/notices").set(cfg); S.noticeCfg = cfg; if (a !== "unskip") audit(a === "pub" ? "Notice published" : "Notice set aside", n.title); toast(a === "pub" ? "Published. Members see it at their next sign-in." : a === "skip" ? "Set aside." : "Back in drafts."); render(); }
  catch(e){ toast("Could not save."); }
}
document.addEventListener("click", e => { const b = e.target.closest("[data-ntc]"); if (!b) return; e.preventDefault(); noticeDecide(b.dataset.ntc, b.dataset.id); });
(function(){
  const _vHome = vHome; vHome = function(){ const h = _vHome(), k = h.trimStart().startsWith('<div class="head">') ? h.indexOf('</div></div>') + 12 : 0; return h.slice(0, k) + noticePanel() + h.slice(k); };
})();
