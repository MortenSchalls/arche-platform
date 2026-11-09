// Operators from official and audit lists (Morten, 9 Nov 2026: "out of thousands of operators, 6 seems like nothing";
// "yes, but with clear filtering options for our purposes"). No AI. Daily after the audit registry read (audits.mjs):
//   1. every operator in the ARGUS and WYVERN registries (registries/index.json): one record per operator, with the
//      programme and level, the certificate number and base where the registry gives them
//   2. official AOC lists of civil aviation authorities (AOC_LISTS below), read from the authority's own file
// Each new operator is screened against the sanctions index, never added from an excluded or sanctioned country, and
// marked "certificate and insurance to confirm before the first booking"; the research agent completes country, fleet
// and certificate details over time. An operator that leaves a list is flagged, never deleted. Existing records only get
// their list entries refreshed. Filters in the portal: region, country, list, audit programme and level, aircraft.
import { readFileSync } from "fs";
import { connect } from "./lib/db.mjs";
import { screen } from "./lib/sanctions.mjs";
import { normName, opTier } from "./intel.mjs";
import { excludedPlace } from "./prospectagent.mjs";

const AP = JSON.parse(readFileSync(new URL("../apps/portal/airports.json", import.meta.url), "utf8"));
const COUNTRIES = Object.entries(AP.c).map(([iso, name]) => [iso, name]);
const US_STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" ");
const CA_PROV = "AB BC MB NB NL NS NT NU ON PE QC SK YT".split(" ");
// the portal's regions (intel.mjs REGIONS), by country
const R_LISTS = {
  "North America": "US CA BM GL PM".split(" "),
  "Latin America": "MX GT BZ SV HN NI CR PA CU JM HT DO PR BS BB TT AG DM GD KN LC VC AW CW SX BQ KY TC VG VI AI MS MF BL GP MQ CO VE EC PE BO BR PY UY AR CL GY SR GF FK".split(" "),
  "Europe": "GB IE IS NO SE FI DK DE NL BE LU FR MC CH LI AT IT SM VA MT ES AD PT GR CY PL CZ SK HU SI HR BA RS ME MK AL XK RO BG MD UA BY LT LV EE RU GI IM JE GG FO AX".split(" "),
  "Middle East": "AE SA QA KW BH OM YE JO LB SY IQ IR IL PS TR".split(" "),
  "Africa": "EG LY TN DZ MA EH MR ML NE TD SD SS ER DJ ET SO KE UG RW BI TZ MZ MW ZM ZW BW NA ZA LS SZ MG MU SC KM RE YT AO CD CG GA GQ CM CF NG BJ TG GH CI LR SL GN GW SN GM CV ST BF".split(" ") };
const REGION_OF = iso => Object.entries(R_LISTS).find(([, l]) => l.includes(iso))?.[0] || (iso ? "Asia-Pacific" : "Global");
// country from a base as the registry writes it ("Teterboro, NJ", "London, United Kingdom", "Geneva, CH"); "" if unclear
export function countryOf(base) {
  const b = String(base || "").trim(); if (!b) return "";
  const parts = b.split(/,\s*/).map(x => x.trim()).filter(Boolean), last = parts[parts.length - 1] || "";
  const byName = COUNTRIES.find(([, n]) => n.toLowerCase() === last.toLowerCase()) || COUNTRIES.find(([, n]) => b.toLowerCase().includes(n.toLowerCase()) && n.length > 4);
  if (byName) return byName[1];
  if (/^(usa|us|united states of america)$/i.test(last) || US_STATES.includes(last.toUpperCase()) && parts.length > 1) return "United States";
  if (CA_PROV.includes(last.toUpperCase()) && parts.length > 1) return "Canada";
  if (/^uk$/i.test(last)) return "United Kingdom";
  const iso = COUNTRIES.find(([i]) => i === last.toUpperCase()); if (iso && parts.length > 1) return iso[1];
  // a city alone: the country of the airports in that city, when they all agree
  const cs = [...new Set(AP.a.filter(x => String(x[3] || "").toLowerCase() === parts[0].toLowerCase()).map(x => x[4]))];
  return cs.length === 1 ? (AP.c[cs[0]] || "") : "";
}
const isoOf = name => (COUNTRIES.find(([, n]) => n === name) || [""])[0];

// official AOC lists, read from the authority's own published file (added one by one, each with its own reader)
export const AOC_LISTS = [];

