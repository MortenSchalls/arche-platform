// Daily intelligence: research new prospect ORGANISATIONS with web search and add them to the portal.
// Rules (same as the claude.ai scheduled task, now also enforced in code):
//  - organisations only; a named person may appear only as a role
//  - every organisation needs a public source URL that appeared in this run's web search results
//  - no personal data, no guessed emails or phone numbers, no bought lists, no logins or scraping
//  - never change status, assignment or history of existing prospects
import { connect } from "./lib/db.mjs";

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
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("Anthropic API " + r.status + ": " + (await r.text()).slice(0, 300));
  return r.json();
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
export function vetAvenues(list, seen, website) {
  const site = host(website);
  return (Array.isArray(list) ? list : []).filter(a => a && AVENUE_TYPES.includes(a.type) && a.url && (seen.has(normUrl(a.url)) || (site && host(a.url).endsWith(site))))
    .filter(a => !PERSONAL.test(a.url) && !/linkedin\.com\/in\//i.test(a.url))     // no personal emails or personal LinkedIn profiles
    .slice(0, 12).map(a => ({ type: a.type, label: clean(a.label || a.type, 120), url: clean(a.url, 400), note: clean(a.note || "found by daily research", 200) }));
}

export async function run(db = connect(), call = callApi, log = console.log) {
  const status = (await db.get("intel/status")) || {};
  const fi = Number.isInteger(status.focusIndex) ? status.focusIndex : 0;
  const focus = FOCUS[fi % FOCUS.length];
  const rows = await db.all("prospects");
  const existing = new Set(rows.map(r => normName(r.data.org)));
  const maxId = rows.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
  const today = new Date().toISOString().slice(0, 10), nowIso = new Date().toISOString();

  // 1. new organisations for today's focus
  const prompt = `You research prospects for Archē Executive, a Singapore private jet charter broker (whole-aircraft charters on third-party operators, worldwide).
Today's focus: ${focus}.
Find up to 15 ORGANISATIONS in this focus that plausibly need private jet charter or can refer clients. Use web search; every organisation must come from a page you actually found in search results.
Strict rules: organisations only. No personal data about private individuals: no named people's phone numbers, emails, addresses or personal social profiles. A person may appear only as a role, for example "Head of Travel". Never guess an email address or a phone number. Family offices: approach only through introductions.
Already in the list (skip these): ${rows.map(r => r.data.org).join("; ").slice(0, 6000)}
Reply with JSON only, in a \`\`\`json block: an array of objects with fields
org, segment (one of ${SEGMENTS.join(", ")}), kind ("client" or "partner"), region (one of ${REGIONS.join(", ")}), country, province, city, website (official site, only if you found it), source (URL of the public page where you found the organisation), why (one sentence), approach (one or two sentences, by role), avenues (array of {type, label, url, note}; types: ${AVENUE_TYPES.join(", ")}; only official business routes you found).`;
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

  const note = `Added ${added.length} for "${focus}"${added.length ? ": " + added.slice(0, 6).join(", ") + (added.length > 6 ? "…" : "") : ""}. Contact routes added to ${updated} existing. ${rejected.length ? rejected.length + " rejected by the rules." : ""}`.trim();
  await db.set("intel/status", { ...status, lastRun: nowIso, lastAdded: added.length, lastUpdated: updated, totalProspects: rows.length + added.length,
    focusIndex: fi + 1, nextFocus: FOCUS[(fi + 1) % FOCUS.length], note, rejected: rejected.slice(0, 20), by: "scheduled" });
  log(note); rejected.forEach(x => log("  rejected:", x));
  return { added, updated, rejected };
}
if (import.meta.url === `file://${process.argv[1]}`) { const { main } = await import("./lib/main.mjs"); await main("Daily research", ["SUPABASE_URL","SUPABASE_SECRET_KEY","ANTHROPIC_API_KEY"], () => run()); }
