// Daily intelligence: research new prospect ORGANISATIONS with web search and add them to the portal,
// plus charter OPERATORS (suppliers) checked for certificate, audits, safety record and sanctions exposure.
// Rules (same as the claude.ai scheduled task, now also enforced in code):
//  - organisations only; a named person may appear only as a role
//  - every organisation needs a public source URL that appeared in this run's web search results
//  - no personal data, no guessed emails or phone numbers, no bought lists, no logins or scraping
//  - never change status, assignment or history of existing prospects
import { connect } from "./lib/db.mjs";
import { loadLists, screen } from "./lib/sanctions.mjs";
import * as investors from "./investors.mjs";
import { vetContacts } from "./lib/contacts.mjs";

const FOCUS = [
  "Hong Kong and China family offices", "Japan and Korea luxury travel and family offices",
  "Thailand, Vietnam, Indonesia, Philippines resorts, villas and DMCs", "Australia and New Zealand luxury travel and events",
  "India family offices and wedding planners", "Saudi Arabia, Qatar, Kuwait family offices and events",
  "UAE concierge, yacht and event companies", "Europe yacht charter brokers (Monaco, Côte d'Azur, Mallorca, Greece, Croatia)",
  "Europe concierge and luxury tour operators (UK, Switzerland, Italy, France, Germany)",
  "North America sports teams, agencies and touring productions", "Latin America family offices (Brazil, Mexico, Colombia)",
  "Africa luxury safari and lodge operators", "Global F1, golf, tennis, sailing and major event organisers and hospitality agencies",
  "Asia private banks and multi-family offices as referral partners"];
const SEGMENTS = ["Family office", "Wealth network", "Luxury travel & concierge", "Yachting", "Events & entertainment", "Sports",
  "Villas & hospitality", "MICE & DMC", "Corporate travel (partner)", "Other"];
const REGIONS = ["Asia-Pacific", "Middle East", "Europe", "North America", "Latin America", "Africa", "Global"];
const AVENUE_TYPES = ["website", "contact", "linkedin", "instagram", "facebook", "x", "youtube", "wechat", "whatsapp", "social", "phone", "email", "event", "association", "introducer", "other"];

const MODEL = process.env.INTEL_MODEL || "claude-sonnet-5-5";
// newer models use the newer tool version; the job falls back to the older one if the API refuses it
const SEARCH_TYPES = process.env.WEB_SEARCH_TOOL ? [process.env.WEB_SEARCH_TOOL] : ["web_search_20260209", "web_search_20250305"];
const searchTool = type => ({ type, name: "web_search", max_uses: 12 });

export const normName = s => String(s || "").toLowerCase().replace(/\b(ltd|limited|group|pte|llc|inc|co|company|the)\b/g, "").replace(/[^a-z0-9À-￿]+/g, "");
const normUrl = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, "")).toLowerCase(); } catch { return ""; } };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

// one research call: returns {data, seen:Set of URLs from search results}
export async function ask(prompt, call = callApi) {
  let res, lastErr;
  for (const t of SEARCH_TYPES) {
    try { res = await call({ model: MODEL, max_tokens: 8000, tools: [searchTool(t)], messages: [{ role: "user", content: prompt }] }); break; }
    catch (e) { lastErr = e; if (!/ 400/.test(e.message)) throw e; }
  }
  if (!res) throw lastErr;
  const seen = new Set(); let text = "";
  const collect = o => { if (!o || typeof o !== "object") return; if (typeof o.url === "string") seen.add(normUrl(o.url)); for (const v of Object.values(o)) if (v && typeof v === "object") collect(v); };
  for (const b of res.content || []) {
    if (b.type === "text") { text += b.text; (b.citations || []).forEach(collect); }
    else if (/result/.test(b.type || "")) collect(b.content);       // web_search_tool_result and newer result blocks
  }
  const m = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})\s*$/);
  if (!m) throw new Error("No JSON in the research answer");
  return { data: JSON.parse(m[1]), seen };
}
async function callApi(body) {
  // streamed, so a long research answer never hits a "no response for 5 minutes" timeout
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }) });
  if (!r.ok) throw new Error("Anthropic API " + r.status + ": " + (await r.text()).slice(0, 300));
  return readStream(r.body);
}
// rebuild the message from server-sent events: blocks start whole, text and citations arrive as deltas
export async function readStream(stream) {
  const content = []; let buf = "", stop = null;
  const dec = new TextDecoder();
  for await (const chunk of stream) {
    buf += dec.decode(chunk, { stream: true });
    let k;
    while ((k = buf.indexOf("\n\n")) >= 0) {
      const evt = buf.slice(0, k); buf = buf.slice(k + 2);
      const line = evt.split("\n").find(l => l.startsWith("data: ")); if (!line) continue;
      let e; try { e = JSON.parse(line.slice(6)); } catch { continue; }
      if (e.type === "content_block_start") content[e.index] = structuredClone(e.content_block);
      else if (e.type === "content_block_delta") {
        const b = content[e.index]; if (!b) continue;
        if (e.delta.type === "text_delta") b.text = (b.text || "") + e.delta.text;
        else if (e.delta.type === "citations_delta") (b.citations = b.citations || []).push(e.delta.citation);
      } else if (e.type === "message_delta") stop = e.delta && e.delta.stop_reason;
      else if (e.type === "error") throw new Error("Anthropic API stream: " + JSON.stringify(e.error).slice(0, 300));
    }
  }
  return { content: content.filter(Boolean), stop_reason: stop };
}

