/* ---------- Owner to-do and trust / performance matrix on Today (Morten, 26 Oct 2026) ----------
   The portal is the owner's true source. Every step only the owner can do (SQL to run in Supabase, settings in
   Vercel or GoDaddy, details to fill in) is listed here. Steps the portal can check are ticked by themselves;
   the rest the owner ticks when done (kept in config/setup). New steps are added to OWNER_TODO with each release.
   The matrix places every member by house-rule trust (vertical) and actual results (horizontal), recalculated
   from live data on every visit, with a weekly snapshot in intel/matrix so movement over time shows. */
const OWNER_SQL = /*SQL*/{};
const OWNER_TODO = [
  {id:"company", sev:"high", title:"Fill in the company details",
    why:"The agreement, email signature, confirmations and privacy notice use them. Agreements cannot be sent until they are in.",
    how:"Settings > Company details: UEN, registered address, bookings email, privacy email, signatory name and title.", view:"settings",
    check: () => { const c = S.company || {}; return ["reg","address","email","privacy","signName","signTitle"].every(k => String(c[k] || "").trim()); }},
  {id:"sql-0006", sev:"high", title:"Run SQL: supplier quotes (0006)", sql:"0006", table:"rfqs",
    why:"Operations request, compare and award quotes from FBOs, caterers and hotels in Supplier quotes.", how:"Supabase > SQL Editor > New query > paste > Run. Safe to run twice."},
  {id:"sql-0007", sev:"high", title:"Run SQL: academy progress (0007)", sql:"0007", table:"academy_progress",
    why:"Saves each person's academy progress on their portal login, which you see when you assess them.", how:"Supabase > SQL Editor > New query > paste > Run. Safe to run twice."},
  {id:"sql-0008", sev:"high", title:"Run SQL: enquiry pool (0008)", sql:"0008", table:"enquiry_pool",
    why:"Charter enquiries reach you first, then go to brokers first come, first served.", how:"Supabase > SQL Editor > New query > paste > Run. Safe to run twice."},
  {id:"sql-0009", sev:"high", title:"Run SQL: agreements signed in the portal (0009)", sql:"0009", table:"agreements",
    why:"Brokers sign their agreement in the portal; you countersign there.", how:"Supabase > SQL Editor > New query > paste > Run. Safe to run twice."},
  {id:"sql-0010", sev:"high", title:"Run SQL: trust and performance history (0010)", sql:"0010", table:"member_scores",
    why:"Keeps every weekly snapshot of the matrix for good, readable by owners only. Until it runs, weeks are held safely and move across by themselves.", how:"Supabase > SQL Editor > New query > paste > Run. Safe to run twice."},
  {id:"sql-0011", sev:"high", title:"Run SQL: supervised steps (0011)", sql:"0011", table:"step_requests",
    why:"Lets supervised members ask for your OK on each step, and you approve or send back on Today. Until it runs, nothing is held back.", how:"Supabase > SQL Editor > New query > paste > Run. Safe to run twice."},
  {id:"sql-0012", sev:"med", title:"Run SQL: supervisor rights (0012), after 0011", sql:"0012", after:"sql-0011",
    why:"Lets the members you choose supervise steps, assess new people or approve bookings. Before it runs, ticking a right has no effect.", how:"Supabase > SQL Editor > New query > paste > Run. Safe to run twice. Mark as done once it has run."},
  {id:"sql-0013", sev:"high", title:"Run SQL: alerts (0013)", sql:"0013", table:"alert_settings",
    why:"Keeps who receives alerts, on which number, for what. Owner only.", how:"Supabase > SQL Editor > New query > paste > Run. Then add yourself in Team > Alerts."},
  {id:"sql-0014", sev:"high", title:"Run SQL: alerts on phones and the 2-minute check (0014)", sql:"0014", table:"push_subs",
    why:"Stores which phones receive alerts, and makes Supabase run the alert check every 2 minutes so alerts repeat until someone acts.", how:"Supabase > SQL Editor > New query > paste > Run. Safe to run twice."},
  {id:"alerts-server", sev:"high", title:"Give the alert sender its keys in Vercel",
    why:"The alert check runs on the portal's server and needs the Supabase server key to see what is waiting.",
    how:"Supabase > Project Settings > API keys: copy the secret (server) key. Vercel > portal project > Settings > Environment Variables: add SUPABASE_SECRET_KEY with it, and SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY if they are not there. Redeploy. Never paste the key in chat.",
    check: async () => { try { const r = await fetch("/api/alerts?status=1"); if (!r.ok) return null; return !!(await r.json()).ready; } catch(e){ return null; } }},
  {id:"alerts-email", sev:"med", title:"Free email alerts: Resend account",
    why:"Email copies of alerts, free up to 100 a day. Without it, alerts still come as phone push.",
    how:"Sign up at resend.com with msj@archeaviation.com (free plan). API Keys > Create API key. Vercel > portal project > Environment Variables: RESEND_API_KEY. Redeploy. Until the archeaviation.com domain is added in Resend, alerts can only go to the email you signed up with.",
    check: async () => { try { const r = await fetch("/api/alerts?status=1"); if (!r.ok) return null; const j = await r.json(); return j.ready ? !!j.email : null; } catch(e){ return null; } }},
  {id:"alerts-phone", sev:"med", title:"Turn on alerts on your phone",
    why:"Phone alerts are free and arrive even when the portal is closed.",
    how:"iPhone: open portal.archeaviation.com in Safari, tap Share > Add to Home Screen, open Archē from the Home Screen and sign in. Then Team > Alerts > Turn on alerts on this device, and Send a test alert. Add yourself in Alerts with msj@archeaviation.com as email and your SMS number for later."},
  {id:"email-dns", sev:"med", title:"Email safety records for archeaviation.com (SPF, DKIM, DMARC)",
    why:"Without them, emails from @archeaviation.com addresses land in spam or are refused.",
    how:"Your email provider (e.g. Google Workspace or Microsoft 365) shows the three records; add them in GoDaddy > DNS. Do this before brokers start mailing clients."},
  {id:"smtp", sev:"med", title:"Sign-in emails sent from archeaviation.com",
    why:"Supabase's built-in mail sends only a few emails an hour and comes from a Supabase address.",
    how:"Supabase > Authentication > Emails > SMTP settings: enter your email provider's SMTP details. Do it after the email safety records."},
  {id:"sandy", sev:"low", title:"Remove the old portal address from Supabase",
    why:"portal.archeaviation.com is now the only address brokers use.",
    how:"Supabase > Authentication > URL Configuration > Redirect URLs: delete https://arche-platform-sandy.vercel.app/**."},
  {id:"ai", sev:"low", title:"Switch on the portal AI (when you decide)", later:true,
    why:"The Assistant, trip co-pilot, roleplay lab and briefing need it. Until then they say the AI is not switched on.",
    how:"console.anthropic.com: add credit with a monthly limit and create a key. Vercel > portal project > Settings > Environment Variables: ANTHROPIC_API_KEY (and SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY if missing), then redeploy.",
    check: async () => { try { const r = await fetch("/api/ai", {method:"GET"}); if (!r.ok) return null; return !!(await r.json()).configured; } catch(e){ return null; } }},
  {id:"sms-service", sev:"med", title:"SMS service for alerts",
    why:"Alerts reach you by SMS. The portal needs an SMS service account to send them; a few US cents or baht per message.",
    how:"Choose an SMS service that delivers to Thai numbers (for example Twilio, or a Thai provider such as ThaiBulkSMS) and register a sender name. Enter its key yourself in Supabase, then ask Claude to connect sending. Never send the key in chat."},
  {id:"wa-official", sev:"low", title:"Official WhatsApp number for alerts", later:true,
    why:"Alerts by WhatsApp go out from the company's official number, which Meta must verify first.",
    how:"After company formation: Meta Business verification, a WhatsApp Business Platform number, and an approved alert message template. Then enter the number in Team > Alerts and ask Claude to connect sending."},
  {id:"accounts", sev:"low", title:"Company WhatsApp Business, LINE and WeChat accounts", later:true,
    why:"Brokers use only company accounts with clients (Standards of Conduct).",
    how:"After company formation: open the three business accounts, then add the numbers and IDs in Settings so they show in signatures and on the website."},
  {id:"ext-academy-pay", sev:"low", title:"External broker academy: paid access by credit card before it opens", later:true,
    why:"The external academy is sold to outside brokers; nobody gets in until they have paid by card (Morten, 26 Oct 2026).",
    how:"Decide the price and the card payment provider (the Paynode replacement, or a card checkout such as Stripe). Claude then builds sign-up, card payment and access that opens only after payment, with receipts and refunds handled by the provider; no card details ever touch the portal."},
  {id:"research", sev:"low", title:"Turn daily prospect research back on (at go-live)", later:true,
    why:"Paused since 21 Oct 2026 to save AI credit; until then new prospects come from research in chat.",
    how:"Ask Claude to restore the daily research line in the jobs workflow; it needs AI credit (see the AI step)."},
  {id:"launch", sev:"low", title:"Launch day: make the website public", later:true,
    why:"archeaviation.com stays behind Vercel's login until you switch it on.",
    how:"Vercel > website project > Settings > Deployment Protection: turn off Vercel Authentication for production."},
  {id:"testpage", sev:"low", title:"Decide whether to keep the test page online", later:true,
    why:"portal.archeaviation.com/test.html runs the portal with example data only; useful to show people.",
    how:"Keep it, or ask Claude to remove it."}
];
const TODO_SEV = {high:"high", med:"med", low:"low"};

