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
    del: async k => { delete D[k]; },
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
// supplier clean-up (Morten, 9 Nov 2026): one record per company, wrong types out, everything archived first
{ const { fixRecords } = await import("./prospectagent.mjs");
  const db = mk({ "prospects/p1": { org: "Example FBO Singapore", kind: "service", category: "FBO and ground handling", airports: ["WSSL"], avenues: [{ type: "website", url: "https://fbo-example.test/" }], contacts: [{ name: "A Example" }], source: "https://fbo-example.test/", website: "https://fbo-example.test/" },
    "prospects/p2": { org: "Example FBO Dubai", kind: "service", category: "FBO and ground handling", airports: ["OMDB"], contacts: [{ name: "B Example" }], source: "https://www.facebook.com/x", website: "" },
    "prospects/p3": { org: "Example Airline Handler", kind: "service", category: "FBO and ground handling", airports: ["RJTT"] },
    "prospects/p4": { org: "Example Resort", kind: "service", category: "Crew hotels", airports: ["VTSP"], hotel: { minutes: 30 } },
    "prospects/p5": { org: "Example Business Aviation Centre", kind: "client", segment: "Service partner" },
    "prospects/p6": { org: "Kappa Example FBO", kind: "service", category: "FBO and ground handling", source: "https://www.businessairnews.com/x", website: "https://fbo-example.test/", airports: ["WSSS"] } });
  const r = await fixRecords(db, { merge: [{ keep: "p1", drop: ["p2"], org: "Example FBO" }], remove: [{ ref: "p3", why: "airline ground handler" }], recat: [{ ref: "p4", category: "Hotels and resorts" }],
    move: [{ ref: "Example Business Aviation Centre", category: "FBO and ground handling", airports: ["WSSL"] }], recheck: true }, { fetchFn: async u => String(u).includes("fbo-example") ? { ok: true, text: async () => "Kappa Example FBO and Example FBO" } : { ok: false, text: async () => "" }, now: mon9 });
  const D = db.D, arch = D["intel/cleanup-2026-11-09"];
  ok("clean-up: duplicates become one record with every airport and contact", D["prospects/p1"].org === "Example FBO" && D["prospects/p1"].airports.join() === "WSSL,OMDB" && D["prospects/p1"].contacts.length === 2 && !D["prospects/p2"]);
  ok("clean-up: wrong type removed, resort moved to Hotels and resorts, supplier moved out of the client list", !D["prospects/p3"] && D["prospects/p4"].category === "Hotels and resorts" && !D["prospects/p4"].hotel && D["prospects/p5"].kind === "service");
  ok("clean-up: a weak source is replaced by the company's own site when it names the company", D["prospects/p6"].source === "https://fbo-example.test/");
  ok("clean-up: every changed or removed record is archived in full", arch && arch.archive.some(a => a.id === "p3" && a.data.org === "Example Airline Handler") && arch.archive.some(a => a.id === "p2") && r.merged === 1 && r.removed === 1); }
