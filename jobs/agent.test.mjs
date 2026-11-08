// Research agent (Morten, 8 Nov 2026: research by a Claude scheduled task, no AI here; every finding must pass the
// checks). Schedule, plan, and the import checks with an in-memory database, fake pages and a fake sanctions list.
// Example data only. Run: node agent.test.mjs
import { gzipSync } from "zlib";
import { due } from "./agent.mjs";
import { plan, importBatch, decode, names, excludedPlace } from "./prospectagent.mjs";
import { keygen, seal, open } from "./agentcrypt.mjs";
const ok = (k, v, x) => { console.log((v ? "PASS " : "FAIL ") + k + (v || x === undefined ? "" : "  -> " + JSON.stringify(x).slice(0, 400))); if (!v) process.exitCode = 1; };

// schedule
const mon9 = new Date("2026-11-09T03:00:00Z");   // Monday 10:00 Bangkok
ok("off: never due", !due({ on: false }, null, mon9));
ok("daily: due once a day from 06:00 Bangkok", due({ on: true }, "2026-11-08T03:00:00Z", mon9) && !due({ on: true }, "2026-11-09T00:30:00Z", mon9) && !due({ on: true }, null, new Date("2026-11-08T22:00:00Z")));
ok("weekdays: not on Sunday", !due({ on: true, freq: "weekdays" }, null, new Date("2026-11-08T03:00:00Z")) && due({ on: true, freq: "weekdays" }, null, mon9));
ok("weekly: Mondays", due({ on: true, freq: "weekly" }, "2026-11-02T03:00:00Z", mon9) && !due({ on: true, freq: "weekly" }, "2026-11-06T03:00:00Z", new Date("2026-11-07T03:00:00Z")));

// in-memory database
const mk = docs => { const D = JSON.parse(JSON.stringify(docs));
  return { D, get: async k => D[k] || null, set: async (k, v) => { D[k] = JSON.parse(JSON.stringify(v)); },
    all: async c => { const pre = c === "owner_prospects" ? "owner" : c; return Object.entries(D).filter(([k]) => k.startsWith(pre + "/") && k.split("/").length === 2).map(([k, v]) => ({ id: k.split("/")[1], data: v })); }, now: () => "2026-11-09T03:00:00.000Z" }; };
const base = { "intel/agent": { on: true, freq: "daily", focus: ["Example focus A", "Example focus B"] }, "intel/status": { focusIndex: 1 },
  "prospects/p007": { org: "Known Example Travel", website: "https://known-example.test", status: "new", avenues: [] } };

// plan
{ const db = mk(base); const p = await plan(db, mon9);
  ok("plan: due, today's focus from the Director's list, known names and bare prospects", p.due && p.focus === "Example focus B" && p.known.includes("Known Example Travel") && p.bare.length === 1 && p.bare[0].id === "p007", p); }
{ const db = mk({ ...base, "intel/agent": { on: false } }); const p = await plan(db, mon9); ok("plan: switched off says so", !p.due && /off/.test(p.reason)); }

