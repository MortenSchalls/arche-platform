// My profile (Morten, 29 Oct 2026: "staff need a page where they can insert and amend their own user profile and also
// change password"). POST { self: {…} } with the person's own sign-in token. Only the fields below can be changed by the
// person; name on the agreement, role, rights, country and Archē email stay with the owner. Stored in profiles.data.self.
const FIELDS = { preferredName: 60, mobile: 30, whatsapp: 30, timezone: 40, languages: 120, availability: 160 };
export function cleanSelf(input) {
  const out = {}, x = input || {};
  for (const [k, n] of Object.entries(FIELDS)) if (k in x) out[k] = String(x[k] ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);
  for (const k of ["mobile", "whatsapp"]) if (out[k] && !/^\+?[0-9 ()-]{6,30}$/.test(out[k])) throw new Error("Phone numbers: digits, spaces and + only, with the country code.");
  return out;
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
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY;
    const who = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
    if (!who.ok) return res.status(401).json({ error: "Sign in again." });
    const me = await who.json(), self = cleanSelf((req.body || {}).self);
    const cur = await sb(`/rest/v1/profiles?select=data&id=eq.${me.id}`), row = (cur.body || [])[0];
    if (!row) return res.status(404).json({ error: "No profile yet. Ask Archē operations." });
    const data = { ...(row.data || {}), self: { ...((row.data || {}).self || {}), ...self, updatedAt: new Date().toISOString() } };
    const up = await sb(`/rest/v1/profiles?id=eq.${me.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ data }) });
    if (!up.ok) return res.status(500).json({ error: "Could not save. Try again." });
    return res.status(200).json({ ok: true, self: data.self });
  } catch (e) { return res.status(400).json({ error: String(e.message || e).slice(0, 160) }); }
}