// operators from the audit registries (Morten, 9 Nov 2026): one record per operator, filters, nothing from excluded places
{ const { run: opsRun, countryOf } = await import("./operators.mjs");
  const ix = { at: "2026-11-09", sources: { ARGUS: { url: "https://argus.example/registry" }, WYVERN: { url: "https://wyvern.example/dir" } }, entries: [
    { prog: "ARGUS", level: "Platinum", name: "Example Jets LLC", norm: "example jets" },
    { prog: "WYVERN", level: "Wingman", name: "Example Jets", norm: "example jets", cert: "EX1J123", base: "Teterboro, NJ" },
    { prog: "WYVERN", level: "Wingman", name: "Example Holder Aviation", norm: "example holder aviation", cert: "EX2", base: "Geneva, CH", holderOf: "Example Trading Air" },
    { prog: "WYVERN", level: "Wingman", name: "Example Trading Air", norm: "example trading air", cert: "EX2", base: "Geneva, CH" },
    { prog: "ARGUS", level: "Gold", name: "Example Listed Air", norm: "example listed air" },
    { prog: "WYVERN", level: "Wingman", name: "Example Tehran Jets", norm: "example tehran jets", cert: "X", base: "Tehran, Iran" },
    { prog: "ARGUS", level: "Gold", name: "Known Example Charter", norm: "known example charter" } ] };
  const db = mk({ "prospects/p010": { org: "Known Example Charter", kind: "operator", ops: { audits: [{ name: "IS-BAH", level: "Stage 2", url: "https://x" }] } },
    "prospects/p011": { org: "Gone Example Air", kind: "operator", origin: "registry", ops: { flags: [] } } });
  const r = await opsRun(db, { ix, lists: { names: new Map([["example listed air", "Example list"]]) }, now: mon9, log: () => {} });
  const P = Object.values(db.D).filter(x => x && x.kind === "operator"), by = n => P.find(x => x.org === n);
  ok("registry operators added, one per operator, with programme, level, certificate number and base", by("Example Jets LLC") && by("Example Jets LLC").ops.audits.length === 2 && by("Example Jets LLC").ops.aoc.number === "EX1J123" && by("Example Jets LLC").country === "United States" && by("Example Jets LLC").region === "North America", by("Example Jets LLC"));
  ok("certificate holder and trading name are one operator", P.filter(x => x.org === "Example Trading Air").length === 1 && !by("Example Holder Aviation") && by("Example Trading Air").country === "Switzerland" && by("Example Trading Air").ops.aliases.includes("Example Holder Aviation"));
  ok("nothing from an excluded or sanctioned place; a possible match is held", !by("Example Tehran Jets") && by("Example Listed Air") && by("Example Listed Air").status === "review");
  ok("every new operator is marked: certificate and insurance to confirm before the first booking", by("Example Jets LLC").ops.flags.some(f => /certificate and insurance to confirm/.test(f)));
  ok("an existing operator keeps its own audits and gets the registry level added", by("Known Example Charter").ops.audits.some(a => a.name === "IS-BAH") && by("Known Example Charter").ops.audits.some(a => a.name === "ARGUS" && a.registry));
  ok("an operator no longer listed is flagged, not deleted", db.D["prospects/p011"] && db.D["prospects/p011"].ops.flags.some(f => /No longer listed/.test(f)) && r.added === 3);
  ok("country from the registry base", countryOf("London, United Kingdom") === "United Kingdom" && countryOf("") === ""); }
// guest services, each in its own section (Morten, 9 Nov 2026)
{ Object.assign(PAGES, { "https://resort-example.test/": "<p>Sigma Example Resort, a five-star resort in Phuket.</p>", "https://inn-example.test/": "<p>Tau Example Inn, rooms near the beach.</p>",
    "https://limo-example.test/": "<p>Upsilon Example Limousines: chauffeur service from the airport.</p>", "https://heli-example.test/": "<p>Phi Example Helicopters, helicopter transfers.</p>",
    "https://caa-example.test/heli": "<p>Phi Example Helicopters holds operator certificate H-1.</p>", "https://chi-example.test/": "<p>Chi Example Helicopters, helicopter flights.</p>",
    "https://yacht-example.test/": "<p>Psi Example Yachts: crewed yacht charter.</p>" });
  const db = mk(base);
  const r = await importBatch(db, { suppliers: {
    guest: { VTSP: [{ org: "Sigma Example Resort", category: "Hotels and resorts", country: "Thailand", website: "https://resort-example.test/", source: "https://resort-example.test/" }, { org: "Tau Example Inn", category: "Hotels and resorts", country: "Thailand", source: "https://inn-example.test/" }] },
    ground: { VTSP: [{ org: "Upsilon Example Limousines", category: "Limousine and chauffeur", country: "Thailand", source: "https://limo-example.test/" }] },
    heli: { VTSP: [{ org: "Phi Example Helicopters", category: "Helicopter transfers", country: "Thailand", source: "https://heli-example.test/", aoc_authority: "CAAT", aoc_source: "https://caa-example.test/heli" }, { org: "Chi Example Helicopters", category: "Helicopter transfers", country: "Thailand", source: "https://chi-example.test/" }] },
    yacht: { VTSP: [{ org: "Psi Example Yachts", category: "Yacht charter", country: "Thailand", source: "https://yacht-example.test/" }] } } }, { fetchFn, lists, now: mon9 });
  const P = Object.values(db.D), has = n => P.some(x => x && x.org === n);
  ok("guest hotels: five-star or luxury shown on the page is kept; a plain inn is rejected", has("Sigma Example Resort") && !has("Tau Example Inn") && r.rejected.some(x => /Tau Example Inn.*five-star/.test(x)), r.rejected);
  ok("limousine with chauffeur service, yacht charter: kept in their own categories with what to confirm", has("Upsilon Example Limousines") && P.find(x => x && x.org === "Psi Example Yachts").flags.some(f => /licence and insurance/.test(f)));
  ok("helicopters need an operator certificate in a source", has("Phi Example Helicopters") && !has("Chi Example Helicopters") && P.find(x => x && x.org === "Phi Example Helicopters").aoc.authority === "CAAT");
  ok("each section keeps its own progress", db.D["intel/services-guest"].covered.includes("VTSP") && db.D["intel/services-yacht"].covered.includes("VTSP")); }
