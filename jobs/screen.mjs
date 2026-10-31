// Daily sanctions screen, independent of the AI research (Morten, 27 Oct 2026). No AI, no cost.
// 1. Downloads the official UN, US (OFAC), EU and UK lists (lib/sanctions.mjs).
// 2. Screens every operator and service partner, and their owners, as the research job did, so the screen keeps
//    running while daily research is paused. A possible match sets the organisation to "review" for the owner.
// 3. Writes a compact name index to private storage (sanctions/index.json) so the portal can screen the names of
//    a booking on demand (api/screen.mjs) without downloading the lists each time.
// 4. Free background checks (Morten, 31 Oct 2026): the FAA Part 135 aircraft list (which US tail is on which certificate)
//    to sanctions/faa135.json, and the ECB euro reference rates to config/fx for quotes in other currencies.
import { loadLists, screen, KIND } from "./lib/sanctions.mjs";
import { readXlsx } from "./lib/xlsx.mjs";
const FAA135 = "https://www.faa.gov/about/officeorg/headquartersoffices/avs/faa-certificated-aircraft-operators-legal-part-135-holders.xlsx";
const ECB = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const UA = { headers: { "user-agent": "Mozilla/5.0 (compatible; ArcheExecutive-sanctions-screen/1.0)" } };
export async function faaTails(fetchFn = fetch) {
  const r = await fetchFn(FAA135, UA); if (!r.ok) throw new Error("FAA Part 135 list HTTP " + r.status);
  const sh = readXlsx(Buffer.from(await r.arrayBuffer()))[0], h = sh.rows[0] || [], ni = h.indexOf("Name"), ri = h.indexOf("Registration No."), ti = h.indexOf("Aircraft M/M/S");
  if (ni < 0 || ri < 0) throw new Error("FAA Part 135 list: columns not found");
  const tails = {}; for (const row of sh.rows.slice(1)) { const reg = String(row[ri] || "").trim().toUpperCase(); if (/^N[0-9A-Z]{1,5}$/.test(reg)) tails[reg] = [String(row[ni] || "").trim(), String(row[ti] || "").trim()]; }
  if (Object.keys(tails).length < 1000) throw new Error("FAA Part 135 list: only " + Object.keys(tails).length + " aircraft");
  return tails;
}
// USD per 1 unit of each currency, from the ECB euro reference rates (AED from its fixed USD peg, 3.6725)
export async function ecbRates(fetchFn = fetch) {
  const r = await fetchFn(ECB, UA); if (!r.ok) throw new Error("ECB HTTP " + r.status);
  const x = await r.text(), date = (x.match(/time='(\d{4}-\d\d-\d\d)'/) || [])[1], eur = {};
  for (const m of x.matchAll(/currency='([A-Z]{3})' rate='([\d.]+)'/g)) eur[m[1]] = +m[2];
  if (!date || !eur.USD) throw new Error("ECB rates not found");
  const usd = { EUR: eur.USD, AED: 1 / 3.6725 }; for (const [c, v] of Object.entries(eur)) if (c !== "USD") usd[c] = eur.USD / v;
  for (const c in usd) usd[c] = Math.round(usd[c] * 1e6) / 1e6;
  return { date, usdPer: usd, source: "European Central Bank euro reference rates", url: ECB };
}

