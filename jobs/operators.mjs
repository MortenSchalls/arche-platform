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

// UK CAA "UK Aeroplane and Helicopter AOC Holders" (pdftotext -raw): every table cell starts with a running marker "<n>B"
export function parseUkCaa(raw) {
  const text = String(raw).split("\n").filter(l => !/^(PDF |OFFICIAL|\d{2} \w+ \d{4} Page|UK Aeroplane|Number$)/.test(l.trim()) && !/^3BCompany 4BTrading As/.test(l.trim())).join("\n");
  const cells = []; let prev = 7, from = -1, re = /(?<=^|\s)(\d{1,4})B/gm, m;
  while ((m = re.exec(text))) { const n = +m[1]; if (n > prev && n <= prev + 15) { if (from >= 0) cells.push(text.slice(from, m.index).replace(/\s+/g, " ").trim()); from = m.index + m[0].length; prev = n; } }
  if (from >= 0) cells.push(text.slice(from).replace(/\s+/g, " ").trim());
  const out = []; let i = 0;
  while (i + 2 < cells.length) {
    if (/^see:/i.test(cells[i + 1] || "")) { i += 2; while (i < cells.length && cells[i] === "N/A") i++; continue; }
    const company = cells[i], trading = cells[i + 1], contact = cells[i + 2]; i += 3; const aircraft = []; let aoc = "", na = 0;
    while (i < cells.length) { const c = cells[i++]; if (/^\d{4}$/.test(c)) { aoc = c; break; } if (c === "N/A") { if (++na >= 2) break; continue; } aircraft.push(c); }
    if (aoc) out.push({ company, trading: trading === "N/A" ? "" : trading, contact: contact === "N/A" ? "" : contact, aircraft, aoc });
  }
  return out;
}

const BIZJET = /citation|phenom|praetor|legacy|lineage|learjet|challenger|global|falcon|gulfstream|hawker|premier|pc-?24|hondajet|emb ?50[05]|emb ?55[05]|emb ?135 ?bj|cl-?6\d\d|bd-?700|bd-?100|cessna (5[0-9]{2}|680|750)|g-?iv|g-?v\b|\bg[0-9]{3}\b|beechjet|nextant|acj|bbj|business jet/i;
const HELI = /helicopter|\baw ?1\d\d|\bbell \d|robinson|\bas ?3\d\d|\bec ?1\d\d|\bh1[2-7]\d|leonardo aw|sikorsky|agusta/i;
const NOT_CHARTER = /air ambulance|charity|flight academy|flight school|police|coastguard|search and rescue/i;
const title = s => String(s || "").toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()).replace(/\b(Uk|Aoc|Ni|Llp|Plc)\b/g, w => w.toUpperCase());
// official AOC lists, read from the authority's own published file (added one by one, each with its own reader).
// The certificate number and the authority's file are the certificate source, so these operators need only insurance
// and fleet confirmed. Jet operators go to Operators, helicopter operators to the Helicopters section of service partners.
export const AOC_LISTS = [
  { id: "UK CAA", country: "United Kingdom", page: "https://www.caa.co.uk/data-and-analysis/approved-persons-and-organisations/approved-organisations/holders-of-air-operator-certificates/",
    link: /href="([^"]*aoc-holders-list[^"]*\.pdf)"/i, format: "raw", parse: parseUkCaa, min: 60 }];
async function readList(L, fetchFn = fetch) {
  const { execFileSync } = await import("child_process"); const { writeFileSync } = await import("fs");
  const h = await (await fetchFn(L.page, { headers: { "user-agent": "Mozilla/5.0 (compatible; ArcheOperatorList/1.0)" } })).text();
  const m = h.match(L.link); if (!m) throw new Error("no list link on the authority's page");
  const url = new URL(m[1], L.page).href, f = "/tmp/aoc-" + L.id.replace(/\W/g, "") + ".pdf";
  writeFileSync(f, Buffer.from(await (await fetchFn(url)).arrayBuffer()));
  const rows = L.parse(execFileSync("pdftotext", ["-" + L.format, f, "-"]).toString());
  if (rows.length < L.min) throw new Error(`only ${rows.length} holders read; a partial list is not used`);
  return { url, rows };
}

