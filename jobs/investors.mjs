// Daily research for INVESTORS and STRATEGIC PARTNERS (Morten, 20 Oct 2026). Owner only:
//  - results go only to the owner_prospects table, which the database shows to the owner and nobody else
//  - nothing about investors is written to the shared research status, the audit log or the GitHub run summary
// Same rules as the other research: organisations only, a public source seen in this run's search results,
// no personal data, no guessed contact details, never a marketplace or broker board; plus no sanctioned
// jurisdictions and an automatic sanctions pre-screen against the official lists.
import { ask, normName, vetAvenues } from "./intel.mjs";
import { screen } from "./lib/sanctions.mjs";
import { vetContacts } from "./lib/contacts.mjs";

export const TRACKS = ["Family office or UHNW office", "Aviation lender or lessor", "Private equity or private credit", "Bank or private bank",
  "Distribution partner for notes", "Strategic partner", "Adviser or placement agent"];
export const FOR = ["Navoryx aircraft notes", "Archē Executive", "Whole platform"];
export const INV_FOCUS = [
  "GCC family offices and private investment offices with aviation, real-asset or private-credit activity (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman)",
  "Singapore and Hong Kong family offices and multi-family offices investing in private credit or real assets",
  "Aviation finance: banks and specialist lenders that finance business jets",
  "Aircraft lessors and aviation investment funds",
  "Private equity and private credit funds with aviation, transport or asset-backed strategies in Asia and the Middle East",
  "Distribution and structuring partners for investment notes: digital investment platforms, tokenisation platforms, placement agents and wealth platforms",
  "Thailand and Southeast Asia private banks, wealth advisers and family offices",
  "Switzerland, UK and Europe: private banks with aviation desks and aviation finance boutiques",
  "Strategic partners in private aviation: FBO groups, aircraft management companies, luxury hospitality and membership clubs open to partnerships"];
const SANCTIONED = ["russia", "russian federation", "belarus", "iran", "north korea", "dprk", "syria", "cuba", "venezuela", "myanmar", "burma", "afghanistan", "crimea"];
const MARKETPLACES = /(^|\.)(avinode|jetvip|aircharterguide|charterhub)\.[a-z.]+$/i;
const clean = (v, n = 300) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const normUrl = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, "")).toLowerCase(); } catch { return ""; } };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const PERSON = /^(mr|mrs|ms|dr|sheikh|sir|hrh|prof)\b\.?\s/i;   // organisations only: drop entries that start like a person's name

// ---- profile and fit (Morten, 20 Oct 2026: filter by potential, portfolio, interests and industries) ----
export const INTERESTS = ["Aviation", "Asset-backed finance", "Private credit", "Fixed income", "Real assets", "Real estate", "Infrastructure", "Private equity", "Venture", "Luxury and hospitality", "Fintech and tokenisation", "Other"];
export const TICKETS = ["Under USD 1m", "USD 1–10m", "USD 10–50m", "Over USD 50m", "Unknown"];
export const GEOS = ["Asia-Pacific", "Middle East", "Europe", "North America", "Latin America", "Africa", "Global"];
export function vetProfile(o, seen) {
  const ok = u => u && seen.has(normUrl(u));
  const pick = (arr, allowed) => [...new Set((Array.isArray(arr) ? arr : []).map(x => allowed.find(a => a.toLowerCase() === String(x).toLowerCase().trim())).filter(Boolean))];
  const aumOk = clean(o.aum, 40) && ok(o.aum_url);
  return { aum: aumOk ? clean(o.aum, 40) : "", aumSource: aumOk ? clean(o.aum_url, 400) : "",
    ticket: TICKETS.includes(o.ticket) ? o.ticket : "Unknown", interests: pick(o.interests, INTERESTS),
    industries: (Array.isArray(o.industries) ? o.industries : []).map(x => clean(x, 40)).filter(Boolean).slice(0, 8),
    aviation: ["direct", "indirect", "none"].includes(o.aviation) ? o.aviation : "none", geo: pick(o.geo, GEOS) };
}
// transparent score out of 100: what makes an organisation likely to fit Navoryx notes or Archē
export function fitScore(r) {
  const pr = r.profile || {}, reasons = []; let sc = 0;
  if (pr.aviation === "direct") { sc += 30; reasons.push("Invests in or finances aviation directly"); } else if (pr.aviation === "indirect") { sc += 15; reasons.push("Some aviation or transport exposure"); }
  const fitI = (pr.interests || []).filter(i => ["Aviation", "Asset-backed finance", "Private credit", "Fixed income", "Real assets"].includes(i));
  if (fitI.length) { sc += 20; reasons.push("Interested in " + fitI.join(", ").toLowerCase()); }
  if (r.track === "Aviation lender or lessor" || ["USD 1–10m", "USD 10–50m"].includes(pr.ticket)) { sc += 15; reasons.push(r.track === "Aviation lender or lessor" ? "Lends against aircraft" : "Ticket size fits a note of about USD 3.5m"); }
  else if (pr.ticket === "Over USD 50m") { sc += 5; reasons.push("Large tickets: fits a multi-aircraft or fleet deal"); }
  if ((pr.geo || []).some(g => ["Asia-Pacific", "Middle East", "Global"].includes(g))) { sc += 15; reasons.push("Invests in Asia, the Middle East or globally"); }
  const ev = (r.evidence || []).length; if (ev) { sc += ev >= 2 ? 15 : 10; reasons.push(ev + " documented deal" + (ev > 1 ? "s" : "")); }
  if (r.track === "Distribution partner for notes") { sc += 5; reasons.push("Can place notes with its own investors"); }
  sc = Math.min(100, sc);
  return { score: sc, potential: sc >= 70 ? "High" : sc >= 45 ? "Medium" : "Low", reasons };
}
const PROFILE_FIELDS = `aum (assets under management or fund size as published, for example "USD 2.5bn"; empty if not published), aum_url (URL showing it), ticket (one of ${TICKETS.join(", ")}: typical investment or loan size), interests (array, from: ${INTERESTS.join(", ")}), industries (array of up to 8 sectors it invests in), aviation ("direct" if it invests in or finances aircraft or aviation companies, "indirect" for transport or adjacent exposure, else "none"), geo (array, from: ${GEOS.join(", ")})`;

