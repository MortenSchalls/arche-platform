// Operator audit check against the auditors' public registries (Morten, 27 Oct 2026: "ensure the audits we list is
// something we can back up ... automated as we do with the sanctions list"). The daily job (jobs/audits.mjs) reads the
// ARGUS operator registry and the WYVERN Wingman directory into private storage (registries/index.json); this
// endpoint looks an operator up there for the portal's Operator safety panel. Members only.
// Environment (Vercel): SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY
const SB = (process.env.SUPABASE_URL || "").replace(/\/$/, ""), SECRET = process.env.SUPABASE_SECRET_KEY, PK = process.env.SUPABASE_PUBLISHABLE_KEY || SECRET;
let cache = null;
export const normName = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/\b(dba|d\/b\/a)\b.*$/, "").replace(/\b(ltd|limited|pte|llc|inc|incorporated|co|corp|corporation|company|plc|sa|ag|gmbh|bv|srl|spa|sdn|bhd|pty|kk|jsc|fze|s\.a\. de c\.v\.|de|cv)\b\.?/g, " ")
  .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
// exact name after normalising, or one name contains the other with at least two words and eight letters
export function lookup(name, entries) {
  const n = normName(name); if (n.length < 3) return [];
  const words = n.split(" ");
  return entries.filter(e => e.norm === n || (words.length >= 2 && n.replace(/ /g, "").length >= 8 && (` ${e.norm} `.includes(` ${n} `) || (e.norm.split(" ").length >= 2 && ` ${n} `.includes(` ${e.norm} `))))).slice(0, 8).map(e => ({ prog: e.prog, level: e.level, name: e.name }));
}
async function index() {
  if (cache && Date.now() - cache.loaded < 6 * 3600e3) return cache;
  const r = await fetch(`${SB}/storage/v1/object/registries/index.json`, { headers: { apikey: SECRET, authorization: `Bearer ${SECRET}` } });
  if (!r.ok) throw new Error("index not available (" + r.status + ")");
  const j = await r.json(); cache = { ...j, loaded: Date.now() }; return cache;
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!SB || !SECRET) return res.status(500).json({ error: "Server not set up" });
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const who = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
  if (!who.ok) return res.status(401).json({ error: "Sign in again" });
  const u = await who.json();
  const pr = await fetch(`${SB}/rest/v1/profiles?id=eq.${encodeURIComponent(u.id)}&select=role,active`, { headers: { apikey: SECRET, authorization: `Bearer ${SECRET}` } });
  const prof = pr.ok ? (await pr.json())[0] : null;
  if (!prof || !prof.active || !["owner", "ops", "broker"].includes(prof.role)) return res.status(403).json({ error: "Members only" });
  const name = String((req.body || {}).name || "").slice(0, 160);
  if (!name.trim()) return res.status(400).json({ error: "No name" });
  let ix; try { ix = await index(); } catch (e) { return res.status(503).json({ error: "The audit registries are not loaded yet (GitHub → Actions → Portal jobs → audits)." }); }
  return res.status(200).json({ at: ix.at, stale: (Date.now() - new Date(ix.at).getTime()) / 3600e3 > 72, sources: ix.sources, matches: lookup(name, ix.entries || []) });
}
