// Daily audit check (Morten, 27 Oct 2026: "ensure the audits we list is something we can back up. we need to have
// this automated as we do with the sanctions list"). No AI.
// 1. Registry index: reads the auditors' public registries (ARGUS operator registry; WYVERN Wingman directory) and
//    stores operator name → programme and level in private storage (registries/index.json). The portal's Operator
//    safety panel checks every operator against it (api/auditcheck.mjs): a level the registry does not confirm needs
//    the director's approval. A registry that cannot be read is reported, never guessed; the broker's own registry
//    check with link and evidence then stays the proof.
// 2. Programme watch: reads the pages where ARGUS, WYVERN and IBAC describe their ratings. When the levels named there
//    change (a level added, renamed or dropped, as ARGUS did with Gold Plus), the owner is asked to review the
//    standard in manual Module 8, the portal and the website guide (Team → Audit watch). Nothing changes automatically.
// min: fewer operators than this means only part of the list was read (it is paginated or loads in the browser), and
// a partial list is never used to say an operator is "not listed".
export const REGISTRIES = [
  { id: "ARGUS", url: "https://www.argus.aero/operatorregistry", levels: ["Platinum Elite", "Platinum", "Gold Certified", "Gold", "Under Review"], min: 300 },
  // the WYVERN directory lists every operator "in good standing" with the Wingman programme (Wingman or Wingman PRO,
  // not told apart), with the trading name, base, certificate number and certificate holder; a single page, in the browser only
  { id: "WYVERN", url: "https://app.wyvern.systems/public/directory/wingman", levels: ["Wingman PRO", "Wingman"], min: 50, text: "wyvern" },
];
export const PROGRAMMES = [
  { id: "ARGUS ratings", url: "https://www.argus.aero/", words: ["Gold Plus", "Gold Certified", "Platinum Elite", "Platinum", "Gold"] },
  { id: "ARGUS Gold", url: "https://www.argus.aero/products/argus-gold", words: ["remote", "onsite", "on-site", "Gold Certified", "May 2027"] },
  { id: "WYVERN programmes", url: "https://www.wyvernltd.com/?p=225", words: ["Wingman PRO", "Wingman", "Registered", "PASS"] },
  { id: "IBAC IS-BAO", url: "https://ibac.org/is-bao", words: ["Stage 1", "Stage 2", "Stage 3", "ICAO"] },
];
export const normName = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/\b(dba|d\/b\/a)\b.*$/, "").replace(/\b(ltd|limited|pte|llc|inc|incorporated|co|corp|corporation|company|plc|sa|ag|gmbh|bv|srl|spa|sdn|bhd|pty|kk|jsc|fze|s\.a\. de c\.v\.|de|cv)\b\.?/g, " ")
  .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