export function vetInvestor(o, seen, existing) {
  if (!o || !clean(o.org) || !o.source) return { why: "missing name or source" };
  if (PERSON.test(clean(o.org))) return { why: "looks like a private individual, not an organisation" };
  if (!seen.has(normUrl(o.source))) return { why: "source not seen in this run's search results" };
  if (MARKETPLACES.test(host(o.source))) return { why: "marketplace used as a source" };
  if (SANCTIONED.some(c => [o.country, o.city, o.org].join(" ").toLowerCase().includes(c))) return { why: "sanctioned or high-risk jurisdiction" };
  if (existing.has(normName(o.org))) return { why: "duplicate" };
  const ok = u => u && seen.has(normUrl(u));
  const evidence = (Array.isArray(o.evidence) ? o.evidence : []).map(x => ({ summary: clean(x && x.summary, 300), url: clean(x && x.url, 400) })).filter(x => x.summary && ok(x.url)).slice(0, 4);
  return { rec: { org: clean(o.org, 160), track: TRACKS.includes(o.track) ? o.track : "Strategic partner", for: FOR.includes(o.for) ? o.for : "Whole platform",
    type: clean(o.type, 80), region: clean(o.region, 40), country: clean(o.country, 60), city: clean(o.city, 60),
    website: o.website && (ok(o.website) || host(o.website) === host(o.source)) ? clean(o.website, 300) : "",
    source: clean(o.source, 400), why: clean(o.why, 400), approach: clean(o.approach, 500), evidence,
    avenues: vetAvenues(o.avenues, seen, o.website), status: "new" } };
}
function withFit(rec) { return { ...rec, ...fitScore(rec) }; }

// profiles for records that have none yet: 8 per research call
export async function enrich(db, call, log = () => {}, max = 16) {
  const rows = (await db.all("owner_prospects")).filter(r => r.id !== "_status" && !r.data.profile && r.data.status !== "dnc").slice(0, max);
  let done = 0;
  for (let i = 0; i < rows.length; i += 8) {
    const batch = rows.slice(i, i + 8);
    const p = `For each organisation below, research its investor profile with web search, from public sources only (its own website, annual reports, press releases, reputable financial press). Organisations only; never personal data.
${batch.map(r => `- id ${r.id}: ${r.data.org}${r.data.website ? " (" + r.data.website + ")" : ""}, ${r.data.country || ""}`).join("\n")}
Reply with JSON only, in a \`\`\`json block: an object mapping id to {${PROFILE_FIELDS}, evidence (array of {summary, url}: relevant investments, financings or partnerships)}.`;
    try {
      const { data, seen } = await ask(p, call);
      for (const r of batch) {
        const o = (data || {})[r.id]; if (!o) continue;
        const evidence = [...(r.data.evidence || []), ...(Array.isArray(o.evidence) ? o.evidence : []).map(x => ({ summary: clean(x && x.summary, 300), url: clean(x && x.url, 400) })).filter(x => x.summary && seen.has(normUrl(x.url)))].slice(0, 5);
        await db.set("owner/" + r.id, withFit({ ...r.data, evidence, profile: vetProfile(o, seen), aiReviewed: new Date().toISOString() })); done++;
      }
    } catch (e) { log("  owner profile batch failed: " + String(e.message || e).slice(0, 200)); }
  }
  return done;
}

