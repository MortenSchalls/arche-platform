// Daily backup: every table to one JSON file. GitHub Actions encrypts it and keeps it for 90 days
// (off-site from Supabase). Real data: never commit the file.
import { writeFileSync } from "fs";
import { connect } from "./lib/db.mjs";
const TABLES = ["profiles", "config", "intel", "region_cards", "join_requests", "prospects", "owner_prospects", "optouts", "audit_log", "faq", "trips", "trip_status",
  "payouts", "leads", "access_log", "questions", "training_runs", "roleplay_runs", "website_enquiries",
  "enquiry_pool", "enquiry_contacts", "agreements", "member_scores", "step_requests", "alert_settings"];

export async function run(db = connect(), out = "backup.json", log = console.log) {
  const dump = { exportedAt: new Date().toISOString(), source: "supabase", tables: {} };
  for (const t of TABLES) dump.tables[t] = await db.all(t);
  const files = await db.sb.storage.from("portal-files").list("", { limit: 1000 });
  dump.fileFolders = (files.data || []).map(f => f.name);
  writeFileSync(out, JSON.stringify(dump));
  const counts = Object.fromEntries(Object.entries(dump.tables).map(([k, v]) => [k, v.length]));
  await db.set("intel/backup", { lastRun: dump.exportedAt, by: "scheduled", counts });
  log("Backup written:", JSON.stringify(counts));
  return counts;
}
if (import.meta.url === `file://${process.argv[1]}`) { const { main } = await import("./lib/main.mjs"); await main("Backup", ["SUPABASE_URL","SUPABASE_SECRET_KEY"], () => run()); }
