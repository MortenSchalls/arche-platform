// Website quote and call-back requests → Supabase (shown in the portal under Today).
// Environment variables (Vercel → website project → Settings → Environment Variables):
//   SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
const clean = (v, n = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  let origin = "";
  try { origin = new URL(req.headers.origin || req.headers.referer || "").host; } catch (e) {}
  if (!/^(?:www\.)?archeaviation\.com$|\.vercel\.app$|^localhost(?::\d+)?$/.test(origin)) return res.status(403).json({ error: "Not allowed" });
  const b = req.body || {};
  if (JSON.stringify(b).length > 8000) return res.status(413).json({ error: "Too large" });
  if (b.website) return res.status(200).json({ ok: true });            // honeypot field for bots
  let data;
  if (b.type === "quote") {
    const legs = (Array.isArray(b.legs) ? b.legs : []).slice(0, 8).map(l => ({ from: clean(l.from, 80), to: clean(l.to, 80), date: clean(l.date, 10), time: clean(l.time, 5) }));
    if (!legs.length || !legs.every(l => l.from && l.to) || !clean(b.name) || !clean(b.reach)) return res.status(400).json({ error: "Missing details" });
    data = { type: "quote", trip: clean(b.trip, 10), legs, returnDate: clean(b.returnDate, 10), pax: Math.max(1, Math.min(19, parseInt(b.pax) || 1)),
             name: clean(b.name, 120), reach: clean(b.reach, 160), reply: clean(b.reply, 20), lang: clean(b.lang, 5), page: clean(b.page, 80) };
  } else if (b.type === "callback") {
    if (!clean(b.phone)) return res.status(400).json({ error: "Missing phone" });
    data = { type: "callback", phone: clean(b.phone, 40), lang: clean(b.lang, 5), page: clean(b.page, 80) };
  } else return res.status(400).json({ error: "Unknown request" });
  data.consent = b.consent === true;
  data.visit = clean(b.visit, 20);                                       // links the enquiry to its website visit (source, campaign)
  data.code = clean(b.code, 12).replace(/[^A-Za-z0-9]/g, "");             // organisation link code, if the visitor came from one

  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/submit_enquiry`, {
    method: "POST",
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ p: data })
  });
  if (!r.ok) return res.status(502).json({ error: "Could not save" });
  return res.status(200).json({ ok: true });
}
