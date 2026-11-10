// Daily backup: every table to backup.json and every stored file to backup-files/<bucket>/<path>. GitHub Actions packs
// both, encrypts the pack and keeps it for 90 days (off-site from Supabase). Real data: never commit these files.
// Morten, 8 Nov 2026 ("ensure all have backups done as well"): every table, checked against the database migrations
// (backup.test.mjs fails when a new table is not listed here), and the files themselves, not only their folder names.
import { writeFileSync, mkdirSync, readdirSync, statSync, readFileSync } from "fs";
import { dirname, join, relative } from "path";
import { connect } from "./lib/db.mjs";
// Books first (SQL 0023): restoring the ledger before the trips means the trips' own postings are found already there
export const TABLES = ["acct_accounts", "acct_journal", "acct_lines", "acct_drafts", "acct_budget", "acct_bank_lines", "acct_settings", "acct_members", "acct_passkeys", "acct_log", "acct_errors", "acct_rules", "acct_receipts", "acct_recurring",
  "profiles", "config", "intel", "region_cards", "join_requests", "prospects", "owner_prospects", "optouts", "audit_log", "faq", "trips", "trip_status",
  "payouts", "leads", "access_log", "questions", "training_runs", "roleplay_runs", "website_enquiries",
  "enquiry_pool", "enquiry_contacts", "agreements", "member_scores", "step_requests", "alert_settings",
  "academy_progress", "academy_records", "assessments", "certificates", "push_subs", "rfqs", "screen_log", "site_events", "site_links"];
// not backed up: locks (a few minutes' run lock, nothing to restore)
export const SKIP_TABLES = ["locks", "acct_challenges", "acct_sessions"];   // minutes-long run locks, sign-in challenges and open books sessions: nothing to restore
// stored files: uploaded documents, the operator registries, the research agent's key, the sanctions index
// (the academy recordings are not here: the narration workflow makes them again from the academy text)
export const BUCKETS = ["portal-files", "registries", "agent", "sanctions", "books"];   // books: receipt files (SQL 0024)

// every file in a bucket, folder by folder
export async function listAll(st, bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await st.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) { if (/not found/i.test(error.message)) return out; throw new Error(`list ${bucket}/${prefix}: ${error.message}`); }
    for (const e of data || []) {
      const path = prefix ? prefix + "/" + e.name : e.name;
      if (e.id === null || !e.metadata) out.push(...await listAll(st, bucket, path)); else out.push(path);
    }
    if (!data || data.length < 1000) return out;
  }
}

export async function run(db = connect(), out = "backup.json", log = console.log, dir = "backup-files") {
  const dump = { exportedAt: new Date().toISOString(), source: "supabase", tables: {}, files: {} };
  for (const t of TABLES) dump.tables[t] = await db.all(t);
  let nFiles = 0, bytes = 0;
  for (const b of BUCKETS) {
    const paths = await listAll(db.sb.storage, b); dump.files[b] = [];
    for (const p of paths) {
      const { data, error } = await db.sb.storage.from(b).download(p);
      if (error) throw new Error(`download ${b}/${p}: ${error.message}`);
      const buf = Buffer.from(await data.arrayBuffer()), f = join(dir, b, p);
      mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, buf);
      dump.files[b].push({ path: p, size: buf.length, type: data.type || "" }); nFiles++; bytes += buf.length;
    }
  }
  dump.fileFolders = [...new Set((dump.files["portal-files"] || []).map(f => f.path.split("/")[0]))];
  writeFileSync(out, JSON.stringify(dump));
  const counts = Object.fromEntries(Object.entries(dump.tables).map(([k, v]) => [k, v.length]));
  await db.set("intel/backup", { lastRun: dump.exportedAt, by: "scheduled", counts, files: nFiles, fileBytes: bytes, buckets: BUCKETS });
  log(`Backup written: ${Object.keys(counts).length} tables, ${nFiles} files (${Math.round(bytes / 1024)} KB): ${BUCKETS.map(b => b + " " + dump.files[b].length).join(", ")}.`);
  return { counts, files: nFiles, bytes };
}

// restore the tables of an opened backup: node backup.mjs restore-tables [backup.json]
// inserts every row that is missing; never overwrites or deletes a row that is there now
export async function restoreTables(db = connect(), file = "backup.json", log = console.log) {
  const dump = JSON.parse(readFileSync(file, "utf8")); let put = 0;
  for (const [table, rows] of Object.entries(dump.tables || {})) {
    for (let i = 0; i < rows.length; i += 500) {
      const r = await db.sb.from(table).upsert(rows.slice(i, i + 500), { ignoreDuplicates: true });
      if (r.error) throw new Error(`restore ${table}: ${r.error.message}`); put += Math.min(500, rows.length - i);
    }
  }
  // identity counters past the restored ids (SQL 0023), so new audit, books and log rows never collide
  try { const r = await db.sb.rpc("reset_identities"); if (r && r.error) log("Note: reset_identities: " + r.error.message); } catch (e) { log("Note: reset_identities not run: " + e.message); }
  log(`Rows checked and missing ones restored: ${put} (existing rows untouched).`); return { rows: put };
}
// restore the files of an opened backup (after the tables): node backup.mjs restore-files [backup-files]
// uploads every file that is missing; never overwrites a file that is there now
export async function restoreFiles(db = connect(), dir = "backup-files", log = console.log) {
  let put = 0, kept = 0;
  const walk = d => readdirSync(d).flatMap(n => { const f = join(d, n); return statSync(f).isDirectory() ? walk(f) : [f]; });
  for (const b of readdirSync(dir)) {
    for (const f of walk(join(dir, b))) {
      const p = relative(join(dir, b), f).split("\\").join("/");
      const r = await db.sb.storage.from(b).upload(p, readFileSync(f), { upsert: false });
      if (r.error) { if (/exists|duplicate/i.test(r.error.message)) kept++; else throw new Error(`upload ${b}/${p}: ${r.error.message}`); } else put++;
    }
  }
  log(`Files restored: ${put}; already there: ${kept}.`); return { put, kept };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { main } = await import("./lib/main.mjs");
  if (process.argv[2] === "restore-tables") await main("Restore tables", ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], () => restoreTables(undefined, process.argv[3] || "backup.json"));
  else if (process.argv[2] === "restore-files") await main("Restore files", ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], () => restoreFiles(undefined, process.argv[3] || "backup-files"));
  else await main("Backup", ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], async () => { const r = await run(); return { note: `${Object.keys(r.counts).length} tables, ${r.files} files.` }; });
}
