// Archē portal AI endpoint (Vercel serverless function).
// The browser sends the signed-in user's Supabase token; this function checks that the person is an
// approved, active member, then calls the Anthropic API with the key held only on the server.
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY

const MODELS = { quick: "claude-haiku-4-5-20251001", default: "claude-sonnet-5-5", complex: "claude-opus-5-5" };
const MAX_CHARS = 60000;
const hits = new Map(); // simple per-user limit: 30 calls a minute per server instance

export default async function handler(req, res) {
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
  const text = (out.content || []).filter(c => c.type === "text").map(c => c.text).join("");
  return res.status(200).json({ text, truncated: out.stop_reason === "max_tokens" });
}
