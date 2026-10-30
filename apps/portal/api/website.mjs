// Private look at the locked website from the portal (Morten, 30 Oct 2026: "Give me access to the website through a link
// in my portal, as I am logged in there I don't need to log in again on the website").
// POST with the owner's sign-in token. Checks the sign-in and the owner role, then sets a 30-day owner pass (HttpOnly
// cookie, signed with the portal's server key) and answers with /website/. GET serves that private copy (api/_site/serve.mjs);
// one function for both, because the Vercel plan allows 12 functions.
import { COOKIE, DAYS, makePass } from "./_site/gate.mjs";
import serveSite from "./_site/serve.mjs";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET" || req.method === "HEAD") return serveSite(req, res);   // portal.archeaviation.com/website/... (vercel.json)
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SECRET_KEY;
  if (!URL_ || !KEY) return res.status(503).json({ error: "not set up" });
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || KEY;
    const who = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
    if (!who.ok) return res.status(401).json({ error: "Sign in again." });
    const me = await who.json();
    const r = await fetch(`${URL_}/rest/v1/profiles?select=role,active&id=eq.${encodeURIComponent(me.id)}`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
    const p = ((await r.json().catch(() => [])) || [])[0];
    if (!p || p.role !== "owner" || p.active === false) return res.status(403).json({ error: "Only the owner can open the private website." });
    res.setHeader("Set-Cookie", `${COOKIE}=${makePass(KEY)}; Path=/website; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`);
    return res.status(200).json({ url: "/website/" });
  } catch (e) { return res.status(500).json({ error: "Could not open the website. Try again." }); }
}