// pages: what each address shows (anything else does not open)
const PAGES = {
  "https://alpha-example.test/": "<h1>Alpha Example Concierge</h1><p>Private travel for families.</p>",
  "https://alpha-example.test/about": "<p>Alpha Example Concierge, Singapore.</p>",
  "https://alpha-example.test/team": "<p>Jane Example, Head of Travel, jane@alpha-example.test</p>",
  "https://news-example.test/story": "<p>The Beta Example Yachts group opens in Monaco.</p>",
  "https://news-example.test/gamma": "<p>Nothing about them here.</p>",
  "https://op-example.test/": "<p>Delta Example Aviation, business jet charter, AOC CAAS.</p>",
  "https://caas-example.test/aoc": "<p>AOC holders: Delta Example Aviation</p>",
  "https://op-example.test/fleet": "<p>Fleet: Challenger 650 x2</p>",
  "https://known-example.test/contact": "<p>Contact us</p>",
  "https://listed-example.test/": "<p>Sanctioned Example Trading</p>",
};
const fetchFn = async u => { const k = String(u); const t = PAGES[k] ?? PAGES[k.replace(/\/$/, "")] ?? PAGES[k + "/"]; return t === undefined ? { ok: false, text: async () => "" } : { ok: true, text: async () => t }; };
const lists = { names: new Map([["sanctioned example trading", "Example list"]]), loaded: ["Example list (1)"], failed: [] };
const batch = { focus: "Example focus B",
  orgs: [
    { org: "Alpha Example Concierge", kind: "client", segment: "Luxury travel & concierge", region: "Asia-Pacific", country: "Singapore", website: "https://alpha-example.test/", source: "https://alpha-example.test/about", why: "Example.", approach: "Example.",
      avenues: [{ type: "contact", label: "Contact", url: "https://alpha-example.test/contact" }, { type: "instagram", label: "IG", url: "https://social-example.test/alpha" }],
      contacts: [{ name: "Jane Example", role: "Head of Travel", email: "jane@alpha-example.test", url: "https://alpha-example.test/team" },
                 { name: "John Nobody", role: "CEO", email: "john@gmail.com", url: "https://alpha-example.test/team" }] },
    { org: "Beta Example Yachts", kind: "partner", country: "Monaco", source: "https://news-example.test/story" },
    { org: "Gamma Example Events", kind: "client", country: "UAE", source: "https://news-example.test/gamma" },
    { org: "Known Example Travel", kind: "client", country: "Singapore", source: "https://known-example.test/contact" },
    { org: "Epsilon Example Tours", kind: "client", country: "Iran", source: "https://alpha-example.test/" },
    { org: "Zeta Example Jets", kind: "client", country: "Singapore", source: "https://www.avinode.com/zeta" },
    { org: "Mr John Example", kind: "client", country: "Singapore", source: "https://alpha-example.test/" },
    { org: "Sanctioned Example Trading", kind: "client", country: "Singapore", source: "https://listed-example.test/" },
  ],
  operators: [
    { org: "Delta Example Aviation", country: "Singapore", website: "https://op-example.test/", source: "https://op-example.test/", aoc_authority: "CAAS", aoc_source: "https://caas-example.test/aoc",
      fleet: [{ type: "Challenger 650", count: 2 }], fleet_source: "https://op-example.test/fleet", audits: [], safety: [], owners: [], eu_air_safety_list: false },
    { org: "Theta Example Air", country: "Singapore", source: "https://news-example.test/story" },
  ],
  routes: { p007: [{ type: "contact", label: "Contact", url: "https://known-example.test/contact" }, { type: "x", label: "X", url: "https://nowhere-example.test/x" }] } };

{ const db = mk(base);
  const r = await importBatch(db, batch, { fetchFn, lists, now: mon9 });
  const P = Object.entries(db.D).filter(([k]) => k.startsWith("prospects/")).map(([, v]) => v), by = n => P.find(p => p.org === n);
  const rej = n => r.rejected.find(x => x.startsWith(n)) || "";
  ok("organisation with a source page that names it is added, marked as the agent's", !!by("Alpha Example Concierge") && by("Alpha Example Concierge").batch === "Research agent 2026-11-09" && by("Alpha Example Concierge").addedBy === "research agent");
  ok("a source on another site that names the organisation counts", !!by("Beta Example Yachts"));
  ok("a source page that does not name the organisation is rejected", !by("Gamma Example Events") && /does not name/.test(rej("Gamma")), r.rejected);
  ok("already known is rejected", /already known/.test(rej("Known Example Travel")));
  ok("excluded or sanctioned country is rejected", /excluded or sanctioned place/.test(rej("Epsilon")));
  ok("a marketplace as source is rejected", /marketplace/.test(rej("Zeta")));
  ok("a private person is rejected", /private person/.test(rej("Mr John")));
  ok("a possible sanctions match is held for the Director, not contacted", by("Sanctioned Example Trading") && by("Sanctioned Example Trading").status === "review" && r.held.includes("Sanctioned Example Trading"));
  const a = by("Alpha Example Concierge");
  ok("contact routes: own site kept, an address that does not open dropped", a.avenues.length === 1 && a.avenues[0].url === "https://alpha-example.test/contact", a.avenues);
  ok("named contact kept only when the organisation's own page shows the name and work email; webmail dropped", a.contacts.length === 1 && a.contacts[0].name === "Jane Example", a.contacts);
  ok("every new organisation is sanctions-screened", a.screen && a.screen.auto && a.screen.auto.result === "no match");
  ok("operator with certificate, own pages and fleet is added", !!by("Delta Example Aviation") && by("Delta Example Aviation").kind === "operator" && by("Delta Example Aviation").ops.aoc.source === "https://caas-example.test/aoc");
  ok("operator without a certificate is rejected", /operator\): (no Air Operator Certificate|source page)/.test(rej("Theta")), r.rejected);
  ok("contact routes added to a prospect that had none; status untouched", db.D["prospects/p007"].avenues.length === 1 && db.D["prospects/p007"].status === "new");
  ok("result recorded for the portal, focus moves on", db.D["intel/agent"].last.added === 3 && db.D["intel/agent"].last.operators === 1 && db.D["intel/agent"].last.rejected === r.rejected.length && db.D["intel/status"].focusIndex === 2, db.D["intel/agent"].last); }
{ const db = mk(base); const before = JSON.stringify(db.D);
  await importBatch(db, batch, { fetchFn, lists, now: mon9, dry: true }); ok("dry run writes nothing", JSON.stringify(db.D) === before); }
