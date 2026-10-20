// Service partners (Morten, 20 Oct 2026): business-jet suppliers at the airports Archē flies to most.
// Step 1 (now): FBOs and business-aviation ground handlers, trip-support companies, business-jet in-flight catering.
// Next steps (roadmap): limousine services, helicopter transfers, yacht charter, one at a time.
// Suppliers, like operators: visible to the owner and operations, never assigned or rotated to brokers.
// Same rules as all research: organisations first, a public source seen in this run's search results, no marketplace
// or broker boards, no sanctioned jurisdictions, named business contacts only from the organisation's own website.
import { ask, normName, vetAvenues } from "./intel.mjs";
import { vetContacts } from "./lib/contacts.mjs";

export const CATEGORIES = ["FBO and ground handling", "Trip support", "In-flight catering"];
export const AIRPORTS = [
  ["WSSL", "Singapore Seletar"], ["WSSS", "Singapore Changi"], ["VTBD", "Bangkok Don Mueang"], ["VTBS", "Bangkok Suvarnabhumi"],
  ["VTSP", "Phuket"], ["VTBU", "U-Tapao (Pattaya)"], ["VHHH", "Hong Kong"], ["VMMC", "Macau"], ["RJTT", "Tokyo Haneda"],
  ["RKSI", "Seoul Incheon"], ["WADD", "Bali Denpasar"], ["WMKK", "Kuala Lumpur"], ["RPLL", "Manila"], ["VVNB", "Hanoi"],
  ["VVTS", "Ho Chi Minh City"], ["VDPP", "Phnom Penh"], ["VRMM", "Malé"], ["VABB", "Mumbai"], ["VIDP", "Delhi"],
  ["YSSY", "Sydney"], ["YMML", "Melbourne"], ["OMDW", "Dubai World Central"], ["OMDB", "Dubai International"], ["OERK", "Riyadh"],
  ["OTHH", "Doha"], ["LSGG", "Geneva"], ["LFMN", "Nice"], ["EGGW", "London Luton"], ["EGLF", "Farnborough"], ["LIML", "Milan Linate"]];
const SANCTIONED = ["russia", "belarus", "iran", "north korea", "syria", "cuba", "venezuela", "myanmar", "afghanistan", "crimea"];
const MARKETPLACES = /(^|\.)(avinode|jetvip|aircharterguide|charterhub|privatefly|fxair|lunajets|flyvictor|jetsmarter|flyxo|airnav|globalair|acukwik)\.[a-z.]+$/i;
const clean = (v, n = 300) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const normUrl = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, "")).toLowerCase(); } catch { return ""; } };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

export function vetService(o, seen, icao, optSet) {
  if (!o || !clean(o.org) || !o.source) return { why: "missing name or source" };
  if (!seen.has(normUrl(o.source))) return { why: "source not seen in this run's search results" };
  if ([o.source, o.website].some(u => u && MARKETPLACES.test(host(u)))) return { why: "marketplace or directory used as a source" };
  if (SANCTIONED.some(c => [o.country, o.city, o.org].join(" ").toLowerCase().includes(c))) return { why: "sanctioned or high-risk jurisdiction" };
  if (!CATEGORIES.includes(o.category)) return { why: "not a business-jet supplier in today's categories" };
  const ok = u => u && seen.has(normUrl(u)) && !MARKETPLACES.test(host(u));
  const website = o.website && (ok(o.website) || host(o.website) === host(o.source)) ? clean(o.website, 300) : "";
  const isbah = o.isbah && ok(o.isbah.url) ? { level: clean(o.isbah.level, 40), year: clean(o.isbah.year, 4), url: clean(o.isbah.url, 400) } : null;
  const evidence = (Array.isArray(o.evidence) ? o.evidence : []).map(x => ({ summary: clean(x && x.summary, 300), url: clean(x && x.url, 400) })).filter(x => x.summary && ok(x.url)).slice(0, 3);
  const flags = [];
  if (o.category === "FBO and ground handling" && !isbah) flags.push("No IS-BAH registration found: check handling standards before relying on them.");
  return { rec: { org: clean(o.org, 160), kind: "service", segment: "Service partner", category: o.category, airports: [icao],
    region: clean(o.region, 40), country: clean(o.country, 60), province: "", city: clean(o.city, 60), website, source: clean(o.source, 400),
    services: (Array.isArray(o.services) ? o.services : []).map(x => clean(x, 60)).filter(Boolean).slice(0, 10),
    hours: clean(o.hours, 40), isbah, evidence, flags, why: clean(o.why, 400), approach: clean(o.approach, 500),
    avenues: vetAvenues(o.avenues, seen, o.website), contacts: vetContacts(o.contacts, seen, website, o.org, optSet), status: "new" } };
}

