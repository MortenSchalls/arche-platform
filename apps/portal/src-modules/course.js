/* ---------- Portal course: learn every screen for your role (Morten, 23 Oct 2026) ----------
   Built from the portal guide (guide.json), the same text as the troubleshooting guide in Help, so the two never differ.
   Each lesson: what it is for, how to do it, a "Try it" task in the test version, what to do when something goes wrong,
   and a short check made from the guide's own problems and fixes. A lesson is done when the check is all right.
   Progress is kept in train/<uid>/runs/course (people see their own; owner and operations see everyone's). */
const CR_TRACKS = [
  {id: "basics", title: "Getting started", lessons: ["access", "rules", "privacy", "testversion", "phone", "dashboard", "help", "ai"]},
  {id: "broker", title: "Selling and booking", lessons: ["leads", "contacts", "enquiry", "extras", "quote", "docs", "send", "conf", "money", "cancel", "aftercare", "points", "training", "roleplay", "cards"]},
  {id: "ops", title: "Operations", lessons: ["enquiries", "ops", "sign", "following", "suppliers", "quotes", "prospects", "rotation", "control", "scorecard", "debrief"]},
  {id: "owner", title: "Owner", lessons: ["today", "approval", "team", "settings", "investors", "security", "audit", "backup", "launch"]}];
/* "Try it" in the test version: who to act as, and what to do */
const CR_TRY = {
  rules: ["broker", "Make a test enquiry with an operator price of USD 30,000 and check the client price: 30,000 ÷ 0.93, rounded up, is USD 32,259."],
  privacy: ["broker", "Look for the watermark with your name on any screen of the test version."],
  cancel: ["broker", "Make a test enquiry, then cancel it yourself while it is still an enquiry."],
  enquiries: ["owner", "As Test Owner, open Today and read the Website enquiries panel (the test version may have none)."],
  access: ["owner", "Switch between Test Owner, Test Operations and Test Broker in the orange bar and compare the menus."],
  testversion: ["broker", "Press Reset test data (twice), then switch to Test Broker 2 and back."],
  phone: ["broker", "Open the test version on your phone, switch between Day and Night, and find My leads in the bottom bar."],
  dashboard: ["broker", "As Test Broker, open Home and read the progress tiles and the Outstanding list."],
  help: ["broker", "Open Help and search the guide for a word such as cancellation."],
  ai: ["broker", "Open Assistant to see where questions go. Answers work only in the real portal."],
  leads: ["owner", "As Test Owner, assign Example Family Office to Test Broker. Then switch to Test Broker, open it in My leads and log a contact with a proper note."],
  contacts: ["broker", "On your lead, press Show, add a business contact with a work email and its source, then press Opted out twice and see the details go."],
  enquiry: ["broker", "Make a New enquiry: Singapore Seletar to Bangkok Don Mueang, 4 passengers, next month."],
  extras: ["broker", "Add a client request (a small dog) and an operational extra (de-icing, at cost) to your enquiry."],
  quote: ["broker", "Enter an operator price of USD 20,000 and check the client price: 20,000 ÷ 0.93, rounded up, is USD 21,506."],
  docs: ["broker", "Attach a small PDF to your trip."],
  send: ["broker", "Tick the pre-issue checks and send your trip to operations."],
  conf: ["ops", "As Test Operations, open the trip in Operations and prepare the confirmation."],
  money: ["ops", "Record the client payment and the flight, then switch to Test Broker and see the commission."],
  aftercare: ["broker", "On a flown trip, follow the aftercare steps above."],
  points: ["broker", "On Home, find your points and your place in the team."],
  training: ["broker", "In Training, Booking practice, start the first exercise."],
  roleplay: ["broker", "Open Training, Roleplay lab and read the scenarios. The AI client works only in the real portal."],
  cards: ["broker", "Open Training, Regional cards and read one card."],
  ops: ["ops", "As Test Operations, open Operations and check the trip waiting for you."],
  sign: ["ops", "On a confirmed trip, follow the signature steps above."],
  following: ["ops", "On a trip due to fly, follow the flight-following steps above."],
  suppliers: ["ops", "Open Prospects, Service partners, filter airport WSSL and open Example Crew Hotel: see its minutes and shuttle."],
  quotes: ["ops", "Make a crew-hotel quote request at WSSL, mark it sent and record a quote. Then switch to Test Owner and award it."],
  prospects: ["owner", "In Prospects, tick two organisations and assign them to Test Broker 2 in one go."],
  rotation: ["owner", "On Today, use Preview in Prospect rotation, then Run now."],
  control: ["ops", "Open Control and read the monitoring flags."],
  scorecard: ["ops", "Open Control and find the operator scorecard."],
  debrief: ["ops", "Read the debrief steps above; they apply to supervised bookings."],
  today: ["owner", "As Test Owner, approve the trip waiting on Today."],
  approval: ["owner", "Approve a trip, then change its price as Test Operations and see it come back to Today."],
  team: ["owner", "Open Team, tick Booking rights for Test Broker, then switch to Test Broker and see Operations in the menu."],
  settings: ["owner", "Open Settings and find the margin (7%)."],
  investors: ["owner", "Open Prospects, Investors and partners and use Import list with one example line."],
  security: ["owner", "Open Security and read the access log."],
  audit: ["owner", "Find the audit log and the approval you made."],
  backup: ["owner", "Read the backup steps above. Backups run only in the real portal."],
  launch: ["owner", "Open the launch checklist and read what is still open."]};
