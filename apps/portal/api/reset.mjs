// Forgot password (Morten, 29 Oct 2026: "when staff forget their password, they should be able to request a new one on
// the sign-in page"). POST { email }. If the address has a portal login, it gets a one-time link (Supabase recovery link)
// by email from the company domain; the link opens the portal on "Choose a new password". The answer is always the same,
// so the page never reveals who has a login. At most one email per address every 5 minutes and 5 a day.
// Environment as for /api/invite: SUPABASE_URL, SUPABASE_SECRET_KEY, RESEND_API_KEY; optional INVITE_FROM, PORTAL_URL.
import crypto from "node:crypto";
const PORTAL = process.env.PORTAL_URL || "https://portal.archeaviation.com";
const FROM = process.env.INVITE_FROM || "Archē Executive <welcome@archeaviation.com>";
const EMAIL_RX = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const SAME = { ok: true, note: "If this email has an Archē login, a link to choose a new password is on its way." };

export function resetMail(link) {
  const text = ["Hello,", "", "Someone asked to choose a new password for this email address on the Archē Executive portal.", "",
    "Open this link to choose a new password:", link, "", "The link works once and only for a short time. If it no longer works, ask again on the sign-in page. If you did not ask for this, ignore this email: your password stays the same.", "",
    `Your portal: ${PORTAL}`, "", "Archē Executive"].join("\n");
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:#24262a;max-width:560px"><p>Hello,</p><p>Someone asked to choose a new password for this email address on the Archē Executive portal.</p>
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#34373d;color:#f3f5f8;padding:12px 22px;text-decoration:none;letter-spacing:.08em;font-size:13px">CHOOSE A NEW PASSWORD</a></p>
<p style="font-size:13px;color:#5b6067">The link works once and only for a short time. If it no longer works, ask again on the sign-in page. If you did not ask for this, ignore this email: your password stays the same.</p><p>Your portal: <a href="${PORTAL}">${PORTAL.replace(/^https:\/\//, "")}</a></p><p>Archē Executive</p></div>`;
  return { subject: "Choose a new password for the Archē portal", text, html };
}
export function allowed(log, key, now) {   // log: { key: [times] }
  const t = (log[key] || []).filter(x => now - x < 24 * 3600e3);
  if (t.length >= 5 || (t.length && now - Math.max(...t) < 5 * 60e3)) return { ok: false, log };
  return { ok: true, log: { ...log, [key]: [...t, now] } };
}
async function sb(path, opt = {}) {
  const KEY = process.env.SUPABASE_SECRET_KEY;
  const r = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...opt, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(opt.headers || {}) } });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).json({ error: "not set up" });
  try {
    const email = String((req.body || {}).email || "").trim().toLowerCase().slice(0, 120);
    if (!EMAIL_RX.test(email)) return res.status(400).json({ error: "Enter your email address." });
    const key = crypto.createHash("sha256").update("reset:" + email).digest("hex").slice(0, 24), now = Date.now();
    const cur = await sb("/rest/v1/intel?select=value&key=eq.resets"), log = (((cur.body || [])[0] || {}).value || {}).log || {};
    const a = allowed(log, key, now); if (!a.ok) return res.status(200).json(SAME);
    const keep = Object.fromEntries(Object.entries(a.log).filter(([, t]) => t.some(x => now - x < 24 * 3600e3)));
    await sb("/rest/v1/intel?on_conflict=key", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "resets", value: { log: keep }, updated_at: new Date(now).toISOString() }) });
    const gl = await sb("/auth/v1/admin/generate_link", { method: "POST", body: JSON.stringify({ type: "recovery", email, redirect_to: PORTAL + "/" }) });
    const link = gl.body && (gl.body.action_link || (gl.body.properties || {}).action_link);
    if (!gl.ok || !link || !process.env.RESEND_API_KEY) return res.status(200).json(SAME);   // no login with this email, or email not set up
    const m = resetMail(link);
    await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ from: FROM, to: [email], subject: m.subject, text: m.text, html: m.html }) });
    await sb("/rest/v1/audit_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ by: null, action: "Password reset link sent", detail: email.replace(/^(.).*?(@.*)$/, "$1***$2") }) });
    return res.status(200).json(SAME);
  } catch (e) { return res.status(200).json(SAME); }
}
