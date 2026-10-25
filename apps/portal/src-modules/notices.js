/* ---------- Notices of new features and changed procedures (Morten, 26 Oct 2026) ----------
   Every new feature or revised procedure ships with a notice here. It shows at the top of each member's dashboard
   the first time they sign in after the release and stays until they confirm they have read it. The confirmation is
   kept in their own training record (train/<uid>/runs/notice-<id>), listed for the owner in Team, and counts in the
   trust matrix ("Notices confirmed within 3 days"). Add new notices at the top; never change an issued one, issue a
   new one instead. Owners do not get notices. */
const NOTICES = [
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
function noticesFor(uid){ const role = noticeRole(uid); return role === "owner" ? [] : NOTICES.filter(n => noticeFor(n, role)); }
function noticeWatch(){
  if (!S.db || !S.uid || !S.role || ["loading", "pending"].includes(S.role)) return;
  const ids = S.isOwner ? Object.keys(S.roster || {}).filter(id => id !== S.uid) : [S.uid];
  ids.forEach(uid => { const path = `train/${uid}/runs`; const key = "nt:" + path; if (S.subs[key]) return;
    S.subs[key] = S.db.collection(path).onSnapshot(snap => { const o = {}; snap.docs.forEach(d => { if (d.id.startsWith("notice-")) o[d.id.slice(7)] = d.data(); }); S.noticeRead[uid] = o; render(); }, () => {}); });
}
setInterval(noticeWatch, 2000);
function noticePanel(){
  if (S.isOwner || S.preview || !S.noticeRead[S.uid]) return "";
  const open = noticesFor(S.uid).filter(n => !S.noticeRead[S.uid][n.id]); if (!open.length) return "";
  return `<div class="panel stack" style="margin-bottom:16px;border-left:4px solid var(--steel)" id="noticePanel"><h2 style="margin:0">New: please read and confirm (${open.length})</h2>
    ${open.map(n => `<div class="stack" style="border-top:1px solid var(--line);padding-top:10px"><p style="margin:0"><b>${esc(n.title)}</b> <span class="small muted">· ${fmtD(n.date)}</span></p>${n.body.map(x => `<p class="small" style="margin:0">${esc(x)}</p>`).join("")}
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
function noticeDue(n, uid){ const since = Date.parse(rosterOf(uid).since || 0) || 0; return Math.max(Date.parse(n.date + "T00:00:00Z"), since) + NOTICE_DAYS * 864e5; }
/* trust measure: confirmed within 3 days, out of the notices now due */
function noticeScore(uid){
  const read = S.noticeRead[uid]; if (!read) return {v: null, txt: "not loaded"};
  const due = noticesFor(uid).filter(n => read[n.id] || Date.now() > noticeDue(n, uid));
  const onTime = due.filter(n => read[n.id] && Date.parse(read[n.id].readAt) <= noticeDue(n, uid));
  return {v: due.length ? onTime.length / due.length : null, txt: `${onTime.length} of ${due.length} confirmed within ${NOTICE_DAYS} days`};
}
/* owner: who has read what (Team) */
function noticeTeamPanel(){
  const ros = Object.entries(S.roster || {}).filter(([id, p]) => id !== S.uid && p.role !== "owner" && p.active !== false);
  if (!ros.length) return "";
  return `<div class="panel tbl" style="margin-bottom:16px" id="noticeTeam"><h2>Notices read</h2><p class="small muted">Each new feature or changed procedure is shown to the people it concerns until they confirm. Confirming within ${NOTICE_DAYS} days counts in the trust matrix.</p>
    <table class="small"><thead><tr><th scope=col>Notice</th>${ros.map(([id, p]) => `<th scope=col>${esc(p.contractName || nm(id))}</th>`).join("")}</tr></thead><tbody>
    ${NOTICES.map(n => `<tr><td><b>${esc(n.title)}</b><br><span class="muted">${fmtD(n.date)}</span></td>${ros.map(([id]) => { if (!noticesFor(id).includes(n)) return `<td class="muted">–</td>`; const r = (S.noticeRead[id] || {})[n.id];
      return `<td>${r ? `<span class="chip ${Date.parse(r.readAt) <= noticeDue(n, id) ? "c-flown" : "c-review"}">Read</span><br><span class="muted">${fmtT(r.readAt)}</span>` : Date.now() > noticeDue(n, id) ? `<span class="chip c-returned">Overdue</span>` : `<span class="chip c-enquiry">Not yet</span>`}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
}
(function(){
  const _vHome = vHome; vHome = function(){ const h = _vHome(), k = h.trimStart().startsWith('<div class="head">') ? h.indexOf('</div></div>') + 12 : 0; return h.slice(0, k) + noticePanel() + h.slice(k); };
})();
