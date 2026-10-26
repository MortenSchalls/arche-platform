// Archē portal alerts (Vercel serverless function), Morten 26 Oct 2026.
// Supabase calls this every 2 minutes (pg_cron, SQL 0014). It finds everything waiting for someone, sends a phone push
// and an email to the people in Team > Alerts, and repeats until someone acts: push every "repeat" minutes, email at
// most hourly, and after "escalate" minutes the next person in the list is added. Messages carry only the type and the
// trip reference, never client names. Nothing secret is needed to call it: a run only sends what is due.
//   GET  ?vapid=1  the public key phones use to subscribe
//   GET  ?status=1 which parts are set up (no secrets)
//   POST {}        run the check (from pg_cron)
//   POST {test:true} with an owner's sign-in token: send a test alert to that owner
// Environment (Vercel > portal project > Settings > Environment Variables), entered by the owner, never in code:
//   SUPABASE_URL, SUPABASE_SECRET_KEY (server key), SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY,
//   optional ALERT_FROM (default "Archē Alerts <onboarding@resend.dev>"), PORTAL_URL (default https://portal.archeaviation.com)
import crypto from "node:crypto";

const PORTAL = process.env.PORTAL_URL || "https://portal.archeaviation.com";
const b64u = b => Buffer.from(b).toString("base64url");
const ub64 = s => Buffer.from(String(s), "base64url");
const MIN = 60e3;

/* ---------- Supabase with the server key ---------- */
function db() {
  const SB = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SECRET_KEY;
  if (!SB || !KEY) return null;
  const h = { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" };
  const q = async (path, opt = {}) => { const r = await fetch(`${SB}/rest/v1/${path}`, { ...opt, headers: { ...h, ...(opt.headers || {}) } }); if (!r.ok) throw new Error(`${path.split("?")[0]} ${r.status}`); return r.status === 204 ? null : r.json().catch(() => null); };
  return {
    all: (t, sel = "*", f = "") => q(`${t}?select=${sel}${f}`),
    get: async (t, id) => (await q(`${t}?select=data&id=eq.${encodeURIComponent(id)}`))?.[0]?.data || null,
    put: (t, id, data) => q(`${t}?on_conflict=id`, { method: "POST", headers: { prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ id, data }) }),
    del: (t, f) => q(`${t}?${f}`, { method: "DELETE" }),
    SB
  };
}

