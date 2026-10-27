// Offline test of the daily audit check (example data only).
import { run, parseRegistry, parseLines, parseWyvern } from "./audits.mjs";
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
index = index || { sources: (await db.get("intel/audit-registries")).sources, entries: [] };
ok("a partial ARGUS list (27 of 300+) is not used", index.sources.ARGUS.ok === false && !index.entries.length);
ok("unreadable WYVERN registry reported, not guessed", index.sources.WYVERN.ok === false && !index.entries.some(e => e.prog === "WYVERN"));
ok("programme baseline stored", store["intel/audit-programmes"].baseline["ARGUS ratings"].includes("Gold Certified") && !store["intel/audit-programmes"].review);
pages["argus.aero/"] = "<p>Gold</p><p>Platinum</p><p>Platinum Elite</p>";
await run(db, fetchFn, () => {}, "2026-11-03T00:00:00Z", async () => {});
const ap = store["intel/audit-programmes"];
ok("a dropped level asks for review", ap.review && ap.open.some(c => c.id === "ARGUS ratings" && c.removed.includes("Gold Certified")));
// the browser reader fills a paginated list
const many = Array.from({ length: 320 }, (_, i) => ({ name: `Example Operator ${i} LLC`, level: i % 2 ? "Gold" : "Platinum" })).concat([{ name: "Example Jets Pte Ltd", level: "Platinum Elite" }]);
let index2 = null; await run(db, fetchFn, () => {}, "2026-11-04T00:00:00Z", async b => { index2 = JSON.parse(b); }, async R => R.id === "ARGUS" ? many : []);
ok("browser read used when the page is partial", index2.sources.ARGUS.ok && index2.sources.ARGUS.count === 321);
ok("operator found by name", lookup("Example Jets Pte. Ltd.", index2.entries).some(m => m.level === "Platinum Elite"));
ok("unrelated operator not found", lookup("Other Aviation Ltd", index2.entries).length === 0);
ok("browser text pairs name and level", (parseLines("Registry\nNo Name\nGold\nAir Bravo Corp.\nPlatinum Elite\nAero Air LLC\nGold\n<\n1", ["Platinum Elite","Platinum","Gold"]).length === 2));
const wy = parseWyvern("WYVERN Wingman Directory\nIntro\nName\nExample Jet\nCity, Country\nAB-1\nExample Jet Holdings Ltd\n+2 Additional\nWebsite\nSecond Air\nTown, Country\nX9\nSecond Air Ltd\nThird Air\nPlace, Country\nC-3\nThird Holder Inc\nWebsite\n© 2026");
ok("WYVERN directory: names, holders and certificates", wy.length === 5 && wy.filter(e => e.name === "Second Air").length === 1 && wy.find(e => e.name === "Third Holder Inc").holderOf === "Third Air" && wy.every(e => e.level === "Wingman"));
ok("names normalised", normName("Example Jets Pte. Ltd.") === "example jets");
console.log(fails ? `${fails} FAILED` : "ALL PASS"); process.exit(fails ? 1 : 0);