export async function run(db, fetchFn = fetch, log = console.log, nowIso = new Date().toISOString(), store = null, storeFile = null, loadPrev = null) {
  const lists = await loadLists(fetchFn, log);
  // a list that cannot be read today keeps its names from the last good index (up to 14 days), so a site being down never
  // removes names from the screen; it is reported as kept, with the date
  if (lists.failed.length && loadPrev) {
    try { const prev = await loadPrev(); const age = prev && prev.at ? (Date.parse(nowIso) - Date.parse(prev.at)) / 864e5 : 99;
      const keptFrom = (prev && prev.kept) || {};
      for (const id of [...lists.failed]) {
        const since = keptFrom[id] || (prev && prev.at), old = since ? (Date.parse(nowIso) - Date.parse(since)) / 864e5 : 99;
        const names = Object.entries((prev && prev.names) || {}).filter(([, l]) => l === id);
        if (!names.length || old > 14 || age > 14) continue;
        names.forEach(([n, l]) => { if (!lists.names.has(n)) lists.names.set(n, l); });
        lists.failed = lists.failed.filter(x => x !== id); lists.loaded.push(`${id} (${names.length}, kept from ${String(since).slice(0, 10)})`);
        (lists.kept = lists.kept || {})[id] = since;
        if (id === "EU Air Safety List" && prev.aslStates) lists.extra = { ...(lists.extra || {}), [id]: prev.aslStates };
      }
    } catch (e) { log("  previous index not read: " + e.message); }
  }
  if (!lists.names.size) throw new Error("No sanctions list could be downloaded: " + lists.failed.join(", "));
  const listsInfo = { loaded: lists.loaded, failed: lists.failed, at: nowIso };

  let screened = 0; const possible = [];
  const ops = (await db.all("prospects")).filter(r => (r.data.kind === "operator" || r.data.kind === "service") && r.data.status !== "dnc");
  for (const r of ops) {
    const isOp = r.data.kind === "operator", o = isOp ? (r.data.ops || {}) : r.data, hits = screen([r.data.org, ...(o.owners || [])], lists);
    const auto = { result: hits.length ? "possible match" : "no match", at: nowIso, lists: lists.loaded.map(x => x.replace(/ \(\d+\)$/, "")), failed: lists.failed, hits };
    const upd = isOp ? { ...r.data, ops: { ...o, screen: { ...(o.screen || {}), auto } } } : { ...r.data, screen: { ...(r.data.screen || {}), auto } };
    const tgt = isOp ? upd.ops : upd;
    const FLAG = "Possible sanctions match: check the names against the list before any contact.";
    // EU Air Safety List or MAS Investor Alert hits say which list in the flag (not a sanctions hit)
    hits.forEach(h => { h.kind = KIND[h.list] || "sanctions"; });
    if (hits.length && r.data.status !== "review") { upd.screenPrev = r.data.status || ""; upd.status = "review"; tgt.flags = [...new Set([...(o.flags || []), FLAG])]; possible.push(r.data.org); }
    else if (hits.length) possible.push(r.data.org);
    // no longer a match (lists or matching changed): remove our flag, and undo the review this job set, unless a person decided
    if (!hits.length && (o.flags || []).includes(FLAG)) {
      tgt.flags = (o.flags || []).filter(f => f !== FLAG);
      if (r.data.status === "review" && "screenPrev" in r.data && !((o.screen || {}).decision)) { upd.status = r.data.screenPrev || "new"; delete upd.screenPrev; }
    }
    await db.set("prospects/" + r.id, upd); screened++;
  }

  // name index for on-demand booking screens: normalised name -> list
  const index = { at: nowIso, lists: listsInfo.loaded, failed: listsInfo.failed, kept: lists.kept || {}, kinds: KIND, aslStates: (lists.extra || {})["EU Air Safety List"] || [], names: Object.fromEntries(lists.names) };
  if (store) await store(JSON.stringify(index));

  let faa = null, fx = null;   // rates go to config/fx: every member reads config (brokers quote in other currencies)
  try { const tails = await faaTails(fetchFn); faa = Object.keys(tails).length; if (storeFile) await storeFile("faa135.json", JSON.stringify({ at: nowIso, source: "FAA Part 135 operators and aircraft (OpSpec D085)", url: FAA135, tails })); }
  catch (e) { log("  " + e.message); }
  try { fx = await ecbRates(fetchFn); await db.set("config/fx", { ...fx, at: nowIso }); } catch (e) { log("  ECB rates: " + e.message); }
  await db.set("intel/screen", { lastRun: nowIso, screened, possible, lists: listsInfo, indexSize: lists.names.size, faaAircraft: faa, fxDate: fx ? fx.date : null });
  const note = `Screened ${screened} operators and partners against ${lists.loaded.join(", ")}${lists.failed.length ? "; could not download " + lists.failed.join(", ") : ""}. Possible matches: ${possible.length ? possible.join(", ") : "none"}. Index of ${lists.names.size} names stored.`;
  log(note); return { screened, possible, note };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs"); const { connect } = await import("./lib/db.mjs");
  await main("Daily sanctions screen", ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], async () => {
    const db = connect();
    const store = async body => {
      const st = db.sb.storage;
      await st.createBucket("sanctions", { public: false }).catch(() => {});
      const r = await st.from("sanctions").upload("index.json", new Blob([body], { type: "application/json" }), { upsert: true, contentType: "application/json" });
      if (r.error) throw new Error("index upload: " + r.error.message);
    };
    const storeFile = async (name, body) => {
      const r = await db.sb.storage.from("sanctions").upload(name, new Blob([body], { type: "application/json" }), { upsert: true, contentType: "application/json" });
      if (r.error) throw new Error(name + " upload: " + r.error.message);
    };
    const loadPrev = async () => { const r = await db.sb.storage.from("sanctions").download("index.json"); if (r.error) throw new Error(r.error.message); return JSON.parse(await r.data.text()); };
    return run(db, fetch, console.log, new Date().toISOString(), store, storeFile, loadPrev);
  });
}
