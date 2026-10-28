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

export function inviteMail({ name, link, from }) {
  const first = (name || "").split(/\s+/)[0] || "";
  const text = [`Dear ${first || "colleague"},`, "",
    "Archē Executive is a private jet charter broker based in Singapore. We arrange the right aircraft for clients across Asia and worldwide, from any operator, on any route.", "",
    "We are inviting a small group of people to build their own charter business with us, keeping up to 35% of the profit on every trip they sell.", "",
    "Your access to our broker portal is ready.", "",
    "Open your personal link below, choose your password, and you will see your joining steps:",
    "1. our offer to you", "2. the Archē Broker Academy, at your own pace", "3. your request for assessment", "4. your agreement, which you read and sign in the portal", "",
    link, "",
    "The link works once and for 24 hours. If it has expired, reply to this email and we will send a new one.", "",
    `Kind regards,`, from || "Archē Executive", "Archē Executive"].join("\n");
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:#24262a;max-width:560px">
<p>Dear ${esc(first || "colleague")},</p><p>Archē Executive is a private jet charter broker based in Singapore. We arrange the right aircraft for clients across Asia and worldwide, from any operator, on any route.</p>
<p>We are inviting a small group of people to build their own charter business with us, keeping up to 35% of the profit on every trip they sell.</p>
<p>Your access to our broker portal is ready.</p>
<p>Open your personal link, choose your password, and you will see your joining steps:</p>
<ol><li>our offer to you</li><li>the Archē Broker Academy, at your own pace</li><li>your request for assessment</li><li>your agreement, which you read and sign in the portal</li></ol>
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#34373d;color:#f3f5f8;padding:12px 22px;text-decoration:none;letter-spacing:.08em;font-size:13px">OPEN YOUR PORTAL</a></p>
<p style="font-size:13px;color:#5b6067">The link works once and for 24 hours. If it has expired, reply to this email and we will send a new one.</p>
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
        out[x.email] = inviteState(u, prof, join, agr);
      }
      return res.status(200).json({ states: out });
    }

    const b = req.body || {}, email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 80);
    if (!EMAIL_RX.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!name || name.split(/\s+/).length < 2) return res.status(400).json({ error: "Enter the person's first and last name." });

    const existing = await findUser(email);
    if (existing && existing.last_sign_in_at) return res.status(200).json({ ok: false, exists: true, error: "This person already has a login and has signed in. Use Start joining again if they should begin from the offer." });
    const type = existing ? "magiclink" : "invite";
    const gl = await sb("/auth/v1/admin/generate_link", { method: "POST", body: JSON.stringify({ type, email, redirect_to: PORTAL + "/", data: { invited: true, name, invited_by: me.id } }) });
    const link = gl.body && (gl.body.action_link || (gl.body.properties || {}).action_link);
    if (!gl.ok || !link) return res.status(502).json({ error: "Could not create the login (" + gl.status + ")." });

    const ownerName = p.contract_name || "";
    let sent = "not sent: RESEND_API_KEY missing in Vercel";
    if (process.env.RESEND_API_KEY) {
      const m = inviteMail({ name, link, from: ownerName });
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify(inviteRequest({ from: FROM, to: email, owner: me.email, mail: m })) });
      if (r.ok) sent = "sent"; else { let msg = ""; try { msg = (await r.json()).message || ""; } catch (e) {} sent = `not sent: refused by Resend (${r.status}${msg ? ": " + msg.slice(0, 120) : ""})`; }
    }
    const at = new Date().toISOString(), masked = email.replace(/^(.).*?(@.*)$/, "$1***$2");
    await sb("/rest/v1/audit_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ by: me.id, action: "Invitation to join", detail: `${name} · ${masked} · email ${sent === "sent" ? "sent" : "not sent"}` }) });
    // the list of invitations on Team (owner only)
    const cur = await sb("/rest/v1/intel?select=value&key=eq.invites"), list = (((cur.body || [])[0] || {}).value || {}).list || [];
    const next = [{ email, name, at, by: me.id, sent: sent === "sent" }, ...list.filter(x => x.email !== email)].slice(0, 100);
    await sb("/rest/v1/intel?on_conflict=key", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "invites", value: { list: next }, updated_at: at }) });
    return res.status(200).json({ ok: true, sent, link, again: !!existing });
  } catch (e) { return res.status(500).json({ error: "invite", detail: String(e.message || e).slice(0, 200) }); }
}
