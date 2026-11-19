/* ---------- Assessment card: Archē record, portal skills check, interview (Morten, 19 Nov 2026) ----------
   "for the assessment, i need to have more dedicated Arche portal and company relations"; chosen: his Archē record,
   a portal skills check and interview questions. On each request in Onboarding, under the qualification checklist:
   - Archē record: email, invitation, sign-ins, password set and the joining log (from /api/invite, as Team shows it);
     every academy module with best score and the date passed; the completion code checked against the academy's own
     check digits and matched to the name on the request.
   - Portal skills check: tasks the person does live in the test version while the Director watches, each ticked.
   - Interview: questions with a note on each answer.
   Kept on the same assessment record (assess/<uid>: the Director and assessors only, SQL 0015). The agreement waits
   until every skills task is ticked and every question has a note (on top of the checklist). */
const ASK_SKILLS = {
  enquiry: "Takes an enquiry from the pool and enters client, legs, dates and passengers correctly",
  checks: "Runs the trip checks and explains one red and one amber result",
  quote: "Prices a quote: operator price, direct trip costs, client price with the 9% Archē fee",
  kyc: "Screens client, payer and travellers for sanctions and says when KYC or KYB applies",
  safety: "Fills the operator safety and insurance record: audit level, certificate amount, aircraft and route covered",
  authorise: "Sends the trip for authorisation and explains the four-eyes rule",
  aftercare: "Follows the flight to the last landing, records the follow-up and asks for the rating"
};
const ASK_INTERVIEW = {
  why: "Why Archē Executive, and why now?",
  network: "Which of the organisations on your list do you know personally, how, and who would you call first?",
  conflicts: "Any work for another broker, operator or charter platform, now or planned? Any non-compete, non-solicit or confidentiality duty from a former employer?",
  clients: "Clients you would bring: are they yours to bring, and how do they book private flights today?",
  availability: "Your hours and time zone; how you answer within 15 minutes; who covers you on holiday or when ill.",
  pressure: "A client asks for a discount, to pay through someone else, or to skip a check to fly tonight. What do you do?",
  plan: "Your first 90 days: which organisations, how many contacts a week, and what would make you stop?",
  questions: "What do you need from us, and what questions do you have?"
};
const ACAD_SALT = "ARCHE-CBT-2026-10";
function acadFnv(s){ let h = 0x811c9dc5; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); }
/* the academy's own completion-code check (academy page.html readCode), done here so the Director sees the result */
function acadCodeCheck(code, name){
  const m = String(code || "").trim().replace(/\s+/g, "").match(/^AE2\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/);
  if (!m) return {ok: false, msg: code ? "not an Archē completion code" : "no code given"};
  let p, d;
  try { p = decodeURIComponent(escape(atob(m[1].replace(/-/g, "+").replace(/_/g, "/")))); d = JSON.parse(p); } catch(e){ return {ok: false, msg: "the code is damaged"}; }
  if (acadFnv(p + ACAD_SALT) !== m[2]) return {ok: false, msg: "the check digits do not match: the code was changed"};
  const [cname, role, date, scores] = d, low = (scores || []).filter(([, s]) => s < 80);
  const sameName = String(cname || "").trim().toLowerCase() === String(name || "").trim().toLowerCase();
  return {ok: !low.length && sameName, name: cname, role, date, scores: scores || [], low, sameName,
    msg: !sameName ? `issued to "${cname}", not the name on the request` : low.length ? `${low.length} module${low.length > 1 ? "s" : ""} under 80%` : "valid"};
}
/* the joining record: asked at most once a minute while Onboarding is open (the same answer Team uses) */
async function asLoadStates(){
  if (S.asStBusy || (S.asStAt && Date.now() - S.asStAt < 60e3) || !window.__sb) return;
  S.asStBusy = true; S.asStAt = Date.now();
  try {
    const sess = (await window.__sb.auth.getSession()).data.session;
    const r = await fetch("/api/invite", {headers: {authorization: "Bearer " + ((sess || {}).access_token || "")}});
    const j = await r.json().catch(() => ({}));
    if (j.states) { S.invStates = j.states; S.invExtra = j.extra || S.invExtra || []; S.peopleEmails = j.people || S.peopleEmails || {}; render(); }
  } catch(e){}
  S.asStBusy = false;
}
function asState(id){
  const a = S.assess[id] || {}, sk = Object.keys(ASK_SKILLS).filter(k => (a.skills || {})[k]).length,
    iv = Object.keys(ASK_INTERVIEW).filter(k => String((a.interview || {})[k] || "").trim().length >= 3).length;
  return {sk, iv, ok: sk === Object.keys(ASK_SKILLS).length && iv === Object.keys(ASK_INTERVIEW).length};
}
function asRecord(id, j){
  asLoadStates();
  const pe = (S.peopleEmails || {})[id] || {}, email = String(pe.email || "").toLowerCase(), st = (S.invStates || {})[email], pg = st && st.progress;
  const inv = (S.invites || []).find(x => String(x.email || "").toLowerCase() === email) || (S.invExtra || []).find(x => x.email === email);
  const c = acadCodeCheck(j.cert, j.contractName), p = S.obProg[id], mods = (p && p.mods) || {}, path = (OB_ACAD.paths[j.role] || OB_ACAD.paths.broker);
  const row = (k, v) => `<tr><th scope="row" style="text-align:left;font-weight:400;padding:2px 12px 2px 0" class="muted">${k}</th><td style="padding:2px 0">${v}</td></tr>`;
  const modRows = path.map(k => { const m = mods[k] || {}, t = (OB_ACAD.steps[k] || [k])[0];
    return `<tr><td style="padding:2px 12px 2px 0">${esc(t)}</td><td style="padding:2px 12px 2px 0">${m.best != null ? m.best + "%" : "–"}</td><td style="padding:2px 0">${m.passed ? `<span class="chip c-flown">Passed</span> ${m.passedAt ? fmtD(m.passedAt) : ""}` : `<span class="muted">not passed</span>`}${m.attempts > 1 ? ` <span class="muted">· ${m.attempts} tries</span>` : ""}</td></tr>`; }).join("");
  const log = pg && pg.log && pg.log.length ? `<ul class="small" style="margin:4px 0 0;padding-left:18px">${pg.log.slice(0, 25).map(l => `<li style="margin:2px 0"><span class="muted mono">${l.at ? fmtT(l.at) : "no date"}</span> ${esc(l.t)}</li>`).join("")}</ul>` : `<p class="small muted">${st ? "Nothing recorded yet." : "Loading…"}</p>`;
  return `<details class="small" style="margin:6px 0"><summary><b>Archē record</b>: ${esc(email || "email loading…")} · academy code ${c.ok ? '<span class="chip c-flown">valid</span>' : `<span class="chip c-review">${esc(c.msg)}</span>`}</summary>
    <table class="small" style="margin:6px 0;border-collapse:collapse">${row("Email", esc(email || "loading…"))}${row("Invited", inv ? fmtT(inv.first || inv.at) + (inv.notInvited ? " (joined without a Team invitation)" : "") : "not invited from Team")}${row("Last sign-in", pe.lastSignIn ? fmtT(pe.lastSignIn) : "never")}${row("Password set", pg ? (pg.pwSet ? "yes" : "no") : "…")}${row("Joining", pg ? esc(pg.label) : "…")}${row("Requested assessment", fmtT(j.at))}${row("Academy code", c.ok ? `valid: issued to ${esc(c.name)} (${esc(c.role)}) on ${esc(c.date)}, ${c.scores.length} modules, lowest ${Math.min(...c.scores.map(s => s[1]))}%` : esc(c.msg))}</table>
    <details style="margin:4px 0"><summary>Academy modules (${path.filter(k => (mods[k] || {}).passed).length} of ${path.length} passed${p && p.completedAt ? `, completed ${fmtD(p.completedAt)}` : ""})</summary><table class="small" style="margin:4px 0;border-collapse:collapse"><thead><tr><th scope="col" style="text-align:left;padding-right:12px">Module</th><th scope="col" style="text-align:left;padding-right:12px">Best</th><th scope="col" style="text-align:left">Result</th></tr></thead><tbody>${modRows}</tbody></table></details>
    <details style="margin:4px 0"><summary>Joining log, newest first</summary>${log}</details></details>`;
}
function asSkillsInterview(id){
  const a = S.assess[id] || {}, s = asState(id), may = S.isOwner || (typeof canRight === "function" && canRight("assess"));
  const skills = Object.entries(ASK_SKILLS).map(([k, l]) => `<label class="check" for="qs_${k}_${id}"><input type="checkbox" id="qs_${k}_${id}" data-qs="${k}" data-uid="${id}" ${(a.skills || {})[k] ? "checked" : ""} ${may ? "" : "disabled"}><span class="small">${esc(l)}</span></label>`).join("");
  const qs = Object.entries(ASK_INTERVIEW).map(([k, q], i) => `<label class="f wide" for="qi_${k}_${id}"><span class="small"><b>${i + 1}.</b> ${esc(q)}</span><textarea id="qi_${k}_${id}" rows="2" data-qi="${k}" data-uid="${id}" maxlength="1500" placeholder="Your note on the answer" ${may ? "" : "disabled"}>${esc((a.interview || {})[k] || "")}</textarea></label>`).join("");
  return `<details class="small" style="margin:6px 0" ${s.sk === Object.keys(ASK_SKILLS).length ? "" : "open"}><summary><b>Portal skills check</b>: ${s.sk} of ${Object.keys(ASK_SKILLS).length} done</summary>
      <p class="muted" style="margin:4px 0">On a video call, the person shares their screen and does each task in the test version (portal.archeaviation.com/test.html, example data only). Tick each task once done right.</p>${skills}</details>
    <details class="small" style="margin:6px 0" ${s.iv === Object.keys(ASK_INTERVIEW).length ? "" : "open"}><summary><b>Interview</b>: ${s.iv} of ${Object.keys(ASK_INTERVIEW).length} answered</summary>
      <p class="muted" style="margin:4px 0">Ask each question and write a short note on the answer. Notes save when you leave the field.</p><div class="fgrid">${qs}</div></details>`;
}
// the record is updated at once and then saved, so quick ticks one after another all count (each builds on the last)
async function asSave(id, change, line){
  const before = S.assess[id] || {}, next = {...before, ...change(before), at: now(), by: S.uid};
  S.assess[id] = next;
  try { await S.db.doc("assess/" + id).set(S.assess[id]); audit("Assessment", `${(S.joins[id] || {}).contractName || id}: ${line}`); render(); return true; }
  catch(e){ S.assess[id] = before; toast("Could not save. Run SQL 0015 if you have not."); render(); return false; }
}
document.addEventListener("change", async e => {
  const b = e.target; if (!b.dataset || !(b.dataset.qs || b.dataset.qi)) return;
  if (!(S.isOwner || (typeof canRight === "function" && canRight("assess")))) return;
  const id = b.dataset.uid, k = b.dataset.qs || b.dataset.qi;
  if (b.dataset.qs) { const on = b.checked, ok = await asSave(id, cur => ({skills: {...(cur.skills || {}), [k]: on}}), `skills ${k} ${on ? "ticked" : "unticked"}`); if (!ok) b.checked = !on; return; }
  const v = String(b.value || "").slice(0, 1500);
  if (v === (((S.assess[id] || {}).interview || {})[k] || "")) return;
  await asSave(id, cur => ({interview: {...(cur.interview || {}), [k]: v}}), `interview note ${k} saved`);
});
/* on the card, after the qualification checklist; the agreement waits for both parts */
(function(){ const _x = intakeJoinExtras; intakeJoinExtras = function(id, j){ const base = _x(id, j); if (id === S.uid) return base; const a = S.assess[id]; return asRecord(id, j) + base + (a ? asSkillsInterview(id) : ""); }; })();
(function(){ const _ib = intakeBlock; intakeBlock = function(id){ const w = _ib(id); if (w) return w; const s = asState(id); if (s.sk < Object.keys(ASK_SKILLS).length) return `Portal skills check not complete (${s.sk} of ${Object.keys(ASK_SKILLS).length} tasks).`; if (s.iv < Object.keys(ASK_INTERVIEW).length) return `Interview not complete (${s.iv} of ${Object.keys(ASK_INTERVIEW).length} questions have a note).`; return ""; }; })();
