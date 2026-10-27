// Daily sanctions screen, independent of the AI research (Morten, 27 Oct 2026). No AI, no cost.
// 1. Downloads the official UN, US (OFAC), EU and UK lists (lib/sanctions.mjs).
// 2. Screens every operator and service partner, and their owners, as the research job did, so the screen keeps
//    running while daily research is paused. A possible match sets the organisation to "review" for the owner.
// 3. Writes a compact name index to private storage (sanctions/index.json) so the portal can screen the names of
//    a booking on demand (api/screen.mjs) without downloading the lists each time.
import { loadLists, screen } from "./lib/sanctions.mjs";

export async function run(db, fetchFn = fetch, log = console.log, nowIso = new Date().toISOString(), store = null) {
  const lists = await loadLists(fetchFn, log);
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
  const index = { at: nowIso, lists: listsInfo.loaded, failed: listsInfo.failed, names: Object.fromEntries(lists.names) };
  if (store) await store(JSON.stringify(index));
  await db.set("intel/screen", { lastRun: nowIso, screened, possible, lists: listsInfo, indexSize: lists.names.size });
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
    return run(db, fetch, console.log, new Date().toISOString(), store);
  });
}
