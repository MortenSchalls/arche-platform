// Archē portal AI endpoint (Vercel serverless function).
// The browser sends the signed-in user's Supabase token; this function checks that the person is an
// approved, active member, then calls the Anthropic API with the key held only on the server.
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY

const MODELS = { quick: "claude-haiku-4-5-20251001", default: "claude-sonnet-5-5", complex: "claude-opus-5-5" };
const MAX_CHARS = 60000;
// Monthly spend cap (Morten, 31 Oct 2026: every paid call must justify its cost, spend capped and shown).
// Spend this month is kept in config "aispend" {month, usd, calls}; the cap in config "aicap" {usd} (owner, Settings), default USD 25.
// Cost is estimated from the tokens Anthropic reports, at list prices per million tokens (input, output); check them against
// anthropic.com/pricing when prices change.
const PRICE = { quick: [1, 5], default: [3, 15], complex: [5, 25] };
const DEFAULT_CAP = 25;
const SECRET = process.env.SUPABASE_SECRET_KEY;
async function cfg(SB, key) { if (!SECRET) return null; const r = await fetch(`${SB}/rest/v1/config?key=eq.${key}&select=value`, { headers: { apikey: SECRET, authorization: `Bearer ${SECRET}` } }); return r.ok ? ((await r.json())[0] || {}).value || null : null; }
async function cfgSet(SB, key, value) { if (!SECRET) return; await fetch(`${SB}/rest/v1/config`, { method: "POST", headers: { apikey: SECRET, authorization: `Bearer ${SECRET}`, "content-type": "application/json", prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }) }); }
const month = () => new Date().toISOString().slice(0, 7);
const hits = new Map(); // simple per-user limit: 30 calls a minute per server instance

export default async function handler(req, res) {
  // status check for the owner's to-do list: says only whether a key is set, never the key
  if (req.method === "GET") {
    const SBg = process.env.SUPABASE_URL; let spend = null, cap = DEFAULT_CAP;
    try { const sp = await cfg(SBg, "aispend"), c = await cfg(SBg, "aicap"); if (sp && sp.month === month()) spend = sp; if (c && +c.usd >= 0) cap = +c.usd; } catch (e) {}
    return res.status(200).json({ configured: !!process.env.ANTHROPIC_API_KEY, month: month(), spentUsd: spend ? Math.round(spend.usd * 100) / 100 : 0, calls: spend ? spend.calls : 0, capUsd: cap });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Sign in first" });

  const SB = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SB || !KEY) return res.status(503).json({ error: "setup", detail: "SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is missing in Vercel" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "setup", detail: "ANTHROPIC_API_KEY is missing in Vercel" });
  const who = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: KEY, authorization: `Bearer ${token}` } });
  if (!who.ok) return res.status(401).json({ error: "Sign in again" });
  const u = await who.json();
  const prof = await fetch(`${SB}/rest/v1/profiles?id=eq.${encodeURIComponent(u.id)}&select=active,role`, { headers: { apikey: KEY, authorization: `Bearer ${token}` } });
  const p = prof.ok ? (await prof.json())[0] : null;
  if (!p || !p.active) return res.status(403).json({ error: "Not approved yet" });

  const now = Date.now(), list = (hits.get(u.id) || []).filter(t => now - t < 60000);
  if (list.length >= 30) return res.status(429).json({ error: "Too many requests" });
  list.push(now); hits.set(u.id, list);

  const sp0 = await cfg(SB, "aispend").catch(() => null), cap0 = await cfg(SB, "aicap").catch(() => null);
  const spent = sp0 && sp0.month === month() ? +sp0.usd || 0 : 0, cap = cap0 && +cap0.usd >= 0 ? +cap0.usd : DEFAULT_CAP;
  if (spent >= cap) return res.status(402).json({ error: "cap", detail: `This month's AI budget of USD ${cap} is used up. The owner can raise it in Settings.` });

  const { input, tier = "default", json = false } = req.body || {};
  let messages = typeof input === "string" ? [{ role: "user", content: input }] : Array.isArray(input) ? input : null;
  if (!messages || !messages.length || messages[messages.length - 1].role !== "user") return res.status(400).json({ error: "Bad input" });
  messages = messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") }));
  if (JSON.stringify(messages).length > MAX_CHARS) return res.status(413).json({ error: "Too long" });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODELS[tier] || MODELS.default,
      max_tokens: 2000,
      system: "You work inside the Archē Executive broker portal. Answer in plain, short English." + (json ? " Reply with JSON only, no other text." : ""),
      messages
    })
  });
  if (r.status === 429) return res.status(429).json({ error: "AI busy" });
  if (!r.ok) {
    let msg = ""; try { msg = ((await r.json()).error || {}).message || ""; } catch (e) {}
    const credit = /credit balance|billing/i.test(msg), badKey = r.status === 401;
    return res.status(502).json({ error: credit ? "credit" : badKey ? "key" : "AI error", detail: credit ? "The Anthropic account has no credit left" : badKey ? "The Anthropic API key in Vercel is not valid" : ("Anthropic API " + r.status) });
  }
  const out = await r.json();
  const pr = PRICE[MODELS[tier] ? tier : "default"], u2 = out.usage || {};
  const cost = ((u2.input_tokens || 0) * pr[0] + (u2.output_tokens || 0) * pr[1]) / 1e6;
  await cfgSet(SB, "aispend", { month: month(), usd: spent + cost, calls: (sp0 && sp0.month === month() ? sp0.calls || 0 : 0) + 1 }).catch(() => {});
  const text = (out.content || []).filter(c => c.type === "text").map(c => c.text).join("");
  return res.status(200).json({ text, truncated: out.stop_reason === "max_tokens" });
}
