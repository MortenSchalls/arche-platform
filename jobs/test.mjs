// Offline tests for the scheduled jobs: in-memory database and a fake research API. Example data only.
import assert from "assert";
import { connect } from "./lib/db.mjs";
import * as rotation from "./rotation.mjs";
import * as intel from "./intel.mjs";
import * as backup from "./backup.mjs";
import { existsSync, unlinkSync } from "fs";

function fake(T) {
  const q = table => {
    let filt = [], op = "select", payload, single = false, conflict, rng;
    const rows = () => (T[table] = T[table] || []);
    const api = { select() { return api; }, eq(k, v) { filt.push(r => String(r[k]) === String(v)); return api; }, range(a, b) { rng = [a, b]; return api; },
      maybeSingle() { single = true; return api; }, upsert(row, o) { op = "upsert"; payload = row; conflict = o.onConflict.split(","); return api; },
      delete() { op = "delete"; return api; }, then(ok) { ok(run()); } };
    function run() {
      const m = r => filt.every(f => f(r));
      if (op === "select") { let out = rows().filter(m).map(r => structuredClone(r)); if (rng) out = out.slice(rng[0], rng[1] + 1); return { data: single ? out[0] || null : out, error: null }; }
      if (op === "upsert") { const i = rows().findIndex(r => conflict.every(c => r[c] === payload[c])); if (i >= 0) rows()[i] = { ...rows()[i], ...payload }; else rows().push(structuredClone(payload)); }
      if (op === "delete") T[table] = rows().filter(r => !m(r));
      return { data: null, error: null };
    }
    return api;
  };
  return { from: q, storage: { from: () => ({ list: async () => ({ data: [{ name: "u1" }] }) }) } };
}
const BRK = "00000000-0000-0000-0000-00000000000b";
const T = {
  profiles: [{ id: BRK, role: "broker", active: true, contract_name: "Example Broker", base: "Singapore", data: { roster: true } }, { id: "owner", role: "owner", active: true, data: {} }],
  prospects: Array.from({ length: 12 }, (_, i) => ({ id: "p" + String(i + 1).padStart(3, "0"), data: { org: "Example Org " + (i + 1), status: "new", region: "Asia-Pacific", country: "Singapore", kind: "client", segment: "Family office", avenues: i < 3 ? [] : [{ type: "website", url: "https://example.org" }] } })),
  config: [], intel: [], locks: [], leads: [], trips: [], trip_status: []
};
const db = connect(fake(T)); const quiet = () => {};
let ok = 0; const pass = m => { ok++; console.log("PASS", m); };

// rotation
const r1 = await rotation.run(db, quiet);
assert(r1.writes > 0, "rotation should assign leads"); pass(`rotation assigns leads (${r1.writes} writes)`);
assert((T.leads || []).some(l => l.owner_id === BRK)); pass("leads written for the active broker");
assert(T.prospects.some(p => p.data.assignedTo === BRK)); pass("prospects marked assigned");
assert(T.locks.find(l => l.key === "engine").value.holder === ""); pass("lock released");
const r2 = await rotation.run(db, quiet); assert(r2.skipped); pass("second run within 2 hours is skipped");

// intel: fake API returns one good org, one with an unseen source, one duplicate, one with personal routes
const call = async body => {
  const isEnrich = /contact routes/.test(body.messages[0].content);
  const results = { type: "web_search_tool_result", content: [{ type: "web_search_result", url: "https://good-yachts.example/about" }, { type: "web_search_result", url: "https://www.linkedin.com/company/good-yachts" }, { type: "web_search_result", url: "https://org3.example/contact" }] };
  const json = isEnrich
    ? { p001: [{ type: "contact", label: "Contact", url: "https://org3.example/contact" }, { type: "email", label: "x", url: "mailto:someone@gmail.com" }], p002: [{ type: "website", url: "https://never-seen.example" }] }
    : [{ org: "Good Yachts Ltd", kind: "client", segment: "Yachting", region: "Europe", country: "Monaco", source: "https://good-yachts.example/about", website: "https://good-yachts.example", why: "x", approach: "y",
         avenues: [{ type: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/good-yachts" }, { type: "linkedin", label: "person", url: "https://www.linkedin.com/in/some-person" }] },
       { org: "Made Up Charters", kind: "client", source: "https://not-in-results.example" },
       { org: "Example Org 5 Group", kind: "client", source: "https://good-yachts.example/about" }];
  return { content: [results, { type: "text", text: "```json\n" + JSON.stringify(json) + "\n```" }] };
};
const p1Before = structuredClone(T.prospects.find(p => p.id === "p001").data);
const res = await intel.run(db, call, quiet);
assert.deepStrictEqual(res.added, ["Good Yachts Ltd"]); pass("only the organisation with a seen source is added");
assert(res.rejected.some(x => /not seen/.test(x)) && res.rejected.some(x => /duplicate/.test(x))); pass("unseen source and duplicate rejected");
const gy = T.prospects.find(p => p.data.org === "Good Yachts Ltd");
assert.equal(gy.id, "p013"); pass("new id follows the highest existing id");
assert(gy.data.avenues.length === 1 && !gy.data.avenues.some(a => /linkedin\.com\/in\//.test(a.url))); pass("personal LinkedIn profile dropped, company page kept");
const p1 = T.prospects.find(p => p.id === "p001").data;
assert(p1.avenues.length === 1 && p1.avenues[0].url.includes("org3.example")); pass("existing prospect: personal email dropped");
assert(p1.status === p1Before.status && p1.assignedTo === p1Before.assignedTo && JSON.stringify(p1.history) === JSON.stringify(p1Before.history)); pass("status, assignment and history of existing prospects untouched");
assert.equal((T.prospects.find(p => p.id === "p002").data.avenues || []).length, 0); pass("route not seen in search results is not stored");
assert.equal(T.intel.find(i => i.key === "status").value.focusIndex, 1); pass("focus rotates to the next region");

// backup
const counts = await backup.run(db, "/tmp/backup-test.json", quiet);
assert(counts.prospects === 13 && existsSync("/tmp/backup-test.json")); pass("backup holds every table"); unlinkSync("/tmp/backup-test.json");
console.log(`\n${ok} checks passed`);
