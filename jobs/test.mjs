// Offline tests for the scheduled jobs: in-memory database and a fake research API. Example data only.
import assert from "assert";
import { connect } from "./lib/db.mjs";
import * as rotation from "./rotation.mjs";
import * as intel from "./intel.mjs";
import * as backup from "./backup.mjs";
import { existsSync, unlinkSync } from "fs";
import { sha, sweep } from "./lib/contacts.mjs";

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
  config: [], intel: [], locks: [], leads: [], trips: [], trip_status: [],
  optouts: [{ id: sha("e:gone@good-yachts.example"), data: { at: "2026-10-01" } }]
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
  if (/CREW HOTELS/.test(body.messages[0].content)) {
    const seenH = { type: "web_search_tool_result", content: ["https://airport-hotel.example/crew", "https://airport-hotel.example/shuttle", "https://far-hotel.example", "https://crew-agency.example", "https://www.booking.com/hotel/x"].map(url => ({ type: "web_search_result", url })) };
    const h = [{ org: "Example Airport Hotel", category: "Crew hotels", type: "hotel", minutes: 10, minutes_url: "https://airport-hotel.example/crew", shuttle: { desc: "Hotel shuttle every 20 minutes, 24/7", url: "https://airport-hotel.example/shuttle" }, country: "Singapore", source: "https://airport-hotel.example/crew", website: "https://airport-hotel.example", services: ["crew rate"] },
      { org: "Far Hotel", category: "Crew hotels", type: "hotel", minutes: 25, minutes_url: "https://far-hotel.example", shuttle: { desc: "Shuttle", url: "https://far-hotel.example" }, source: "https://far-hotel.example" },
      { org: "No Shuttle Hotel", category: "Crew hotels", type: "hotel", minutes: 8, minutes_url: "https://airport-hotel.example/crew", source: "https://airport-hotel.example/crew" },
      { org: "Crew Agency Example", category: "Crew hotels", type: "agency", source: "https://crew-agency.example" },
      { org: "Booked Hotel", category: "Crew hotels", source: "https://www.booking.com/hotel/x" },
      { org: "Wrong Category Hotel", category: "FBO and ground handling", source: "https://airport-hotel.example/crew" }];
    return { content: [seenH, { type: "text", text: "```json\n" + JSON.stringify(h) + "\n```" }] };
  }
  if (/BUSINESS-JET SUPPLIERS/.test(body.messages[0].content)) {
    const seenSvc = { type: "web_search_tool_result", content: ["https://fbo-one.example/singapore", "https://isbah.example/fbo-one", "https://cater.example", "https://www.airnav.com/x", "https://limo.example"].map(url => ({ type: "web_search_result", url })) };
    const svc = [
      { org: "FBO One Aviation", category: "FBO and ground handling", country: "Singapore", source: "https://fbo-one.example/singapore", website: "https://fbo-one.example", hours: "24/7", services: ["customs and immigration", "hangar"],
        isbah: { level: "Stage 2", year: "2025", url: "https://isbah.example/fbo-one" }, contacts: [{ name: "Example Manager", role: "FBO manager", email: "fbo@fbo-one.example", url: "https://fbo-one.example/singapore" }] },
      { org: "Sky Catering Example", category: "In-flight catering", country: "Singapore", source: "https://cater.example" },
      { org: "Directory Handler", category: "FBO and ground handling", source: "https://www.airnav.com/x" },
      { org: "Limo Example", category: "Limousine", source: "https://limo.example" }];
    return { content: [seenSvc, { type: "text", text: "```json\n" + JSON.stringify(svc) + "\n```" }] };
  }
  if (/investor profile/.test(body.messages[0].content)) {
    const ids = [...body.messages[0].content.matchAll(/- id (\w+):/g)].map(m => m[1]);
    const prof = Object.fromEntries(ids.map(id => [id, { aum: "USD 9bn", aum_url: "https://unseen.example", ticket: "Over USD 50m", interests: ["Real estate"], industries: ["Property"], aviation: "none", geo: ["Europe"] }]));
    return { content: [{ type: "web_search_tool_result", content: [] }, { type: "text", text: "```json\n" + JSON.stringify(prof) + "\n```" }] };
  }
  if (/INVESTORS and STRATEGIC PARTNERS/.test(body.messages[0].content)) {
    const seenInv = { type: "web_search_tool_result", content: ["https://gulf-fo.example/about", "https://gulf-fo.example/deals", "https://notes-platform.example", "https://example-holdings.example", "https://ru-fund.example"].map(url => ({ type: "web_search_result", url })) };
    const inv = [
      { org: "Gulf Example Family Office", track: "Family office or UHNW office", for: "Navoryx aircraft notes", country: "UAE", source: "https://gulf-fo.example/about", website: "https://gulf-fo.example",
        aum: "USD 2bn", aum_url: "https://gulf-fo.example/about", ticket: "USD 1–10m", interests: ["Aviation", "Private credit", "Made-up class"], industries: ["Aircraft leasing", "Hospitality"], aviation: "direct", geo: ["Middle East", "Mars"],
        evidence: [{ summary: "Invested in an aircraft leasing fund", url: "https://gulf-fo.example/deals" }, { summary: "unseen", url: "https://never.example" }], why: "x", approach: "Through an introduction" },
      { org: "Example Notes Platform", track: "Distribution partner for notes", source: "https://notes-platform.example" },
      { org: "Example Holdings Limited", track: "Private equity or private credit", source: "https://example-holdings.example" },
      { org: "Mr Private Person", source: "https://gulf-fo.example/about" },
      { org: "RU Capital", country: "Russia", source: "https://ru-fund.example" },
      { org: "Unseen Capital", source: "https://not-in-results.example" },
      { org: "Example Org 4", source: "https://gulf-fo.example/about" }];
    return { content: [seenInv, { type: "text", text: "```json\n" + JSON.stringify(inv) + "\n```" }] };
  }
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
  const results = { type: "web_search_tool_result", content: [{ type: "web_search_result", url: "https://good-yachts.example/team" }, { type: "web_search_result", url: "https://good-yachts.example/about" }, { type: "web_search_result", url: "https://www.linkedin.com/company/good-yachts" }, { type: "web_search_result", url: "https://org3.example/contact" }] };
  const json = isEnrich
    ? { p001: [{ type: "contact", label: "Contact", url: "https://org3.example/contact" }, { type: "email", label: "x", url: "mailto:someone@gmail.com" }], p002: [{ type: "website", url: "https://never-seen.example" }] }
    : [{ org: "Good Yachts Ltd", kind: "client", segment: "Yachting", region: "Europe", country: "Monaco", source: "https://good-yachts.example/about", website: "https://good-yachts.example", why: "x", approach: "y",
         avenues: [{ type: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/good-yachts" }, { type: "linkedin", label: "person", url: "https://www.linkedin.com/in/some-person" }],
         contacts: [{ name: "Example Person", role: "Head of Charter", email: "charter@good-yachts.example", url: "https://good-yachts.example/team" },
                    { name: "Webmail Person", role: "Director", email: "someone@gmail.com", url: "https://good-yachts.example/team" },
                    { name: "Profile Person", role: "CEO", url: "https://www.linkedin.com/company/good-yachts" },
                    { name: "Opted Out", role: "Sales", email: "gone@good-yachts.example", url: "https://good-yachts.example/team" },
                    { name: "Guessed Person", role: "Sales", email: "sales@good-yachts.example", url: "https://not-seen.example/team" }] },
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
assert.deepStrictEqual(gy.data.contacts.map(c => c.name), ["Example Person"]); assert(gy.data.contacts[0].source === "https://good-yachts.example/team" && gy.data.contacts[0].sourceType === "Organisation's own website");
pass("business contacts kept only from the organisation's own site, work email on its domain; webmail, other sites, unseen pages and opt-outs dropped");
const p1 = T.prospects.find(p => p.id === "p001").data;
assert(p1.avenues.length === 1 && p1.avenues[0].url.includes("org3.example")); pass("existing prospect: personal email dropped");
assert(p1.status === p1Before.status && p1.assignedTo === p1Before.assignedTo && JSON.stringify(p1.history) === JSON.stringify(p1Before.history)); pass("status, assignment and history of existing prospects untouched");
assert.equal((T.prospects.find(p => p.id === "p002").data.avenues || []).length, 0); pass("route not seen in search results is not stored");
assert.equal(T.intel.find(i => i.key === "status").value.focusIndex, 1); pass("focus rotates to the next region");
// investors and partners: owner-only table, nothing outside it
const own = (T.owner_prospects || []).filter(r => r.id !== "_status");
assert.deepStrictEqual(own.map(r => r.data.org).sort(), ["Example Holdings Limited", "Example Notes Platform", "Gulf Example Family Office"]); pass("investors and partners stored only in the owner-only table");
assert(!T.prospects.some(p => /Gulf Example|Notes Platform/.test(p.data.org))); pass("no investor in the shared prospect list");
assert(!JSON.stringify(T.intel).includes("Gulf Example") && !res.note.includes("Gulf Example") && res.ownerAdded === 3); pass("shared status and run summary carry no investor names, only a count");
const st = T.owner_prospects.find(r => r.id === "_status").data;
assert(/Mr Private Person: looks like a private individual/.test(st.rejected.join("|")) && /RU Capital: sanctioned/.test(st.rejected.join("|")) && /Unseen Capital: source not seen/.test(st.rejected.join("|")) && /Example Org 4: duplicate/.test(st.rejected.join("|"))); pass("private person, sanctioned country, unseen source and duplicate rejected");
const gfo = own.find(r => r.data.org === "Gulf Example Family Office").data;
assert(gfo.evidence.length === 1 && gfo.for === "Navoryx aircraft notes" && gfo.screen.auto.result === "no match"); pass("evidence kept only with a seen source; sanctions pre-screen recorded");
assert(own.find(r => r.data.org === "Example Holdings Limited").data.status === "review"); pass("possible sanctions match goes to the owner's decision");
assert.deepStrictEqual(gfo.profile.interests, ["Aviation", "Private credit"]); assert.deepStrictEqual(gfo.profile.geo, ["Middle East"]); assert(gfo.profile.aum === "USD 2bn"); pass("profile kept to the allowed values; portfolio size only with a seen source");
assert(gfo.score >= 70 && gfo.potential === "High" && gfo.reasons.some(x => /aviation directly/.test(x))); pass("direct aviation, fitting interests, ticket and region give High potential, with reasons");
const np = own.find(r => r.data.org === "Example Notes Platform").data;
assert(np.profile && np.profile.aum === "" && np.potential === "Low"); pass("profile research fills records without one; unsourced portfolio size dropped");

// service partners
assert.deepStrictEqual(res.services.sort(), ["Crew Agency Example", "Example Airport Hotel", "FBO One Aviation", "Sky Catering Example"]); pass("service partners added: FBO, caterer and crew hotel");
const fbo = T.prospects.find(p => p.data.org === "FBO One Aviation").data;
assert.deepStrictEqual(fbo.airports, ["WSSL", "WSSS", "VTBD"]); pass("same company at the next airports is linked, not duplicated");
assert(fbo.kind === "service" && fbo.isbah && fbo.isbah.level === "Stage 2" && !fbo.flags.length && fbo.contacts.length === 1); pass("IS-BAH evidence and business contact kept");
assert(fbo.screen && fbo.screen.auto && fbo.screen.auto.result === "no match"); pass("service partners are sanctions pre-screened");
assert(res.rejected.some(x => /Directory Handler.*directory/.test(x)) && res.rejected.some(x => /Limo Example.*categories/.test(x))); pass("directory sources and later categories (limousine) rejected for now");
{ const sv = T.intel.find(i => i.key === "services").value; assert.deepStrictEqual(sv.covered, ["WSSL", "WSSS", "VTBD"]); assert(sv.airportsLeft === 27 && !sv.pausedUntil); }
pass("three airports covered per run; only successful searches count, no pause before all are covered");
{ const ht = T.prospects.find(p => p.data.org === "Example Airport Hotel").data; assert(ht.kind === "service" && ht.category === "Crew hotels" && !ht.flags.length && ht.airports.length === 3); }
pass("crew hotels researched as their own category and linked across airports");
assert(res.rejected.some(x => /Far Hotel.*15 minutes/.test(x)) && res.rejected.some(x => /No Shuttle Hotel.*shuttle/.test(x))); pass("hotels more than 15 minutes away or without a dedicated shuttle refused");
{ const ht = T.prospects.find(p => p.data.org === "Example Airport Hotel").data; assert(ht.hotel.minutes === 10 && /shuttle/i.test(ht.hotel.shuttle)); } pass("distance and shuttle stored with their sources");
assert(res.rejected.some(x => /Booked Hotel.*marketplace/.test(x)) && res.rejected.some(x => /Wrong Category Hotel.*categories/.test(x))); pass("booking sites refused as sources; hotel research adds only hotels");
{ const hv = T.intel.find(i => i.key === "services-hotels").value; assert(hv.airportsLeft === 27); } pass("crew hotels keep their own progress");

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
  const e = engine({ prospects: { x1: { org: "Op", kind: "operator", status: "new", region: "Asia-Pacific", country: "Singapore" }, x3: { org: "Svc", kind: "service", status: "new", region: "Asia-Pacific", country: "Singapore" }, x2: { org: "Client", kind: "client", status: "new", region: "Asia-Pacific", country: "Singapore" } }, roster, leads: {}, trips: [] }, {}, new Date().toISOString());
  assert(e.writes.some(w => JSON.stringify(w).includes("x2")) && !e.writes.some(w => JSON.stringify(w).includes("x1")) && !e.writes.some(w => JSON.stringify(w).includes("x3"))); }
pass("operators and service partners are never rotated to brokers (client assigned, suppliers left alone)");

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

// contacts sweep: opt-outs, 12-month limit, brokers' contacts copied to the shared prospect
{ const old = new Date(Date.now() - 400 * 864e5).toISOString();
  T.prospects.find(p => p.id === "p002").data.contacts = [{ name: "Stale Person", role: "Director", added: old }, { name: "Fresh Person", role: "Director", added: new Date().toISOString() }];
  T.leads.push({ owner_id: BRK, id: "p002", data: { org: "Example Org 2", contacts: [{ name: "Broker Found", role: "Travel manager", email: "travel@org2.example", added: new Date().toISOString() }, { name: "Opted", role: "x", email: "gone@good-yachts.example", added: new Date().toISOString() }], log: [] } });
  const r = await sweep(db, quiet);
  const p2 = T.prospects.find(p => p.id === "p002").data;
  assert.deepStrictEqual(p2.contacts.map(c => c.name).sort(), ["Broker Found", "Fresh Person"]); assert(r.removed >= 2 && r.merged === 1);
  assert(!T.leads.find(l => l.id === "p002").data.contacts.some(c => c.name === "Opted")); }
pass("contacts older than 12 months without contact and opted-out contacts removed everywhere; broker's contact copied to the prospect");

// backup
const counts = await backup.run(db, "/tmp/backup-test.json", quiet);
assert(counts.prospects === 19 && existsSync("/tmp/backup-test.json")); pass("backup holds every table"); unlinkSync("/tmp/backup-test.json");
console.log(`\n${ok} checks passed`);
