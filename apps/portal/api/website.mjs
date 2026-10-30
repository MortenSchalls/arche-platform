// Private look at the locked website from the portal (Morten, 30 Oct 2026: "Give me access to the website through a link
// in my portal, as I am logged in there I don't need to log in again on the website").
// POST with the owner's sign-in token. Returns the website address with Vercel's protection bypass, which also sets a
// cookie on archeaviation.com so the whole site opens without the Vercel login. Owner only.
// Environment variable (Vercel → portal project): WEBSITE_BYPASS_SECRET = the website project's
// "Protection Bypass for Automation" secret (Vercel → website project → Settings → Deployment Protection).
export const SITE = "https://archeaviation.com/";
export function bypassUrl(secret, site = SITE) {
  const u = new URL(site);
  u.searchParams.set("x-vercel-protection-bypass", secret);
  u.searchParams.set("x-vercel-set-bypass-cookie", "true");
  return u.toString();
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SECRET_KEY, SECRET = process.env.WEBSITE_BYPASS_SECRET;
  if (!URL_ || !KEY) return res.status(503).json({ error: "not set up" });
  if (!SECRET) return res.status(503).json({ error: "The website key is not set up yet (WEBSITE_BYPASS_SECRET in the portal project)." });
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || KEY;
    const who = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
    if (!who.ok) return res.status(401).json({ error: "Sign in again." });
    const me = await who.json();
    const r = await fetch(`${URL_}/rest/v1/profiles?select=role,active&id=eq.${encodeURIComponent(me.id)}`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
    const p = ((await r.json().catch(() => [])) || [])[0];
    if (!p || p.role !== "owner" || p.active === false) return res.status(403).json({ error: "Only the owner can open the private website." });
    return res.status(200).json({ url: bypassUrl(SECRET) });
  } catch (e) { return res.status(500).json({ error: "Could not open the website. Try again." }); }
}
