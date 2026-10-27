// Sanctions screen of names on demand (Morten, 27 Oct 2026): booking screens (owner, operations) and the live check in the trip form (brokers too).
// Uses the name index the daily job (jobs/screen.mjs) builds from the official UN, US (OFAC), EU and UK lists and
// keeps in private storage. Returns possible matches; a person decides. Names are not stored here: the portal saves
// the screening record on the trip (operations-only table).
// Saved screenings (body.log = "trip" or "operations") are written to screen_log (SQL 0018) by this server only.
// Environment (Vercel): SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY
const SB = (process.env.SUPABASE_URL || "").replace(/\/$/, ""), SECRET = process.env.SUPABASE_SECRET_KEY, PK = process.env.SUPABASE_PUBLISHABLE_KEY || SECRET;
let cache = null;   // { at, lists, failed, names: Map }

const SUFFIX = /\b(ltd|limited|pte|pvt|private|llc|l\.l\.c|inc|incorporated|co|corp|corporation|company|plc|sa|s\.a|ag|gmbh|bv|b\.v|nv|srl|s\.r\.l|spa|s\.p\.a|jsc|ojsc|pjsc|cjsc|oao|ooo|zao|fze|fzco|fzc|llp|lp|sdn|bhd|pt|tbk|kk|the|and|&)\b/g;
// words that say what a company does, not who it is: a listed name made only of these is not a match on its own
// (same list as jobs/lib/sanctions.mjs; "Business Aviation Centre" alone matched four real handling agents, 27 Oct 2026)
const GENERIC = new Set("air airlines airline airways aviation aero aerospace jet jets charter charters flight flights executive business global international group holding holdings services service transport logistics trading general express star sky centre center airport airports terminal handling fbo ground support base company enterprises industries solutions systems management partners worldwide".split(" "));
const distinct = ws => ws.some(w => !GENERIC.has(w) && w.length >= 3);
export const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9& ]+/g, " ").replace(SUFFIX, " ").replace(/\s+/g, " ").trim();

// A name is a possible match when it equals a listed name, when every word of a listed name (two or more words) is in
// it, or when every word of it (two or more words) is in a listed name. Order of words does not matter.
export function check(names, index) {
  const out = [];
  for (const raw of names) {
    const n = norm(raw); const hits = [];
    if (n.length >= 3) {
      const mine = n.split(" "), mineSet = new Set(mine);
      for (const [listed, list] of index) {
        if (listed === n) { hits.push({ listed, list }); }
        else {
          const lw = listed.split(" ");
          if (lw.length >= 2 && lw.join("").length >= 8 && distinct(lw) && lw.every(w => mineSet.has(w))) hits.push({ listed, list });
          else if (mine.length >= 2 && mine.join("").length >= 8 && distinct(mine) && mine.every(w => lw.includes(w))) hits.push({ listed, list });
        }
        if (hits.length >= 5) break;
      }
    }
    out.push({ name: raw, result: hits.length ? "possible match" : "no match", hits });
  }
  return out;
}

async function index() {
  if (cache && Date.now() - cache.loaded < 6 * 3600e3) return cache;
  const r = await fetch(`${SB}/storage/v1/object/sanctions/index.json`, { headers: { apikey: SECRET, authorization: `Bearer ${SECRET}` } });
  if (!r.ok) throw new Error("index not available (" + r.status + ")");
  const j = await r.json();
  cache = { at: j.at, lists: j.lists || [], failed: j.failed || [], names: new Map(Object.entries(j.names || {})), loaded: Date.now() };
  return cache;
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
  const names = (Array.isArray((req.body || {}).names) ? req.body.names : []).map(x => String(x || "").slice(0, 160)).filter(x => x.trim()).slice(0, 40);
  if (!names.length) return res.status(400).json({ error: "No names" });
  let ix;
  try { ix = await index(); } catch (e) { return res.status(503).json({ error: "The sanctions lists are not loaded yet. The daily screen job must run once (GitHub → Actions → Portal jobs → screen)." }); }
  const ageH = (Date.now() - new Date(ix.at).getTime()) / 3600e3, results = check(names, ix.names);
  // a saved screening is logged here, by the server, so the record cannot be changed afterwards (SQL 0018)
  let logId = null, logged = false;
  const b = req.body || {}, purpose = ["trip", "operations"].includes(b.log) ? b.log : null;
  if (purpose && !(purpose === "operations" && !["owner", "ops"].includes(prof.role))) {
    const row = { by: u.id, role: prof.role, trip_owner: /^[0-9a-f-]{36}$/i.test(b.tripOwner || "") ? b.tripOwner : null, trip_id: String(b.tripId || "").slice(0, 60), purpose,
      names, results, outcome: results.some(r => r.result !== "no match") ? "possible match" : "clear", lists: ix.lists, lists_at: ix.at, stale: ageH > 48 };
    try {
      const w = await fetch(`${SB}/rest/v1/screen_log`, { method: "POST", headers: { apikey: SECRET, authorization: `Bearer ${SECRET}`, "content-type": "application/json", prefer: "return=representation" }, body: JSON.stringify(row) });
      if (w.ok) { logId = ((await w.json())[0] || {}).id || null; logged = true; }
    } catch (e) { /* the log table is missing until SQL 0018 runs; the screening still works */ }
  }
  return res.status(200).json({ at: ix.at, stale: ageH > 48, lists: ix.lists, failed: ix.failed, results, logged, logId });
}