async function todoProbe(){
  if (S.todoProbing || (S.todoAuto && Date.now() - S.todoAuto.at < 10 * 60e3)) return;
  S.todoProbing = true; const res = {};
  for (const x of OWNER_TODO) {
    try {
      if (x.table && window.__sb) {
        // a normal read (not a head request): a head request gets no error text, which made missing tables look present (26 Oct 2026)
        const {error, status} = await window.__sb.from(x.table).select("*").limit(1);
        res[x.id] = !error && status >= 200 && status < 300 ? true : (status === 404 || /does not exist|PGRST205|42P01|schema cache/i.test(((error || {}).code || "") + " " + ((error || {}).message || ""))) ? false : null;
      } else if (x.check) res[x.id] = await x.check();
    } catch(e){ res[x.id] = null; }
  }
  S.todoAuto = {at: Date.now(), res}; S.todoProbing = false; render();
}
function todoState(x){
  const auto = S.todoAuto && S.todoAuto.res ? S.todoAuto.res[x.id] : undefined, man = ((S.setup || {}).done || {})[x.id];
  if (auto === true) return {done:true, how:"checked by the portal"};
  if (auto === false) return {done:false};
  if (man) return {done:true, how:"ticked " + fmtT(man.at)};
  return {done:false, manual: !x.table && !x.check || auto === null};
}
function ownerTodoPanel(){
  if (!S.isOwner || S.preview) return "";
  setTimeout(todoProbe, 0);
  const rows = OWNER_TODO.map(x => ({x, s: todoState(x)})), open = rows.filter(r => !r.s.done), now_ = open.filter(r => !r.x.later), later = open.filter(r => r.x.later), done = rows.filter(r => r.s.done);
  const item = ({x, s}) => `<div class="flag"><span class="sev ${TODO_SEV[x.sev]}" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc(x.title)}</b></p><p class="small muted">${esc(x.why)}</p><p class="small">${esc(x.how)}</p>
    ${x.sql && OWNER_SQL[x.sql] ? `<details class="small"><summary>Show the SQL</summary><pre class="mono" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto">${esc(OWNER_SQL[x.sql])}</pre></details>` : ""}
    <div class="row" style="margin-top:6px">${x.after && !todoState(OWNER_TODO.find(y => y.id === x.after) || {}).done ? `<span class="small" style="color:var(--warn)">Run ${esc((OWNER_TODO.find(y => y.id === x.after) || {}).title || "the step before")} first.</span>` : x.sql && OWNER_SQL[x.sql] ? `<button class="btn small primary" type="button" data-todo="copy" data-id="${x.id}">Copy SQL</button>` : ""}${x.view ? `<button class="btn small" type="button" data-view="${x.view}">Open ${esc(x.view === "settings" ? "Settings" : x.view)}</button>` : ""}${s.manual ? `<button class="btn small" type="button" data-todo="done" data-id="${x.id}">Mark as done</button>` : `<span class="small muted">The portal ticks this by itself once done.</span>`}</div></div></div>`;
  return `<div class="panel" style="margin-bottom:16px" id="ownerTodo"><div class="row" style="justify-content:space-between"><h2 style="margin:0">To do for you</h2><span class="small muted">${now_.length} now · ${later.length} later · ${done.length} done</span></div>
    <p class="small muted">Steps only you can do: SQL to run, settings outside the portal, details to fill in. Run the SQL steps in number order. New steps appear here with each update.</p>
    ${now_.map(item).join("") || `<div class="empty"><p><b>Nothing to do right now.</b></p></div>`}
    ${later.length ? `<details style="margin-top:8px"${S.todoLater ? " open" : ""} data-todo-det="later"><summary class="small"><b>Later (${later.length})</b></summary>${later.map(item).join("")}</details>` : ""}
    ${done.length ? `<details style="margin-top:8px"><summary class="small muted">Done (${done.length})</summary><ul class="small" style="margin:6px 0 0;padding-left:18px">${done.map(({x, s}) => `<li>${esc(x.title)} · <span class="muted">${esc(s.how)}</span>${((S.setup || {}).done || {})[x.id] ? ` <a href="#" data-todo="undo" data-id="${x.id}">undo</a>` : ""}</li>`).join("")}</ul></details>` : ""}</div>`;
}
/* Today shows only a prompt; the list itself is kept in Team (Morten, 26 Oct 2026) */
function ownerTodoPrompt(){
  if (!S.isOwner || S.preview) return "";
  setTimeout(todoProbe, 0);
  const open = OWNER_TODO.filter(x => !todoState(x).done && !x.later); if (!open.length) return "";
  return `<div class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Your tasks: ${open.length} need${open.length === 1 ? "s" : ""} you</h2><button class="btn small primary" type="button" data-view="team">Open in Team</button></div>
    ${open.map(x => `<div class="flag"><span class="sev ${TODO_SEV[x.sev]}" aria-hidden="true"></span><div><p>${esc(x.title)}</p></div></div>`).join("")}</div>`;
}
async function todoAct(a, id){
  const x = OWNER_TODO.find(t => t.id === id); if (!x) return;
  if (a === "copy") { try { await navigator.clipboard.writeText(OWNER_SQL[x.sql]); toast("SQL copied. Paste it in Supabase > SQL Editor and press Run."); } catch(e){ toast("Could not copy: open Show the SQL and copy it from there."); } return; }
  const done = {...((S.setup || {}).done || {})};
  if (a === "done") done[id] = {at: now(), by: S.uid}; else if (a === "undo") delete done[id];
  try { await S.db.doc("config/setup").set({...(S.setup || {}), done}); S.setup = {...(S.setup || {}), done}; render(); } catch(e){ toast("Could not save. Try again."); }
}

/* ---------- trust / performance matrix ---------- */
const DAY = 864e5;
function mxMembers(){
  return Object.entries(S.roster || {}).filter(([id, r]) => r && r.active !== false && r.role !== "owner" && (r.role === "broker" || r.role === "ops" || r.book)).map(([id, r]) => ({id, r}));
}
const share = (ok, n) => n ? ok / n : null;
function mxScore(id){
  const t0 = Date.now(), since = t0 - 180 * DAY, trips = allTrips().filter(t => t.bid === id && Date.parse(t.d.enquiryAt || t.d.created || t.st?.updatedAt || 0) >= since);
  const conf = trips.filter(t => ["issued","clientPaid","flown"].includes(t.stage)), quoted = trips.filter(t => num(t.d.quote && t.d.quote.opPrice) || conf.includes(t) || t.stage === "cancelled");
  const conf90 = conf.filter(t => Date.parse((t.st && t.st.issuedAt) || 0) >= t0 - 90 * DAY), thr = num((S.terms || {}).threshold) || 8;
  const cyc = (typeof cycleDays === "function" ? cycleDays() : 5) * DAY;
  const fast = conf.filter(t => { const a = Date.parse(t.d.enquiryAt || t.d.created || 0), b = Date.parse((t.st && t.st.issuedAt) || 0); return a && b && b - a <= cyc; });
  const rated = trips.filter(t => t.d.rating && num(t.d.rating.broker || t.d.rating.overall) > 0);
  const P = [
    ["Win rate", 0.3, quoted.length >= 2 ? share(conf.length, quoted.length) : null, `${conf.length} of ${quoted.length} quotes booked`],
    ["Volume", 0.3, trips.length ? Math.min(1, conf90.length / 3 / thr) : null, `${conf90.length} bookings in 90 days (target ${thr} a month)`],
    ["Booking cycle", 0.2, conf.length ? share(fast.length, conf.length) : null, `${fast.length} of ${conf.length} booked within the cycle target`],
    ["Client rating", 0.2, rated.length ? rated.reduce((a, t) => a + num(t.d.rating.broker || t.d.rating.overall), 0) / rated.length / 5 : null, `${rated.length} rated`]
  ];
  const flown = trips.filter(t => t.stage === "flown"), ac = flown.map(t => ({t, a: (typeof acStatus === "function" ? acStatus(t) : null)})).filter(x => x.a);
  const fuOn = ac.filter(x => x.a.fu && (!x.a.due || Date.parse(x.a.fu.at) <= Date.parse(x.a.due))), due = ac.filter(x => x.a.fu || x.a.overdue);
  const low = ac.filter(x => x.a.low), sent = trips.filter(t => ["review","issued","clientPaid","flown","returned"].includes(t.stage) || (t.st && t.st.state));
  const returned = sent.filter(t => t.stage === "returned" || ((t.st && t.st.history) || []).some(h => /return/i.test(h.a || "")));
  const issued = trips.filter(t => t.st && t.st.confIssued), unsignedLate = issued.filter(t => !t.st.signed && t0 - Date.parse(t.st.confIssued.at || t.st.issuedAt || 0) > 2 * DAY);
  const m = ((S.assignRun || {}).metrics || {})[id] || {}, r = (S.roster || {})[id] || {};
  const T = [
    ["Follow-up within 24 h", 0.25, due.length ? share(fuOn.length, due.length) : null, `${fuOn.length} of ${due.length} flights followed up on time`],
    ["Rating requested", 0.15, ac.length ? share(ac.filter(x => x.a.rq).length, ac.length) : null, `${ac.filter(x => x.a.rq).length} of ${ac.length} flights`],
    ["Service recovery", 0.15, low.length ? share(low.filter(x => x.a.rec).length, low.length) : null, `${low.filter(x => x.a.rec).length} of ${low.length} low scores recovered`],
    ["Files right first time", 0.2, sent.length ? 1 - share(returned.length, sent.length) : null, `${returned.length} of ${sent.length} returned by operations`],
    ["Contracts signed on time", 0.1, issued.length ? 1 - share(unsignedLate.length, issued.length) : null, `${unsignedLate.length} unsigned after 48 h`],
    ["Notices confirmed", 0.1, typeof noticeScore === "function" ? noticeScore(id).v : null, typeof noticeScore === "function" ? noticeScore(id).txt : ""],
    ["Lead follow-up", 0.15, num(m.recv30) >= 3 ? 1 - Math.min(1, num(m.breaches30) / num(m.recv30)) : null, `${num(m.breaches30)} of ${num(m.recv30)} leads went cold in 30 days`]
  ];
  const agg = L => { const have = L.filter(c => c[2] !== null); const w = have.reduce((a, c) => a + c[1], 0); return {v: w ? Math.round(have.reduce((a, c) => a + c[1] * c[2], 0) / w * 100) : null, n: have.length}; };
  const p = agg(P), tr = agg(T), onb = !!r.onboarding;
  return {id, name: nm(id), role: r.role || "broker", P, T, perf: p.v, trust: tr.v, early: p.n < 2 || tr.n < 2, trips: trips.length, onb};
}
function mxQuad(x){ if (x.perf === null || x.trust === null) return "Too early to place"; return x.trust >= 60 ? (x.perf >= 60 ? "Trusted performer" : "Reliable: build volume") : (x.perf >= 60 ? "Results, rules at risk: coach" : "Review with the director"); }
/* weekly history: one row per week in member_scores (owner only, kept for good). Until SQL 0010 has run,
   weeks wait in intel/matrix and move across by themselves once the table exists. */
async function mxLoad(){
  if (S.mxLoading || S.mxHist) return; S.mxLoading = true;
  let weeks = [], table = false;
  try { const q = await S.db.collection("scores").get(); weeks = q.docs.map(d => d.data()); table = true; } catch(e){}
  let pend = []; try { const d = await S.db.doc("intel/matrix").get(); pend = d.exists ? (d.data().weeks || []) : []; } catch(e){}
  if (table && pend.length) { try { for (const w of pend) if (!weeks.some(x => x.at === w.at)) { await S.db.doc("scores/" + w.at).set(w); weeks.push(w); } await S.db.doc("intel/matrix").set({weeks: [], movedAt: now()}); pend = []; } catch(e){} }
  S.mxTable = table; S.mxHist = {weeks: [...weeks, ...pend.filter(w => !weeks.some(x => x.at === w.at))].sort((a, b) => a.at < b.at ? -1 : 1)}; S.mxLoading = false; render();
}
const MX_BOOT = Date.now();
async function mxSnapshot(rows){
  // wait until every member's trips have loaded (15 s after opening), and never store an empty week
  if (!S.isOwner || S.preview || S.mxSaved || !S.mxHist || Date.now() - MX_BOOT < 15000) return;
  if (!rows.some(x => x.perf !== null && x.trust !== null)) return;
  S.mxSaved = true;
  const wk = new Date().toISOString().slice(0, 10), hist = S.mxHist.weeks || [];
  if (hist.length && Date.now() - Date.parse(hist[hist.length - 1].at) < 7 * DAY) return;
  const w = {at: wk, pts: rows.filter(x => x.perf !== null && x.trust !== null).map(x => ({id: x.id, n: x.name, p: x.perf, t: x.trust}))};
  try {
    if (S.mxTable) await S.db.doc("scores/" + wk).set(w);
    else { let pend = []; try { const d = await S.db.doc("intel/matrix").get(); pend = d.exists ? (d.data().weeks || []) : []; } catch(e){} await S.db.doc("intel/matrix").set({weeks: [...pend, w]}); }
    S.mxHist = {weeks: [...hist, w]};
  } catch(e){}
}
function trustMatrix(){
  if (!S.isOwner || S.preview) return "";
  const rows = mxMembers().map(({id}) => mxScore(id));
  setTimeout(() => S.mxHist ? mxSnapshot(rows) : mxLoad(), 0);
  const old = ((S.mxHist && S.mxHist.weeks) || []).filter(w => Date.now() - Date.parse(w.at) >= 25 * DAY).pop();
  const narrow = (window.innerWidth || 1000) < 600, W = narrow ? 360 : 640, H = narrow ? 360 : 440, L = 40, R = 12, T = 12, B = 40, pw = W - L - R, ph = H - T - B;
  const X = v => L + pw * v / 100, Y = v => T + ph * (1 - v / 100);
  const placed = rows.map(x => ({...x, px: x.perf === null ? 50 : x.perf, py: x.trust === null ? 50 : x.trust}));
  const quads = [[60, 100, 60, 100, "Trusted performers"], [0, 60, 60, 100, "Reliable: build volume"], [60, 100, 0, 60, "Results, rules at risk"], [0, 60, 0, 60, "Review with the director"]];
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trust and performance matrix of ${rows.length} members" style="width:100%;max-width:720px;height:auto;display:block;margin:8px auto 0">
    ${quads.map(([x0, x1, y0, y1, l], i) => `<rect x="${X(x0)}" y="${Y(y1)}" width="${X(x1) - X(x0)}" height="${Y(y0) - Y(y1)}" fill="var(--${i === 0 ? "ok" : i === 3 ? "bad" : "line"})" opacity="${i === 0 || i === 3 ? 0.08 : 0.25}"/><text x="${i % 2 === 0 ? X(x1) - 6 : X(x0) + 6}" y="${Y(y1) + 16}" text-anchor="${i % 2 === 0 ? "end" : "start"}" font-size="${narrow ? 10 : 12}" fill="var(--muted)">${l}</text>`).join("")}
    <line x1="${X(60)}" y1="${T}" x2="${X(60)}" y2="${T + ph}" stroke="var(--line)" stroke-dasharray="4 4"/><line x1="${L}" y1="${Y(60)}" x2="${L + pw}" y2="${Y(60)}" stroke="var(--line)" stroke-dasharray="4 4"/>
    <rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="none" stroke="var(--line)"/>
    ${(narrow ? [0, 100] : [0, 50, 100]).map(v => `<text x="${X(v)}" y="${T + ph + 16}" text-anchor="middle" font-size="11" fill="var(--muted)">${v}</text><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`).join("")}
    <text x="${L + pw / 2}" y="${H - 6}" text-anchor="middle" font-size="12" fill="var(--text)">Performance: actual results →</text>
    <text transform="translate(14 ${T + ph / 2}) rotate(-90)" text-anchor="middle" font-size="12" fill="var(--text)">Trust: house rules kept →</text>
    ${placed.map(x => { const o = old && old.pts.find(p => p.id === x.id); return o ? `<line x1="${X(o.p)}" y1="${Y(o.t)}" x2="${X(x.px)}" y2="${Y(x.py)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${X(o.p)}" cy="${Y(o.t)}" r="3" fill="var(--muted)"/>` : ""; }).join("")}
    ${placed.map(x => `<g><title>${esc(x.name)}: performance ${x.perf ?? "–"}, trust ${x.trust ?? "–"}${x.early ? " (little data yet)" : ""}</title><circle cx="${X(x.px)}" cy="${Y(x.py)}" r="7" fill="${x.early ? "var(--surface)" : "var(--steel)"}" stroke="var(--steel)" stroke-width="2"/><text x="${x.px > 70 ? X(x.px) - 10 : X(x.px) + 10}" y="${Y(x.py) + 4}" text-anchor="${x.px > 70 ? "end" : "start"}" font-size="12" fill="var(--text)">${esc(String(x.name).length > 16 ? String(x.name).slice(0, 15) + "…" : x.name)}</text></g>`).join("")}
  </svg>`;
  const pct = v => v === null ? `<span class="muted">–</span>` : Math.round(v * 100);
  const table = rows.length ? `<div class="tbl" style="margin-top:10px"><table class="small"><thead><tr><th scope=col>Member</th><th scope=col class="n">Trust</th><th scope=col class="n">Performance</th><th scope=col>Where</th><th scope=col>Weakest point</th></tr></thead><tbody>${rows.sort((a, b) => (b.trust ?? -1) - (a.trust ?? -1)).map(x => {
      const weak = [...x.T, ...x.P].filter(c => c[2] !== null).sort((a, b) => a[2] - b[2])[0];
      return `<tr><td>${esc(x.name)}${x.onb ? "" : ` <span class="chip c-review">Onboarding</span>`}</td><td class="n">${x.trust ?? "–"}</td><td class="n">${x.perf ?? "–"}</td><td>${esc(mxQuad(x))}</td><td>${weak ? `${esc(weak[0])} ${pct(weak[2])}%: <span class="muted">${esc(weak[3])}</span>` : `<span class="muted">No data yet</span>`}</td></tr>`; }).join("")}</tbody></table></div>
    <details class="small" style="margin-top:8px"><summary>Each member's measures</summary>${rows.map(x => `<p style="margin:8px 0 2px"><b>${esc(x.name)}</b> · ${x.trips} trips in 180 days</p><p class="muted" style="margin:0">Trust: ${x.T.map(c => `${esc(c[0])} ${pct(c[2])}`).join(" · ")}<br>Performance: ${x.P.map(c => `${esc(c[0])} ${pct(c[2])}`).join(" · ")}</p>`).join("")}</details>` : "";
  return `<div class="panel" style="margin-top:16px" id="trustMatrix"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Trust and performance</h2><span class="small muted">${rows.length} member${rows.length === 1 ? "" : "s"} · last 180 days</span></div>
    <p class="small muted">Trust (up) measures the house rules each member keeps: follow-up within 24 hours of landing, rating requests, service recovery for scores of 3 or less, files right first time, contracts signed on time, notices confirmed within 3 days and lead follow-up. Performance (right) measures results: quotes booked, bookings against the monthly target, the booking-cycle target and client ratings. Recalculated from live data on every visit; the dotted line shows where each member stood a month ago. A snapshot is kept every week, for good${S.mxHist && S.mxHist.weeks.length ? ` (${S.mxHist.weeks.length} week${S.mxHist.weeks.length === 1 ? "" : "s"} since ${fmtD(S.mxHist.weeks[0].at)})` : ""}. Hollow dots have little data yet.</p>
    ${rows.length ? svg : `<div class="empty"><p><b>No active members yet.</b> Members appear here once their agreement is countersigned.</p></div>`}${table}</div>`;
}