const crRole = () => { const r = acting(); return r === "owner" ? "owner" : r === "ops" ? (S.alsoBroker ? "opsBroker" : "ops") : "broker"; };
function crRequired(role = crRole()){ return {owner: ["basics", "broker", "ops", "owner"], ops: ["basics", "ops"], opsBroker: ["basics", "broker", "ops"], broker: ["basics", "broker"]}[role] || ["basics", "broker"]; }
const crFeat = id => ((HELP.guide || {}).features || []).find(f => f.id === id);
const crDoc = () => (S.trRuns || {}).course || {};
function crLessons(tracks){ return tracks.flatMap(t => (CR_TRACKS.find(x => x.id === t) || {lessons: []}).lessons).filter(crFeat); }
/* the check: "what do you do if…" from the guide's own problems; wrong answers are fixes from other lessons */
function crQuiz(id){
  const all = ((HELP.guide || {}).features || []).flatMap(f => (f.trouble || []).map(t => ({id: f.id, fix: t[1]})));
  const f = crFeat(id); if (!f) return [];
  return (f.trouble || []).slice(0, 3).map((t, qi) => {
    const others = all.filter(x => x.id !== id && x.fix !== t[1]);
    const seed = [...(id + qi)].reduce((a, c) => a + c.charCodeAt(0), 0);
    const pick = [others[seed % others.length], others[(seed * 7 + 3) % others.length]].filter(Boolean).map(x => x.fix);
    const opts = [t[1], ...pick.filter((x, i) => pick.indexOf(x) === i && x !== t[1])].slice(0, 3);
    const order = opts.map((o, i) => ({o, k: (seed * (i + 3)) % 7})).sort((a, b) => a.k - b.k).map(x => x.o);
    return {q: t[0], opts: order, right: order.indexOf(t[1])};
  });
}
function vCourse(){
  if (!HELP.guide) { loadGuide(); return `<div class="panel empty"><p>Loading the course…</p></div>`; }
  const req = crRequired(), done = crDoc().done || {}, need = crLessons(req), n = need.filter(id => done[id]).length;
  const sel = S.crSel && crFeat(S.crSel) ? S.crSel : (need.find(id => !done[id]) || need[0]);
  const staff = isStaff() && !S.preview;
  return `<div class="grid2"><div class="stack">
    <div class="panel"><h2 style="margin-top:0">Your course</h2>
      <p class="small">${n} of ${need.length} lessons done${n === need.length && need.length ? ` · <b>course complete</b>${crDoc().completedAt ? " on " + fmtD(crDoc().completedAt) : ""}` : ""}.</p>
      <div class="cr-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${need.length}" aria-valuenow="${n}"><span style="width:${need.length ? Math.round(100 * n / need.length) : 0}%"></span></div>
      ${n === need.length && need.length && !crDoc().completedAt ? `<div class="note info small"><b>All lessons done.</b> Finish with the final check: ${crFinalSize()} questions from your lessons, at least 80% right to pass. <button class="btn small primary" type="button" data-crfinal="start">Start the final check</button></div>` : ""}
      <p class="small muted">Each lesson takes a few minutes: read it, try it in the test version, then answer the check. The same text is the troubleshooting guide in Help.</p></div>
    ${CR_TRACKS.map(t => { const ls = t.lessons.filter(crFeat); if (!ls.length) return ""; const reqd = req.includes(t.id);
      return `<div class="panel"><h3 style="margin-top:0">${esc(t.title)}${reqd ? "" : ` <span class="small muted">· optional for your role</span>`}</h3><div class="list">${ls.map(id => `<div class="item" role="option" tabindex="0" data-crsel="${id}" aria-selected="${sel === id}"><div class="t">${done[id] ? "✓ " : ""}${esc(crFeat(id).title)}</div><div class="small muted">${esc(crFeat(id).who || "")}</div></div>`).join("")}</div></div>`; }).join("")}
    ${staff ? crTeam() : ""}
  </div><div class="pdetail">${S.crFinal ? crFinalView() : crLesson(sel)}</div></div>`;
}
function crLesson(id){
  const f = crFeat(id); if (!f) return `<div class="panel empty"><p>Choose a lesson.</p></div>`;
  const tr = CR_TRY[id], quiz = crQuiz(id), done = (crDoc().done || {})[id], ans = (S.crAns || {})[id] || {};
  const base = location.pathname.replace(/[^/]*$/, "");
  return `<div class="panel stack"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(f.title)}</h2>${done ? `<span class="chip c-flown">Done</span>` : ""}</div>
    <p class="small muted">For: ${esc(f.who || "")}</p>
    <p>${esc(f.purpose || "")}</p>
    <div><h3>How to do it</h3><ol class="small">${(f.steps || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol></div>
    ${tr ? `<div class="note info small"><b>Try it in the test version</b>, as ${esc({owner: "Test Owner", ops: "Test Operations", broker: "Test Broker"}[tr[0]])}: ${esc(tr[1])} <a href="${base}test.html?as=${tr[0]}" target="_blank" rel="noopener">Open the test version</a></div>` : ""}
    ${(f.trouble || []).length ? `<div><h3>If something goes wrong</h3><ul class="small">${f.trouble.map(t => `<li><b>${esc(t[0])}.</b> ${esc(t[1])}</li>`).join("")}</ul></div>` : ""}
    ${(f.tips || []).length ? `<div><h3>Tips</h3><ul class="small">${f.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
    ${quiz.length ? `<form class="stack" data-crquiz="${id}"><h3 style="margin:0">Check</h3>${quiz.map((q, qi) => `<fieldset class="small"><legend><b>What do you do if: ${esc(q.q.replace(/[.?]$/, ""))}?</b></legend>${q.opts.map((o, oi) => `<label class="check" for="cr_${id}_${qi}_${oi}"><input type="radio" name="cr_${id}_${qi}" id="cr_${id}_${qi}_${oi}" value="${oi}" ${ans[qi] === oi ? "checked" : ""}><span>${esc(o)}</span></label>`).join("")}
      ${S.crShow === id && ans[qi] !== undefined ? (ans[qi] === q.right ? `<p class="small" style="color:var(--ok)">Right.</p>` : `<p class="small bad-ink">Not quite: read "If something goes wrong" above.</p>`) : ""}</fieldset>`).join("")}
      <div class="row"><button class="btn primary" type="submit">${done ? "Check again" : "Check my answers"}</button></div></form>` : `<div class="row"><button class="btn primary" type="button" data-crdone="${id}">Mark as done</button></div>`}
    <div class="row">${crNext(id) ? `<button class="btn" type="button" data-crsel="${crNext(id)}">Next lesson</button>` : ""}</div>
  </div>`;
}
function crNext(id){ const need = crLessons(crRequired()); const i = need.indexOf(id); return i >= 0 && i < need.length - 1 ? need[i + 1] : null; }
async function crMark(id){
  const d = crDoc(), done = {...(d.done || {}), [id]: now()}, need = crLessons(crRequired());
  const complete = need.length && need.every(x => done[x]);
  await S.db.doc(`train/${S.uid}/runs/course`).set({...d, kind: "course", done, updated: now()});
  toast(complete && !d.completedAt ? "All lessons done. Now take the final check." : "Lesson done.");
}
/* final check: questions drawn from every lesson the person needs; 80% to pass */
function crPool(){ return crLessons(crRequired()).flatMap(id => crQuiz(id).map((q, qi) => ({id, qi, ...q}))); }
function crFinalSize(){ return Math.min(15, crPool().length); }
function crFinalView(){
  const F = S.crFinal;
  return `<form class="panel stack" data-crfinalform="1"><h2 style="margin:0">Final check</h2><p class="small muted">${F.qs.length} questions. You need ${Math.ceil(F.qs.length * 0.8)} right to pass.</p>
    ${F.qs.map((q, i) => `<fieldset class="small"><legend><b>${i + 1}. What do you do if: ${esc(q.q.replace(/[.?]$/, ""))}?</b></legend>${q.opts.map((o, oi) => `<label class="check" for="crf_${i}_${oi}"><input type="radio" name="crf_${i}" id="crf_${i}_${oi}" value="${oi}" ${F.ans[i] === oi ? "checked" : ""}><span>${esc(o)}</span></label>`).join("")}
      ${F.marked && F.ans[i] !== q.right ? `<p class="small bad-ink">The right answer: ${esc(q.opts[q.right])} (lesson: ${esc(crFeat(q.id).title)})</p>` : ""}</fieldset>`).join("")}
    ${F.marked ? `<div class="note ${F.passed ? "info" : "warn"} small"><b>${F.score} of ${F.qs.length} right.</b> ${F.passed ? "Passed: the course is complete." : "Not passed yet. Read the lessons named above and try again."}</div>` : ""}
    <div class="row">${F.marked ? `<button class="btn" type="button" data-crfinal="close">Back to the course</button>${F.passed ? "" : `<button class="btn primary" type="button" data-crfinal="start">Try again</button>`}` : `<button class="btn primary" type="submit">Hand in</button><button class="btn" type="button" data-crfinal="close">Cancel</button>`}</div></form>`;
}
function crTeam(){
  if (!S.crAll && !S.crLoading) crLoadAll();
  const rows = Object.entries(S.roster || {}).filter(([, r]) => r.active !== false && !r.example).map(([bid, r]) => {
    const role = r.role === "ops" ? "ops" : r.book ? "opsBroker" : "broker", need = crLessons(crRequired(role)), d = (S.crAll || {})[bid] || {}, done = d.done || {};
    return {name: r.contractName || nm(bid), n: need.filter(x => done[x]).length, of: need.length, at: d.completedAt, last: d.updated, score: d.finalScore};
  });
  return `<div class="panel tbl"><h3 style="margin-top:0">Team progress</h3>${rows.length ? `<table class="small"><thead><tr><th scope=col>Person</th><th scope=col class="n">Lessons</th><th scope=col>Final check</th><th scope=col>Last</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(x.name)}</td><td class="n">${x.n} / ${x.of}</td><td>${x.at ? "Passed " + fmtD(x.at) + (x.score ? " · " + esc(x.score) : "") : "–"}</td><td>${x.last ? fmtD(x.last) : "–"}</td></tr>`).join("")}</tbody></table>` : `<p class="small muted">No team members yet.</p>`}</div>`;
}
async function crLoadAll(){ S.crLoading = true; const out = {};
  for (const bid of Object.keys(S.roster || {})) { try { const d = await S.db.doc(`train/${bid}/runs/course`).get(); if (d.exists) out[bid] = d.data(); } catch(e){} }
  S.crAll = out; S.crLoading = false; render(); }
