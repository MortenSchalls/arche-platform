// Prospect agent (Morten, 8 Nov 2026: "same as the agent we made for the airports ... runs in the background as a
// scheduled task but automated and not AI related, needs to pass all our checking points").
// The research is done by a Claude scheduled task on Morten's Claude plan ("Daily Archē prospect research"); this job
// has no AI and no AI key. It has two parts, both run on GitHub Actions with the database key:
//   plan    tells the task whether a run is due (the Director's settings in Prospects > Research agent, intel/agent),
//           today's focus areas, the organisations already known (names only, to skip) and up to 8 prospects without
//           contact routes. Read only.
//   import  takes what the task found and lets in only what passes every check below; the rest is listed as rejected
//           with the reason. Nothing is ever changed on an existing prospect except new contact routes on one that had
//           none (status, assignment and history are never touched).
// Checks on every organisation: a public source page that opens and names the organisation (fetched here, so nothing
// rests on the researcher's word); organisations only (a person only as a role); not already known; not in an excluded
// or sanctioned country (apps/website/content/excluded.json and the operators' list); never a marketplace or another
// broker's site as a source; contact routes only from the organisation's own site or a page that opens; named business
// contacts only from a page on the organisation's own site that shows that name (and the work email, on its own
// domain), never a webmail address, never anyone who opted out; sanctions pre-screen of the organisation and its owners
// (a possible match is held for the Director's decision). Operators also need an Air Operator Certificate and are never
// added from the EU Air Safety List (the same rules as before, intel.mjs vetOperator).
// Also (Morten, 8 Nov 2026: "use same agent ... for the investor and supplier research"): business-jet suppliers at the
// business airports worldwide (services.mjs rules: five airports a run per set, a 30-day refresh once all are covered) and, once a
// week, investors and strategic partners for the Director-only list (investors.mjs rules). Investor names never appear in
// GitHub logs: the plan and the findings travel sealed (agentcrypt.mjs) and the job reports investor counts only.
import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { connect } from "./lib/db.mjs";
import { loadLists, screen } from "./lib/sanctions.mjs";
import { vetContacts } from "./lib/contacts.mjs";
import { due } from "./agent.mjs";
import { FOCUS, OP_FOCUS, SEGMENTS, REGIONS, SANCTIONED, MARKETPLACES, normName, normUrl, host, vetAvenues, vetOperator } from "./intel.mjs";
import { TRACKS, FOR, INV_FOCUS, INTERESTS, TICKETS, GEOS, vetInvestor, vetProfile, fitScore } from "./investors.mjs";
import { CORE, SETS, AIRPORTS, vetService } from "./services.mjs";
import { seal, open, jobKeys } from "./agentcrypt.mjs";

export const LIMITS = { orgs: 20, operators: 12, routes: 8, airports: 5, perAirport: 8, investors: 12, profiles: 8 };
const WEEK = 7 * 864e5;
const clean = (v, n = 300) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const EXCL = JSON.parse(readFileSync(new URL("../apps/website/content/excluded.json", import.meta.url), "utf8"));
const BAD_PLACES = [...new Set([...(EXCL.countries || []), ...(EXCL.words || []), ...SANCTIONED].map(x => String(x).toLowerCase()))];
export function excludedPlace(o) {
  const place = " " + [o.country, o.province, o.city, o.org].join(" ").toLowerCase().replace(/[^a-zÀ-￿]+/g, " ") + " ";
  return BAD_PLACES.find(c => place.includes(" " + c + " ")) || "";
}
const PERSONLIKE = /^(mr|mrs|ms|miss|dr|sir|madam|hrh|sheikh)\b\.?\s/i;

