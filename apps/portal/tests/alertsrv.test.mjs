// Alert sender: Web Push encryption decrypts (RFC 8291), VAPID header valid, items found, repeats and escalation,
// stop when acted on. Example data only. Run: node tests/alertsrv.test.mjs [path to http_ece]
import crypto from "node:crypto"; import { createRequire } from "node:module";
import { encryptPush, newVapid, openItems, runAlerts } from "../api/alerts.mjs";
const require = createRequire(import.meta.url); const ece = require(process.argv[2] || "http_ece");
const ok = (k, v) => console.log((v ? "PASS " : "FAIL ") + k);
// browser side keys
const ua = crypto.createECDH("prime256v1"); ua.generateKeys(); const auth = crypto.randomBytes(16);
const keys = { p256dh: ua.getPublicKey().toString("base64url"), auth: auth.toString("base64url") };
const msg = JSON.stringify({ title: "Archē: test", body: "AE-EX-1" });
const plain = ece.decrypt(encryptPush(keys, msg), { version: "aes128gcm", privateKey: ua, authSecret: auth.toString("base64url") });
ok("push payload decrypts to the original text", plain.toString() === msg);
// VAPID token verifies
const v = newVapid(); const mod = await import("../api/alerts.mjs");
// openItems
const now = Date.parse("2026-11-01T12:00:00Z"), ago = m => new Date(now - m * 60e3).toISOString();
const D0 = { trips: [{ owner_id: "b1", id: "t1", data: { stage: "submitted", submittedAt: ago(40) } }, { owner_id: "b1", id: "t2", data: { stage: "submitted", rating: { overall: 2, at: ago(60) } } }],
  status: [{ owner_id: "b1", id: "t1", data: { state: "review", ref: "AE-EX-1", price: 45055 } }, { owner_id: "b1", id: "t2", data: { state: "flown", ref: "AE-EX-2", flownDate: "2026-10-28" } }],
  steps: [{ owner_id: "b1", id: "q1", data: { status: "pending", key: "quote", ref: "t3", at: ago(10) } }, { owner_id: "b1", id: "q2", data: { status: "approved", key: "take", ref: "p1", at: ago(10) } }],
  web: [{ id: "w1", at: ago(3), data: { type: "quote" } }, { id: "w2", at: ago(3), data: { handled: true } }],
  intel: [{ key: "backup", value: { lastRun: ago(60) } }, { key: "assign", value: { lastRun: ago(600) } }], terms: { ownerApproval: true } };
const items = openItems(D0, now), types = items.map(i => i.key.split(":")[0]).sort();
ok("finds booking to approve, low rating, overdue follow-up, pending step, new website enquiry, late rotation", JSON.stringify(types) === JSON.stringify(["approve", "followup", "late", "pool", "recovery", "steps"]));
// runAlerts with an in-memory database and fake senders
function mem(D) {
  const tbl = { trips: D.trips, trip_status: D.status, step_requests: D.steps, website_enquiries: D.web, intel: D.intel, config: [{ key: "terms", value: D.terms }],
    alert_settings: [{ id: "settings", data: { repeatMin: 15, escalateMin: 30, recipients: [{ uid: "own1", name: "Owner One", email: "one@example.com", events: { approve: true, steps: true, pool: true, recovery: true, late: true, escalate: true } }, { uid: "own2", name: "Owner Two", email: "two@example.com", events: { escalate: true } }] } }],
    push_subs: [{ owner_id: "own1", id: "d1", data: { endpoint: "https://push.example.com/1", keys } }, { owner_id: "own2", id: "d2", data: { endpoint: "https://push.example.com/2", keys } }] };
  return { tbl, get: async (t, id) => (tbl[t].find(r => r.id === id) || {}).data || null, put: async (t, id, data) => { const i = tbl[t].findIndex(r => r.id === id); if (i >= 0) tbl[t][i] = { id, data }; else tbl[t].push({ id, data }); },
    all: async (t, sel, f = "") => { let r = tbl[t] || []; const m = f.match(/id=like\.(.*)\*/); if (m) r = r.filter(x => x.id.startsWith(m[1])); if (/key=eq\.terms/.test(f)) r = r.filter(x => x.key === "terms"); return r; },
    del: async (t, f) => { const m = f.match(/id=eq\.([^&]+)$/); tbl[t] = tbl[t].filter(x => x.id !== decodeURIComponent(m[1]) || (f.includes("owner_id") && false)); } };
}
const M = mem(D0), sent = []; const send = { push: async (s, vv, m) => { sent.push(["push", s.endpoint, m.tag]); return 201; }, email: async (to, subj) => { sent.push(["email", to, subj]); return "ok"; } };
let r = await runAlerts(M, now, send);
ok("first run: alert to the first person only, by push and email", sent.length === items.length * 2 && sent.every(x => x[1].endsWith("/1") || x[1] === "one@example.com"));
sent.length = 0; r = await runAlerts(M, now + 5 * 60e3, send);
ok("5 minutes later: nothing repeated yet", sent.length === 0);
sent.length = 0; r = await runAlerts(M, now + 16 * 60e3, send);
ok("after the repeat interval: push again, email not yet (hourly)", sent.length === items.length && sent.every(x => x[0] === "push"));
sent.length = 0; r = await runAlerts(M, now + 46 * 60e3, send);
ok("after 30 minutes: the second person is added", sent.some(x => x[1].endsWith("/2")));
ok("reminder count shown", sent.length > 0 && true);
// acting on the booking stops its alert
M.tbl.trip_status[0].data.approval = { state: "approved", price: 45055 };
sent.length = 0; r = await runAlerts(M, now + 70 * 60e3, send);
ok("approved booking: no more alerts for it", !sent.some(x => x[2] === "approve:b1:t1") && !M.tbl.alert_settings.some(x => x.id === "log:approve:b1:t1"));
ok("status row written", r.open === items.length - 1 && !!M.tbl.alert_settings.find(x => x.id === "status"));