export async function run(db = connect(), { log = console.log, now = new Date(), dry = false, ix = null, lists = null, aoc = null } = {}) {
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
      const d = { ...ex.data, lists: o.lists, ...(!ex.data.country && country ? { country, region: REGION_OF(isoOf(country)), city: ex.data.city || o.base } : {}), ops: { ...ops0, audits: [...kept, ...audits], tier: opTier([...kept, ...audits]), aliases: [...new Set([...(ops0.aliases || []), ...o.aliases])].slice(0, 6),
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
  // official AOC lists: certificate confirmed from the authority's own file
  const aocDone = {}; let aocAdded = 0, heliAdded = 0;
  for (const L of AOC_LISTS) {
    let got; try { got = aoc ? aoc[L.id] : await readList(L); } catch (e) { aocDone[L.id] = { ok: false, error: String(e.message || e).slice(0, 300) }; log(`  ${L.id}: ${e.message}`); continue; }
    if (!got) continue; aocDone[L.id] = { ok: true, count: got.rows.length, url: got.url, readAt: nowIso };
    for (const h of got.rows) {
      if (/^www\./i.test(h.company) || NOT_CHARTER.test(h.company + " " + h.trading)) continue;
      const jets = h.aircraft.filter(a => BIZJET.test(a)), helis = h.aircraft.filter(a => HELI.test(a));
      if (!jets.length && !helis.length) continue;   // airlines, cargo, training: not for Archē's clients
      const org = title(h.company), names = [org, h.trading ? title(h.trading) : ""].filter(Boolean);
      const cert = { authority: L.id, number: h.aoc, source: got.url, confirmed: today };
      const listEntry = { name: L.id + " AOC list", level: "Certificate holder", url: got.url, checked: today };
      const ex = names.map(n => byName.get(normName(n))).find(Boolean);
      const hits = lists.names.size ? screen(names, lists) : [];
      if (jets.length) {
        if (ex && ex.data.kind === "operator") {
          seenIds.add(ex.id); const o0 = ex.data.ops || {};
          const d = { ...ex.data, country: ex.data.country || L.country, region: ex.data.region && ex.data.region !== "Global" ? ex.data.region : REGION_OF(isoOf(L.country)), lists: [...(ex.data.lists || []).filter(l => l.name !== listEntry.name), listEntry],
            ops: { ...o0, aoc: { ...(o0.aoc || {}), ...cert }, fleet: (o0.fleet || []).length ? o0.fleet : h.aircraft.map(type => ({ type, count: 0 })), fleetSource: o0.fleetSource || got.url,
              flags: (o0.flags || []).filter(f => !/certificate and insurance to confirm|^Country to confirm/.test(f)).concat(["Insurance to confirm before the first booking."]).filter((x, i, a) => a.indexOf(x) === i) } };
          if (!dry) await db.set("prospects/" + ex.id, d); done.refreshed++; continue;
        }
        if (ex) continue;
        const rec = { org, segment: "Operator", kind: "operator", region: REGION_OF(isoOf(L.country)), country: L.country, province: "", city: "", website: h.contact ? "https://" + h.contact.replace(/^https?:\/\//, "") : "", source: got.url,
          why: `Holds ${L.id} Air Operator Certificate ${h.aoc} with business jets (${jets.join(", ")}), per the authority's list of ${today}.`, approach: "Ask for the fleet list and insurance certificate before the first quote.",
          status: hits.length ? "review" : "new", avenues: h.contact ? [{ type: "website", label: "Website (as listed by the authority)", url: "https://" + h.contact.replace(/^https?:\/\//, "") }] : [], contacts: [], lists: [listEntry], origin: "aoc-list", added: nowIso, batch: `${L.id} AOC list ${today}`, addedBy: "official list import",
          ops: { aoc: cert, aliases: h.trading ? [title(h.trading)] : [], bases: [], fleet: h.aircraft.map(type => ({ type, count: 0 })), fleetSource: got.url, audits: [], safety: [], enforcement: [], owners: [], insurance: null, euAirSafetyList: "to check", founded: "", tier: opTier([]),
            flags: ["Insurance to confirm before the first booking.", ...(hits.length ? ["Possible sanctions match: check the names against the list before any contact."] : [])], screen: { auto: { result: lists.names.size ? (hits.length ? "possible match" : "no match") : "not screened", at: nowIso, hits } } } };
        next++; const id = "p" + String(next).padStart(3, "0"); if (!dry) await db.set("prospects/" + id, rec); byName.set(normName(org), { id, data: rec }); seenIds.add(id); aocAdded++; if (hits.length) done.held++;
      } else if (!ex) {   // helicopter operators: the Helicopters section of service partners
        const rec = { org, kind: "service", segment: "Service partner", category: "Helicopter transfers", airports: [], region: REGION_OF(isoOf(L.country)), country: L.country, province: "", city: "", website: h.contact ? "https://" + h.contact.replace(/^https?:\/\//, "") : "", source: got.url,
          services: helis.slice(0, 10), aoc: cert, evidence: [], flags: ["Insurance to confirm before the first booking."], why: `Holds ${L.id} Air Operator Certificate ${h.aoc} for helicopters (${helis.join(", ")}).`, approach: "Ask for transfer prices, aircraft and insurance before the first booking.",
          avenues: h.contact ? [{ type: "website", label: "Website (as listed by the authority)", url: "https://" + h.contact.replace(/^https?:\/\//, "") }] : [], contacts: [], status: hits.length ? "review" : "new", origin: "aoc-list", added: nowIso, batch: `${L.id} AOC list ${today}`, addedBy: "official list import",
          screen: { auto: { result: lists.names.size ? (hits.length ? "possible match" : "no match") : "not screened", at: nowIso, hits } } };
        next++; const id = "p" + String(next).padStart(3, "0"); if (!dry) await db.set("prospects/" + id, rec); byName.set(normName(org), { id, data: rec }); heliAdded++;
      }
    }
  }
  done.aocAdded = aocAdded; done.heliAdded = heliAdded;
  // an operator from a registry that is no longer listed is flagged, never deleted
  for (const r of rows) if (r.data.kind === "operator" && r.data.origin === "registry" && !seenIds.has(r.id)) {
    const f = `No longer listed in the audit registries since ${today}: check before using this operator.`;
    if (!((r.data.ops || {}).flags || []).some(x => /^No longer listed/.test(x))) { if (!dry) await db.set("prospects/" + r.id, { ...r.data, ops: { ...r.data.ops, flags: [...((r.data.ops || {}).flags || []), f] } }); done.left++; }
  }
  const note = `${dry ? "Dry run, nothing written. " : ""}Operators: ${done.added} added from the audit registries, ${aocAdded} from official AOC lists (${Object.entries(aocDone).map(([k, v]) => k + (v.ok ? " " + v.count + " holders" : " not read")).join(", ") || "none"}), ${heliAdded} helicopter operators to service partners, ${done.refreshed} refreshed, ${done.left} no longer listed, ${done.excluded} left out (excluded or sanctioned place), ${done.held} held for the Director (possible sanctions match).`;
  if (!dry) await db.set("intel/operators", { lastRun: nowIso, ...done, note, sources: ix.sources, aocLists: aocDone });
  log(note); return { ...done, note };
}

// a look at an official list's layout before its reader is written: node operators.mjs probe <page url> <pdf link pattern>
async function probe(page, pattern) {
  const { execFileSync } = await import("child_process"); const { writeFileSync } = await import("fs");
  const h = await (await fetch(page, { headers: { "user-agent": "Mozilla/5.0 (compatible; ArcheOperatorList/1.0)" } })).text();
  if (process.env.DRY === "html") { const i = h.indexOf(pattern); console.log(h.length, i); console.log(h.slice(Math.max(0, i - 1500), i + 3000)); return; }
  const m = h.match(new RegExp('href="([^"]*' + pattern + '[^"]*)"', "i")); if (!m) { console.log("no link matching " + pattern); return; }
  const url = new URL(m[1], page).href; console.log("PDF " + url);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer()); writeFileSync("/tmp/list.pdf", buf);
  console.log(execFileSync("pdftotext", [process.env.DRY === "raw" ? "-raw" : "-layout", "/tmp/list.pdf", "-"]).toString());
}
if (import.meta.url === `file://${process.argv[1]}` && process.argv[2] === "probe") { await probe(process.argv[3], process.argv[4]); process.exit(0); }
if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs");
  await main("Operators", ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], async () => run(undefined, { dry: process.env.DRY === "1" }));
}
