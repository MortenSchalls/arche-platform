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
import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { connect } from "./lib/db.mjs";
import { loadLists, screen } from "./lib/sanctions.mjs";
import { vetContacts } from "./lib/contacts.mjs";
import { due } from "./agent.mjs";
import { FOCUS, OP_FOCUS, SEGMENTS, REGIONS, SANCTIONED, MARKETPLACES, normName, normUrl, host, vetAvenues, vetOperator } from "./intel.mjs";

export const LIMITS = { orgs: 20, operators: 12, routes: 8 };
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
  return { due: isDue, reason: !agent.on ? "The agent is off (Prospects > Research agent)." : isDue ? "Due." : "Not due today.", focus: FOC[fi % FOC.length], opFocus: OP_FOCUS[ofi % OP_FOCUS.length],
    limits: LIMITS, segments: SEGMENTS, regions: REGIONS, known: rows.map(r => r.data.org).filter(Boolean), bare };
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

  const note = `${dry ? "Dry run, nothing written. " : ""}Research agent: ${added.length} organisations added${added.length ? " (" + added.slice(0, 6).join(", ") + (added.length > 6 ? "…" : "") + ")" : ""}, ${opsAdded.length} operators, contact routes for ${updated} existing; ${rejected.length} rejected by the checks${held.length ? "; held for your decision (possible sanctions match): " + held.join(", ") : ""}.${lists.failed.length ? " Sanctions lists not loaded: " + lists.failed.join(", ") + "." : ""}`;
  if (!dry) {
    const fi = Number.isInteger(status.focusIndex) ? status.focusIndex : 0, ofi = Number.isInteger(status.opFocusIndex) ? status.opFocusIndex : 0;
    await db.set("intel/status", { ...status, lastRun: nowIso, lastAdded: added.length, lastUpdated: updated, lastOperators: opsAdded.length, totalProspects: rows.length + added.length + opsAdded.length,
      focusIndex: fi + 1, opFocusIndex: ofi + 1, note, rejected: rejected.slice(0, 30), by: "research agent" });
    const a2 = (await db.get("intel/agent")) || agent;
    await db.set("intel/agent", { ...a2, state: "done", stateAt: nowIso, last: { at: nowIso, added: added.length, operators: opsAdded.length, routes: updated, rejected: rejected.length, held: held.length, focus: clean(batch.focus, 160), note: note.slice(0, 600), reasons: rejected.slice(0, 30) } });
  }
  log(note); rejected.forEach(x => log("  rejected: " + x));
  return { added, operators: opsAdded, updated, rejected, held, note };
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
    if (mode === "plan") { const p = await plan(db); console.log("PLAN-BEGIN\n" + JSON.stringify(p) + "\nPLAN-END"); return { note: p.reason + " Focus: " + p.focus + "." }; }
    // the daily sanctions screen's name index (every list, with names kept up to 14 days when a site is down); live lists if missing
    let lists = null;
    try { const { data } = await db.sb.storage.from("sanctions").download("index.json"); const ix = JSON.parse(await data.text());
      if (ix && ix.names && Date.now() - Date.parse(ix.at) < 3 * 864e5) lists = { names: new Map(Object.entries(ix.names)), loaded: ix.lists || [], failed: ix.failed || [] }; } catch {}
    return importBatch(db, decode(process.env.BATCH), { lists, log: console.log, dry: process.env.DRY === "1" });
  });
}
