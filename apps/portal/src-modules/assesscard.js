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
/* assessor notes behind each (i) (Morten, 19 Nov 2026: "put assessor notes on each of the questions as a small (i) box so
   assessor can see what the meaning of the questions is and have the answer or result at hand while assessing") */
const ASK_INFO = {
  enquiry: ["The person captures a trip once, completely and correctly.", "Client name and a way to reach them, country of residence, every leg with from and to (airport code or city), date, local time and passengers; the return leg added as its own leg; nothing typed twice.", "Missing local time or passenger count, a wrong airport code, client details left for later."],
  checks: ["They understand the background checks and what each colour means.", "Red stops the trip until it is changed: sanctioned place, a name that may match a sanctions list, a curfew at that time, US or intra-EU domestic flying with a foreign operator. Amber must be confirmed with the operator and recorded: other domestic legs, arrival curfew, aircraft size, customs hours. Grey: the airport is not researched yet.", "Thinks a broker can clear a red, or ignores an amber."],
  quote: ["Archē pricing, the most important number in the job.", "Client price = (operator price + direct trip costs) ÷ 0.91, rounded up, so the Archē fee is 9% of what the client pays. Example: 40,000 + 1,000 → 45,055. Card fee (3.6%) and currency conversion (0.4%) are direct trip costs inside the price, never added on top. Only the Director may set a different fee, with the reason recorded.", "Adds 9% on top (41,000 × 1.09 = 44,690 is wrong), calls it “margin”, or offers a discount."],
  kyc: ["Compliance on every trip.", "Sanctions screening for client, payer and every traveller on every trip. KYC for a person who signs and pays; KYB for a company, plus KYC on its owners of 25% or more, its controllers and its signatory. Source of funds only on a trigger: third-party or foreign payer, higher-risk country, unusual value, politically exposed person, amber check, cash or split payments. No ID or bank numbers stored by Archē.", "Wants to keep passport copies, forgets the payer, or asks for source of funds on every client."],
  safety: ["They can tell a safe, insured operator from a risky one.", "Accepted audits: ARGUS Platinum or Platinum Elite, WYVERN Wingman or PRO, IS-BAO Stage 2 or 3, checked at the source. Insurance at least USD 50M for a jet, 25M for a turboprop, valid on every flight date, the aircraft on the certificate, the route inside the cover, confirmed with the insurer or its broker. Two pilots on every jet.", "Takes the operator's word without the certificate, or accepts an audit level not on the list."],
  authorise: ["They know where their own authority stops.", "Send for authorisation goes to the Director or a person the Director has mandated. Nobody prices, approves, issues or records payment on their own trip. A price change after approval sends the trip back. Brokers set only enquiry, quoted, sent for authorisation or cancelled.", "Expects to issue the confirmation or record a payment themselves."],
  aftercare: ["The trip is theirs until the last landing and after.", "Follows every leg to the last landing (Track links, leg status), follows up with the client within 24 hours, sends the rating request; a score of 3 or less starts service recovery. Records the route flown: the filed route, off-block and on-block in UTC, any fuel stop.", "Treats the job as done at departure, or forgets the follow-up."],
  why: ["Motivation and fit with a commission-only, remote role.", "Specific reasons: their network, independence, our operator standard, Asia and global reach. Understands it is 100% commission, no salary or retainer, with Archē's portal, academy and support.", "Expects a salary or a retainer, is vague, or is “just trying it”."],
  network: ["Real reach. The organisations they listed become their own leads once they join.", "Names a person, desk or role at each organisation and how they know them; a realistic first call. New leads get a first contact within 48 hours.", "Names taken only from websites, or cannot say who they would call."],
  conflicts: ["The agreement bars work for another broker, operator or charter platform, and any former employer's confidential information or client lists (clause 2.8).", "None, or disclosed clearly with dates and terms (non-compete, non-solicit, confidentiality), so you can decide.", "Still working for another broker or platform, or plans to bring a former employer's client list."],
  clients: ["Clients come only by their own free choice and are recorded in the portal (clause 2.8).", "People who know them personally and book with whoever they trust; nothing taken from an employer's records.", "“My old company's clients”, or data exported from an employer's CRM."],
  availability: ["Speed: we promise replies within the hour, our own target is 15 minutes; there must be cover when they are away.", "Clear working hours and time zone, phone on for alerts, a named backup and the “I'm unavailable” switch used when away.", "Answers next day, no plan for holidays or illness."],
  pressure: ["Integrity under pressure.", "No discount: the Archē fee is fixed and only the Director may change it, with the reason. A third-party payer means KYB of the payer and a source-of-funds check. No check is skipped, the four-eyes rule always applies. Payment only through Archē's secure payment request: no cash, no other accounts.", "“I'd make an exception for a good client”, or any idea of skipping a check to fly tonight."],
  plan: ["A realistic pipeline that follows our data rules.", "Named organisations first, a weekly number of first contacts, follow-ups planned; each first message says where we found the details and offers an opt-out.", "No numbers, or plans to use bought lists, guessed emails or LinkedIn scraping (all against our rules)."],
  questions: ["Engagement and expectations.", "Asks about supervision, the first six months, how commission is counted and paid, training and support.", "No questions at all. Write down anything you promise, so it is on record."]
};
function asInfo(k){ const i = ASK_INFO[k]; if (!i) return ""; return `<details class="small" style="margin:2px 0 8px 28px"><summary style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;list-style:none"><span aria-hidden="true" style="display:inline-grid;place-items:center;width:18px;height:18px;border:1px solid currentColor;border-radius:50%;font:600 11px/1 serif;font-style:italic">i</span><span class="muted">For the assessor</span></summary><div style="margin:6px 0 0;padding:8px 10px;border-left:2px solid var(--line, #8888)"><p style="margin:0 0 4px"><b>What it tests:</b> ${esc(i[0])}</p><p style="margin:0 0 4px"><b>Correct or good:</b> ${esc(i[1])}</p><p style="margin:0"><b>Red flags:</b> ${esc(i[2])}</p></div></details>`; }
/* the meeting in one natural flow, in person or on a video call (Morten, 25 Nov 2026: "Align portal and document so that
   I can be present and follow a natural flow with [the candidate]. And he will do the booking flow and we'll go into q&a and
   launch as well"): the booking flow is the full trial booking, and each skill is shown at its steps */
