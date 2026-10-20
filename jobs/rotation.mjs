// Prospect rotation: the same engine the portal runs (apps/portal/engine.js), every 3 hours.
import { createRequire } from "module";
import { connect } from "./lib/db.mjs";
const require = createRequire(import.meta.url);
const { engine } = require("../apps/portal/engine.js");

export async function run(db = connect(), log = console.log) {
  const last = await db.get("intel/assign");
  if (last && Date.now() - Date.parse(last.lastRun || 0) < 2 * 36e5 && !process.env.FORCE) { log("Skipped: a round ran less than 2 hours ago."); return { skipped: true }; }
  if (!(await db.lock("scheduled", 15))) { log("Skipped: another round is running."); return { skipped: true }; }
  try {
    const roster = await db.roster();
    const prospects = {}; for (const r of await db.all("prospects")) prospects[r.id] = r.data;
    const leads = {}; for (const r of await db.all("leads")) (leads[r.owner_id] = leads[r.owner_id] || {})[r.id] = r.data;
    const st = {}; for (const r of await db.all("trip_status")) st[r.owner_id + "|" + r.id] = r.data;
    const trips = (await db.all("trips")).map(r => ({ bid: r.owner_id, did: r.id, d: r.data, st: st[r.owner_id + "|" + r.id] || {} }));
    const cfg = (await db.get("config/assign")) || {};
    const res = engine({ prospects, roster, leads, trips }, cfg, new Date().toISOString());
    let n = 0;
    for (const w of res.writes) { await db.apply(w); n++; }           // in the engine's order: new lead, prospect, old copy
    await db.set("config/board", res.board);
    await db.set("intel/assign", { lastRun: db.now(), by: "scheduled", report: res.report, metrics: res.metrics, writes: n });
    log(`Rotation done: ${n} writes, ${Object.keys(roster).length} people, ${Object.keys(prospects).length} prospects.`);
    return { writes: n, report: res.report };
  } finally { await db.unlock("scheduled"); }
}
if (import.meta.url === `file://${process.argv[1]}`) { const { main } = await import("./lib/main.mjs"); await main("Prospect rotation", ["SUPABASE_URL","SUPABASE_SECRET_KEY"], () => run()); }
