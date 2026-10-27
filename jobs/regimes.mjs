// Weekly watch on the official sanctions lists (Morten, 27 Oct 2026: "check against official sanction lists and
// ensure we are covered and list is updated when needed").
// Downloads the UN, US (OFAC), EU and UK lists (the same official files the operator pre-screen uses) and reads which
// sanctions programmes or regimes each one contains. The first run stores them as the baseline. Any programme added
// or removed after that, or a list that cannot be read, is written to intel/sanctions-regimes; the portal then asks
// the owner (Team → To do, and Today) to review the website's excluded places (apps/website/content/excluded.json),
// manual Appendix G.2 and the KYC steps. Nothing is changed automatically: a person decides.
// Names of people and companies are screened per booking and per operator against the same lists (lib/sanctions.mjs).
import { LISTS } from "./lib/sanctions.mjs";

function split(line, sep = ",") {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === sep) { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur); return out;
}
function column(text, test, sep = ",") {
  const lines = text.split(/\r?\n/); const hi = lines.findIndex(l => split(l, sep).some(h => test(h.trim())));
  if (hi < 0) return [];
  const i = split(lines[hi], sep).findIndex(h => test(h.trim()));
  return lines.slice(hi + 1).map(l => (split(l, sep)[i] || "").trim()).filter(Boolean);
}
const uniq = a => [...new Set(a)].sort();

// what each list calls its programmes
export const READERS = {
  "OFAC SDN": t => uniq(t.split(/\r?\n/).map(l => split(l)[3] || "").flatMap(p => p.replace(/[\[\]]/g, " ").split(/[;\s]+/)).map(x => x.trim()).filter(x => /^[A-Z0-9][A-Z0-9-]{1,30}$/.test(x) && x !== "-0-")),
  "UN": t => uniq([...t.matchAll(/<UN_LIST_TYPE>([^<]+)<\/UN_LIST_TYPE>/g)].map(m => m[1].trim())),
  "EU": t => uniq(column(t, h => /^(Programme|Entity_Regulation_Programme|Regulation_Programme)$/i.test(h), ";")),
  "UK": t => uniq(column(t, h => /^regime( name)?$/i.test(h))),
};

export async function readRegimes(fetchFn = fetch, log = () => {}) {
  const found = {}, failed = [];
  for (const L of LISTS.filter(l => READERS[l.id])) {
    let ok = false;
    for (const url of L.urls) {
      try {
        const r = await fetchFn(url, { headers: { "user-agent": "ArcheExecutive-sanctions-watch/1.0" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const list = READERS[L.id](await r.text());
        if (list.length < 3) throw new Error("only " + list.length + " programmes read");
        found[L.id] = list; ok = true; break;
      } catch (e) { log(`  ${L.id}: ${url} failed: ${e.message}`); }
    }
    if (!ok) failed.push(L.id);
  }
  return { found, failed };
}

export function compare(base, found) {
  const changes = [];
  for (const [id, list] of Object.entries(found)) {
    const was = new Set((base || {})[id] || []), now = new Set(list);
    if (!base || !base[id]) continue;
    const added = list.filter(x => !was.has(x)), removed = [...was].filter(x => !now.has(x));
    if (added.length || removed.length) changes.push({ list: id, added, removed });
  }
  return changes;
}

export async function run(db, fetchFn = fetch, log = console.log, today = new Date().toISOString()) {
  const prev = (await db.get("intel/sanctions-regimes")) || {};
  const { found, failed } = await readRegimes(fetchFn, log);
  const base = prev.baseline || null;
  const changes = compare(base, found);
  const baseline = { ...found, ...(base || {}) };   // the first run sets the baseline; a list read for the first time joins it; known lists keep theirs until the owner marks the change reviewed
  const open = (prev.open || []).concat(changes.map(c => ({ ...c, at: today })));
  const failRuns = failed.length ? (prev.failRuns || 0) + 1 : 0;
  const out = { baseline, latest: found, checkedAt: today, failed, failRuns, open,
    review: open.length > 0 || failRuns >= 2, note: base ? "" : "Baseline stored on the first run." };
  await db.set("intel/sanctions-regimes", out);
  const msg = `${Object.keys(found).length} lists read${failed.length ? ", could not read " + failed.join(", ") : ""}; ${changes.length ? changes.length + " list(s) changed" : "no change"}${base ? "" : " (baseline stored)"}`;
  log(msg); return { note: msg };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs"); const { connect } = await import("./lib/db.mjs");
  await main("Sanctions programmes watch", ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], () => run(connect()));
}