ok("batch arrives gzip + base64 or as plain JSON", decode(gzipSync(Buffer.from('{"orgs":[]}')).toString("base64")).orgs.length === 0 && decode('{"orgs":[1]}').orgs.length === 1);
ok("page check: name, distinctive words, not a stranger", names("the alpha example concierge team", "Alpha Example Concierge Pte Ltd") && !names("other text", "Alpha Example Concierge"));
ok("excluded list includes Morten's countries", excludedPlace({ country: "Venezuela" }) && excludedPlace({ country: "Russia" }) && !excludedPlace({ country: "Singapore" }));

// suppliers and investors (Morten, 8 Nov 2026: the same agent for the investor and supplier research)
Object.assign(PAGES, {
  "https://fbo-example.test/": "<p>Kappa Example FBO, business aviation handling at Singapore Seletar. IS-BAH Stage 2.</p>",
  "https://isbah-example.test/reg": "<p>IS-BAH registered: Kappa Example FBO, Stage 2, 2025</p>",
  "https://hotel-example.test/": "<p>Lambda Example Hotel, 10 minutes from the airport, own airport shuttle for crews.</p>",
  "https://fund-example.test/": "<p>Mu Example Aviation Capital finances business jets and aircraft leasing.</p>",
  "https://fund-example.test/deals": "<p>Mu Example Aviation Capital financed two business jets in 2025.</p>",
  "https://nu-example.test/about": "<p>Nu Example Family Office invests in real assets.</p>",
});
{ const db = mk({ ...base, "owner/i004": { org: "Omicron Example Partners", status: "new" }, "owner/_status": { focusIndex: 2, lastRun: "2026-10-30T00:00:00Z" } });
  const p = await plan(db, mon9);
  ok("plan: supplier airports for each set and the weekly investor part with profiles to complete", p.suppliers.core.airports.length === 5 && p.suppliers.hotels.airports.length === 5 && p.investors && p.investors.known.includes("Omicron Example Partners") && p.investors.profile[0].id === "i004", p.suppliers);
  const b2 = { focus: "x",
    suppliers: { core: { WSSL: [
      { org: "Kappa Example FBO", category: "FBO and ground handling", country: "Singapore", website: "https://fbo-example.test/", source: "https://fbo-example.test/", isbah: { level: "Stage 2", year: "2025", url: "https://isbah-example.test/reg" } },
      { org: "Xi Example Handling", category: "FBO and ground handling", country: "Singapore", source: "https://news-example.test/gamma" } ] },
      hotels: { WSSL: [ { org: "Lambda Example Hotel", category: "Crew hotels", type: "hotel", minutes: 10, minutes_url: "https://hotel-example.test/", shuttle: { desc: "Own crew shuttle", url: "https://hotel-example.test/" }, country: "Singapore", website: "https://hotel-example.test/", source: "https://hotel-example.test/" },
                        { org: "Pi Example Hotel", category: "Crew hotels", type: "hotel", minutes: 40, minutes_url: "https://hotel-example.test/", shuttle: { desc: "x", url: "https://hotel-example.test/" }, country: "Singapore", source: "https://hotel-example.test/" } ] } },
    investors: { items: [
      { org: "Mu Example Aviation Capital", track: "Aviation lender or lessor", for: "Navoryx aircraft notes", country: "Singapore", website: "https://fund-example.test/", source: "https://fund-example.test/", evidence: [{ summary: "Financed two jets", url: "https://fund-example.test/deals" }], aviation: "direct", interests: ["Aviation"], ticket: "USD 1–10m", geo: ["Asia-Pacific"] },
      { org: "Omicron Example Partners", country: "Singapore", source: "https://fund-example.test/" },
      { org: "Rho Example Office", country: "Iran", source: "https://fund-example.test/" } ],
      profiles: { i004: { aviation: "indirect", interests: ["Real assets"], ticket: "Unknown", geo: ["Global"], evidence: [] } } } };
  const logs = []; const r = await importBatch(db, b2, { fetchFn, lists, now: mon9, log: x => logs.push(x) });
  const P = Object.values(db.D);
  ok("supplier with a source that names it is added, with its airport; IS-BAH evidence kept", P.some(x => x.org === "Kappa Example FBO" && x.kind === "service" && x.airports[0] === "WSSL" && x.isbah));
  ok("supplier whose source does not name it is rejected", !P.some(x => x.org === "Xi Example Handling") && r.rejected.some(x => /Xi Example.*does not/.test(x)));
  ok("crew hotel within 15 minutes with its own shuttle kept; one 40 minutes away rejected", P.some(x => x.org === "Lambda Example Hotel") && r.rejected.some(x => /Pi Example Hotel.*15 minutes/.test(x)));
  ok("airport marked covered for each set", db.D["intel/services"].covered.includes("WSSL") && db.D["intel/services-hotels"].covered.includes("WSSL"));
  ok("investor added to the Director-only list with fit score and screen", db.D["owner/i005"] && db.D["owner/i005"].org === "Mu Example Aviation Capital" && db.D["owner/i005"].score > 0 && db.D["owner/i005"].screen.auto.result === "no match");
  ok("known investor and excluded country rejected; profile added to the existing record", !db.D["owner/i006"] && db.D["owner/_status"].rejected.length === 2 && !!db.D["owner/i004"].profile);
  ok("no investor name in the job's log or in the shared result", !logs.join(" ").includes("Mu Example") && !logs.join(" ").includes("Omicron") && !JSON.stringify(db.D["intel/agent"]).includes("Mu Example") && !JSON.stringify(db.D["intel/status"]).includes("Mu Example"));
  const p2 = await plan(db, new Date("2026-11-10T03:00:00Z")); ok("investors wait a week after a run", p2.investors === null); }
{ const k = keygen(), msg = { investors: { items: [{ org: "Sealed Example" }] } }, s = seal(msg, Buffer.from(k.publicKey).toString("base64"));
  ok("sealed hand-over opens only with the right key and shows no names", !s.includes("Sealed Example") && open(s, k.privateKey).investors.items[0].org === "Sealed Example" && (() => { try { open(s, keygen().privateKey); return false; } catch { return true; } })()); }
// global supplier airports (Morten, 8 Nov 2026: "we need to operate globally"): airports already done are not repeated
{ const { AIRPORTS } = await import("./services.mjs");
  ok("supplier airports: the global business-airport list (over 100, several continents), Phnom Penh kept", AIRPORTS.length > 100 && AIRPORTS.some(a => a[0] === "LFPB") && AIRPORTS.some(a => a[0] === "KTEB") && AIRPORTS.some(a => a[0] === "FAOR") && AIRPORTS.some(a => a[0] === "VDPP"));
  const db = mk({ ...base, "intel/services": { pausedUntil: "2026-12-01T00:00:00Z", covered: [] }, "prospects/p050": { org: "Old Example FBO", kind: "service", category: "FBO and ground handling", airports: ["LFPB", "EGLF"] } });
  const p = await plan(db, mon9);
  ok("a longer airport list ends the old 30-day pause and skips airports already done", p.suppliers.core.airports.length === 5 && !p.suppliers.core.airports.some(a => a.icao === "LFPB" || a.icao === "EGLF"), p.suppliers.core); }