// HTML → a flat sequence of text pieces, with rating badges (image names or alt text) kept as pieces too
export function pieces(html) {
  const s = String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const out = [];
  const re = /<img\b[^>]*>|<[^>]+>|[^<]+/g; let m;
  while ((m = re.exec(s))) {
    const t = m[0];
    if (/^<img/i.test(t)) { const alt = (t.match(/\balt="([^"]*)"/i) || [])[1] || ""; const src = (t.match(/\bsrc="([^"]*)"/i) || [])[1] || ""; out.push({ img: (alt + " " + src.split("/").pop()).toLowerCase() }); }
    else if (t[0] !== "<") { const x = t.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); if (x) out.push({ text: x }); }
  }
  return out;
}
// pair each rating (as text or badge) with the operator name just before it
export function parseRegistry(html, levels) {
  const P = pieces(html), entries = [], lv = [...levels].sort((a, b) => b.length - a.length);
  const levelOf = s => lv.find(l => new RegExp("(^|[^a-z])" + l.toLowerCase().replace(/ /g, "[ _-]?") + "([^a-z]|$)").test(s.toLowerCase()));
  let last = null;
  for (const p of P) {
    if (p.text) {
      const m = p.text.match(/^(.{3,120}?)\s*[:–-]\s*(.+)$/); const inline = m && levelOf(m[2]) && m[2].length < 30 ? levelOf(m[2]) : null;
      if (inline) { entries.push({ name: m[1].trim(), level: inline }); last = null; continue; }
      const only = levelOf(p.text) && p.text.length < 30 ? levelOf(p.text) : null;
      if (only && last) { entries.push({ name: last, level: only }); last = null; continue; }
      if (!only && p.text.length >= 3 && p.text.length <= 120 && /[a-z]/i.test(p.text)) last = p.text;
    } else if (p.img && last) { const l = levelOf(p.img); if (l) { entries.push({ name: last, level: l }); last = null; } }
  }
  const seen = new Set();
  return entries.filter(e => { const k = normName(e.name) + "|" + e.level; if (!normName(e.name) || seen.has(k)) return false; seen.add(k); return true; });
}
// browser text: a name line followed by a level line
export function parseLines(text, levels) {
  const lv = [...levels].sort((a, b) => b.length - a.length), out = [];
  const lines = String(text || "").split(/\n+/).map(x => x.trim()).filter(Boolean);
  for (let i = 1; i < lines.length; i++) { const l = lv.find(x => lines[i].toLowerCase() === x.toLowerCase()); if (l && !lv.some(x => lines[i - 1].toLowerCase() === x.toLowerCase()) && lines[i - 1].length >= 3 && lines[i - 1].length <= 120 && !/^no name$/i.test(lines[i - 1])) out.push({ name: lines[i - 1], level: l }); }
  return out;
}
// WYVERN directory text: after the "Name" heading, each operator is 4 lines (trading name, base, certificate number,
// certificate holder), then optional "+2 Additional" and "Website" lines. Both names are indexed.
export function parseWyvern(text) {
  const L = String(text || "").split(/\n+/).map(x => x.trim()).filter(Boolean), out = [];
  let i = L.findIndex(x => x === "Name"); if (i < 0) return out; i++;
  while (i + 3 < L.length && !/^©/.test(L[i])) {
    const [name, base, cert, holder] = L.slice(i, i + 4);
    if ([name, base, cert, holder].some(x => /^©|^\+\d+ Additional$|^Website$/.test(x))) break;
    out.push({ name, level: "Wingman", cert, base });
    if (normName(holder) && normName(holder) !== normName(name)) out.push({ name: holder, level: "Wingman", cert, base, holderOf: name });
    i += 4; while (i < L.length && /^\+\d+ Additional$|^Website$/.test(L[i])) i++;
  }
  return out;
}
// a real browser (GitHub Actions installs Chromium for this job): loads the page, then presses the list's "next" control
// until no new operators appear, so a paginated or browser-only list is read in full
export async function readWithBrowser(R, log = () => {}) {
  let pw; try { pw = await import("playwright"); } catch (e) { throw new Error("browser not installed"); }
  const b = await pw.chromium.launch(); const p = await b.newPage({ userAgent: "Mozilla/5.0 (compatible; ArcheExecutive-audit-check/1.0)" });
  try {
    await p.goto(R.url, { waitUntil: "networkidle", timeout: 60000 }); await p.waitForTimeout(3000);
    const all = new Map(); let same = 0;
    for (let page = 0; page < 60 && same < 2; page++) {
      const txt = await p.evaluate(() => document.body.innerText);
      const got = R.text === "wyvern" ? parseWyvern(txt) : parseLines(txt, R.levels); const before = all.size;
      got.forEach(e => all.set(normName(e.name) + "|" + e.level, e));
      same = all.size === before ? same + 1 : 0;
      // the ARGUS list (a Wix page) pages with a "selection tag" checkbox whose value is {"type":"next",...}
      const next = await p.evaluate(() => { const t = [...document.querySelectorAll("input[type=checkbox]")].find(i => /"type"\s*:\s*"next"/.test(i.value || "")); if (t) { t.click(); return true; } const c = [...document.querySelectorAll("a,button,[role=button],span,div")].filter(e => e.getBoundingClientRect().width > 0 && e.children.length === 0 && /^(>|›|»|next|next page)$/i.test((e.textContent || e.getAttribute("aria-label") || "").trim())); const n = c[c.length - 1]; if (!n) return false; (n.closest("a,button,[role=button]") || n).click(); return true; });
      if (!next) break; await p.waitForTimeout(2500);
    }
    log(`  ${R.id}: browser read ${all.size} operators`);
    return [...all.values()];
  } finally { await b.close(); }
}
// a page's text through the browser, for sites that refuse plain requests
export async function browserText(url) {
  const pw = await import("playwright"); const b = await pw.chromium.launch();
  try { const p = await b.newPage(); await p.goto(url, { waitUntil: "networkidle", timeout: 60000 }); return "<p>" + (await p.evaluate(() => document.body.innerText)).replace(/</g, " ") + "</p>"; }
  finally { await b.close(); }
}
export function words(html, list) {
  const t = pieces(html).map(p => p.text || "").join(" ").toLowerCase();
  return list.filter(w => t.includes(w.toLowerCase())).sort();
}

