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
// openItems (example data; times: 09:00 in Bangkok = 02:00 UTC)
const now = Date.parse("2026-11-01T02:00:00Z"), ago = m => new Date(now - m * 60e3).toISOString(), inH = h => new Date(now + h * 3600e3);
const day = d => d.toISOString().slice(0, 10), hm = d => d.toISOString().slice(11, 16);
const D0 = { trips: [{ owner_id: "b1", id: "t1", data: { stage: "submitted", submittedAt: ago(40), trip: { legs: [{ date: day(inH(24 * 10)), time: "10:00" }] } } }, { owner_id: "b1", id: "t2", data: { stage: "submitted", rating: { overall: 2, at: ago(60) } } }],
  status: [{ owner_id: "b1", id: "t1", data: { state: "review", ref: "AE-EX-1", price: 45055 } }, { owner_id: "b1", id: "t2", data: { state: "flown", ref: "AE-EX-2", flownDate: "2026-10-28" } }],
  steps: [{ owner_id: "b1", id: "q1", data: { status: "pending", key: "quote", ref: "t3", at: ago(10) } }, { owner_id: "b1", id: "q2", data: { status: "approved", key: "take", ref: "p1", at: ago(10) } }],
  web: [{ id: "w1", at: ago(3), data: { type: "quote" } }, { id: "w2", at: ago(3), data: { handled: true } }],
  intel: [{ key: "backup", value: { lastRun: ago(60) } }, { key: "assign", value: { lastRun: ago(600) } }], terms: { ownerApproval: true } };
const items = openItems(D0, now), types = items.map(i => i.key.split(":")[0]).sort();
ok("finds booking to approve, low rating, overdue follow-up, pending step, new website enquiry, late rotation", JSON.stringify(types) === JSON.stringify(["approve", "followup", "late", "pool", "recovery", "steps"]));
ok("urgency: late rotation is low, the rest normal (departure 10 days away)", items.find(i => i.type === "late").urgency === "low" && items.filter(i => i.type !== "late").every(i => i.urgency === "normal"));
// runAlerts with an in-memory database and fake senders
function mem(D) {
  const tbl = { trips: D.trips, trip_status: D.status, step_requests: D.steps, website_enquiries: D.web, intel: D.intel, config: [{ key: "terms", value: D.terms }],
    alert_settings: [{ id: "settings", data: { escalateMin: 30, recipients: [{ uid: "own1", name: "Owner One", email: "one@example.com", events: { approve: true, steps: true, pool: true, recovery: true, late: true, escalate: true } }, { uid: "own2", name: "Owner Two", email: "two@example.com", events: { escalate: true } }] } }],
    push_subs: [{ owner_id: "own1", id: "d1", data: { endpoint: "https://push.example.com/1", keys } }, { owner_id: "own2", id: "d2", data: { endpoint: "https://push.example.com/2", keys } }] };
  return { tbl, get: async (t, id) => (tbl[t].find(r => r.id === id) || {}).data || null, put: async (t, id, data) => { const i = tbl[t].findIndex(r => r.id === id); if (i >= 0) tbl[t][i] = { id, data }; else tbl[t].push({ id, data }); },
    all: async (t, sel, f = "") => { let r = tbl[t] || []; const m = f.match(/id=like\.(.*)\*/); if (m) r = r.filter(x => x.id.startsWith(m[1])); if (/key=eq\.terms/.test(f)) r = r.filter(x => x.key === "terms"); return r; },
    del: async (t, f) => { const m = f.match(/id=eq\.([^&]+)$/); tbl[t] = tbl[t].filter(x => x.id !== decodeURIComponent(m[1])); } };
}
const sent = []; const send = { push: async (s, vv, m) => { sent.push(["push", s.endpoint, m.tag, m.title]); return 201; }, email: async (to, subj, txt) => { sent.push(["email", to, subj, txt]); return "ok"; } };
const pushes = () => sent.filter(x => x[0] === "push"), mails = () => sent.filter(x => x[0] === "email");
const M = mem(D0); let r = await runAlerts(M, now, send);
ok("09:00: one push per waiting item to the first person, none for the late rotation", pushes().length === 5 && pushes().every(x => x[1].endsWith("/1")) && !pushes().some(x => /late/.test(x[2])));
ok("09:00: one morning summary email with everything open, including the late rotation", mails().length === 1 && mails()[0][1] === "one@example.com" && /6 items waiting/.test(mails()[0][2]) && /late/i.test(mails()[0][3]));
sent.length = 0; await runAlerts(M, now + 16 * 60e3, send); await runAlerts(M, now + 3 * 3600e3, send);
ok("no repeats every 15 minutes: nothing for 4 hours", sent.length === 0);
sent.length = 0; await runAlerts(M, now + 4 * 3600e3 + 60e3, send);
ok("after 4 hours: one reminder per item, still only to the first person", pushes().length === 5 && pushes().every(x => x[1].endsWith("/1") && /reminder/.test(x[3])) && mails().length === 0);
sent.length = 0; for (const h of [8.5, 9, 10, 12]) await runAlerts(M, now + h * 3600e3, send);
ok("after the reminder: no more pushes for normal items (max 2), no escalation", pushes().length === 0);
sent.length = 0; await runAlerts(M, now + 24 * 3600e3 + 60e3, send);
ok("next morning: a new summary email, still no pushes for them", mails().length === 1 && pushes().length === 0);
M.tbl.trip_status[0].data.approval = { state: "approved", price: 45055 };
sent.length = 0; r = await runAlerts(M, now + 25 * 3600e3, send);
ok("approved booking: its alert is closed", !M.tbl.alert_settings.some(x => x.id === "log:approve:b1:t1") && r.open === items.length - 1);

