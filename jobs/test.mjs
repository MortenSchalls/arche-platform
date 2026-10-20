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
  if (/charter OPERATORS/.test(body.messages[0].content)) {
    const seenOps = { type: "web_search_tool_result", content: ["https://good-air.example/about", "https://good-air.example/fleet", "https://argus.example/registry/good-air", "https://www.avinode.com/operator/x", "https://ru-jets.example", "https://noaoc.example", "https://asn.example/accident/1", "https://clean-air.example", "https://eu-banned.example", "https://caa.example/enforcement/1", "https://good-air.example/insurance"].map(url => ({ type: "web_search_result", url })) };
    const ops = [
      { org: "Good Air Charter", country: "Singapore", region: "Asia-Pacific", source: "https://good-air.example/about", website: "https://good-air.example", aoc_authority: "CAAS",
        fleet: [{ type: "Bombardier Challenger 650", count: 3 }], fleet_source: "https://good-air.example/fleet",
        owners: ["Example Holdings Ltd", "Mr John Example"], insurance: { summary: "USD 300m liability", url: "https://good-air.example/insurance" },
        enforcement: [{ year: String(new Date().getFullYear() - 1), summary: "AOC restriction lifted after audit", url: "https://caa.example/enforcement/1" }],
        audits: [{ name: "ARGUS", level: "Platinum", year: "2025", url: "https://argus.example/registry/good-air" }, { name: "Wyvern", level: "Wingman", url: "https://never-seen.example/w" }],
        safety: [{ year: String(new Date().getFullYear() - 2), summary: "Runway excursion, no injuries", url: "https://asn.example/accident/1" }], why: "x", approach: "y" },
      { org: "Board Listed Jets", country: "Malaysia", source: "https://www.avinode.com/operator/x", aoc_authority: "CAAM" },
      { org: "RU Jets", country: "Russia", source: "https://ru-jets.example", aoc_authority: "Rosaviatsia" },
      { org: "No AOC Aviation", country: "Thailand", source: "https://noaoc.example", aoc_authority: "" },
      { org: "EU Banned Air", country: "Exampleland", source: "https://eu-banned.example", aoc_authority: "Example CAA", eu_air_safety_list: true },
      { org: "Clean Air Jets", country: "Thailand", region: "Asia-Pacific", source: "https://clean-air.example", aoc_authority: "CAAT", fleet: [{ type: "King Air 350", count: 2 }] }];
    return { content: [seenOps, { type: "text", text: "```json\n" + JSON.stringify(ops) + "\n```" }] };
  }
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
// fake sanctions lists: OFAC loads (with one name matching an operator's owner), the rest fail and are reported
const fakeLists = async url => /sdn\.csv/.test(url)
  ? { ok: true, text: async () => ['1,"EXAMPLE HOLDINGS LIMITED",-0-', ...Array.from({ length: 60 }, (_, i) => `${i + 2},"LISTED ENTITY NUMBER ${i}",-0-`)].join("\n") }
  : { ok: false, status: 503, text: async () => "" };