/* ---------- Web Push (RFC 8291 aes128gcm, RFC 8292 VAPID), no extra packages ---------- */
export function newVapid() { const e = crypto.createECDH("prime256v1"); e.generateKeys(); return { publicKey: b64u(e.getPublicKey()), privateKey: b64u(e.getPrivateKey()) }; }
function vapidAuth(endpoint, v) {
  const aud = new URL(endpoint).origin, pub = ub64(v.publicKey);
  const head = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" })), body = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: PORTAL }));
  const key = crypto.createPrivateKey({ key: { kty: "EC", crv: "P-256", d: v.privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: "jwk" });
  const sig = crypto.sign("sha256", Buffer.from(head + "." + body), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${v.publicKey}`;
}
const hkdf = (salt, ikm, info, n) => Buffer.from(crypto.hkdfSync("sha256", ikm, salt, info, n));
export function encryptPush(keys, text) {
  const ua = ub64(keys.p256dh), auth = ub64(keys.auth), e = crypto.createECDH("prime256v1"); e.generateKeys();
  const as = e.getPublicKey(), shared = e.computeSecret(ua), salt = crypto.randomBytes(16);
  const ikm = hkdf(auth, shared, Buffer.concat([Buffer.from("WebPush: info\0"), ua, as]), 32);
  const cek = hkdf(salt, ikm, Buffer.from("Content-Encoding: aes128gcm\0"), 16), nonce = hkdf(salt, ikm, Buffer.from("Content-Encoding: nonce\0"), 12);
  const c = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(text), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([as.length]), as, ct]);
}
async function sendPush(sub, v, msg) {
  const r = await fetch(sub.endpoint, { method: "POST", headers: { TTL: "86400", Urgency: "high", "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", Authorization: vapidAuth(sub.endpoint, v) }, body: encryptPush(sub.keys, JSON.stringify(msg)) });
  return r.status;
}
async function sendEmail(to, subject, text) {
  if (!process.env.RESEND_API_KEY) return "no-key";   // shown to the owner as "RESEND_API_KEY missing in Vercel"
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.ALERT_FROM || "Archē Alerts <onboarding@resend.dev>", to: [to], subject, text }) });
  if (r.ok) return "ok";
  let m = ""; try { m = (await r.json()).message || ""; } catch (e) {}
  return `refused by Resend (${r.status}${m ? ": " + m.slice(0, 160) : ""})`;
}

/* ---------- what is waiting (types match Team > Alerts) ---------- */
const TITLES = { approve: "Booking waiting for your approval", steps: "Supervised step waiting for an OK", pool: "New enquiry waiting",
  recovery: "Service recovery or overdue follow-up", late: "Backup or rotation late", escalate: "Escalation" };
export function openItems(d, now = Date.now()) {
  const out = [], st = {}; (d.status || []).forEach(r => st[r.owner_id + "/" + r.id] = r.data || {});
  const approvalOn = ((d.terms || {}).ownerApproval) !== false;
  for (const t of d.trips || []) {
    const x = t.data || {}, s = st[t.owner_id + "/" + t.id] || {}, ref = s.ref || t.id, a = s.approval || {};
    if (approvalOn && x.stage === "submitted" && s.state !== "returned" && !["issued", "clientPaid", "flown", "cancelled"].includes(s.state) && !(a.state === "approved" && Number(a.price) === Number(s.price)))
      out.push({ key: `approve:${t.owner_id}:${t.id}`, type: "approve", ref, since: x.submittedAt || x.updated });
    if (s.state === "flown") {
      const r = x.rating || {}, base = s.flownDate ? Date.parse(s.flownDate + "T12:00:00Z") : 0;
      if (Number(r.overall) > 0 && Number(r.overall) <= 3 && !x.recovery) out.push({ key: `recovery:${t.owner_id}:${t.id}`, type: "recovery", ref, since: r.at || s.updatedAt, what: `client rated ${r.overall}/5` });
      if (!x.followUp && base && now > base + 24 * 3600e3) out.push({ key: `followup:${t.owner_id}:${t.id}`, type: "recovery", ref, since: new Date(base + 24 * 3600e3).toISOString(), what: "24-hour follow-up overdue" });
    }
  }
  for (const r of d.steps || []) if ((r.data || {}).status === "pending") out.push({ key: `steps:${r.owner_id}:${r.id}`, type: "steps", ref: r.data.ref || "", since: r.data.at, what: r.data.key });
  for (const e of d.web || []) { const x = e.data || {}; if (!x.handled) out.push({ key: `pool:web:${e.id}`, type: "pool", ref: "website " + (x.type === "callback" ? "call-back request" : "enquiry"), since: e.at || x.at }); }
  const iv = {}; (d.intel || []).forEach(r => iv[r.key] = r.value || {});
  const late = (k, h, name) => { const at = (iv[k] || {}).lastRun; if (!at || now - Date.parse(at) > h * 3600e3) out.push({ key: `late:${k}`, type: "late", ref: name, since: at || null }); };
  late("backup", 26, "nightly backup"); late("assign", 7, "prospect rotation");
  return out;
}

/* ---------- one run ---------- */
export async function runAlerts(D, now = Date.now(), send = { push: sendPush, email: sendEmail }) {
  const cfg = (await D.get("alert_settings", "settings")) || {}, R = (cfg.recipients || []).filter(r => r.active !== false);
  const repeat = Math.max(5, Number(cfg.repeatMin) || 15) * MIN, escalate = Math.max(10, Number(cfg.escalateMin) || 30) * MIN, emailEvery = Math.max(60 * MIN, repeat);
  let v = await D.get("alert_settings", "vapid"); if (!v) { v = newVapid(); await D.put("alert_settings", "vapid", v); }
  const [trips, status, steps, web, intel, cfgRows, logs, subs] = await Promise.all([
    D.all("trips", "owner_id,id,data"), D.all("trip_status", "owner_id,id,data"), D.all("step_requests", "owner_id,id,data").catch(() => []),
    D.all("website_enquiries", "id,at,data").catch(() => []), D.all("intel", "key,value"), D.all("config", "key,value", "&key=eq.terms"),
    D.all("alert_settings", "id,data", "&id=like.log:*"), D.all("push_subs", "owner_id,id,data").catch(() => [])]);
  const items = openItems({ trips, status, steps, web, intel, terms: (cfgRows[0] || {}).value }, now);
  const log = {}; logs.forEach(l => log[l.id.slice(4)] = l.data);
  let pushes = 0, emails = 0; const errors = [];
  for (const it of items) {
    const L = log[it.key] || { first: now, count: 0 }; const age = now - L.first;
    const dueP = !L.lastPush || now - L.lastPush >= repeat, dueE = !L.lastEmail || now - L.lastEmail >= emailEvery;
    if (!dueP && !dueE) continue;
    const level = Math.floor(age / escalate);   // 0 = first person, 1 = add the second, …
    const who = R.filter(r => (r.events || {})[it.type] || (level > 0 && (r.events || {}).escalate)).slice(0, level + 1);
    const mins = Math.round((now - Date.parse(it.since || new Date(L.first).toISOString())) / MIN) || Math.round(age / MIN);
    const title = `Archē: ${TITLES[it.type]}${L.count ? ` (reminder ${L.count})` : ""}`, body = `${it.ref}${it.what ? " · " + it.what : ""}${mins > 0 ? ` · waiting ${mins} min` : ""}. Open the portal to act.`;
    for (const r of who) {
      if (dueP && r.uid) for (const s of subs.filter(s => s.owner_id === r.uid)) {
        try { const code = await send.push(s.data, v, { title, body, tag: it.key, url: PORTAL + "/" }); if (code === 404 || code === 410) await D.del("push_subs", `owner_id=eq.${s.owner_id}&id=eq.${encodeURIComponent(s.id)}`); else if (code < 300) pushes++; else errors.push("push " + code); } catch (e) { errors.push("push " + e.message); }
      }
      if (dueE && r.email) { const res = await send.email(r.email, title, `${body}\n\n${PORTAL}\n\nYou get this because you are on the alert list in Team > Alerts.`); if (res === "ok") emails++; else if (res !== "no-key") errors.push("email " + res); }
    }
    const next = { ...L, count: L.count + 1, level, type: it.type, ref: it.ref, ...(dueP ? { lastPush: now } : {}), ...(dueE ? { lastEmail: now } : {}) };
    await D.put("alert_settings", "log:" + it.key, next);
  }
  const open = new Set(items.map(i => "log:" + i.key));
  for (const l of logs) if (!open.has(l.id)) await D.del("alert_settings", `id=eq.${encodeURIComponent(l.id)}`);   // acted on: stop alerting
  const statusRow = { lastRun: new Date(now).toISOString(), open: items.length, pushes, emails, errors: errors.slice(0, 5), email: !!process.env.RESEND_API_KEY, push: true };
  await D.put("alert_settings", "status", statusRow);
  return statusRow;
}

/* ---------- HTTP ---------- */
export default async function handler(req, res) {
  const D = db();
  if (req.method === "GET") {
    if (!D) return res.status(200).json({ ready: false, why: "SUPABASE_URL or SUPABASE_SECRET_KEY missing in Vercel" });
    try {
      if ("vapid" in (req.query || {})) { let v = await D.get("alert_settings", "vapid"); if (!v) { v = newVapid(); await D.put("alert_settings", "vapid", v); } return res.status(200).json({ publicKey: v.publicKey }); }
      return res.status(200).json({ ready: true, email: !!process.env.RESEND_API_KEY });
    } catch (e) { return res.status(200).json({ ready: false, why: "Run SQL 0013 and 0014 first" }); }
  }
  if (req.method !== "POST") return res.status(405).json({ error: "GET or POST" });
  if (!D) return res.status(503).json({ error: "setup", detail: "SUPABASE_URL or SUPABASE_SECRET_KEY missing in Vercel" });
  try {
    const body = req.body || {};
    if (body.test) {
      const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY;
      const who = await fetch(`${D.SB}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } }); if (!who.ok) return res.status(401).json({ error: "Sign in again" });
      const u = await who.json(), prof = (await D.all("profiles", "id,role,active", `&id=eq.${u.id}`))[0];
      if (!prof || prof.role !== "owner" || !prof.active) return res.status(403).json({ error: "Owners only" });
      const cfg = (await D.get("alert_settings", "settings")) || {}, R = cfg.recipients || [];
      const linked = R.find(r => r.uid === u.id), me = (linked && linked.email ? linked : R.find(r => r.email && (r.uid === u.id || (u.email && r.email.toLowerCase() === u.email.toLowerCase())))) || linked || {};
      let v = await D.get("alert_settings", "vapid"); if (!v) { v = newVapid(); await D.put("alert_settings", "vapid", v); }
      const subs = (await D.all("push_subs", "owner_id,id,data", `&owner_id=eq.${u.id}`)) || []; let pushed = 0, mailed = "none";
      for (const s of subs) { const c = await sendPush(s.data, v, { title: "Archē: test alert", body: "Alerts reach this device.", tag: "test", url: PORTAL + "/" }); if (c < 300) pushed++; }
      if (me.email) { mailed = await sendEmail(me.email, "Archē: test alert", `Alerts reach this email.\n\n${PORTAL}`); if (mailed === "no-key") mailed = "not sent: RESEND_API_KEY missing in Vercel (redeploy after adding it)"; }
      const why = !R.length ? "not sent: the server sees no one in Team > Alerts yet (was the entry saved?)" : !linked ? `not sent: the server sees ${R.length} entr${R.length === 1 ? "y" : "ies"} in Team > Alerts, none linked to you (Change > Who: yourself)` : "not sent: your linked entry has no email";
      return res.status(200).json({ devices: subs.length, pushed, email: me.email ? mailed : why, to: me.email || "", from: process.env.ALERT_FROM || "Archē Alerts <onboarding@resend.dev>" });
    }
    const last = await D.get("alert_settings", "status");
    if (last && Date.now() - Date.parse(last.lastRun) < 60e3) return res.status(200).json({ skipped: "ran less than a minute ago" });
    return res.status(200).json(await runAlerts(D));
  } catch (e) { return res.status(500).json({ error: "alerts", detail: String(e.message || e).slice(0, 200) }); }
}