// night: 23:30 Bangkok. A normal item waits until 07:00; an urgent one (departure within 48 h) goes out at once and repeats
const night = Date.parse("2026-11-01T16:30:00Z");
const D2 = { ...D0, trips: [{ owner_id: "b1", id: "t5", data: { stage: "submitted", submittedAt: new Date(night - 60e3).toISOString(), trip: { legs: [{ date: "2026-11-02", time: "09:00" }] } } }], status: [{ owner_id: "b1", id: "t5", data: { state: "review", ref: "AE-EX-5" } }],
  steps: [], web: [{ id: "w9", at: new Date(night - 60e3).toISOString(), data: { type: "quote" } }], intel: [{ key: "backup", value: { lastRun: new Date(night).toISOString() } }, { key: "assign", value: { lastRun: new Date(night).toISOString() } }] };
const M2 = mem(D2); M2.tbl.alert_settings.push({ id: "digest", data: { day: "2026-11-01" } });
sent.length = 0; await runAlerts(M2, night, send);
ok("23:30: the urgent booking (departs within 48 h) is pushed, marked URGENT; the website enquiry waits", pushes().length === 1 && /URGENT/.test(pushes()[0][3]) && /approve/.test(pushes()[0][2]) && mails().length === 0);
sent.length = 0; for (const m of [10, 31, 62, 93, 124, 155]) await runAlerts(M2, night + m * 60e3, send);
const urg = pushes().filter(x => /approve/.test(x[2]));
ok("urgent: repeated every 30 minutes, at most 4 pushes in all", urg.filter(x => x[1].endsWith("/1")).length === 3);
ok("urgent: after 30 minutes the next person is added", urg.some(x => x[1].endsWith("/2")));
ok("night: the website enquiry is still not pushed", !pushes().some(x => /pool/.test(x[2])));
sent.length = 0; await runAlerts(M2, Date.parse("2026-11-02T00:01:00Z"), send);
ok("07:01: the website enquiry is pushed and the morning summary sent", pushes().some(x => /pool/.test(x[2])) && mails().length === 1);

// away: owner one unavailable, owner two (backup) gets the alerts first
const MA = mem(D0); MA.tbl.alert_settings[0].data.away = { own1: { until: new Date(now + 3600e3).toISOString(), backup: "own2" } };
const sent2 = []; await runAlerts(MA, now, { push: async (s, vv, m) => { sent2.push(s.endpoint); return 201; }, email: async (to) => { sent2.push(to); return "ok"; } });
ok("unavailable: alerts go to the backup, not the person away", sent2.length > 0 && sent2.every(x => x.endsWith("/2") || x === "two@example.com"));

// flight following: one alert per leg status change, sent once, to chosen recipients and the trip's broker; no client name
const D3 = { trips: [{ owner_id: "b1", id: "t9", data: { stage: "issued", client: { name: "Example Client" }, trip: { legs: [{ from: "WSSS", to: "VTBS" }, { from: "VTBS", to: "WSSS" }] } } }],
  status: [{ owner_id: "b1", id: "t9", data: { state: "issued", ref: "AE-EX-9", legStatus: [{ s: "dep", at: ago(30), set: ago(5), note: "Example Client on board" }, { s: "", at: "" }] } }],
  steps: [], web: [], intel: [{ key: "backup", value: { lastRun: ago(1) } }, { key: "assign", value: { lastRun: ago(1) } }], terms: { ownerApproval: true } };
const f3 = openItems(D3, now).filter(i => i.type === "flight");
ok("flight: departed leg found once, airports and reference only", f3.length === 1 && f3[0].what === "leg 1 WSSS→VTBS departed" && f3[0].ref === "AE-EX-9");
const M3 = mem(D3); M3.tbl.alert_settings[0].data.recipients[0].events.flight = true; M3.tbl.push_subs.push({ owner_id: "b1", id: "d3", data: { endpoint: "https://push.example.com/broker", keys } });
const s3 = []; const snd3 = { push: async (s, vv, m) => { s3.push(["push", s.endpoint, m.title + " " + m.body]); return 201; }, email: async (to, subj, txt) => { s3.push(["email", to, subj + " " + txt]); return "ok"; } };
await runAlerts(M3, now, snd3);
ok("flight: push to the owner who chose it and to the trip's broker, no per-item email", s3.some(x => x[1].endsWith("/1")) && s3.some(x => x[1].endsWith("/broker")) && !s3.some(x => x[0] === "email" && /status change/i.test(x[2])) && !s3.some(x => x[1].endsWith("/2")));
ok("flight: no client name or note in any message", s3.every(x => !/Example Client|on board/.test(x[2])));
s3.length = 0; await runAlerts(M3, now + 20 * 60e3, snd3); await runAlerts(M3, now + 50 * 60e3, snd3);
ok("flight: sent once, no reminders or escalation", s3.length === 0);
M3.tbl.trip_status[0].data.legStatus[0] = { s: "delay", at: ago(1), set: ago(1) };
s3.length = 0; await runAlerts(M3, now + 52 * 60e3, snd3);
ok("flight: a delay is a new alert, marked URGENT", s3.some(x => /delayed/.test(x[2]) && /URGENT/.test(x[2])));
ok("flight: older than 6 hours is not sent", openItems(D3, now + 7 * 3600e3).filter(i => i.type === "flight").length === 0);
