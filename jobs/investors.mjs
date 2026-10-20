// Daily research for INVESTORS and STRATEGIC PARTNERS (Morten, 20 Oct 2026). Owner only:
//  - results go only to the owner_prospects table, which the database shows to the owner and nobody else
//  - nothing about investors is written to the shared research status, the audit log or the GitHub run summary
// Same rules as the other research: organisations only, a public source seen in this run's search results,
// no personal data, no guessed contact details, never a marketplace or broker board; plus no sanctioned
// jurisdictions and an automatic sanctions pre-screen against the official lists.
import { ask, normName, vetAvenues } from "./intel.mjs";
import { screen } from "./lib/sanctions.mjs";

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

// one research call per focus area; the daily run covers PER_DAY areas, a manual run can cover them all
export async function run(db, call, log = () => {}, lists = null, areas = Number(process.env.INVESTOR_AREAS || 3)) {
  const out = { added: [], rejected: [] };
  for (let i = 0; i < Math.min(areas, INV_FOCUS.length); i++) {
    try { const r = await runOne(db, call, log, lists); out.added.push(...r.added); out.rejected.push(...r.rejected); }
    catch (e) { log("  owner research area failed: " + String(e.message || e).slice(0, 200)); }
  }
  return out;
}
async function runOne(db, call, log, lists) {
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
org, track (one of ${TRACKS.join(", ")}), for (one of ${FOR.join(", ")}), type (short description), region, country, city, website (official site, only if found), source (URL of the public page where you found it), evidence (array of {summary, url}: public evidence of relevant investments, financings or partnerships), why (one sentence), approach (one or two sentences, by role or introduction route), avenues (array of {type, label, url, note}; official business routes only; types: website, contact, linkedin, event, association, introducer, other).`;
  const { data, seen } = await ask(prompt, call);
  const added = [], rejected = [];
  let next = maxId;
  for (const o of Array.isArray(data) ? data.slice(0, 18) : []) {
    const v = vetInvestor(o, seen, existing); if (v.why) { rejected.push(`${clean(o && o.org, 60)}: ${v.why}`); continue; }
    const rec = { ...v.rec, added: nowIso, batch: `Investor review ${today}`, aiReviewed: nowIso };
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
    const r = await run(connect(), undefined, console.log, lists, Number(process.env.INVESTOR_AREAS || INV_FOCUS.length));
    return { note: `Added ${r.added.length}; ${r.rejected.length} rejected by the rules. Details only in the portal.` };
  });
}