// ---- page checks (fetched from GitHub; a page that does not open does not count) ----
const strip = h => String(h || "").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ").toLowerCase();
export async function fetchPage(url, fetchFn = fetch) {
  try {
    const u = new URL(url); if (!/^https?:$/.test(u.protocol)) return null;
    const r = await fetchFn(u.href, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "Mozilla/5.0 (compatible; ArcheProspectCheck/1.0)", accept: "text/html,*/*" } });
    if (!r.ok) return null; return strip((await r.text()).slice(0, 2_000_000));
  } catch { return null; }
}
// the page must show the organisation: its full name, or every distinctive word of it, or its own web address
export function names(text, org, website) {
  if (!text) return false;
  const n = String(org || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  if (n && text.includes(n)) return true;
  const words = n.replace(/\b(ltd|limited|pte|llc|inc|co|company|group|the|and|of|plc|sa|ag|gmbh|srl|spa|bv|pty)\b/g, " ").split(/[^a-z0-9À-￿]+/).filter(w => w.length >= 3);
  if (words.length && words.every(w => text.includes(w))) return true;
  const h = host(website); return !!h && text.includes(h.split(".")[0]) && words.some(w => text.includes(w));
}
// pages are fetched once each; `seen` collects every address that opened and showed what it had to show
function pager(fetchFn) {
  const cache = new Map();
  const get = async u => { const k = normUrl(u); if (!k) return null; if (!cache.has(k)) cache.set(k, await fetchPage(u, fetchFn)); return cache.get(k); };
  return { get, cache };
}

// supplier airports already done for a set: its progress record, plus (until the whole list has been covered once) every
// airport where suppliers of that set are already listed, so a longer airport list never repeats the ones done
export function coveredFor(st, rows, S, now = new Date()) {
  const paused = st.pausedUntil && Date.parse(st.pausedUntil) > now.getTime() && st.listSize === AIRPORTS.length;
  const have = st.listSize === AIRPORTS.length ? [] : rows.filter(r => r.data.kind === "service" && S.cats.includes(r.data.category)).flatMap(r => r.data.airports || []);
  return { paused, covered: new Set([...(st.covered || []), ...have]) };
}
// ---- plan ----
export async function plan(db, now = new Date()) {
  const agent = (await db.get("intel/agent")) || {}, status = (await db.get("intel/status")) || {};
  const isDue = due(agent, status.lastRun, now);
  const FOC = Array.isArray(agent.focus) && agent.focus.filter(x => String(x || "").trim()).length ? agent.focus.map(x => String(x).trim().slice(0, 160)).filter(Boolean).slice(0, 40) : FOCUS;
  const fi = Number.isInteger(status.focusIndex) ? status.focusIndex : 0, ofi = Number.isInteger(status.opFocusIndex) ? status.opFocusIndex : 0;
  const rows = await db.all("prospects");
  const bare = rows.filter(r => r.data.status !== "dnc" && !(r.data.avenues || []).length)
    .sort((a, b) => String(a.data.aiReviewed || a.data.added || "").localeCompare(String(b.data.aiReviewed || b.data.added || ""))).slice(0, LIMITS.routes)
    .map(r => ({ id: r.id, org: r.data.org, website: r.data.website || "", country: r.data.country || "" }));
  // suppliers: the next airports of each set that are not covered yet (none while a set waits for its 30-day refresh)
  const suppliers = {};
  for (const [name, S] of Object.entries(SETS)) {
    const st = (await db.get(S.key)) || {}, { paused, covered } = coveredFor(st, rows, S, now);
    if (paused) { suppliers[name] = { airports: [], categories: S.cats, note: "refresh after " + st.pausedUntil.slice(0, 10) }; continue; }
    suppliers[name] = { airports: AIRPORTS.filter(([icao]) => !covered.has(icao)).slice(0, LIMITS.airports).map(([icao, n]) => ({ icao, name: n })), categories: S.cats };
  }
  // investors and strategic partners: once a week (Director-only list)
  const inv = (await db.get("owner/_status")) || {}, mine = (await db.all("owner_prospects")).filter(r => r.id !== "_status");
  const investors = !inv.lastRun || now.getTime() - Date.parse(inv.lastRun) > WEEK - 6 * 36e5 ? {
    focus: INV_FOCUS[(Number.isInteger(inv.focusIndex) ? inv.focusIndex : 0) % INV_FOCUS.length], tracks: TRACKS, for: FOR, interests: INTERESTS, tickets: TICKETS, geos: GEOS,
    known: [...mine.map(r => r.data.org), ...rows.map(r => r.data.org)].filter(Boolean),
    profile: mine.filter(r => !r.data.profile && r.data.status !== "dnc").slice(0, LIMITS.profiles).map(r => ({ id: r.id, org: r.data.org, website: r.data.website || "", country: r.data.country || "" })) } : null;
  return { due: isDue, reason: !agent.on ? "The agent is off (Prospects > Research agent)." : isDue ? "Due." : "Not due today.", focus: FOC[fi % FOC.length], opFocus: OP_FOCUS[ofi % OP_FOCUS.length],
    limits: LIMITS, segments: SEGMENTS, regions: REGIONS, known: rows.map(r => r.data.org).filter(Boolean), bare, suppliers, investors };
}

// ---- import ----
export async function importBatch(db, batch, { fetchFn = fetch, lists = null, log = () => {}, dry = false, now = new Date() } = {}) {
  const nowIso = now.toISOString(), today = nowIso.slice(0, 10);
  const status = (await db.get("intel/status")) || {}, agent = (await db.get("intel/agent")) || {};
  const rows = await db.all("prospects");
  const existing = new Set(rows.map(r => normName(r.data.org))), sites = new Set(rows.map(r => host(r.data.website)).filter(Boolean));
  const optSet = new Set((await db.all("optouts")).map(r => r.id));
  let next = rows.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
  const P = pager(fetchFn), seen = new Set(), rejected = [], added = [], opsAdded = [], held = [];
  if (!lists) lists = await loadLists(fetchFn, log);
  const opened = async (u, mustName, org, website) => { const t = await P.get(u); if (!t) return false; if (mustName && !names(t, org, website)) return false; seen.add(normUrl(u)); return true; };
  // every address an avenue or a contact points to: kept only if it opens (or is on the organisation's own site)
  const openAll = async (list, website, org, contacts = false) => {
    for (const a of (Array.isArray(list) ? list : []).slice(0, 12)) {
      const u = a && a.url; if (!u) continue;
      if (contacts) { const t = await P.get(u); if (t && a.name && t.includes(String(a.name).toLowerCase()) && (!a.email || t.includes(String(a.email).toLowerCase()))) seen.add(normUrl(u)); }
      else if (!(host(website) && host(u).endsWith(host(website)))) { if (await P.get(u)) seen.add(normUrl(u)); }
    }
  };
  const common = async (o, kind) => {
    if (!o || !clean(o.org) || !clean(o.source)) return "missing name or source";
    if (PERSONLIKE.test(clean(o.org))) return "looks like a private person, not an organisation";
    if ([o.source, o.website].some(u => u && MARKETPLACES.test(host(u)))) return "marketplace or broker site used as a source";
    const bad = excludedPlace(o); if (bad) return "excluded or sanctioned place (" + bad + ")";
    if (existing.has(normName(o.org)) || (host(o.website) && sites.has(host(o.website)))) return "already known";
    if (!(await opened(o.source, true, o.org, o.website))) return "source page does not open or does not name the organisation";
    if (o.website && !(await opened(o.website, false))) o.website = "";
    return null;
  };
  const screenOf = (org, owners = []) => {
    if (!lists.names.size) return { result: "not screened", at: nowIso, failed: lists.failed };
    const hits = screen([org, ...owners], lists);
    return { result: hits.length ? "possible match" : "no match", at: nowIso, lists: lists.loaded.map(x => x.replace(/ \(\d+\)$/, "")), failed: lists.failed, hits };
  };
  const write = async (rec, list) => { next++; const id = "p" + String(next).padStart(3, "0"); if (!dry) await db.set("prospects/" + id, rec); existing.add(normName(rec.org)); if (host(rec.website)) sites.add(host(rec.website)); list.push(rec.org); };

  // 1. organisations (clients and referral partners)
  for (const o of (Array.isArray(batch.orgs) ? batch.orgs : []).slice(0, LIMITS.orgs)) {
    const why = (o && o.kind !== "client" && o.kind !== "partner") ? "bad kind" : await common(o);
    if (why) { rejected.push(`${clean(o && o.org, 60)}: ${why}`); continue; }
    await openAll(o.avenues, o.website, o.org); await openAll(o.contacts, o.website, o.org, true);
    const rec = { org: clean(o.org, 160), segment: SEGMENTS.includes(o.segment) ? o.segment : "Other", kind: o.kind, region: REGIONS.includes(o.region) ? o.region : "Global",
      country: clean(o.country, 60), province: clean(o.province, 60), city: clean(o.city, 60), website: clean(o.website, 300), source: clean(o.source, 400),
      why: clean(o.why, 400), approach: clean(o.approach, 500), status: "new", avenues: vetAvenues(o.avenues, seen, o.website), added: nowIso, batch: `Research agent ${today}`, aiReviewed: nowIso, addedBy: "research agent" };
    rec.contacts = vetContacts(o.contacts, seen, rec.website, rec.org, optSet).map(c => ({ ...c, addedBy: "research agent" }));
    const s = screenOf(rec.org); rec.screen = { auto: s };
    if (s.result === "possible match") { rec.status = "review"; rec.flags = ["Possible sanctions match: check the names against the list before any contact."]; held.push(rec.org); }
    await write(rec, added);
  }
  // 2. operators (suppliers; the Director decides, never rotated to brokers)
  for (const o of (Array.isArray(batch.operators) ? batch.operators : []).slice(0, LIMITS.operators)) {
    let why = await common(o);
    if (!why) {
      for (const u of [o.aoc_source, o.fleet_source, ...(o.audits || []).map(a => a && a.url), ...(o.safety || []).map(a => a && a.url), ...(o.enforcement || []).map(a => a && a.url), o.insurance && o.insurance.url].filter(Boolean).slice(0, 20)) if (await P.get(u)) seen.add(normUrl(u));
      const v = vetOperator(o, seen, existing); why = v.why;
      if (!why) {
        await openAll(o.avenues, o.website, o.org); await openAll(o.contacts, o.website, o.org, true);
        const ops = v.ops, s = screenOf(o.org, ops.owners); ops.screen = { ...ops.screen, auto: s };
        const rec = { org: clean(o.org, 160), segment: "Operator", kind: "operator", region: REGIONS.includes(o.region) ? o.region : "Global", country: clean(o.country, 60), province: "", city: clean(o.city, 60),
          website: clean(o.website, 300), source: clean(o.source, 400), why: clean(o.why, 400), approach: clean(o.approach, 500), status: "new", avenues: vetAvenues(o.avenues, seen, o.website), ops,
          added: nowIso, batch: `Research agent operators ${today}`, aiReviewed: nowIso, addedBy: "research agent" };
        rec.contacts = vetContacts(o.contacts, seen, rec.website, rec.org, optSet).map(c => ({ ...c, addedBy: "research agent" }));
        if (s.result === "possible match") { rec.status = "review"; ops.flags = [...new Set([...(ops.flags || []), "Possible sanctions match: check the names against the list before any contact."])]; held.push(rec.org); }
        await write(rec, opsAdded); continue;
      }
    }
    rejected.push(`${clean(o && o.org, 60)} (operator): ${String(why).replace("source not seen in this run's search results", "source page does not open or does not name the operator")}`);
  }
  // 3. contact routes for prospects that had none (only avenues and the review date change)
  let updated = 0; const byId = Object.fromEntries(rows.map(r => [r.id, r]));
  for (const [id, list] of Object.entries(batch.routes || {}).slice(0, LIMITS.routes)) {
    const r = byId[id]; if (!r || (r.data.avenues || []).length || r.data.status === "dnc") continue;
    for (const a of (Array.isArray(list) ? list : []).slice(0, 12)) if (a && a.url && (await P.get(a.url))) seen.add(normUrl(a.url));
    const av = vetAvenues(list, seen, r.data.website); if (!av.length) { rejected.push(`${clean(r.data.org, 60)} (contact routes): none opened`); continue; }
    if (!dry) await db.set("prospects/" + id, { ...r.data, avenues: av, aiReviewed: nowIso }); updated++;
  }

  // 4. business-jet suppliers at the key airports (services.mjs rules; a company already listed gets the airport added)
  const svcAdded = [], svcRejected = []; let svcMerged = 0;
  const byName = new Map(rows.map(r => [normName(r.data.org), r]));
  for (const [setName, perAirport] of Object.entries(batch.suppliers || {})) {
    const S = SETS[setName]; if (!S || !perAirport || typeof perAirport !== "object") continue;
    const st = (await db.get(S.key)) || {}, { covered } = coveredFor(st, rows, S, now), done = [];
    for (const [icao, items] of Object.entries(perAirport).slice(0, LIMITS.airports)) {
      if (!AIRPORTS.some(([c]) => c === icao)) continue;
      for (const o of (Array.isArray(items) ? items : []).slice(0, LIMITS.perAirport)) {
        let why = !o || !clean(o.org) || !clean(o.source) ? "missing name or source" : PERSONLIKE.test(clean(o.org)) ? "looks like a private person, not an organisation" : excludedPlace(o) ? "excluded or sanctioned place (" + excludedPlace(o) + ")" : "";
        if (!why && !(await opened(o.source, true, o.org, o.website))) why = "source page does not open or does not name the organisation";
        if (!why) { for (const u of [o.website, o.minutes_url, o.shuttle && o.shuttle.url, o.isbah && o.isbah.url, ...(o.evidence || []).map(x => x && x.url)].filter(Boolean)) if (await P.get(u)) seen.add(normUrl(u));
          await openAll(o.avenues, o.website, o.org); await openAll(o.contacts, o.website, o.org, true); }
        const v = why ? { why } : vetService(o, seen, icao, optSet, S.cats);
        if (v.why) { svcRejected.push(`${clean(o && o.org, 60)} (${icao}): ${String(v.why).replace("source not seen in this run's search results", "source page does not open")}`); continue; }
        const ex = byName.get(normName(v.rec.org));
        if (ex) {
          if (ex.data.kind === "service" && ex.data.category === v.rec.category && !(ex.data.airports || []).includes(icao)) { ex.data = { ...ex.data, airports: [...(ex.data.airports || []), icao] }; if (!dry) await db.set("prospects/" + ex.id, ex.data); svcMerged++; }
          else if (ex.data.kind !== "service" || ex.data.category !== v.rec.category) svcRejected.push(`${v.rec.org} (${icao}): already in the list as another type`);
          continue;
        }
        const rec = { ...v.rec, added: nowIso, batch: `Research agent ${S.label.toLowerCase()} ${today}`, aiReviewed: nowIso, addedBy: "research agent" };
        const s = screenOf(rec.org); rec.screen = { ...(rec.screen || {}), auto: s };
        if (s.result === "possible match") { rec.status = "review"; rec.flags = [...new Set([...(rec.flags || []), "Possible sanctions match: check the names against the list before any contact."])]; held.push(rec.org); }
        next++; const id = "p" + String(next).padStart(3, "0"); if (!dry) await db.set("prospects/" + id, rec); byName.set(normName(rec.org), { id, data: rec }); existing.add(normName(rec.org)); svcAdded.push(rec.org);
      }
      done.push(icao); covered.add(icao);
    }
    const finished = covered.size >= AIRPORTS.length, left = AIRPORTS.filter(([c]) => !covered.has(c));
    if (!dry && done.length) await db.set(S.key, { ...st, lastRun: nowIso, listSize: AIRPORTS.length, covered: finished ? [] : [...covered], pausedUntil: finished ? new Date(now.getTime() + 30 * 864e5).toISOString() : null,
      nextAirport: finished ? "refresh in 30 days" : left[0][1], airportsLeft: finished ? 0 : left.length, airportsDone: done, lastAdded: svcAdded.length, lastMerged: svcMerged, rejected: svcRejected.slice(0, 20), by: "research agent" });
  }
  rejected.push(...svcRejected);

  // 5. investors and strategic partners: Director-only table; nothing about them is logged, only counts
  let invAdded = 0, invRejected = 0, invProfiled = 0, invHeld = 0;
  if (batch.investors && typeof batch.investors === "object") {
    const IB = batch.investors, ist = (await db.get("owner/_status")) || {};
    const mine = (await db.all("owner_prospects")).filter(r => r.id !== "_status");
    const known = new Set([...existing, ...mine.map(r => normName(r.data.org))]);
    let inext = mine.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
    const irej = [];
    for (const o of (Array.isArray(IB.items) ? IB.items : []).slice(0, LIMITS.investors)) {
      let why = !o || !clean(o.org) || !clean(o.source) ? "missing name or source" : excludedPlace(o) ? "excluded or sanctioned place (" + excludedPlace(o) + ")" : "";
      if (!why && !(await opened(o.source, true, o.org, o.website))) why = "source page does not open or does not name the organisation";
      if (!why) { for (const u of [o.website, o.aum_url, ...(o.evidence || []).map(x => x && x.url)].filter(Boolean)) if (await P.get(u)) seen.add(normUrl(u));
        await openAll(o.avenues, o.website, o.org); await openAll(o.contacts, o.website, o.org, true); }
      const v = why ? { why } : vetInvestor(o, seen, known);
      if (v.why) { irej.push(`${clean(o && o.org, 60)}: ${String(v.why).replace("source not seen in this run's search results", "source page does not open").replace("duplicate", "already known")}`); continue; }
      const rec0 = { ...v.rec, profile: vetProfile(o, seen), added: nowIso, batch: `Research agent investors ${today}`, aiReviewed: nowIso, addedBy: "research agent" };
      const rec = { ...rec0, ...fitScore(rec0) };
      rec.contacts = vetContacts(o.contacts, seen, rec.website, rec.org, optSet).map(c => ({ ...c, addedBy: "research agent" }));
      const s = screenOf(rec.org); rec.screen = { auto: s }; if (s.result === "possible match") { rec.status = "review"; invHeld++; }
      inext++; if (!dry) await db.set("owner/i" + String(inext).padStart(3, "0"), rec); known.add(normName(rec.org)); invAdded++;
    }
    const byI = Object.fromEntries(mine.map(r => [r.id, r]));
    for (const [id, o] of Object.entries(IB.profiles || {}).slice(0, LIMITS.profiles)) {
      const r = byI[id]; if (!r || r.data.profile || !o) continue;
      for (const u of [o.aum_url, ...(o.evidence || []).map(x => x && x.url)].filter(Boolean)) if (await P.get(u)) seen.add(normUrl(u));
      const evidence = [...(r.data.evidence || []), ...(Array.isArray(o.evidence) ? o.evidence : []).map(x => ({ summary: clean(x && x.summary, 300), url: clean(x && x.url, 400) })).filter(x => x.summary && seen.has(normUrl(x.url)))].slice(0, 5);
      const d = { ...r.data, evidence, profile: vetProfile(o, seen), aiReviewed: nowIso }; if (!dry) await db.set("owner/" + id, { ...d, ...fitScore(d) }); invProfiled++;
    }
    invRejected = irej.length;
    if (!dry) { const fi = Number.isInteger(ist.focusIndex) ? ist.focusIndex : 0;
      await db.set("owner/_status", { ...ist, lastRun: nowIso, lastAdded: invAdded, focusIndex: fi + 1, nextFocus: INV_FOCUS[(fi + 1) % INV_FOCUS.length], profiled: invProfiled,
        note: `Research agent: ${invAdded} added, ${invProfiled} profiles, ${invRejected} rejected by the checks.`, rejected: irej.slice(0, 20), by: "research agent" }); }
  }
  const invNote = batch.investors ? ` Investors and partners (Director-only list): ${invAdded} added, ${invProfiled} profiles, ${invRejected} rejected${invHeld ? ", " + invHeld + " held for your decision" : ""}.` : "";
  const svcNote = batch.suppliers ? ` Suppliers at business airports: ${svcAdded.length} added, ${svcMerged} linked to more airports.` : "";
  const note = `${dry ? "Dry run, nothing written. " : ""}Research agent: ${added.length} organisations added${added.length ? " (" + added.slice(0, 6).join(", ") + (added.length > 6 ? "…" : "") + ")" : ""}, ${opsAdded.length} operators, contact routes for ${updated} existing; ${rejected.length} rejected by the checks${held.length ? "; held for your decision (possible sanctions match): " + held.join(", ") : ""}.${svcNote}${invNote}${lists.failed.length ? " Sanctions lists not loaded: " + lists.failed.join(", ") + "." : ""}`;
  if (!dry) {
    const fi = Number.isInteger(status.focusIndex) ? status.focusIndex : 0, ofi = Number.isInteger(status.opFocusIndex) ? status.opFocusIndex : 0;
    await db.set("intel/status", { ...status, lastRun: nowIso, lastAdded: added.length, lastUpdated: updated, lastOperators: opsAdded.length, totalProspects: rows.length + added.length + opsAdded.length + svcAdded.length,
      focusIndex: fi + 1, opFocusIndex: ofi + 1, note, rejected: rejected.slice(0, 30), by: "research agent" });
    const a2 = (await db.get("intel/agent")) || agent;
    await db.set("intel/agent", { ...a2, state: "done", stateAt: nowIso, last: { at: nowIso, added: added.length, operators: opsAdded.length, routes: updated, suppliers: svcAdded.length, suppliersLinked: svcMerged, investors: batch.investors ? invAdded : null, rejected: rejected.length, held: held.length + invHeld, focus: clean(batch.focus, 160), note: note.slice(0, 600), reasons: rejected.slice(0, 30) } });
  }
  log(note); rejected.forEach(x => log("  rejected: " + x));
  return { added, operators: opsAdded, updated, suppliers: svcAdded, suppliersLinked: svcMerged, investors: { added: invAdded, profiled: invProfiled, rejected: invRejected, held: invHeld }, rejected, held, note };
}

// one-off clean-up of supplier records (Morten, 9 Nov 2026): merge duplicates into one record per company with all its
// airports, remove records of the wrong type, recategorise, move suppliers out of the client list, re-check weak sources.
// Every record changed or removed is kept in full in intel/cleanup-<date> first, so any change can be undone.
const uniqBy = (arr, k) => { const s = new Set(); return (arr || []).filter(x => { const v = k(x); if (!v || s.has(v)) return false; s.add(v); return true; }); };
export async function fixRecords(db, plan, { log = () => {}, dry = false, now = new Date(), fetchFn = fetch } = {}) {
  const nowIso = now.toISOString(), rows = await db.all("prospects"), byId = Object.fromEntries(rows.map(r => [r.id, r]));
  const byOrg = Object.fromEntries(rows.map(r => [r.data.org, r])), archive = [], done = { merged: 0, removed: 0, recategorised: 0, moved: 0, sourcesFixed: 0, flagged: 0 }, notes = [];
  const save = async (id, d) => { if (!dry) await db.set("prospects/" + id, d); byId[id] = { id, data: d }; };
  const drop = async (id, why) => { const r = byId[id]; if (!r) return; archive.push({ id, why, data: r.data }); if (!dry) await db.del("prospects/" + id); delete byId[id]; };
  const find = ref => byId[ref] || byOrg[ref];
  for (const m of plan.merge || []) {
    const k = find(m.keep); if (!k) { notes.push("merge: " + m.keep + " not found"); continue; }
    const others = (m.drop || []).map(find).filter(x => x && x.id !== k.id); archive.push({ id: k.id, why: "before merge", data: k.data });
    const all = [k, ...others].map(r => r.data);
    const d = { ...k.data, org: m.org || k.data.org, airports: [...new Set(all.flatMap(x => x.airports || []))], avenues: uniqBy(all.flatMap(x => x.avenues || []), a => normUrl(a.url)).slice(0, 20),
      contacts: uniqBy(all.flatMap(x => x.contacts || []), c => String(c.name || "").toLowerCase()).slice(0, 12), evidence: uniqBy(all.flatMap(x => x.evidence || []), e => normUrl(e.url)).slice(0, 10),
      country: m.country || k.data.country || all.map(x => x.country).find(Boolean) || "", merged: [...(k.data.merged || []), ...others.map(o => ({ id: o.id, org: o.data.org, at: nowIso }))] };
    if (m.category) d.category = m.category;
    await save(k.id, d); for (const o of others) await drop(o.id, "merged into " + k.id); done.merged += others.length;
  }
  for (const x of plan.remove || []) { const r = find(x.ref || x); if (r) { await drop(r.id, x.why || "wrong type"); done.removed++; } else notes.push("remove: " + (x.ref || x) + " not found"); }
  for (const x of plan.recat || []) { const r = find(x.ref); if (!r) { notes.push("recat: " + x.ref + " not found"); continue; } archive.push({ id: r.id, why: "before recategorise", data: r.data });
    const d = { ...r.data, category: x.category }; if (x.category !== "Crew hotels") delete d.hotel; await save(r.id, d); done.recategorised++; }
  for (const x of plan.move || []) { const r = find(x.ref); if (!r) { notes.push("move: " + x.ref + " not found"); continue; }
    if (x.into) { const k = find(x.into); if (!k) { notes.push("move into: " + x.into + " not found"); continue; } archive.push({ id: k.id, why: "before merge", data: k.data });
      const all = [k.data, r.data]; await save(k.id, { ...k.data, avenues: uniqBy(all.flatMap(y => y.avenues || []), a => normUrl(a.url)).slice(0, 20), contacts: uniqBy(all.flatMap(y => y.contacts || []), c => String(c.name || "").toLowerCase()).slice(0, 12), merged: [...(k.data.merged || []), { id: r.id, org: r.data.org, at: nowIso }] });
      await drop(r.id, "supplier in the client list, merged into " + k.id); }
    else { archive.push({ id: r.id, why: "before move", data: r.data }); await save(r.id, { ...r.data, kind: "service", segment: "Service partner", category: x.category, airports: x.airports || r.data.airports || [] }); }
    done.moved++; }
  // weak sources: the organisation's own site replaces a third-party source when it opens and names the organisation
  if (plan.recheck) {
    const weak = /facebook\.com|ibac\.org|businessairnews|ainonline|gulfnews|centreforaviation|wikipedia|thepeakmagazine|bsigroup|verdictfoodservice|pax-intl|asianaviation|iata\.org|cloudfront|aviationpros|aviationbusinessme|businessairportinternational|aerotime|avitrader|ch-aviation/;
    for (const r of Object.values(byId)) {
      if (!["service", "operator"].includes(r.data.kind) || !weak.test(host(r.data.source))) continue;
      const site = r.data.website && !weak.test(host(r.data.website)) ? r.data.website : "";
      const t = site ? await fetchPage(site, fetchFn) : null;
      if (t && names(t, r.data.org, site)) { archive.push({ id: r.id, why: "before source fix", data: r.data }); await save(r.id, { ...r.data, source: site, sourceChecked: nowIso, flags: (r.data.flags || []).filter(f => !/^Source to check/.test(f)) }); done.sourcesFixed++; }
      else { const f = "Source to check: only a third-party page names it (" + host(r.data.source) + "); confirm on the company's own site before the first booking.";
        await save(r.id, { ...r.data, flags: [...new Set([...(r.data.flags || []), f])] }); done.flagged++; }
    }
    for (const r of Object.values(byId)) if (r.data.kind === "service" && !r.data.country) { const f = "Country to confirm."; if (!(r.data.flags || []).includes(f)) { await save(r.id, { ...r.data, flags: [...(r.data.flags || []), f] }); done.flagged++; } }
  }
  if (!dry) await db.set("intel/cleanup-" + nowIso.slice(0, 10), { at: nowIso, by: "clean-up", done, notes, archive });
  const note = `${dry ? "Dry run, nothing written. " : ""}Clean-up: ${done.merged} duplicates merged, ${done.removed} removed, ${done.recategorised} recategorised, ${done.moved} moved from the client list, ${done.sourcesFixed} sources replaced by the company's own site, ${done.flagged} flagged to check.${notes.length ? " Not found: " + notes.length + "." : ""}`;
  log(note); notes.forEach(n => log("  " + n)); return { ...done, notes, note };
}

// the batch arrives as the workflow input BATCH: gzip + base64 of the JSON the task wrote ({focus, orgs, operators, routes})
export function decode(s) {
  const t = String(s || "").trim(); if (!t) throw new Error("No batch given.");
  const j = t.startsWith("{") ? t : gunzipSync(Buffer.from(t, "base64")).toString("utf8");
  const b = JSON.parse(j); if (!b || typeof b !== "object") throw new Error("The batch is not a JSON object.");
  return b;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs");
  const mode = process.argv[2] || "plan";
  await main("Research agent " + mode, ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], async () => {
    const db = connect();
    const keys = await jobKeys(db);
    if (mode === "plan") {
      // the plan is sealed with the task's own public key (input KEY): investor names never appear in the log
      if (!String(process.env.KEY || "").trim()) throw new Error("No KEY given: the task must pass its public key (node agentcrypt.mjs keygen).");
      const p = await plan(db);
      console.log("PLAN-BEGIN\n" + seal(p, process.env.KEY) + "\nPLAN-END\nJOBKEY-BEGIN\n" + Buffer.from(keys.publicKey).toString("base64") + "\nJOBKEY-END");
      return { note: p.reason + (p.due ? " Investors this run: " + (p.investors ? "yes" : "no") + "." : "") };
    }
    // the daily sanctions screen's name index (every list, with names kept up to 14 days when a site is down); live lists if missing
    let lists = null;
    try { const { data } = await db.sb.storage.from("sanctions").download("index.json"); const ix = JSON.parse(await data.text());
      if (ix && ix.names && Date.now() - Date.parse(ix.at) < 3 * 864e5) lists = { names: new Map(Object.entries(ix.names)), loaded: ix.lists || [], failed: ix.failed || [] }; } catch {}
    if (mode === "report") {
      // read-only review of operators and service partners (Morten, 9 Nov 2026), sealed with the caller's key
      if (!String(process.env.KEY || "").trim()) throw new Error("No KEY given.");
      const rows = await db.all("prospects"), pick = r => ({ id: r.id, org: r.data.org, kind: r.data.kind, segment: r.data.segment, category: r.data.category, country: r.data.country, city: r.data.city,
        airports: r.data.airports, source: r.data.source, website: r.data.website, status: r.data.status, batch: r.data.batch, added: r.data.added, type: r.data.hotel ? "hotel" : "", aoc: r.data.ops && r.data.ops.aoc, fleet: r.data.ops && r.data.ops.fleet });
      const rep = { operators: rows.filter(r => r.data.kind === "operator").map(pick), services: rows.filter(r => r.data.kind === "service").map(pick),
        others: rows.filter(r => !["operator", "service"].includes(r.data.kind)).map(r => ({ org: r.data.org, kind: r.data.kind, segment: r.data.segment, country: r.data.country, batch: r.data.batch })),
        sets: { core: await db.get("intel/services"), hotels: await db.get("intel/services-hotels") }, registriesStatus: await db.get("intel/audit-registries") };
      try { const { data } = await db.sb.storage.from("registries").download("index.json"); const ix = JSON.parse(await data.text());
        rep.registries = { keys: Object.keys(ix), sample: JSON.stringify(ix).slice(0, 1500), size: JSON.stringify(ix).length }; } catch (e) { rep.registries = { error: String(e) }; }
      console.log("PLAN-BEGIN\n" + seal(rep, process.env.KEY) + "\nPLAN-END"); return { note: `report: ${rep.operators.length} operators, ${rep.services.length} service partners` };
    }
    if (mode === "fix") {
      const raw0 = String(process.env.BATCH || "").trim(); if (!raw0.startsWith("S1.")) throw new Error("The clean-up must be sealed.");
      return fixRecords(db, open(raw0, keys.privateKey), { log: console.log, dry: process.env.DRY === "1" });
    }
    const raw = String(process.env.BATCH || "").trim();
    const batch = raw.startsWith("S1.") ? open(raw, keys.privateKey) : decode(raw);
    if (!raw.startsWith("S1.") && batch.investors) throw new Error("Investor findings must be sealed (agentcrypt.mjs seal); nothing was written.");
    return importBatch(db, batch, { lists, log: console.log, dry: process.env.DRY === "1" });
  });
}