const clean = (v, n = 300) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const PERSONAL = /@(gmail|yahoo|hotmail|outlook|icloud|live|qq|163)\./i;

// keep only what passes the rules
export function vetOrg(o, seen, existing) {
  if (!o || !clean(o.org) || !o.source) return "missing name or source";
  if (!seen.has(normUrl(o.source))) return "source not seen in this run's search results";
  if (existing.has(normName(o.org))) return "duplicate";
  if (o.kind !== "client" && o.kind !== "partner") return "bad kind";
  return null;
}
// ---- operators (suppliers): Air Operator Certificate holders Archē can book for clients (Morten, 20 Oct 2026) ----
export const OP_FOCUS = ["Singapore, Malaysia and Indonesia", "Thailand, Vietnam, Cambodia and the Philippines", "Hong Kong, Macau and Taiwan",
  "Mainland China", "Japan and South Korea", "India, Sri Lanka and the Maldives", "Australia and New Zealand",
  "United Arab Emirates, Qatar, Saudi Arabia and Bahrain", "Switzerland, Austria and Germany", "Malta, Cyprus, Italy and France",
  "United Kingdom, Ireland and the Netherlands", "United States and Canada", "Turkey and Greece", "South Africa and Kenya"];
// comprehensively sanctioned or high-risk jurisdictions: operators based there are never added
export const SANCTIONED = ["russia", "russian federation", "belarus", "iran", "north korea", "dprk", "syria", "cuba", "venezuela", "myanmar", "burma", "afghanistan", "crimea", "donetsk", "luhansk"];
// charter marketplaces and other brokers' sites are never a source (no scraping of boards, nothing copied out of Avinode)
const MARKETPLACES = /(^|\.)(avinode|jetvip|aircharterguide|charterhub|privatefly|fxair|lunajets|flyvictor|jetsmarter|flyxo|paramountbusinessjets|aircharterservice|evojets|stratosjets|jettly|villiers|mercuryjets|privatejetcharter|charterscanner|jetcharterhub)\.[a-z.]+$/i;
const AUDITS = { argus: "ARGUS", wyvern: "Wyvern", "is-bah": "IS-BAH", isbah: "IS-BAH" };
export function opTier(audits) {
  const top = audits.some(a => (a.name === "ARGUS" && /platinum|gold\s*\+|gold plus/i.test(a.level)) || (a.name === "Wyvern" && /wingman/i.test(a.level)) || (a.name === "IS-BAH" && /stage\s*(2|ii|3|iii)/i.test(a.level)));
  return top ? "A" : audits.length ? "B" : "C";
}
// business jets in Archē's categories (light jet to ultra-long-range); turboprops and helicopters do not count
const BIZJET = /citation|phenom|praetor|legacy|lineage|learjet|challenger|global\s*\d|global express|falcon|gulfstream|\bg\s?(150|200|280|300|350|400|450|500|550|600|650|700|800)\b|\bg-?iv|\bg-?v\b|hawker|premier|pc-?24|hondajet|\bbbj\b|boeing business jet|\bacj|airbus corporate|embraer (legacy|lineage|praetor|phenom)/i;
export function vetOperator(o, seen, existing, nowYear = new Date().getFullYear()) {
  if (!o || !clean(o.org) || !o.source) return { why: "missing name or source" };
  if (!seen.has(normUrl(o.source))) return { why: "source not seen in this run's search results" };
  if ([o.source, o.website, o.aoc_source, o.fleet_source].some(u => u && MARKETPLACES.test(host(u)))) return { why: "marketplace or broker site used as a source" };
  const place = [o.country, o.city, o.org].join(" ").toLowerCase();
  if (SANCTIONED.some(c => place.includes(c))) return { why: "sanctioned or high-risk jurisdiction" };
  if (existing.has(normName(o.org))) return { why: "duplicate" };
  if (!clean(o.aoc_authority)) return { why: "no Air Operator Certificate found" };
  if (o.eu_air_safety_list === true || /^(yes|true|listed)/i.test(String(o.eu_air_safety_list || ""))) return { why: "on the EU Air Safety List (operator or its certifying state)" };
  const ok = u => u && seen.has(normUrl(u)) && !MARKETPLACES.test(host(u));
  const audits = (Array.isArray(o.audits) ? o.audits : []).map(a => ({ name: AUDITS[String(a && a.name || "").toLowerCase()] || "", level: clean(a && a.level, 60), year: clean(a && a.year, 4), url: clean(a && a.url, 400) }))
    .filter(a => a.name && ok(a.url));
  const safety = (Array.isArray(o.safety) ? o.safety : []).map(x => ({ year: clean(x && x.year, 4), summary: clean(x && x.summary, 300), url: clean(x && x.url, 400) })).filter(x => x.summary && ok(x.url));
  const flags = [];
  if (safety.some(x => +x.year >= nowYear - 5)) flags.push("Accident or serious incident in the last 5 years: read the report before using this operator.");
  if (!audits.length) flags.push("No ARGUS, Wyvern or IS-BAH evidence found: check before using this operator.");
  const enforcement = (Array.isArray(o.enforcement) ? o.enforcement : []).map(x => ({ year: clean(x && x.year, 4), summary: clean(x && x.summary, 300), url: clean(x && x.url, 400) })).filter(x => x.summary && ok(x.url));
  if (enforcement.some(x => +x.year >= nowYear - 5)) flags.push("Regulator action (suspension, fine or restriction) in the last 5 years: read it before using this operator.");
  const fleet = (Array.isArray(o.fleet) ? o.fleet : []).map(f => ({ type: clean(f && f.type, 80), count: Math.max(0, parseInt(f && f.count, 10) || 0) })).filter(f => f.type).slice(0, 20);
  if (!fleet.some(f => BIZJET.test(f.type))) flags.push("No business jet in Archē's categories found in the published fleet: check the fleet before using this operator.");
  const owners = (Array.isArray(o.owners) ? o.owners : []).map(x => clean(x, 120)).filter(x => x && !/\b(mr|mrs|ms|dr)\b\.?/i.test(x)).slice(0, 5);   // organisations only
  const insurance = o.insurance && ok(o.insurance.url) ? { summary: clean(o.insurance.summary, 200), url: clean(o.insurance.url, 400) } : null;
  return { ops: { aoc: { authority: clean(o.aoc_authority, 80), source: ok(o.aoc_source) ? clean(o.aoc_source, 400) : "" },
    bases: (Array.isArray(o.bases) ? o.bases : []).map(b => clean(b, 40)).filter(Boolean).slice(0, 8),
    fleet, fleetSource: ok(o.fleet_source) || (o.fleet_source && o.website && host(o.fleet_source).endsWith(host(o.website))) ? clean(o.fleet_source, 400) : "",
    audits, safety, enforcement, owners, insurance, euAirSafetyList: "not listed", founded: clean(o.founded, 4), tier: opTier(audits), flags,
    screen: { country: "clear", entity: "", note: "Screen the company and its owners against OFAC, EU, UK and UN lists before the first booking." } } };
}