// registry operators completed by the research agent: only blank fields, only from pages that name the operator
{ Object.assign(PAGES, { "https://omega-example.test/": "<p>Omega Example Jets, Teterboro. Fleet: Challenger 350 x3</p>", "https://faa-example.test/omega": "<p>Omega Example Jets certificate OEJA123</p>" });
  const db = mk({ ...base, "prospects/p020": { org: "Omega Example Jets", kind: "operator", origin: "registry", country: "", city: "Teterboro, NJ", ops: { aoc: { number: "OEJA123" }, flags: ["Country to confirm."] } } });
  const p = await plan(db, mon9); ok("plan lists registry operators to complete", p.opsToComplete.some(x => x.id === "p020"));
  await importBatch(db, { opsComplete: { p020: { website: "https://omega-example.test/", country: "United States", region: "North America", country_source: "https://omega-example.test/", aoc_authority: "FAA", aoc_source: "https://faa-example.test/omega", fleet: [{ type: "Challenger 350", count: 3 }], fleet_source: "https://omega-example.test/" } } }, { fetchFn, lists, now: mon9 });
  const d = db.D["prospects/p020"];
  ok("registry operator completed: website, country, certificate source and fleet, flag cleared", d.website && d.country === "United States" && d.ops.aoc.source && d.ops.fleet.length === 1 && d.completed && !d.ops.flags.includes("Country to confirm."), d); }
// official AOC list (UK CAA, the authority's own file; fixture of 2 Nov 2026): reader and import
{ const { parseUkCaa, run: opsRun } = await import("./operators.mjs"); const { readFileSync } = await import("fs");
  const rows = parseUkCaa(readFileSync(new URL("./fixtures/ukcaa-aoc-2026-11-02.txt", import.meta.url), "utf8"));
  ok("UK CAA list read in full: about 100 certificate holders with AOC numbers and aircraft", rows.length >= 100 && rows.every(r => /^\d{4}$/.test(r.aoc)) && rows.some(r => /^VOLUXIS/.test(r.company) && r.aoc === "0851"), rows.length);
  const db = mk({ "prospects/p030": { org: "Voluxis Limited", kind: "operator", origin: "registry", ops: { aoc: {}, flags: ["From an audit registry: certificate and insurance to confirm before the first booking."] } } });
  const r = await opsRun(db, { ix: { entries: [], sources: {} }, lists: { names: new Map() }, now: mon9, log: () => {}, aoc: { "UK CAA": { url: "https://caa.example/list.pdf", rows } } });
  const P = Object.values(db.D);
  ok("jet operators added with the certificate from the authority's list; airlines and air ambulances left out", r.aocAdded >= 15 && P.some(x => x && x.kind === "operator" && /Netjets/i.test(x.org) && x.ops.aoc.authority === "UK CAA") && !P.some(x => x && /Air Ambulance|Wizz Air/i.test(x.org)), r);
  ok("an operator already listed gets its certificate confirmed, keeping only insurance to confirm", db.D["prospects/p030"].ops.aoc.number === "0851" && !db.D["prospects/p030"].ops.flags.some(f => /certificate and insurance/.test(f)));
  ok("helicopter operators go to the Helicopters section of service partners", r.heliAdded > 0 && P.some(x => x && x.kind === "service" && x.category === "Helicopter transfers" && x.aoc && x.aoc.authority === "UK CAA")); }
