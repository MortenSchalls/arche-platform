// Offline test of the daily audit check (example data only).
import { run, parseRegistry } from "./audits.mjs";
import { lookup, normName } from "../apps/portal/api/auditcheck.mjs";
let fails = 0; const ok = (n, c) => { console.log((c ? "PASS " : "FAIL ") + n); if (!c) fails++; };
const rows = Array.from({ length: 25 }, (_, i) => `<div><p>Example Operator ${i} LLC</p><img src="/x/${i % 3 ? "gold" : "platinum"}.png" alt=""></div>`).join("") +
  `<div><p>Example Jets Pte Ltd</p><p>Platinum Elite</p></div><div><p>Inline Air: Gold Certified</p></div>`;
const argus = `<html><body><h1>Operator registry</h1>${rows}</body></html>`;
const parsed = parseRegistry(argus, ["Platinum Elite", "Platinum", "Gold Certified", "Gold"]);
ok("badge images read as levels", parsed.filter(e => /Example Operator/.test(e.name)).length === 25 && parsed.find(e => e.name === "Example Operator 0 LLC").level === "Platinum");
ok("text level after a name", parsed.find(e => e.name === "Example Jets Pte Ltd").level === "Platinum Elite");
ok("inline name: level", parsed.find(e => e.name === "Inline Air").level === "Gold Certified");
const pages = { "argus.aero/operatorregistry": argus, "app.wyvern.systems": "<html><div id=root></div><script src=app.js></script></html>",
  "argus.aero/": "<p>Gold Certified</p><p>Platinum</p><p>Platinum Elite</p>", "argus-gold": "<p>remote</p>", "wyvernltd.com": "<p>Wingman</p><p>Wingman PRO</p><p>Registered</p>", "ibac.org": "<p>Stage 1 Stage 2 Stage 3 ICAO</p>" };
const fetchFn = async url => { const k = Object.keys(pages).find(k => url.includes(k)); const t = k ? pages[k] : null; return { ok: !!t, status: t ? 200 : 404, text: async () => t }; };
const store = {}; let index = null;
const db = { set: async (k, v) => { store[k] = v; }, get: async k => store[k] || null };
await run(db, fetchFn, () => {}, "2026-10-27T00:00:00Z", async b => { index = JSON.parse(b); });
ok("ARGUS registry indexed", index.sources.ARGUS.ok && index.sources.ARGUS.count >= 27);
ok("unreadable WYVERN registry reported, not guessed", index.sources.WYVERN.ok === false && !index.entries.some(e => e.prog === "WYVERN"));
ok("programme baseline stored", store["intel/audit-programmes"].baseline["ARGUS ratings"].includes("Gold Certified") && !store["intel/audit-programmes"].review);
pages["argus.aero/"] = "<p>Gold</p><p>Platinum</p><p>Platinum Elite</p>";
await run(db, fetchFn, () => {}, "2026-11-03T00:00:00Z", async () => {});
const ap = store["intel/audit-programmes"];
ok("a dropped level asks for review", ap.review && ap.open.some(c => c.id === "ARGUS ratings" && c.removed.includes("Gold Certified")));
ok("operator found by name", lookup("Example Jets Pte. Ltd.", index.entries).some(m => m.level === "Platinum Elite"));
ok("unrelated operator not found", lookup("Other Aviation Ltd", index.entries).length === 0);
ok("names normalised", normName("Example Jets Pte. Ltd.") === "example jets");
console.log(fails ? `${fails} FAILED` : "ALL PASS"); process.exit(fails ? 1 : 0);