// one research call per focus area; the daily run covers PER_DAY areas, a manual run can cover them all
export async function run(db, call, log = () => {}, lists = null, areas = Number(process.env.INVESTOR_AREAS || 3), optSet = null) {
  if (!optSet) optSet = new Set((await db.all("optouts")).map(r => r.id));
  const out = { added: [], rejected: [] };
  for (let i = 0; i < Math.min(areas, INV_FOCUS.length); i++) {
    try { const r = await runOne(db, call, log, lists, optSet); out.added.push(...r.added); out.rejected.push(...r.rejected); }
    catch (e) { log("  owner research area failed: " + String(e.message || e).slice(0, 200)); }
  }
  out.profiled = await enrich(db, call, log, Number(process.env.INVESTOR_PROFILES || 16));
  return out;
}
async function runOne(db, call, log, lists, optSet) {
  const status = (await db.get("owner/_status")) || {};
  const fi = Number.isInteger(status.focusIndex) ? status.focusIndex : 0;
  const focus = INV_FOCUS[fi % INV_FOCUS.length];
  const mine = (await db.all("owner_prospects")).filter(r => r.id !== "_status");
  const other = await db.all("prospects");
  const existing = new Set([...mine, ...other].map(r => normName(r.data.org)));
  const maxId = mine.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
  const nowIso = new Date().toISOString(), today = nowIso.slice(0, 10);
  const prompt = `You research INVESTORS and STRATEGIC PARTNERS for a Singapore private aviation group: (1) Navoryx, which plans a fleet of long-range business jets held one per special-purpose company and funded by fixed-return investor notes secured on each aircraft; (2) Archē Executive, a private jet charter broker. Both are early stage.
Focus today: ${focus}.
Find up to 15 ORGANISATIONS that plausibly invest in, finance, distribute or partner with this kind of business. Prefer organisations with public evidence of relevant activity (aviation, real assets, asset-backed or private credit, notes distribution, private aviation partnerships). Use web search; every organisation must come from a page you actually found in search results.
Strict rules: organisations only; no personal data about private individuals (no names of people, no personal phone numbers, emails or profiles); a person may appear only as a role, for example "Head of Aviation Finance". Never guess contact details. Nothing based in or controlled from Russia, Belarus, Iran, North Korea, Syria, Cuba, Venezuela, Myanmar or Afghanistan. Family offices: approach only through introductions or their published channels.
Already known (skip these): ${[...mine, ...other].map(r => r.data.org).join("; ").slice(0, 5000)}
Reply with JSON only, in a \`\`\`json block: an array of objects with fields
org, track (one of ${TRACKS.join(", ")}), for (one of ${FOR.join(", ")}), type (short description), region, country, city, website (official site, only if found), source (URL of the public page where you found it), evidence (array of {summary, url}: public evidence of relevant investments, financings or partnerships), ${PROFILE_FIELDS}, why (one sentence), approach (one or two sentences, by role or introduction route), contacts (array of up to 3 {name, role, email, phone, url}: named BUSINESS contacts only as published on the organisation's OWN website, with the page url; work email on the organisation's own domain; never personal emails or phones, never guessed; empty if none published), avenues (array of {type, label, url, note}; official business routes only; types: website, contact, linkedin, event, association, introducer, other).`;
  const { data, seen } = await ask(prompt, call);
  const added = [], rejected = [];
  let next = maxId;
  for (const o of Array.isArray(data) ? data.slice(0, 18) : []) {
    const v = vetInvestor(o, seen, existing); if (v.why) { rejected.push(`${clean(o && o.org, 60)}: ${v.why}`); continue; }
    const rec = withFit({ ...v.rec, profile: vetProfile(o, seen), added: nowIso, batch: `Investor review ${today}`, aiReviewed: nowIso });
    rec.contacts = vetContacts(o.contacts, seen, rec.website, rec.org, optSet);
    if (lists && lists.names.size) {
      const hits = screen([rec.org], lists);
      rec.screen = { auto: { result: hits.length ? "possible match" : "no match", at: nowIso, lists: lists.loaded.map(x => x.replace(/ \(\d+\)$/, "")), failed: lists.failed, hits } };
      if (hits.length) rec.status = "review";
    }
    next++; await db.set("owner/i" + String(next).padStart(3, "0"), rec); existing.add(normName(rec.org)); added.push(rec.org);
  }
  const note = `Added ${added.length} for "${focus}"${added.length ? ": " + added.join(", ") : ""}.${rejected.length ? " " + rejected.length + " rejected by the rules." : ""}`;
  await db.set("owner/_status", { lastRun: nowIso, lastAdded: added.length, focusIndex: fi + 1, nextFocus: INV_FOCUS[(fi + 1) % INV_FOCUS.length], note, rejected: rejected.slice(0, 20) });
  return { added, rejected };   // the caller reports only a count, never names
}
// run on its own (GitHub Actions job choice "investors"); the run summary shows only a count
if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs"); const { connect } = await import("./lib/db.mjs"); const { loadLists } = await import("./lib/sanctions.mjs");
  await main("Owner research", ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "ANTHROPIC_API_KEY"], async () => {
    const lists = await loadLists(fetch, console.log);
    if (process.env.INVESTOR_AREAS === "0") { const n = await enrich(connect(), undefined, console.log, 400); return { note: `Profiles added to ${n}. Details only in the portal.` }; }
    const r = await run(connect(), undefined, console.log, lists, Number(process.env.INVESTOR_AREAS || INV_FOCUS.length));
    return { note: `Added ${r.added.length}; ${r.rejected.length} rejected by the rules; profiles added to ${r.profiled}. Details only in the portal.` };
  });
}