export function vetAvenues(list, seen, website) {
  const site = host(website);
  return (Array.isArray(list) ? list : []).filter(a => a && AVENUE_TYPES.includes(a.type) && a.url && (seen.has(normUrl(a.url)) || (site && host(a.url).endsWith(site))))
    .filter(a => !PERSONAL.test(a.url) && !/linkedin\.com\/in\//i.test(a.url))     // no personal emails or personal LinkedIn profiles
    .slice(0, 12).map(a => ({ type: a.type, label: clean(a.label || a.type, 120), url: clean(a.url, 400), note: clean(a.note || "found by daily research", 200) }));
}

export async function run(db = connect(), call = callApi, log = console.log, fetchLists = fetch) {
  const status = (await db.get("intel/status")) || {};
  const fi = Number.isInteger(status.focusIndex) ? status.focusIndex : 0;
  const focus = FOCUS[fi % FOCUS.length];
  const rows = await db.all("prospects");
  const existing = new Set(rows.map(r => normName(r.data.org)));
  const maxId = rows.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
  const today = new Date().toISOString().slice(0, 10), nowIso = new Date().toISOString();
  const optSet = new Set((await db.all("optouts")).map(r => r.id));

  // 1. new organisations for today's focus
  const prompt = `You research prospects for Archē Executive, a Singapore private jet charter broker (whole-aircraft charters on third-party operators, worldwide).
Today's focus: ${focus}.
Find up to 15 ORGANISATIONS in this focus that plausibly need private jet charter or can refer clients. Use web search; every organisation must come from a page you actually found in search results.
Strict rules: organisations only. No personal data about private individuals: no named people's phone numbers, emails, addresses or personal social profiles. A person may appear only as a role, for example "Head of Travel". Never guess an email address or a phone number. Family offices: approach only through introductions.
Already in the list (skip these): ${rows.map(r => r.data.org).join("; ").slice(0, 6000)}
Reply with JSON only, in a \`\`\`json block: an array of objects with fields
org, segment (one of ${SEGMENTS.join(", ")}), kind ("client" or "partner"), region (one of ${REGIONS.join(", ")}), country, province, city, website (official site, only if you found it), source (URL of the public page where you found the organisation), why (one sentence), approach (one or two sentences, by role), avenues (array of {type, label, url, note}; types: ${AVENUE_TYPES.join(", ")}; only official business routes you found), contacts (array of up to 3 {name, role, email, phone, url}: named BUSINESS contacts only as published on the organisation's OWN website, with the page url; work email on the organisation's own domain; never personal emails or phones, never guessed; empty if none published).`;
  const { data, seen } = await ask(prompt, call);
  const added = [], rejected = [];
  let next = maxId;
  for (const o of Array.isArray(data) ? data.slice(0, 20) : []) {
    const why = vetOrg(o, seen, existing); if (why) { rejected.push(`${clean(o && o.org, 60)}: ${why}`); continue; }
    next++; const id = "p" + String(next).padStart(3, "0");
    const rec = { org: clean(o.org, 160), segment: SEGMENTS.includes(o.segment) ? o.segment : "Other", kind: o.kind, region: REGIONS.includes(o.region) ? o.region : "Global",
      country: clean(o.country, 60), province: clean(o.province, 60), city: clean(o.city, 60),
      website: o.website && (seen.has(normUrl(o.website)) || host(o.website) === host(o.source)) ? clean(o.website, 300) : "",
      source: clean(o.source, 400), why: clean(o.why, 400), approach: clean(o.approach, 500), status: "new",
      avenues: vetAvenues(o.avenues, seen, o.website), added: nowIso, batch: `AI review ${today}`, aiReviewed: nowIso };
    rec.contacts = vetContacts(o.contacts, seen, rec.website, rec.org, optSet);
    await db.set("prospects/" + id, rec); existing.add(normName(rec.org)); added.push(rec.org);
  }

  // 2. contact routes for up to 8 existing prospects without any (only avenues and aiReviewed change)
  const bare = rows.filter(r => !(r.data.avenues || []).length).sort((a, b) => String(a.data.aiReviewed || "").localeCompare(String(b.data.aiReviewed || ""))).slice(0, 8);
  let updated = 0;
  if (bare.length) {
    const p2 = `For each organisation below, find its official BUSINESS contact routes with web search: official website, its contact page, the organisation's official LinkedIn company page, official Instagram/Facebook/X/YouTube accounts, a general office phone or email that the organisation itself publishes, events they host or attend, associations. No personal profiles or personal contact details; never guess.
${bare.map(r => `- id ${r.id}: ${r.data.org}${r.data.website ? " (" + r.data.website + ")" : ""}, ${r.data.country || ""}`).join("\n")}
Reply with JSON only, in a \`\`\`json block: an object mapping id to an array of {type, label, url, note}; types: ${AVENUE_TYPES.join(", ")}.`;
    const r2 = await ask(p2, call);
    for (const r of bare) {
      const av = vetAvenues((r2.data || {})[r.id], r2.seen, r.data.website);
      if (!av.length) continue;
      await db.set("prospects/" + r.id, { ...r.data, avenues: av, aiReviewed: nowIso }); updated++;
    }
  }

  // 3. operators for today's operator focus (suppliers, owner decides; never rotated to brokers)
  const ofi = Number.isInteger(status.opFocusIndex) ? status.opFocusIndex : 0;
  const opFocus = OP_FOCUS[ofi % OP_FOCUS.length];
  const opsAdded = [];
  const p3 = `You research charter OPERATORS for Archē Executive, a Singapore private jet charter broker. Archē books whole aircraft on demand (light jets to ultra-long-range business jets) as agent for its clients, worldwide.
Region focus: ${opFocus}.
Find up to 10 operators that: hold a current Air Operator Certificate from a recognised civil aviation authority; fly business jets on on-demand charter and accept bookings through brokers; are not based in or controlled from Russia, Belarus, Iran, North Korea, Syria, Cuba, Venezuela, Myanmar or Afghanistan; and, as far as public sources show, are not named on OFAC, EU, UK or UN sanctions lists.
Scrutinise quality and safety from public sources only: the operator's own website, the aviation authority's AOC register, ARGUS, Wyvern or IS-BAH registries and announcements, official accident investigation reports, the Aviation Safety Network, the regulator's enforcement notices, and the EU Air Safety List (exclude any operator on it, or certified by a state whose carriers are on it).
Prefer operators with business jets in Archē's categories (light, midsize, super-midsize, heavy, ultra-long-range), a safety audit (ARGUS, Wyvern or IS-BAH), several years of operation and no recent accident or regulator action. Never use charter marketplaces, booking platforms or other brokers' websites as a source (for example Avinode, JetVIP, Air Charter Guide).
Organisations only: no personal data, no named people. Never guess: leave a field empty if you did not find it.
Already in the list (skip these): ${rows.map(r => r.data.org).join("; ").slice(0, 6000)}
Reply with JSON only, in a \`\`\`json block: an array of objects with fields
org, country, city, region (one of ${REGIONS.join(", ")}), website, source (URL of the page where you found the operator), aoc_authority (for example CAAS, CAAT, CAD Hong Kong, GCAA, an EASA member-state authority, FAA Part 135), aoc_source (URL showing the certificate, if found), bases (array of airports), fleet (array of {type, count}) and fleet_source (URL), audits (array of {name: "ARGUS" | "Wyvern" | "IS-BAH", level, year, url}; only with public evidence), safety (array of {year, summary, url} for accidents or serious incidents involving the operator in the last 10 years; empty if none found), owners (array of owning COMPANIES or groups only, never private individuals; empty if not published), eu_air_safety_list (true only if the operator or its certifying state appears on the EU Air Safety List), enforcement (array of {year, summary, url} for AOC suspensions, fines or restrictions by a regulator in the last 10 years; empty if none found), insurance (object {summary, url} if the operator publishes its liability cover, else null), founded (year), why (one sentence: why they fit Archē's business), approach (one or two sentences: how to set them up as a supplier, by role), avenues (array of {type, label, url, note}; official business routes only; types: ${AVENUE_TYPES.join(", ")}), contacts (array of up to 3 {name, role, email, phone, url}: named BUSINESS contacts only as published on the operator's OWN website, with the page url; work email on the operator's own domain; never personal emails or phones, never guessed; empty if none published).`;
  const r3 = await ask(p3, call);
  for (const o of Array.isArray(r3.data) ? r3.data.slice(0, 12) : []) {
    const v = vetOperator(o, r3.seen, existing); if (v.why) { rejected.push(`${clean(o && o.org, 60)} (operator): ${v.why}`); continue; }
    next++; const id = "p" + String(next).padStart(3, "0");
    const rec = { org: clean(o.org, 160), segment: "Operator", kind: "operator", region: REGIONS.includes(o.region) ? o.region : "Global",
      country: clean(o.country, 60), province: "", city: clean(o.city, 60),
      website: o.website && (r3.seen.has(normUrl(o.website)) || host(o.website) === host(o.source)) ? clean(o.website, 300) : "",
      source: clean(o.source, 400), why: clean(o.why, 400), approach: clean(o.approach, 500), status: "new",
      avenues: vetAvenues(o.avenues, r3.seen, o.website), ops: v.ops, added: nowIso, batch: `Operator review ${today}`, aiReviewed: nowIso };
    rec.contacts = vetContacts(o.contacts, r3.seen, rec.website, rec.org, optSet);
    await db.set("prospects/" + id, rec); existing.add(normName(rec.org)); opsAdded.push(rec.org);
  }

  // 4. sanctions pre-screen of every operator (new and existing) against the official lists, each run
  let screened = 0, possible = [];
  const ops = (await db.all("prospects")).filter(r => r.data.kind === "operator" && r.data.status !== "dnc");
  const lists = await loadLists(fetchLists, log), listsInfo = { loaded: lists.loaded, failed: lists.failed };
  {
    if (lists.names.size) for (const r of ops) {
      const o = r.data.ops || {}, hits = screen([r.data.org, ...(o.owners || [])], lists);
      const auto = { result: hits.length ? "possible match" : "no match", at: nowIso, lists: lists.loaded.map(x => x.replace(/ \(\d+\)$/, "")), failed: lists.failed, hits };
      const upd = { ...r.data, ops: { ...o, screen: { ...(o.screen || {}), auto } } };
      if (hits.length && r.data.status !== "review") { upd.status = "review"; upd.ops.flags = [...new Set([...(o.flags || []), "Possible sanctions match: check the names against the list before any contact."])]; possible.push(r.data.org); }
      await db.set("prospects/" + r.id, upd); screened++;
    }
  }

  // 5. investors and strategic partners: owner-only table; only a count is reported outside it
  let invCount = 0;
  if (process.env.INVESTOR_RESEARCH !== "off") {
    try { invCount = (await investors.run(db, call, log, lists, undefined, optSet)).added.length; }
    catch (e) { log("  owner research step failed: " + String(e.message || e).slice(0, 200)); }
  }

  const note = `Added ${added.length} for "${focus}"${added.length ? ": " + added.slice(0, 6).join(", ") + (added.length > 6 ? "…" : "") : ""}. Contact routes added to ${updated} existing. Operators added for "${opFocus}": ${opsAdded.length}. Sanctions pre-screen: ${screened} operators${possible.length ? ", possible match: " + possible.join(", ") : ", no match"}${listsInfo.failed.length ? " (lists not loaded: " + listsInfo.failed.join(", ") + ")" : ""}. ${rejected.length ? rejected.length + " rejected by the rules." : ""}`.trim();
  await db.set("intel/status", { ...status, lastRun: nowIso, lastAdded: added.length, lastUpdated: updated, totalProspects: rows.length + added.length,
    focusIndex: fi + 1, nextFocus: FOCUS[(fi + 1) % FOCUS.length], opFocusIndex: ofi + 1, nextOpFocus: OP_FOCUS[(ofi + 1) % OP_FOCUS.length], lastOperators: opsAdded.length, sanctionsLists: listsInfo, note, rejected: rejected.slice(0, 20), by: "scheduled" });
  log(note); rejected.forEach(x => log("  rejected:", x));
  return { added, updated, rejected, operators: opsAdded, screened, possible, note, ownerAdded: invCount };
}
if (import.meta.url === `file://${process.argv[1]}`) { const { main } = await import("./lib/main.mjs"); await main("Daily research", ["SUPABASE_URL","SUPABASE_SECRET_KEY","ANTHROPIC_API_KEY"], () => run()); }