document.addEventListener("click", async e => {
  const s = e.target.closest("[data-crsel]"); if (s) { S.crSel = s.dataset.crsel; S.crShow = null; S.scrollDetail = true; render(); return; }
  const fb = e.target.closest("[data-crfinal]");
  if (fb) { if (fb.dataset.crfinal === "close") { S.crFinal = null; render(); return; }
    const pool = crPool().sort(() => Math.random() - 0.5).slice(0, crFinalSize()); S.crFinal = {qs: pool, ans: {}, marked: false}; S.scrollDetail = true; render(); return; }
  const d = e.target.closest("[data-crdone]"); if (d) { try { await crMark(d.dataset.crdone); } catch(err){ toast("Could not save. Try again."); } return; }
});
document.addEventListener("change", e => {
  const fm = /^crf_(\d+)$/.exec(e.target.name || ""); if (fm && S.crFinal && !S.crFinal.marked) { S.crFinal.ans[+fm[1]] = +e.target.value; return; }
  const m = /^cr_(.+)_(\d+)$/.exec(e.target.name || ""); if (!m) return;
  S.crAns = S.crAns || {}; S.crAns[m[1]] = {...(S.crAns[m[1]] || {}), [m[2]]: +e.target.value};
});
document.addEventListener("submit", async e => {
  const f = e.target;
  if (f.dataset && f.dataset.crfinalform) { e.preventDefault(); const F = S.crFinal; if (!F || F.marked) return;
    if (F.qs.some((q, i) => F.ans[i] === undefined)) { toast("Answer every question first."); return; }
    F.score = F.qs.filter((q, i) => F.ans[i] === q.right).length; F.passed = F.score >= Math.ceil(F.qs.length * 0.8); F.marked = true;
    try { const d = crDoc(); await S.db.doc(`train/${S.uid}/runs/course`).set({...d, kind: "course", updated: now(), finalTries: (d.finalTries || 0) + 1,
      ...(F.passed ? {completedAt: d.completedAt || now(), finalScore: `${F.score}/${F.qs.length}`} : {})});
      if (F.passed && !d.completedAt) audit("Portal course completed", `${F.score}/${F.qs.length}`); } catch(err){ toast("Could not save the result. Try again."); }
    render(); return; }
  if (!f.dataset || !f.dataset.crquiz) return; e.preventDefault();
  const id = f.dataset.crquiz, quiz = crQuiz(id), ans = (S.crAns || {})[id] || {};
  if (quiz.some((q, i) => ans[i] === undefined)) { toast("Answer every question first."); return; }
  S.crShow = id;
  if (quiz.every((q, i) => ans[i] === q.right)) { try { await crMark(id); } catch(err){ toast("Could not save. Try again."); } }
  else toast("Not all right yet. Read the lesson again and try once more.");
  render();
});