export async function run(db, fetchFn = fetch, log = console.log, nowIso = new Date().toISOString(), store = null, browser = null, pageText = null) {
  const get = async url => { const r = await fetchFn(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; ArcheExecutive-audit-check/1.0)" } }); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); };
  // 1. registries
  const index = { at: nowIso, sources: {}, entries: [] };
  for (const R of REGISTRIES) {
    try {
      let e = []; try { e = parseRegistry(await get(R.url), R.levels); } catch (err) { log(`  ${R.id} page: ${err.message}`); }
      if (e.length < R.min && browser) { try { e = await browser(R, log); } catch (err) { log(`  ${R.id} browser: ${err.message}`); } }
      if (e.length < R.min) throw new Error(`only ${e.length} operators could be read; the list is paginated or loads in the browser only, so it is not used to say an operator is not listed`);
      e.forEach(x => index.entries.push({ prog: R.id, level: x.level, name: x.name, norm: normName(x.name), ...(x.cert ? { cert: x.cert } : {}), ...(x.holderOf ? { holderOf: x.holderOf } : {}) }));
      index.sources[R.id] = { ok: true, count: e.length, url: R.url };
    } catch (err) { index.sources[R.id] = { ok: false, error: String(err.message || err).slice(0, 200), url: R.url }; log(`  ${R.id} registry: ${err.message}`); }
  }
  if (store && index.entries.length) await store(JSON.stringify(index));
  const prevReg = (await db.get("intel/audit-registries")) || {};
  const regOut = { at: nowIso, sources: index.sources, total: index.entries.length, lastGood: index.entries.length ? nowIso : prevReg.lastGood || null };
  await db.set("intel/audit-registries", regOut);
  // 2. programme watch
  const prev = (await db.get("intel/audit-programmes")) || {};
  const latest = {}, failed = [];
  for (const P of PROGRAMMES) {
    try { latest[P.id] = words(await get(P.url), P.words); }
    catch (err) {
      // some sites refuse plain requests; a real browser reads the page as a visitor would
      try { if (!pageText) throw err; latest[P.id] = words(await pageText(P.url), P.words); log(`  ${P.id}: read in the browser`); }
      catch (err2) { failed.push(P.id); log(`  ${P.id}: ${err.message}`); }
    }
  }
  const base = prev.baseline || null, changes = [];
  if (base) for (const [id, w] of Object.entries(latest)) { const was = base[id]; if (!was) continue; const added = w.filter(x => !was.includes(x)), removed = was.filter(x => !w.includes(x)); if (added.length || removed.length) changes.push({ id, added, removed, at: nowIso }); }
  const open = (prev.open || []).concat(changes);
  const failRuns = failed.length ? (prev.failRuns || 0) + 1 : 0;
  await db.set("intel/audit-programmes", { baseline: { ...latest, ...(base || {}) }, latest, checkedAt: nowIso, failed, failRuns, open, review: open.length > 0 || failRuns >= 7 });
  const regNote = REGISTRIES.map(R => index.sources[R.id].ok ? `${R.id} registry ${index.sources[R.id].count} operators` : `${R.id} registry not readable (${index.sources[R.id].error})`).join("; ");
  const note = `${regNote}. Programme pages: ${Object.keys(latest).length} read${failed.length ? ", could not read " + failed.join(", ") : ""}; ${changes.length ? changes.length + " changed: " + changes.map(c => c.id + (c.added.length ? " +" + c.added.join("/") : "") + (c.removed.length ? " -" + c.removed.join("/") : "")).join("; ") : base ? "no change" : "baseline stored"}.`;
  log(note); return { note };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs"); const { connect } = await import("./lib/db.mjs");
  await main("Daily audit check", ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], async () => {
    const db = connect();
    const store = async body => {
      const st = db.sb.storage;
      await st.createBucket("registries", { public: false }).catch(() => {});
      const r = await st.from("registries").upload("index.json", new Blob([body], { type: "application/json" }), { upsert: true, contentType: "application/json" });
      if (r.error) throw new Error("index upload: " + r.error.message);
    };
    return run(db, fetch, console.log, new Date().toISOString(), store, readWithBrowser, browserText);
  });
}