(function(){
  const _vToday = vToday;
  vToday = function(){ const h = _vToday(), i = h.indexOf('<div class="kpis">'), top = (typeof awayBlock === "function" ? awayBlock() : "") + (typeof leaveTodayFlags === "function" && leaveTodayFlags().length ? `<div class="panel" style="margin-bottom:16px"><h2>Leaving files</h2>${leaveTodayFlags().map(x => `<div class="flag"><span class="sev high" aria-hidden="true"></span><div><p>${esc(x)}</p></div></div>`).join("")}</div>` : "") + ownerTodoPrompt() + (typeof noticePrompt === "function" ? noticePrompt() : "") + (typeof reqTodayPanel === "function" ? reqTodayPanel() : ""); const out = i < 0 ? top + h : h.slice(0, i) + top + h.slice(i); return out + trustMatrix(); };
  const _vTeam = vTeam;
  vTeam = function(){ const h = _vTeam(); if (!S.isOwner || S.preview) return h; const add = (typeof intakeTeamPanel === "function" ? intakeTeamPanel() : "") + ownerTodoPanel() + (typeof supervisionPanel === "function" ? supervisionPanel() : "") + (typeof noticeTeamPanel === "function" ? noticeTeamPanel() : "") + (typeof alertsPanel === "function" ? alertsPanel() : ""), k = h.trimStart().startsWith('<div class="head">') ? h.indexOf('</div></div>') + 12 : 0; return h.slice(0, k) + add + h.slice(k); };
  document.addEventListener("click", e => { const b = e.target.closest("[data-todo]"); if (!b) return; e.preventDefault(); todoAct(b.dataset.todo, b.dataset.id); });
  document.addEventListener("toggle", e => { if (e.target.dataset && e.target.dataset.todoDet === "later") S.todoLater = e.target.open; }, true);
})();
