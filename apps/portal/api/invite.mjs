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
export function joinProgress({ invite = {}, user = null, prof = null, join = null, agr = null, prog = null, ack = null, offer = null, audits = [] } = {}) {
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
  sends.forEach((x, i) => log.push({ at: x.at, t: i ? "Invitation sent again" + (x.sent ? "" : " (link given to the owner)") : "Invited" + (x.sent ? "; email sent" : "; email not sent, link given to the owner") }));
  if (firstIn) log.push({ at: firstIn, t: "Opened the invitation and set a password" });
  if (signedIn && signedIn !== firstIn) log.push({ at: signedIn, t: "Last signed in" });
  if (offer && offer.data && offer.data.at) log.push({ at: offer.data.at, t: "Opened the offer" });
  path.forEach(k => { const m = mods[k]; if (m && m.passedAt) log.push({ at: m.passedAt, t: `Academy: passed ${ACADEMY_TITLES[k] || k}${m.best ? ` (${m.best}%` + (m.attempts > 1 ? `, ${m.attempts} attempts)` : ")") : ""}` }); else if (m && m.at && !m.passed) log.push({ at: m.at, t: `Academy: tried ${ACADEMY_TITLES[k] || k}, not passed yet (best ${m.best || 0}%)` }); });
  if (p && p.completedAt) log.push({ at: p.completedAt, t: "Academy completed" });
  if (jd.at || (join && join.at)) log.push({ at: jd.at || join.at, t: "Asked for assessment" });
  if (a.sentAt) log.push({ at: a.sentAt, t: "Assessed and passed; agreement sent" });
  if (a.signedAt) log.push({ at: a.signedAt, t: "Signed the agreement" });
  if (a.counterAt || ob.issuedAt) log.push({ at: a.counterAt || ob.issuedAt, t: "Countersigned; onboarding package issued" });
  if (ack && ack.data && ack.data.ackAt) log.push({ at: ack.data.ackAt, t: "Confirmed the onboarding package; desk opened" });
  (audits || []).forEach(x => { if (!/^Invitation to join$/.test(x.action || "")) log.push({ at: x.t, t: x.action + (x.detail ? ": " + String(x.detail).slice(0, 160) : "") }); });
  log.sort((x, y) => String(y.at || "").localeCompare(String(x.at || "")));
  return { done, of: steps.length, pct, label, steps, log: log.slice(0, 80), lastSeen: signedIn };
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
      for (const x of list.slice(0, 30)) {
        const u = await findUser(String(x.email || "").toLowerCase());
        let prof = null, join = null, agr = null;
        if (u) { prof = ((await sb(`/rest/v1/profiles?select=active,data&id=eq.${u.id}`)).body || [])[0] || null; join = ((await sb(`/rest/v1/join_requests?select=data&user_id=eq.${u.id}`)).body || [])[0] || null; agr = ((await sb(`/rest/v1/agreements?select=data&id=eq.${u.id}`)).body || [])[0] || null; }
        let prog = null, ack = null, offer = null, audits = [];
        if (u) {
          prog = ((await sb(`/rest/v1/academy_progress?select=data&id=eq.${u.id}`)).body || [])[0] || null;
          const runs = (await sb(`/rest/v1/training_runs?select=id,data&owner_id=eq.${u.id}&id=in.(onboarding,offer)`)).body || [];
          ack = runs.find(r => r.id === "onboarding") || null; offer = runs.find(r => r.id === "offer") || null;
          const nm = String(x.name || "").replace(/[^\p{L}\p{N} .'-]/gu, "").trim();
          if (nm.length >= 3) audits = (await sb(`/rest/v1/audit_log?select=t,action,detail&detail=ilike.*${encodeURIComponent(nm)}*&order=t.desc&limit=30`)).body || [];
        }
        out[x.email] = { ...inviteState(u, prof, join, agr), progress: joinProgress({ invite: x, user: u, prof, join, agr, prog, ack, offer, audits: Array.isArray(audits) ? audits : [] }) };
      }
      // email addresses of everyone with a login, so Team can show who is who (owners only; never stored in the page)
      const people = {}, users = []; for (let page = 1; page <= 20; page++) { const r = await sb(`/auth/v1/admin/users?page=${page}&per_page=200`); const ul = (r.body && r.body.users) || []; ul.forEach(u => { people[u.id] = { email: u.email || "", lastSignIn: u.last_sign_in_at || null }; users.push(u); }); if (ul.length < 200) break; }
      // people joining who were not invited from Team (an earlier starter package, or sent back to joining): shown too
      const extra = [], listed = new Set(list.slice(0, 30).map(x => String(x.email || "").toLowerCase()));
      const joining = (await sb("/rest/v1/profiles?select=id,role,active,contract_name,data&active=eq.false&role=neq.owner")).body || [];
      for (const pr of (Array.isArray(joining) ? joining : []).slice(0, 30)) {
        if (pr.data && pr.data.roster) continue;   // left the team: not joining
        const u = users.find(z => z.id === pr.id); if (!u || !u.email || listed.has(u.email.toLowerCase())) continue;
        const name = pr.contract_name || ((u.user_metadata || {}).name) || u.email.split("@")[0];
        const x = { email: u.email.toLowerCase(), name, at: u.created_at, notInvited: true };
        const join = ((await sb(`/rest/v1/join_requests?select=data,at&user_id=eq.${u.id}`)).body || [])[0] || null, agr = ((await sb(`/rest/v1/agreements?select=data&id=eq.${u.id}`)).body || [])[0] || null;
        const prog = ((await sb(`/rest/v1/academy_progress?select=data&id=eq.${u.id}`)).body || [])[0] || null;
        const runs = (await sb(`/rest/v1/training_runs?select=id,data&owner_id=eq.${u.id}&id=in.(onboarding,offer)`)).body || [];
        const nm = String(name).replace(/[^\p{L}\p{N} .'-]/gu, "").trim();
        const audits = nm.length >= 3 ? (await sb(`/rest/v1/audit_log?select=t,action,detail&detail=ilike.*${encodeURIComponent(nm)}*&order=t.desc&limit=30`)).body || [] : [];
        extra.push(x);
        out[x.email] = { ...inviteState(u, pr, join, agr), progress: joinProgress({ invite: { at: u.created_at, first: u.created_at, sends: [] }, user: u, prof: pr, join, agr, prog, ack: (Array.isArray(runs) ? runs : []).find(r => r.id === "onboarding") || null, offer: (Array.isArray(runs) ? runs : []).find(r => r.id === "offer") || null, audits: Array.isArray(audits) ? audits : [] }) };
      }
      return res.status(200).json({ states: out, people, extra });
    }

    const b = req.body || {}, email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 80);
    if (!EMAIL_RX.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!name || name.split(/\s+/).length < 2) return res.status(400).json({ error: "Enter the person's first and last name." });

    const existing = await findUser(email);
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
