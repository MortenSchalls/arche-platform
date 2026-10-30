// Website statistics → Supabase (owner view: portal → Website). First-party, no cookies.
// The IP address is never stored or passed on; only the country and city that Vercel derives from it.
// Environment variables (Vercel → website project): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
const KINDS = new Set(["view", "section", "call", "whatsapp", "email", "portal", "language", "finder", "quote_start", "callback_start", "quote_sent", "callback_sent", "leave"]);
const HOSTS = /^(?:www\.)?archeaviation\.com$|^arche-platform-[a-z0-9-]+\.vercel\.app$|^localhost(?::\d+)?$/;
const clean = (v, n) => String(v ?? "").replace(/[^\p{L}\p{N} ._\-\/@:+]/gu, "").trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  // only our own pages may send (stops other sites and scripts filling the table)
  let origin = "";
  try { origin = new URL(req.headers.origin || req.headers.referer || "").host; } catch (e) {}
  if (!HOSTS.test(origin)) return res.status(403).end();
  const ua = String(req.headers["user-agent"] || "");
  if (!ua || /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|python|wget/i.test(ua)) return res.status(204).end();

  let b = req.body;
  if (typeof b === "string") { if (b.length > 2000) return res.status(413).end(); try { b = JSON.parse(b); } catch (e) { return res.status(400).end(); } }
  if (!b || typeof b !== "object" || !KINDS.has(b.kind)) return res.status(400).end();
  const utm = {};
  if (b.utm && typeof b.utm === "object") for (const k of ["source", "medium", "campaign", "term", "content"]) if (b.utm[k]) utm[k] = clean(b.utm[k], 60);
  const city = (() => { try { return decodeURIComponent(req.headers["x-vercel-ip-city"] || ""); } catch (e) { return ""; } })();
  const p = {
    visit: clean(b.visit, 20), kind: b.kind, detail: clean(b.detail, 60), path: clean(b.path, 60), lang: clean(b.lang, 5),
    ref: clean(b.ref, 80), utm, code: clean(b.code, 12).replace(/[^A-Za-z0-9]/g, ""),
    device: ["phone", "tablet", "desktop"].includes(b.device) ? b.device : "",
    secs: Math.max(0, Math.min(86400, parseInt(b.secs) || 0)),
    country: clean(req.headers["x-vercel-ip-country"], 2), city: clean(city, 60)
  };
  if (!p.visit) return res.status(400).end();
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/submit_visit`, {
      method: "POST",
      headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ p })
    });
    return res.status(r.ok ? 204 : 502).end();
  } catch (e) { return res.status(502).end(); }
}