// a few airports per run until all are covered, then a full refresh every 30 days
export async function run(db, call, log = () => {}, optSet = new Set(), perRun = Number(process.env.SERVICE_AIRPORTS || 3)) {
  const status = (await db.get("intel/services")) || {};
  if (status.pausedUntil && Date.parse(status.pausedUntil) > Date.now()) return { added: [], merged: 0, rejected: [], airports: [] };
  let idx = Number.isInteger(status.index) ? status.index : 0;
  const rows = await db.all("prospects");
  const byName = new Map(rows.map(r => [normName(r.data.org), r]));
  const maxId = rows.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
  let next = maxId; const nowIso = new Date().toISOString(), today = nowIso.slice(0, 10);
  const added = [], rejected = [], done = []; let merged = 0;
  for (let k = 0; k < perRun && idx < AIRPORTS.length; k++, idx++) {
    const [icao, name] = AIRPORTS[idx];
    const prompt = `You research BUSINESS-JET SUPPLIERS at ${name} airport (${icao}) for Archē Executive, a Singapore private jet charter broker.
Find up to 8 organisations serving business jets at this airport in these categories: ${CATEGORIES.join("; ")}. Prefer FBOs and handlers dedicated to business aviation, trip-support companies with 24/7 operations, and caterers specialised in business-jet catering.
Scrutinise quality from public sources: the company's own website, the airport's official site, IS-BAH (International Standard for Business Aircraft Handling) registry or announcements, reputable aviation press. Never use charter marketplaces, booking platforms or airport directories such as AirNav, Avinode or AC-U-KWIK as the source.
Organisations first; named BUSINESS contacts only as published on the organisation's own website. Nothing based in or controlled from Russia, Belarus, Iran, North Korea, Syria, Cuba, Venezuela, Myanmar or Afghanistan. Never guess.
Reply with JSON only, in a \`\`\`json block: an array of objects with fields
org, category (one of ${CATEGORIES.join(", ")}), region, country, city, website, source (URL of the page where you found it), services (array of short items, for example "customs and immigration", "crew transport", "hangar", "kosher catering"), hours (for example "24/7"), isbah (object {level, year, url} if registered, else null), evidence (array of {summary, url}: awards, audits or notable facts), why (one sentence), approach (one or two sentences: how to set them up as a supplier), avenues (array of {type, label, url, note}; types: website, contact, phone, email, linkedin, other), contacts (array of up to 3 {name, role, email, phone, url}: named BUSINESS contacts only as published on the organisation's own website; work email on its own domain; empty if none).`;
    try {
      const { data, seen } = await ask(prompt, call, 16000);
      for (const o of Array.isArray(data) ? data.slice(0, 10) : []) {
        const v = vetService(o, seen, icao, optSet); if (v.why) { rejected.push(`${clean(o && o.org, 60)} (${icao}): ${v.why}`); continue; }
        const ex = byName.get(normName(v.rec.org));
        if (ex) {   // same company at another airport: add the airport, never a duplicate record
          if (ex.data.kind === "service" && !(ex.data.airports || []).includes(icao)) { ex.data = { ...ex.data, airports: [...(ex.data.airports || []), icao] }; await db.set("prospects/" + ex.id, ex.data); merged++; }
          else if (ex.data.kind !== "service") rejected.push(`${v.rec.org} (${icao}): already in the list as another type`);
          continue;
        }
        next++; const id = "p" + String(next).padStart(3, "0");
        const rec = { ...v.rec, added: nowIso, batch: `Service partner review ${today}`, aiReviewed: nowIso };
        await db.set("prospects/" + id, rec); byName.set(normName(rec.org), { id, data: rec }); added.push(rec.org);
      }
      done.push(icao);
    } catch (e) { const m = String(e.message || e).replace(/\n/g, " ").slice(0, 200); log(`  service partners ${icao} failed: ${m}`); if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Service partners ${icao} failed::${m}`); }
  }
  const finished = idx >= AIRPORTS.length;
  await db.set("intel/services", { lastRun: nowIso, index: finished ? 0 : idx, pausedUntil: finished ? new Date(Date.now() + 30 * 864e5).toISOString() : null,
    nextAirport: finished ? "refresh in 30 days" : AIRPORTS[idx][1], lastAdded: added.length, lastMerged: merged, airportsDone: done, rejected: rejected.slice(0, 20) });
  return { added, merged, rejected, airports: done };
}

// run on its own (GitHub Actions job choice "services"): all remaining airports in one go
if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs"); const { connect } = await import("./lib/db.mjs");
  await main("Service partners", ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "ANTHROPIC_API_KEY"], async () => {
    const db = connect(); const opt = new Set((await db.all("optouts")).map(r => r.id));
    const r = await run(db, undefined, console.log, opt, Number(process.env.SERVICE_AIRPORTS || AIRPORTS.length));
    return { note: `Airports covered: ${r.airports.length} (${r.airports.join(", ")}). Added ${r.added.length}, linked to more airports ${r.merged}, rejected ${r.rejected.length}. The next morning review runs the sanctions pre-screen.` };
  });
}
