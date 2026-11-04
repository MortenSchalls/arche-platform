// Invite someone to join Archē from the portal (Morten, 28 Oct 2026: "I simply invite a person from the portal, and they
// receive all the needed on an email, log in and they are done").
// POST { email, name } with an owner's sign-in token. Creates the login (or a fresh link if the person already has one but
// never finished signing in), emails a personal one-time link from the company domain (Resend), and returns the link so
// the owner can send it another way if the email fails. The person clicks it, chooses a password and lands on step 1 of
// joining (the offer). The inviting owner gets a hidden copy (BCC). Owners only; written to the audit log. Environment as for /api/alerts:
//   SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY; optional INVITE_FROM, PORTAL_URL.
const PORTAL = process.env.PORTAL_URL || "https://portal.archeaviation.com";
const FROM = process.env.INVITE_FROM || "Archē Executive <welcome@archeaviation.com>";
const EMAIL_RX = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);

export function inviteMail({ name, link, from, again }) {
  const first = (name || "").split(/\s+/)[0] || "";
  if (again) {   // a new link for someone who already has a login (lost access, link run out)
    const text = [`Dear ${first || "colleague"},`, "", "Here is a new personal link to the Archē Executive broker portal. Open it and choose your password; you then continue where you left off.", "",
      link, "", "The link works once and only for a short time. If it no longer works, reply to this email and we will send a new one.", "",
      `Later, on any phone or computer: ${PORTAL} (sign in with this email address and your password; "Forgot password" is on the sign-in page).`, "",
      "Kind regards,", from || "Archē Executive", "Archē Executive"].join("\n");
    const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const html = `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:#24262a;max-width:560px"><p>Dear ${esc(first || "colleague")},</p><p>Here is a new personal link to the Archē Executive broker portal. Open it and choose your password; you then continue where you left off.</p>
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#34373d;color:#f3f5f8;padding:12px 22px;text-decoration:none;letter-spacing:.08em;font-size:13px">OPEN YOUR PORTAL</a></p>
<p style="font-size:13px;color:#5b6067">The link works once and only for a short time. If it no longer works, reply to this email and we will send a new one.</p>
<p style="font-size:13px">Later, on any phone or computer: <a href="${PORTAL}">${PORTAL.replace(/^https:\/\//, "")}</a>. Sign in with this email address and your password; "Forgot password" is on the sign-in page.</p><p>Kind regards,<br>${esc(from || "Archē Executive")}<br>Archē Executive</p></div>`;
    return { subject: "Your new link to the Archē Executive portal", text, html };
  }
  const text = [`Dear ${first || "colleague"},`, "",
    "Archē Executive is a private jet charter broker based in Singapore. We arrange the right aircraft for clients across Asia and worldwide, from any operator, on any route.", "",
    "We are inviting a small group of people to build their own charter business with us, keeping up to 35% of the profit on every trip they sell.", "",
    "Your access to our broker portal is ready.", "",
    "Open your personal link below, choose your password, and you will see your joining steps:",
    "1. our offer to you", "2. the Archē Broker Academy, at your own pace", "3. your request for assessment", "4. your agreement, which you read and sign in the portal", "",
    link, "",
    "The link works once and only for a short time. If it no longer works, reply to this email and we will send a new one.", "",
    "Later, on any phone or computer:",
    `- Your portal: ${PORTAL}`,
    `- The Archē Broker Academy: ${PORTAL}/academy.html`,
    "Sign in with this email address and the password you chose. Forgot it? Press \"Forgot password\" on the sign-in page.", "",
    `Kind regards,`, from || "Archē Executive", "Archē Executive"].join("\n");
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:#24262a;max-width:560px">
<p>Dear ${esc(first || "colleague")},</p><p>Archē Executive is a private jet charter broker based in Singapore. We arrange the right aircraft for clients across Asia and worldwide, from any operator, on any route.</p>
<p>We are inviting a small group of people to build their own charter business with us, keeping up to 35% of the profit on every trip they sell.</p>
<p>Your access to our broker portal is ready.</p>
<p>Open your personal link, choose your password, and you will see your joining steps:</p>
<ol><li>our offer to you</li><li>the Archē Broker Academy, at your own pace</li><li>your request for assessment</li><li>your agreement, which you read and sign in the portal</li></ol>
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#34373d;color:#f3f5f8;padding:12px 22px;text-decoration:none;letter-spacing:.08em;font-size:13px">OPEN YOUR PORTAL</a></p>
<p style="font-size:13px;color:#5b6067">The link works once and only for a short time. If it no longer works, reply to this email and we will send a new one.</p>
<p style="font-size:13px"><b>Later, on any phone or computer:</b><br>Your portal: <a href="${PORTAL}">${PORTAL.replace(/^https:\/\//, "")}</a><br>The Archē Broker Academy: <a href="${PORTAL}/academy.html">${PORTAL.replace(/^https:\/\//, "")}/academy.html</a><br>Sign in with this email address and the password you chose. Forgot it? Press "Forgot password" on the sign-in page.</p>
<p>Kind regards,<br>${esc(from || "Archē Executive")}<br>Archē Executive</p></div>`;
  return { subject: "Your access to the Archē Executive broker portal", text, html };
}

// a friendly reminder after 3 quiet days (Morten, 4 Nov 2026): the owner sees it ready in Team > Invitations, reads it and
// presses Send; nothing goes out on its own. It names the next step and carries a fresh personal link (a new password
// link for someone who never set one). Replies go to the owner, so "not for me" is one reply away.
export function remindMail({ name, link, from, next, pwSet, started }) {
  const first = (name || "").split(/\s+/)[0] || "";
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const step = next ? `${next.title}${next.min ? ` (about ${next.min} minutes)` : ""}` : "";
  const lead = started ? "You have made a good start on the Archē Broker Academy, and your place is kept for you." : "Your place in the Archē Executive broker programme is ready when you are.";
  const nx = step ? `Your next step: ${step}.` : "Your next step is waiting on your joining page.";
  const how = pwSet === false ? "Open your personal link below and choose your password; your joining page then shows the next step, and \"Continue where you left off\" opens the academy at the right place."
    : "Open your personal link below; it signs you in to your joining page, and \"Continue where you left off\" opens the academy at the right place.";
  const text = [`Dear ${first || "colleague"},`, "", lead, "", nx, "You can stop and come back at any time; your progress is saved as you go.", "", how, "", link, "",
    "The link works once and only for a short time. Later, sign in at " + PORTAL + " with this email address and your password.", "",
    "If you have decided not to go ahead, just reply to this email and we will not send further reminders.", "",
    "Kind regards,", from || "Archē Executive", "Archē Executive"].join("\n");
  const html = `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:#24262a;max-width:560px"><p>Dear ${esc(first || "colleague")},</p><p>${esc(lead)}</p>
<p><b>${esc(nx)}</b><br>You can stop and come back at any time; your progress is saved as you go.</p><p>${esc(how)}</p>
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#34373d;color:#f3f5f8;padding:12px 22px;text-decoration:none;letter-spacing:.08em;font-size:13px">CONTINUE WHERE YOU LEFT OFF</a></p>
<p style="font-size:13px;color:#5b6067">The link works once and only for a short time. Later, sign in at <a href="${PORTAL}">${PORTAL.replace(/^https:\/\//, "")}</a> with this email address and your password.</p>
<p style="font-size:13px;color:#5b6067">If you have decided not to go ahead, just reply to this email and we will not send further reminders.</p><p>Kind regards,<br>${esc(from || "Archē Executive")}<br>Archē Executive</p></div>`;
  return { subject: "Your next step with Archē Executive", text, html };
}
export const REMIND_DAYS = 3;

// the inviting owner gets a hidden copy (BCC) of every invitation (Morten, 28 Oct 2026) and the person's replies
export function inviteRequest({ from, to, owner, mail }) {
  const o = owner && EMAIL_RX.test(owner) && owner.toLowerCase() !== to ? [owner] : undefined;
  return { from, to: [to], bcc: o, reply_to: o, subject: mail.subject, text: mail.text, html: mail.html };
}
async function sb(path, opt = {}) {
  const KEY = process.env.SUPABASE_SECRET_KEY;
  const r = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...opt, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(opt.headers || {}) } });
  const body = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, body };
}
const arrFirst = b => (Array.isArray(b) ? b[0] : null) || null;
async function findUser(email) {
  for (let page = 1; page <= 20; page++) {
    const r = await sb(`/auth/v1/admin/users?page=${page}&per_page=200`); if (!r.ok) throw new Error("users " + r.status);
    const list = (r.body && r.body.users) || []; const u = list.find(x => String(x.email || "").toLowerCase() === email); if (u) return u;
    if (list.length < 200) return null;
  }
  return null;
}

// accepted = the person has signed in; step = where they are in joining (for Team > Recent invitations)
export function inviteState(u, prof, join, agr) {
  if (!u) return { accepted: false, step: "No login yet" };
  if (!u.last_sign_in_at) return { accepted: false, step: "Invited, not signed in yet" };
  const onTeam = !!(prof && prof.active && prof.data && prof.data.roster);
  const step = onTeam ? "On the team" : agr ? "Agreement " + ((agr.data || {}).status || "") : join ? "Asked for assessment" : "Joining steps (offer, academy)";
  return { accepted: true, signedIn: u.last_sign_in_at, step };
}

// Exact joining progress and a log for one invited person (owners only, Team > Invitations). Built from what the portal
// already records: the invitation, the login, the academy, the request, the agreement, the package. No personal data
// beyond what Team already shows.
const ACADEMY_PATHS = { broker: ["m0","m1","m2","lab","m3","m4","m5","m6","m7","m8","m9","m10","book","m11","m12","m13","m14","exam"], consultant: ["m0","m1","m2","lab","m3","m4","m5","m12","m13","exam"] };
const ACADEMY_TITLES = { m0: "0 Aviation for brokers", m1: "1 Archē Executive and the broker's role", m2: "2 Where we may and may not sell", lab: "2L Lab: the trip risk screen", m3: "3 Compliance: KYC, sanctions, fraud", m4: "4 Our clients", m5: "5 Enquiry intake and qualification", m6: "6 Flight feasibility and trip planning", m7: "7 Aircraft knowledge: long-range jets", m8: "8 Sourcing on Avinode and operator vetting", m9: "9 Pricing and quoting", m10: "10 Contract, payment and settlement", book: "10P Practical: the booking form", m11: "11 Trip operations and the 24/7 desk", m12: "12 Selling and the consultant desk", m13: "13 Case studies", m14: "14 Assessment and certification", exam: "Written exam" };
const ACADEMY_MIN = { m0: 21, m1: 13, m2: 23, m3: 12, m4: 5, m5: 8, m6: 16, m7: 5, m8: 13, m9: 15, m10: 15, m11: 12, m12: 7, m13: 9, m14: 14 };
export const academyNext = (p, role) => {
  const path = ACADEMY_PATHS[(p && p.role) || role || "broker"] || ACADEMY_PATHS.broker, mods = (p && p.mods) || {}, id = path.find(k => !(mods[k] && mods[k].passed));
  if (!id) return null;
  const t = ACADEMY_TITLES[id] || id, mm = t.match(/^(\d+) (.*)$/), title = mm ? `Module ${mm[1]} · ${mm[2]}` : t.replace(/^\S+ (?=Lab|Practical)/, "");
  return { id, title, min: ACADEMY_MIN[id] || 0 };
};
export function joinProgress({ invite = {}, user = null, prof = null, join = null, agr = null, prog = null, ack = null, offer = null, audits = [], runs = [], authEvents = null, now = new Date() } = {}) {
  const jd = (join && join.data) || {}, a = (agr && agr.data) || {}, pd = (prof && prof.data) || {}, ob = (pd.roster || {}).onboarding || {};
  const p = (prog && prog.data) || null, role = (p && p.role) || jd.role || "broker", path = ACADEMY_PATHS[role] || ACADEMY_PATHS.broker;
  const mods = (p && p.mods) || {}, passed = path.filter(k => mods[k] && mods[k].passed), next = path.find(k => !(mods[k] && mods[k].passed));
  const onTeam = !!(prof && prof.active && pd.roster), sends = invite.sends || (invite.at ? [{ at: invite.at, sent: !!invite.sent }] : []);
  const invAt = invite.first || invite.at || "", conf = user ? (user.email_confirmed_at || user.confirmed_at || null) : null, firstIn = conf && (!invAt || conf >= invAt) ? conf : null, signedIn = user ? user.last_sign_in_at || null : null;
  const steps = [
    { k: "invited", t: sends.length ? "Invited" : "Login created", done: !!(invite.first || invite.at), at: invite.first || invite.at || null, note: sends.length > 1 ? `link sent ${sends.length} times` : invite.sent === false ? "link given to the owner" : sends.length ? "" : "not invited from Team" },
    { k: "login", t: "Accepted and signed in", done: !!signedIn, at: firstIn && signedIn ? firstIn : signedIn, note: signedIn ? "last seen " + signedIn.slice(0, 16).replace("T", " ") : user ? "invitation not opened yet" : "no login" },
    { k: "offer", t: "Read the offer", done: !!(offer && offer.data && offer.data.at), at: (offer && offer.data && offer.data.at) || null, note: "" },
    { k: "academy", t: "Broker Academy", done: !!(p && p.completedAt), at: (p && p.completedAt) || null, note: p ? `${passed.length} of ${path.length} modules passed${!p.completedAt && next ? " · next: " + ACADEMY_TITLES[next] : ""}` : "not started", part: path.length ? passed.length / path.length : 0 },
    { k: "request", t: "Asked for assessment", done: !!join || !!a.status, at: jd.at || (join && join.at) || null, note: jd.role ? `as ${jd.role === "ops" ? "operations" : jd.role}${jd.base ? ", " + jd.base : ""}` : "" },
    { k: "assessed", t: "Assessed; agreement sent", done: !!a.sentAt, at: a.sentAt || null, note: "" },
    { k: "signed", t: "Signed the agreement", done: !!a.signedAt, at: a.signedAt || null, note: a.version ? "version " + a.version : "" },
    { k: "counter", t: "Countersigned; package issued", done: !!(a.counterAt || ob.issuedAt), at: a.counterAt || ob.issuedAt || null, note: "" },
    { k: "desk", t: "Confirmed the package; desk open", done: !!(ack && ack.data && ack.data.ackAt), at: (ack && ack.data && ack.data.ackAt) || null, note: onTeam ? "" : "" }
  ];
  // a later step done means the earlier ones are done, even if the earlier record was not kept
  for (let i = steps.length - 1, later = false; i >= 0; i--) { if (steps[i].done) later = true; else if (later) { steps[i].done = true; steps[i].note = "done (no date recorded)"; } }
  const done = steps.filter(x => x.done).length, cur = steps.find(x => !x.done);
  const pct = Math.round(((done + (cur && cur.k === "academy" ? cur.part || 0 : 0)) / steps.length) * 100);
  const label = cur ? `Step ${steps.indexOf(cur) + 1} of ${steps.length}: ${cur.t}${cur.note ? " (" + cur.note + ")" : ""}` : "Done: on the desk";
  const log = [];
  // invitations: the list on Team, plus earlier ones found in the audit log (the list kept only the latest before 2 Nov 2026)
  const near = (a, b) => Math.abs(new Date(a) - new Date(b)) < 5 * 60e3;
  const invAudits = (audits || []).filter(x => x.action === "Invitation to join" && x.t && !sends.some(y => near(y.at, x.t))).map(x => ({ at: x.t, sent: /email sent/.test(x.detail || "") }));
  const allSends = [...sends, ...invAudits].sort((a, b) => String(a.at).localeCompare(String(b.at)));
  if (allSends.length > 1 && steps[0].k === "invited" && !steps[0].note) steps[0].note = `link sent ${allSends.length} times`;
  allSends.forEach((x, i) => log.push({ at: x.at, t: i ? "Invitation sent again" + (x.sent ? "" : " (link given to the owner)") : "Invited" + (x.sent ? "; email sent" : "; email not sent, link given to the owner") }));
  // sign-in history kept by Supabase (SQL 0021): every sign-in, grouped by day, and account events
  const AUTH = { user_signedup: "Login created", user_invited: "Invitation link created", invite_accepted: "Opened the invitation", user_confirmation_requested: "Asked to confirm the email", user_recovery_requested: "Asked for a new password link", user_updated_password: "Set or changed the password", user_modified: "Account details changed", logout: "Signed out", user_repeated_signup: "Tried to sign up again", user_deleted: "Login deleted" };
  if (Array.isArray(authEvents) && authEvents.length) {
    const days = {};
    authEvents.forEach(e => { if (e.action === "login") { const d = String(e.at).slice(0, 10); (days[d] = days[d] || []).push(e.at); } else if (AUTH[e.action]) log.push({ at: e.at, t: AUTH[e.action] }); });
    Object.values(days).forEach(ts => { ts.sort(); log.push({ at: ts[ts.length - 1], t: ts.length > 1 ? `Signed in ${ts.length} times that day (first ${String(ts[0]).slice(11, 16)} UTC)` : "Signed in" }); });
  } else {
    if (firstIn) log.push({ at: firstIn, t: (user.user_metadata || {}).pw_set ? "Opened the invitation and set a password" : "Opened the invitation" });
    if (signedIn && signedIn !== firstIn) log.push({ at: signedIn, t: "Last signed in" });
  }
  if (prog && prog.created_at) log.push({ at: prog.created_at, t: "Started the academy" });
  (runs || []).forEach(r => { const d = r.data || {};
    if (d.kind === "syllabus" && d.at) log.push({ at: d.at, t: "Live training lesson: " + String(d.title || d.lesson || "").slice(0, 80) });
    else if (/^notice-/.test(r.id || "") && (d.at || r.updated_at)) log.push({ at: d.at || r.updated_at, t: "Read a notice from Archē" }); });
  if (offer && offer.data && offer.data.at) log.push({ at: offer.data.at, t: "Opened the offer" });
  path.forEach(k => { const m = mods[k]; if (m && m.passedAt) log.push({ at: m.passedAt, t: `Academy: passed ${ACADEMY_TITLES[k] || k}${m.best ? ` (${m.best}%` + (m.attempts > 1 ? `, ${m.attempts} attempts)` : ")") : ""}` }); else if (m && m.at && !m.passed) log.push({ at: m.at, t: `Academy: tried ${ACADEMY_TITLES[k] || k}, not passed yet (best ${m.best || 0}%)` }); });
  if (p && p.completedAt) log.push({ at: p.completedAt, t: "Academy completed" });
  if (jd.at || (join && join.at)) log.push({ at: jd.at || join.at, t: "Asked for assessment" });
  if (a.sentAt) log.push({ at: a.sentAt, t: "Assessed and passed; agreement sent" });
  if (a.signedAt) log.push({ at: a.signedAt, t: "Signed the agreement" });
  if (a.counterAt || ob.issuedAt) log.push({ at: a.counterAt || ob.issuedAt, t: "Countersigned; onboarding package issued" });
  if (ack && ack.data && ack.data.ackAt) log.push({ at: ack.data.ackAt, t: "Confirmed the onboarding package; desk opened" });
  (audits || []).forEach(x => { if (x.action !== "Invitation to join") log.push({ at: x.t, t: x.action + (x.detail ? ": " + String(x.detail).slice(0, 160) : "") }); });
  // the academy page: when it was opened signed in, and failed password sign-ins there before that (make_academy.py)
  const av = (((runs || []).find(r => r.id === "academy") || {}).data) || null;
  if (av && av.first) log.push({ at: av.first, t: "Opened the academy for the first time" });
  if (av && av.last && av.count > 1) log.push({ at: av.last, t: `Opened the academy (${av.count} times in all)` });
  if (av && av.fails) log.push({ at: av.lastFailAt || av.last, t: `${av.fails} failed password sign-in${av.fails > 1 ? "s" : ""} on the academy page before getting in` });
  // reminders sent from Team
  const rem = (invite.reminders || []).slice().sort((a, b) => String(a.at).localeCompare(String(b.at)));
  rem.forEach(x => log.push({ at: x.at, t: "Reminder sent" + (x.sent ? "" : " (email not sent)") }));
  log.sort((x, y) => String(y.at || "").localeCompare(String(x.at || "")));
  // a password never set: the person signed in by link but the "choose your password" step was not finished
  const um = (user && user.user_metadata) || {}, viaMs = ((user && user.app_metadata) || {}).provider === "azure";
  const pwSet = !user ? null : !!(um.pw_set || viaMs);
  const alert = user && signedIn && !pwSet ? "Signed in but never set a password: use Send again for a new password link" : "";
  // quiet for 3 days or more, not yet asking for assessment: a reminder is ready for the owner to send
  const stamps = [invAt, ...sends.map(x => x.at), signedIn, p && (p.updated || null), av && av.last, offer && offer.data && offer.data.at, ...rem.map(x => x.at)].filter(Boolean).map(String).sort();
  const lastActive = stamps[stamps.length - 1] || null, quiet = lastActive ? Math.floor((now - new Date(lastActive)) / 864e5) : 0;
  const atJoin = !onTeam && !join && !a.status, nextStep = academyNext(p, role);
  const remind = atJoin && user ? { due: quiet >= REMIND_DAYS, quiet, lastActive, sent: rem.length, lastSent: rem.length ? rem[rem.length - 1].at : null, next: nextStep,
    preview: remindMail({ name: invite.name || um.name || "", link: "[personal sign-in link]", from: "[your name]", next: nextStep, pwSet, started: !!p }).text } : null;
  return { done, of: steps.length, pct, label, steps, log: log.slice(0, 150), lastSeen: signedIn, history: Array.isArray(authEvents) ? "full" : "partial", pwSet, alert, remind };
}
async function owner(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const who = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
  if (!who.ok) return { code: 401, error: "Sign in again" };
  const me = await who.json();
  const prof = await sb(`/rest/v1/profiles?select=role,active,contract_name&id=eq.${me.id}`);
  const p = (prof.body || [])[0]; if (!p || p.role !== "owner" || !p.active) return { code: 403, error: "Owners only" };
  return { me, p };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).json({ error: "GET or POST" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).json({ error: "SUPABASE_URL or SUPABASE_SECRET_KEY missing in Vercel" });
  try {
    const o = await owner(req); if (o.error) return res.status(o.code).json({ error: o.error });
    const { me, p } = o;
    if (req.method === "GET") {   // who has accepted (owners only)
      const cur = await sb("/rest/v1/intel?select=value&key=eq.invites"), list = (((cur.body || [])[0] || {}).value || {}).list || [];
      const out = {};
      const arr = r => Array.isArray(r) ? r : [];
      const one = async path => arr((await sb(path)).body)[0] || null;
      // everything recorded about one person's joining, with dates (history included where the records keep it)
      const gather = async (u, x, prof) => {
        const join = await one(`/rest/v1/join_requests?select=data,at&user_id=eq.${u.id}`), agr = await one(`/rest/v1/agreements?select=data,created_at&id=eq.${u.id}`);
        const prog = await one(`/rest/v1/academy_progress?select=data,created_at&id=eq.${u.id}`);
        const runs = arr((await sb(`/rest/v1/training_runs?select=id,data,updated_at&owner_id=eq.${u.id}`)).body);
        const nm = String(x.name || "").replace(/[^\p{L}\p{N} .'-]/gu, "").trim();
        const audits = nm.length >= 3 ? arr((await sb(`/rest/v1/audit_log?select=t,action,detail&detail=ilike.*${encodeURIComponent(nm)}*&order=t.desc&limit=60`)).body) : [];
        // sign-in history kept by Supabase (needs SQL 0021; without it the log uses the other records only)
        const ae = await sb("/rest/v1/rpc/join_auth_events", { method: "POST", body: JSON.stringify({ p_uid: u.id, p_email: String(u.email || x.email || "").toLowerCase() }) });
        return { ...inviteState(u, prof, join, agr), progress: joinProgress({ invite: x, user: u, prof, join, agr, prog, ack: runs.find(r => r.id === "onboarding") || null, offer: runs.find(r => r.id === "offer") || null, runs, audits, authEvents: ae.ok ? arr(ae.body) : null }) };
      };
      for (const x of list.slice(0, 30)) {
        const u = await findUser(String(x.email || "").toLowerCase());
        if (!u) { out[x.email] = { ...inviteState(null), progress: joinProgress({ invite: x }) }; continue; }
        const prof = await one(`/rest/v1/profiles?select=active,data&id=eq.${u.id}`);
        out[x.email] = await gather(u, x, prof);
      }
      // email addresses of everyone with a login, so Team can show who is who (owners only; never stored in the page)
      const people = {}, users = []; for (let page = 1; page <= 20; page++) { const r = await sb(`/auth/v1/admin/users?page=${page}&per_page=200`); const ul = (r.body && r.body.users) || []; ul.forEach(u => { people[u.id] = { email: u.email || "", lastSignIn: u.last_sign_in_at || null }; users.push(u); }); if (ul.length < 200) break; }
      // people joining who were not invited from Team (an earlier starter package, or sent back to joining): shown too
      const extra = [], listed = new Set(list.slice(0, 30).map(x => String(x.email || "").toLowerCase()));
      const joining = arr((await sb("/rest/v1/profiles?select=id,role,active,contract_name,data&active=eq.false&role=neq.owner")).body);
      for (const pr of joining.slice(0, 30)) {
        if (pr.data && pr.data.roster) continue;   // left the team: not joining
        const u = users.find(z => z.id === pr.id); if (!u || !u.email || listed.has(u.email.toLowerCase())) continue;
        const name = pr.contract_name || ((u.user_metadata || {}).name) || u.email.split("@")[0];
        const x = { email: u.email.toLowerCase(), name, at: u.created_at, first: u.created_at, sends: [], notInvited: true };
        extra.push(x); out[x.email] = await gather(u, x, pr);
      }
      return res.status(200).json({ states: out, people, extra });
    }

    const b = req.body || {}, email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 80);
    if (!EMAIL_RX.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!name || name.split(/\s+/).length < 2) return res.status(400).json({ error: "Enter the person's first and last name." });

    const existing = await findUser(email);
    const remind = b.mode === "remind";
    if (remind) {
      if (!existing) return res.status(400).json({ error: "This person has no login yet. Use Send invitation." });
      const pwSet = !!((existing.user_metadata || {}).pw_set || ((existing.app_metadata || {}).provider === "azure"));
      // a sign-in link for people with a password; a new password link for those who signed in but never set one
      const rtype = existing.last_sign_in_at && !pwSet ? "recovery" : "magiclink";
      const gl = await sb("/auth/v1/admin/generate_link", { method: "POST", body: JSON.stringify({ type: rtype, email, redirect_to: PORTAL + "/" }) });
      const link = gl.body && (gl.body.action_link || (gl.body.properties || {}).action_link);
      if (!gl.ok || !link) return res.status(502).json({ error: "Could not create the link (" + gl.status + ")." });
      const prog = arrFirst((await sb(`/rest/v1/academy_progress?select=data&id=eq.${existing.id}`)).body);
      const pd = (prog && prog.data) || null;
      let sent = "not sent: RESEND_API_KEY missing in Vercel";
      if (process.env.RESEND_API_KEY) {
        const m = remindMail({ name, link, from: p.contract_name || "", next: academyNext(pd), pwSet, started: !!pd });
        const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify(inviteRequest({ from: FROM, to: email, owner: me.email, mail: m })) });
        if (r.ok) sent = "sent"; else { let msg = ""; try { msg = (await r.json()).message || ""; } catch (e) {} sent = `not sent: refused by Resend (${r.status}${msg ? ": " + msg.slice(0, 120) : ""})`; }
      }
      const at = new Date().toISOString(), masked = email.replace(/^(.).*?(@.*)$/, "$1***$2");
      await sb("/rest/v1/audit_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ by: me.id, action: "Joining reminder", detail: `${name} · ${masked} · email ${sent === "sent" ? "sent" : "not sent"}` }) });
      const cur = await sb("/rest/v1/intel?select=value&key=eq.invites"), list = (((cur.body || [])[0] || {}).value || {}).list || [];
      const next = list.map(x => x.email === email ? { ...x, reminders: [...(x.reminders || []), { at, sent: sent === "sent", by: me.id }].slice(-20) } : x);
      if (!list.some(x => x.email === email)) next.unshift({ email, name, at: existing.created_at, first: existing.created_at, sends: [], notInvited: true, reminders: [{ at, sent: sent === "sent", by: me.id }] });
      await sb("/rest/v1/intel?on_conflict=key", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "invites", value: { list: next.slice(0, 100) }, updated_at: at }) });
      return res.status(200).json({ ok: true, sent, link, remind: true });
    }
    // new person: an invitation; invited but never signed in: a fresh sign-in link; already signed in before (lost access,
    // link run out): a link to choose a new password, so "Send again" always works (Morten, 29 Oct 2026)
    const type = !existing ? "invite" : existing.last_sign_in_at ? "recovery" : "magiclink", again = !!existing;
    const gl = await sb("/auth/v1/admin/generate_link", { method: "POST", body: JSON.stringify({ type, email, redirect_to: PORTAL + "/", data: { invited: true, name, invited_by: me.id } }) });
    const link = gl.body && (gl.body.action_link || (gl.body.properties || {}).action_link);
    if (!gl.ok || !link) return res.status(502).json({ error: "Could not create the login (" + gl.status + ")." });

    const ownerName = p.contract_name || "";
    let sent = "not sent: RESEND_API_KEY missing in Vercel";
    if (process.env.RESEND_API_KEY) {
      const m = inviteMail({ name, link, from: ownerName, again });
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify(inviteRequest({ from: FROM, to: email, owner: me.email, mail: m })) });
      if (r.ok) sent = "sent"; else { let msg = ""; try { msg = (await r.json()).message || ""; } catch (e) {} sent = `not sent: refused by Resend (${r.status}${msg ? ": " + msg.slice(0, 120) : ""})`; }
    }
    const at = new Date().toISOString(), masked = email.replace(/^(.).*?(@.*)$/, "$1***$2");
    await sb("/rest/v1/audit_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ by: me.id, action: "Invitation to join", detail: `${name} · ${masked} · email ${sent === "sent" ? "sent" : "not sent"}` }) });
    // the list of invitations on Team (owner only)
    const cur = await sb("/rest/v1/intel?select=value&key=eq.invites"), list = (((cur.body || [])[0] || {}).value || {}).list || [];
    const prev = list.find(x => x.email === email) || {}, sends = [...(prev.sends || (prev.at ? [{ at: prev.at, sent: !!prev.sent }] : [])), { at, sent: sent === "sent" }].slice(-20);
    const next = [{ email, name, at, first: prev.first || prev.at || at, sends, by: me.id, sent: sent === "sent" }, ...list.filter(x => x.email !== email)].slice(0, 100);
    await sb("/rest/v1/intel?on_conflict=key", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "invites", value: { list: next }, updated_at: at }) });
    return res.status(200).json({ ok: true, sent, link, again: !!existing });
  } catch (e) { return res.status(500).json({ error: "invite", detail: String(e.message || e).slice(0, 200) }); }
}