export async function run(db = connect(), { log = console.log, now = new Date(), dry = false, ix = null, lists = null } = {}) {
  const nowIso = now.toISOString(), today = nowIso.slice(0, 10);
  if (!ix) { const { data, error } = await db.sb.storage.from("registries").download("index.json"); if (error) throw new Error("registries index: " + error.message); ix = JSON.parse(await data.text()); }
  if (!lists) { try { const { data } = await db.sb.storage.from("sanctions").download("index.json"); const s = JSON.parse(await data.text()); lists = { names: new Map(Object.entries(s.names || {})) }; } catch { lists = { names: new Map() }; } }
  // one operator per certificate (WYVERN) or name; a certificate holder's trading name is kept as an alias
  const ops = new Map();
  for (const e of ix.entries || []) {
    const key = e.holderOf ? normName(e.holderOf) : e.norm; const prog = e.prog, url = ((ix.sources || {})[prog] || {}).url || "";
    const o = ops.get(key) || { org: e.holderOf || e.name, aliases: [], lists: [], cert: "", base: "" };
    if (e.holderOf) o.aliases.push(e.name); else if (o.org !== e.name) o.aliases.push(e.name);
    o.lists.push({ name: prog, level: e.level, url, checked: today }); if (e.cert) o.cert = e.cert; if (e.base) o.base = e.base;
    ops.set(key, o);
  }
  for (const o of ops.values()) { o.lists = o.lists.filter((x, i, a) => a.findIndex(y => y.name === x.name) === i); o.aliases = [...new Set(o.aliases)].filter(a => a !== o.org).slice(0, 4); }
  const rows = await db.all("prospects"), byName = new Map();
  for (const r of rows) { byName.set(normName(r.data.org), r); for (const a of (r.data.ops && r.data.ops.aliases) || []) byName.set(normName(a), r); }
  const done = { added: 0, refreshed: 0, left: 0, excluded: 0, held: 0 }, seenIds = new Set();
  let next = rows.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
  for (const o of ops.values()) {
    const country = countryOf(o.base), bad = excludedPlace({ country, org: o.org, city: o.base });
    if (bad) { done.excluded++; continue; }
    const audits = o.lists.map(l => ({ name: l.name, level: l.level, year: today.slice(0, 4), url: l.url, registry: true }));
    const ex = byName.get(normName(o.org)) || o.aliases.map(a => byName.get(normName(a))).find(Boolean);
    if (ex) {
      seenIds.add(ex.id); if (ex.data.kind !== "operator") continue;
      const ops0 = ex.data.ops || {}, kept = (ops0.audits || []).filter(a => !a.registry);
      const d = { ...ex.data, lists: o.lists, ops: { ...ops0, audits: [...kept, ...audits], tier: opTier([...kept, ...audits]), aliases: [...new Set([...(ops0.aliases || []), ...o.aliases])].slice(0, 6),
        aoc: { ...(ops0.aoc || {}), ...(o.cert && !(ops0.aoc || {}).number ? { number: o.cert } : {}) }, flags: (ops0.flags || []).filter(f => !/^No longer listed/.test(f)) } };
      if (!dry) await db.set("prospects/" + ex.id, d); done.refreshed++; continue;
    }
    const hits = lists.names.size ? screen([o.org, ...o.aliases], lists) : [];
    const rec = { org: o.org, segment: "Operator", kind: "operator", region: country ? REGION_OF(isoOf(country)) : "Global", country, province: "", city: o.base, website: "", source: o.lists[0].url,
      why: `Listed in the ${o.lists.map(l => l.name + " registry (" + l.level + ")").join(" and ")} on ${today}.`, approach: "Ask for the Air Operator Certificate, fleet list and insurance certificate before the first quote.",
      status: hits.length ? "review" : "new", avenues: [], contacts: [], lists: o.lists, origin: "registry", added: nowIso, batch: `Audit registries ${today}`, addedBy: "registry import",
      ops: { aoc: { authority: "", number: o.cert || "", source: "" }, aliases: o.aliases, bases: o.base ? [o.base] : [], fleet: [], fleetSource: "", audits, safety: [], enforcement: [], owners: [], insurance: null,
        euAirSafetyList: "to check", founded: "", tier: opTier(audits),
        flags: ["From an audit registry: certificate and insurance to confirm before the first booking.", ...(country ? [] : ["Country to confirm."]), ...(hits.length ? ["Possible sanctions match: check the names against the list before any contact."] : [])],
        screen: { auto: { result: lists.names.size ? (hits.length ? "possible match" : "no match") : "not screened", at: nowIso, hits } } } };
    next++; const id = "p" + String(next).padStart(3, "0"); if (!dry) await db.set("prospects/" + id, rec); byName.set(normName(rec.org), { id, data: rec }); seenIds.add(id);
    done.added++; if (hits.length) done.held++;
  }
  // an operator from a registry that is no longer listed is flagged, never deleted
  for (const r of rows) if (r.data.kind === "operator" && r.data.origin === "registry" && !seenIds.has(r.id)) {
    const f = `No longer listed in the audit registries since ${today}: check before using this operator.`;
    if (!((r.data.ops || {}).flags || []).some(x => /^No longer listed/.test(x))) { if (!dry) await db.set("prospects/" + r.id, { ...r.data, ops: { ...r.data.ops, flags: [...((r.data.ops || {}).flags || []), f] } }); done.left++; }
  }
  const note = `${dry ? "Dry run, nothing written. " : ""}Operators from the audit registries: ${done.added} added, ${done.refreshed} refreshed, ${done.left} no longer listed, ${done.excluded} left out (excluded or sanctioned place), ${done.held} held for the Director (possible sanctions match).`;
  if (!dry) await db.set("intel/operators", { lastRun: nowIso, ...done, note, sources: ix.sources });
  log(note); return { ...done, note };
}

// a look at an official list's layout before its reader is written: node operators.mjs probe <page url> <pdf link pattern>
async function probe(page, pattern) {
  const { execFileSync } = await import("child_process"); const { writeFileSync } = await import("fs");
  const h = await (await fetch(page, { headers: { "user-agent": "Mozilla/5.0 (compatible; ArcheOperatorList/1.0)" } })).text();
  const m = h.match(new RegExp('href="([^"]*' + pattern + '[^"]*)"', "i")); if (!m) { console.log("no link matching " + pattern); return; }
  const url = new URL(m[1], page).href; console.log("PDF " + url);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer()); writeFileSync("/tmp/list.pdf", buf);
  console.log(execFileSync("pdftotext", ["-layout", "/tmp/list.pdf", "-"]).toString().split("\n").slice(0, 90).join("\n"));
}
if (import.meta.url === `file://${process.argv[1]}` && process.argv[2] === "probe") { await probe(process.argv[3], process.argv[4]); process.exit(0); }
if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs");
  await main("Operators", ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], async () => run(undefined, { dry: process.env.DRY === "1" }));
}
