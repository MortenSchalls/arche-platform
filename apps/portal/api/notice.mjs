// Cancellation with one click (Morten, 29 Oct 2026: automate cancellations "if actions are not taken before due
// date/time"; the final step stays one click by a person, CLAUDE.md: anything that cannot be undone needs a person).
// POST { bid, did, reason: "missing" | "client", noticeDate, opCharge, avinode: true } with the sign-in token of an owner
// or operations member (never on their own trip, the owner excepted). The server builds the notice from the database
// (the same words the trip file shows), sends it to the client with a copy to the bookings address, and records the
// cancellation, the client's charge (A9, the higher of our scale and the operator's charge plus our fee) and the
// operator's charge. Environment as for /api/alerts.
import { tripMoney, BP } from "../server/money.mjs";
import { sendClient } from "./alerts.mjs";
const isId = s => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);
async function sb(path, opt = {}) {
  const KEY = process.env.SUPABASE_SECRET_KEY;
  const r = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...opt, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(opt.headers || {}) } });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
}
// what the cancellation records and says, from the rows (exported for the tests)
export function cancellation(x, s, { reason, noticeDate, opCharge, margin = 0.09, company = {}, nowMs = Date.now() }) {
  const m = tripMoney(x, s, margin, nowMs); if (!m) throw new Error("Only issued bookings with operator terms can be cancelled here.");
  const row = m.cancelRow || { amount: m.P, label: "Under 24 hours, or no-show" }, miss = m.firstMissing;
  if (reason === "missing" && !miss) throw new Error("No client payment is overdue. For a client's written cancellation choose that reason.");
  const day = reason === "client" ? String(noticeDate || "").slice(0, 10) : new Date(nowMs).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Enter the date the client's written notice arrived.");
  const mail = BP.cancelText({ name: (x.client || {}).name, ref: s.ref || "", reason, missing: miss ? miss.cum - m.received : 0, missingDue: miss ? miss.due : "", charge: row.amount, period: row.label.toLowerCase(), received: m.received, phone: company.phone, email: company.email, noticeDate: day });
  return { mail, record: { reason, noticeDate: day, clientCharge: row.amount, period: row.label, received: m.received, opCancelCharge: Math.max(0, Math.round(Number(opCharge) || 0)), refund: Math.max(0, m.received - row.amount), stillDue: Math.max(0, row.amount - m.received) } };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).json({ error: "not set up" });
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY;
    const who = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
    if (!who.ok) return res.status(401).json({ error: "Sign in again." });
    const me = await who.json(), pr = await sb(`/rest/v1/profiles?select=role,active&id=eq.${me.id}`), prof = (pr.body || [])[0];
    if (!prof || prof.active === false || !["owner", "ops"].includes(prof.role)) return res.status(403).json({ error: "Operations or the owner only." });
    const b = req.body || {};
    if (!isId(b.bid) || !/^[\w-]{1,80}$/.test(String(b.did || ""))) return res.status(400).json({ error: "Unknown trip." });
    if (prof.role === "ops" && b.bid === me.id) return res.status(403).json({ error: "Another operations member or the owner must do this on your own trip." });
    if (b.avinode !== true) return res.status(400).json({ error: "Cancel on Avinode first, then tick it here." });
    const [t, s, cfg] = await Promise.all([sb(`/rest/v1/trips?select=data&owner_id=eq.${b.bid}&id=eq.${encodeURIComponent(b.did)}`), sb(`/rest/v1/trip_status?select=data&owner_id=eq.${b.bid}&id=eq.${encodeURIComponent(b.did)}`), sb("/rest/v1/config?select=key,value&key=in.(terms,company)")]);
    const x = ((t.body || [])[0] || {}).data, st = ((s.body || [])[0] || {}).data; if (!x || !st) return res.status(404).json({ error: "Trip not found." });
    const val = k => ((cfg.body || []).find(r => r.key === k) || {}).value || {}, company = val("company");
    const c = cancellation(x, st, { reason: b.reason === "client" ? "client" : "missing", noticeDate: b.noticeDate, opCharge: b.opCharge, margin: Number(val("terms").margin) || 0.09, company });
    const to = ((x.client || {}).email || "").trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return res.status(400).json({ error: "The trip has no client email. Add it, then try again." });
    const sent = await sendClient(to, c.mail, company.email);
    if (sent !== "ok") return res.status(502).json({ error: sent === "no-key" ? "Email is not connected (RESEND_API_KEY). Nothing was recorded." : `The email was refused: ${sent}. Nothing was recorded.` });
    const at = new Date().toISOString(), next = { ...st, state: "cancelled", opCancelCharge: c.record.opCancelCharge, cancelled: { ...c.record, at, by: me.id, noticeSentAt: at, avinode: true },
      updatedAt: at, history: [...(st.history || []), { t: at, by: "ops", a: `Cancelled (${c.record.reason === "client" ? "client's written notice" : "client payment missing, A3"}): client charge ${BP.money$(c.record.clientCharge)}, operator charge ${BP.money$(c.record.opCancelCharge)}; notice sent to the client` }] };
    const w = await sb(`/rest/v1/trip_status?owner_id=eq.${b.bid}&id=eq.${encodeURIComponent(b.did)}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ data: next }) });
    await sb("/rest/v1/audit_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ by: me.id, action: "Booking cancelled", detail: `${st.ref || b.did} · ${c.record.reason} · client ${BP.money$(c.record.clientCharge)} · operator ${BP.money$(c.record.opCancelCharge)} · notice sent` }) });
    return w.ok ? res.status(200).json({ ok: true, record: c.record }) : res.status(500).json({ error: "The notice was sent, but the cancellation could not be saved. Record it by hand at once." });
  } catch (e) { return res.status(400).json({ error: String(e.message || e).slice(0, 200) }); }
}