const res = await intel.run(db, call, quiet, fakeLists);
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
// operators
assert.deepStrictEqual(res.operators, ["Good Air Charter", "Clean Air Jets"]); pass("only vetted operators are added");
assert(res.rejected.some(x => /EU Banned Air.*EU Air Safety List/.test(x))); pass("operator on the EU Air Safety List rejected");
assert(res.rejected.some(x => /RU Jets.*sanctioned/.test(x))); pass("operator in a sanctioned jurisdiction rejected");
assert(res.rejected.some(x => /Board Listed.*marketplace/.test(x))); pass("operator sourced from a marketplace rejected");
assert(res.rejected.some(x => /No AOC.*Air Operator Certificate/.test(x))); pass("operator without a certificate rejected");
const ga = T.prospects.find(p => p.data.org === "Good Air Charter").data;
assert(ga.kind === "operator" && ga.ops.tier === "A" && ga.ops.audits.length === 1); pass("audit without a seen source dropped; ARGUS Platinum gives tier A");
assert(ga.ops.flags.some(f => /Accident.*last 5 years/.test(f)) && ga.ops.screen.entity === ""); pass("recent accident flagged; final sanctions screen left for a person");
assert(ga.ops.flags.some(f => /Regulator action/.test(f)) && ga.ops.enforcement.length === 1); pass("recent regulator action flagged");
assert.deepStrictEqual(ga.ops.owners, ["Example Holdings Ltd"]); pass("owners kept as companies only, a named person dropped");
assert(ga.ops.insurance && /300m/.test(ga.ops.insurance.summary)); pass("published insurance recorded");
assert(ga.ops.screen.auto.result === "possible match" && ga.status === "review" && ga.ops.flags.some(f => /sanctions match/.test(f))); pass("owner on a sanctions list: possible match, sent to the owner for a decision");
assert(ga.ops.screen.auto.failed.includes("UN") && ga.ops.screen.auto.lists.includes("OFAC SDN")); pass("lists that fail to load are reported, not guessed");
const ca = T.prospects.find(p => p.data.org === "Clean Air Jets").data;
assert(ca.ops.screen.auto.result === "no match" && ca.status === "new"); pass("clean operator: no match recorded, status unchanged");
assert(ca.ops.flags.some(f => /No business jet/.test(f))); pass("turboprop-only fleet flagged");
await db.set("intel/assign", { lastRun: "2000-01-01T00:00:00Z" });
await rotation.run(db, quiet);
assert(!T.prospects.find(p => p.data.org === "Good Air Charter").data.assignedTo);
{ const { createRequire } = await import("module"); const { engine } = createRequire(import.meta.url)("../apps/portal/engine.js");
  const roster = { [BRK]: { role: "broker", active: true, contractName: "Example Broker", base: "Singapore", roster: true } };
  const e = engine({ prospects: { x1: { org: "Op", kind: "operator", status: "new", region: "Asia-Pacific", country: "Singapore" }, x2: { org: "Client", kind: "client", status: "new", region: "Asia-Pacific", country: "Singapore" } }, roster, leads: {}, trips: [] }, {}, new Date().toISOString());
  assert(e.writes.some(w => JSON.stringify(w).includes("x2")) && !e.writes.some(w => JSON.stringify(w).includes("x1"))); }
pass("operators are never rotated to brokers (client assigned, operator left alone)");

// sanctions list parsers
{ const sx = await import("./lib/sanctions.mjs");
  const L = id => sx.LISTS.find(l => l.id === id).parse;
  assert.deepStrictEqual(L("UN")("<X><FIRST_NAME>ACME SHIPPING</FIRST_NAME><ALIAS_NAME>ACME LINES</ALIAS_NAME></X>"), ["ACME SHIPPING", "ACME LINES"]);
  assert.deepStrictEqual(L("EU")('Id;NameAlias_WholeName;X\n1;"Acme; Air LLC";y\n'), ["Acme; Air LLC"]);
  assert.deepStrictEqual(L("UK")("Last Updated,1/1/2026\nName 6,Name 1,Group Type\nACME AVIATION,,Entity\n"), ["ACME AVIATION"]);
  assert.equal(sx.norm("Acme Aviation Pte. Ltd."), "acme aviation");
  const lists = { names: new Map([["acme aviation", "UN"], ["blue", "EU"]]) };
  assert(sx.screen(["ACME Aviation Limited"], lists).length === 1 && sx.screen(["Blue Sky Jets"], lists).length === 0);
  assert(sx.screen(["Global Aviation Services Asia"], { names: new Map([["global aviation", "OFAC SDN"]]) }).length === 0); }
pass("sanctions lists parsed; names compared after removing company suffixes; one-word or all-generic names never match on their own");

// backup
const counts = await backup.run(db, "/tmp/backup-test.json", quiet);
assert(counts.prospects === 15 && existsSync("/tmp/backup-test.json")); pass("backup holds every table"); unlinkSync("/tmp/backup-test.json");
console.log(`\n${ok} checks passed`);
