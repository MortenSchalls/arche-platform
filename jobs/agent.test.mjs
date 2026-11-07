// Research agent: runs only when switched on and due, or when "Run now" was pressed; never without the AI key;
// records what happened for the portal. In-memory database, example data only. Run: node agent.test.mjs
import { due, tick } from "./agent.mjs";
const ok = (k, v, x) => { console.log((v ? "PASS " : "FAIL ") + k + (v || x === undefined ? "" : "  -> " + JSON.stringify(x))); if (!v) process.exitCode = 1; };
const mk = docs => { const D = JSON.parse(JSON.stringify(docs)); return { D, get: async k => D[k] || null, set: async (k, v) => { D[k] = v; }, now: () => "2026-11-09T03:00:00.000Z" }; };
const mon9 = new Date("2026-11-09T03:00:00Z");   // Monday 10:00 Bangkok
ok("off: never due", !due({ on: false }, null, mon9));
ok("daily: due once a day from 06:00 Bangkok", due({ on: true }, "2026-11-08T03:00:00Z", mon9) && !due({ on: true }, "2026-11-09T00:30:00Z", mon9) && !due({ on: true }, null, new Date("2026-11-08T22:00:00Z")));
ok("weekdays: not on Sunday", !due({ on: true, freq: "weekdays" }, null, new Date("2026-11-08T03:00:00Z")) && due({ on: true, freq: "weekdays" }, null, mon9));
ok("weekly: Mondays", due({ on: true, freq: "weekly" }, "2026-11-02T03:00:00Z", mon9) && !due({ on: true, freq: "weekly" }, "2026-11-06T03:00:00Z", new Date("2026-11-07T03:00:00Z")));
delete process.env.ANTHROPIC_API_KEY;
{ const db = mk({ "intel/agent": { on: true }, "intel/status": {} }); let ran = 0;
  const r = await tick(db, () => {}, async () => { ran++; return {}; });
  ok("no AI key: does not run, tells the portal", !r.ran && ran === 0 && db.D["intel/agent"].state === "no-key"); }
process.env.ANTHROPIC_API_KEY = "example-not-a-key";
{ const db = mk({ "intel/agent": { on: false, runNow: { at: "2026-11-09T02:00:00Z" } }, "intel/status": { lastRun: "2026-11-09T01:00:00Z" } }); let ran = 0;
  const r = await tick(db, () => {}, async () => { ran++; return { added: [1, 2, 3], rejected: [1], note: "Example." }; });
  ok("Run now works even when the schedule is off, and records the result", r.ran && ran === 1 && db.D["intel/agent"].state === "done" && db.D["intel/agent"].last.added === 3 && db.D["intel/agent"].last.asked);
  const r2 = await tick(db, () => {}, async () => { ran++; return {}; });
  ok("Run now is used once", !r2.ran && ran === 1); }
{ const db = mk({ "intel/agent": { on: true }, "intel/status": { lastRun: "2026-11-09T00:30:00Z" } }); let ran = 0;
  await tick(db, () => {}, async () => { ran++; return {}; }, new Date("2026-11-09T03:00:00Z")); ok("already ran today: waits", ran === 0); }
{ const db = mk({ "intel/agent": { on: true }, "intel/status": {} });
  let threw = false; try { await tick(db, () => {}, async () => { throw new Error("search failed sk-ant-abc123"); }); } catch (e) { threw = true; }
  ok("a failed run is shown, with any key hidden", threw && db.D["intel/agent"].state === "failed" && !/sk-ant/.test(db.D["intel/agent"].error)); }