const ASK_PLAN = [["Welcome and Archē record", 10], ["Booking flow: the full trial booking, the person at the keyboard", 40], ["Interview", 20], ["Q&A and launch", 15], ["Decision and next steps", 5]];
const ASK_STEP = {enquiry: "steps 1-2 (brief, enquiry)", checks: "step 5 (checks)", quote: "step 4 (price)", kyc: "step 5 (checks) and step 10 (client signs and pays)",
  safety: "step 3 (operator choice) and step 8 (operator contract)", authorise: "step 6 (authorisation) and step 11 (operator signed and paid)", aftercare: "steps 12-13 (flight following, follow-up and rating)"};
const ASK_LAUNCH = {
  commission: "Commission: up to 35% of the Archē fee, on a Completed Booking (flown, client paid, operator paid), counted in the month it completes, paid monthly",
  supervision: "Supervision in the first six months: who supervises, which steps wait for an OK, how it ends",
  leads: "Leads: the organisations on the list become their own leads at countersignature; first contact within 48 hours; data rules and opt-out",
  tools: "Tools: Archē email, signature, meeting backgrounds, company WhatsApp, LINE and WeChat; the portal on the phone",
  avinode: "Avinode: Archē's membership, the user licence and Avinode's own training; Booking practice until then",
  launch: "Launch: website preview now, bookings open at launch (target 15 Dec 2026); what is still open (payment provider, Avinode)",
  agreement: "Agreement walk-through: commission (4.2, Schedule 1), clients and earlier work (2.8), ending and client handover (8.x), Standards of Conduct",
  next: "Next steps and dates agreed, and anything promised written down"
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
  const skills = Object.entries(ASK_SKILLS).map(([k, l]) => `<label class="check" for="qs_${k}_${id}"><input type="checkbox" id="qs_${k}_${id}" data-qs="${k}" data-uid="${id}" ${(a.skills || {})[k] ? "checked" : ""} ${may ? "" : "disabled"}><span class="small">${esc(l)}${ASK_STEP[k] ? ` <span class="muted">· trial booking ${esc(ASK_STEP[k])}</span>` : ""}</span></label>${asInfo(k)}`).join("");
  const qs = Object.entries(ASK_INTERVIEW).map(([k, q], i) => `<div class="wide"><label class="f" for="qi_${k}_${id}"><span class="small"><b>${i + 1}.</b> ${esc(q)}</span><textarea id="qi_${k}_${id}" rows="2" data-qi="${k}" data-uid="${id}" maxlength="1500" placeholder="Your note on the answer" ${may ? "" : "disabled"}>${esc((a.interview || {})[k] || "")}</textarea></label>${asInfo(k).replace('margin:2px 0 8px 28px', 'margin:4px 0 4px 0')}</div>`).join("");
  const ln = a.launch || {}, lc = Object.keys(ASK_LAUNCH).filter(k => ln[k]).length;
  const launch = Object.entries(ASK_LAUNCH).map(([k, l]) => `<label class="check" for="ql_${k}_${id}"><input type="checkbox" id="ql_${k}_${id}" data-ql="${k}" data-uid="${id}" ${ln[k] ? "checked" : ""} ${may ? "" : "disabled"}><span class="small">${esc(l)}</span></label>`).join("");
  return `<p class="small muted" style="margin:6px 0">Meeting, about 90 minutes: ${ASK_PLAN.map(([t, m], i) => `${i + 1}. ${esc(t)} (${m} min)`).join(" · ")}.</p>
    <details class="small" style="margin:6px 0" ${s.sk === Object.keys(ASK_SKILLS).length ? "" : "open"}><summary><b>Portal skills check</b>: ${s.sk} of ${Object.keys(ASK_SKILLS).length} done</summary>
      <p class="muted" style="margin:4px 0">In person or on a video call, the person does the full trial booking in the test version while you watch: portal.archeaviation.com/test.html, Test Broker, Training, Booking practice, "Full trial booking: Singapore to Tokyo" (example data only, nothing is sent). Each task below shows at the steps named; tick it once done right, and use the (i) for what good looks like.</p>${skills}</details>
    <details class="small" style="margin:6px 0" ${s.iv === Object.keys(ASK_INTERVIEW).length ? "" : "open"}><summary><b>Interview</b>: ${s.iv} of ${Object.keys(ASK_INTERVIEW).length} answered</summary>
      <p class="muted" style="margin:4px 0">Ask each question and write a short note on the answer. Notes save when you leave the field.</p><div class="fgrid">${qs}</div></details>
    <details class="small" style="margin:6px 0" ${lc === Object.keys(ASK_LAUNCH).length ? "" : "open"}><summary><b>Q&amp;A and launch</b>: ${lc} of ${Object.keys(ASK_LAUNCH).length} covered</summary>
      <p class="muted" style="margin:4px 0">Go through each topic and tick it once covered. A record of what was explained; it does not hold the agreement back.</p>${launch}</details>`;
}
// the record is updated at once and then saved, so quick ticks one after another all count (each builds on the last)
async function asSave(id, change, line){
  const before = S.assess[id] || {}, next = {...before, ...change(before), at: now(), by: S.uid};
  S.assess[id] = next;
  try { await S.db.doc("assess/" + id).set(S.assess[id]); audit("Assessment", `${(S.joins[id] || {}).contractName || id}: ${line}`); render(); return true; }
  catch(e){ S.assess[id] = before; toast("Could not save. Run SQL 0015 if you have not."); render(); return false; }
}
document.addEventListener("change", async e => {
  const b = e.target; if (!b.dataset || !(b.dataset.qs || b.dataset.qi || b.dataset.ql)) return;
  if (!(S.isOwner || (typeof canRight === "function" && canRight("assess")))) return;
  const id = b.dataset.uid, k = b.dataset.qs || b.dataset.qi;
  if (b.dataset.ql) { const on = b.checked, kk = b.dataset.ql, ok = await asSave(id, cur => ({launch: {...(cur.launch || {}), [kk]: on}}), `Q&A and launch ${kk} ${on ? "covered" : "unticked"}`); if (!ok) b.checked = !on; return; }
  if (b.dataset.qs) { const on = b.checked, ok = await asSave(id, cur => ({skills: {...(cur.skills || {}), [k]: on}}), `skills ${k} ${on ? "ticked" : "unticked"}`); if (!ok) b.checked = !on; return; }
  const v = String(b.value || "").slice(0, 1500);
  if (v === (((S.assess[id] || {}).interview || {})[k] || "")) return;
  await asSave(id, cur => ({interview: {...(cur.interview || {}), [k]: v}}), `interview note ${k} saved`);
});
/* on the card, after the qualification checklist; the agreement waits for both parts */
(function(){ const _x = intakeJoinExtras; intakeJoinExtras = function(id, j){ const base = _x(id, j); if (id === S.uid) return base; const a = S.assess[id]; return asRecord(id, j) + base + (a ? asSkillsInterview(id) : ""); }; })();
(function(){ const _ib = intakeBlock; intakeBlock = function(id){ const w = _ib(id); if (w) return w; const s = asState(id); if (s.sk < Object.keys(ASK_SKILLS).length) return `Portal skills check not complete (${s.sk} of ${Object.keys(ASK_SKILLS).length} tasks).`; if (s.iv < Object.keys(ASK_INTERVIEW).length) return `Interview not complete (${s.iv} of ${Object.keys(ASK_INTERVIEW).length} questions have a note).`; return ""; }; })();