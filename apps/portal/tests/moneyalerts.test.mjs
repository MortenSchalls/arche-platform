// Booking money on the server (Morten, 29 Oct 2026): critical (AOG) alerts from 12 hours before the operator's deadline
// to everyone involved, overdue client payments, lapsed offers, payment reminders to clients (only when switched on),
// and the cancellation notice. Example data only.
import { openItems, runAlerts } from "../api/alerts.mjs";
import { cancellation } from "../api/notice.mjs";
let fails = 0; const ok = (k, v, x) => { console.log((v ? "PASS " : "FAIL ") + k + (v || x === undefined ? "" : "  -> " + JSON.stringify(x).slice(0, 300))); if (!v) fails++; };
const H = 3600e3, B = "00000000-0000-4000-8000-0000000000b1";
// departure 8 Dec 10:00 UTC; operator: 15% from booking, 50% under 30 days, 100% under 7 days; pays 50% at signing, 50% 10 days before
const x = { stage: "submitted", client: { name: "Anna Example", email: "anna@example.com" }, quote: { operator: "Example Charter Air Ltd", opPrice: 90000, avinode: "EX123" },
  trip: { legs: [{ from: "WSSS", to: "VTBD", date: "2026-12-08", time: "10:00", pax: 4 }] }, conf: { valid: { date: "2026-11-02" } },
  opTerms: { cancel: [{ days: "booking", pct: 15 }, { days: 30, unit: "days", pct: 50 }, { days: 7, unit: "days", pct: 100 }], pay: [{ days: "booking", pct: 50 }, { days: 10, unit: "days", pct: 50 }] } };
const base = () => ({ state: "issued", ref: "AE-EX-9", opPrice: 90000, direct: 0, price: 98902, confIssued: { at: "2026-11-01T02:00:00Z" }, signed: { at: "2026-11-01T05:00:00Z" },
  receipts: [{ date: "2026-11-01", amount: 45000 }], payouts: [{ date: "2026-11-01", amount: 45000 }], book: { signedAt: "2026-11-01T06:00:00Z" } });
const items = (s, now) => openItems({ trips: [{ owner_id: B, id: "t1", data: x }], status: [{ owner_id: B, id: "t1", data: s }], terms: { margin: 0.09 } }, now).filter(i => i.type === "money");
const dl30 = Date.parse("2026-11-08T10:00:00Z"), dl10 = Date.parse("2026-11-28T10:00:00Z");
// the 30-day step needs 45,000 held: covered, no alert
ok("covered at the 30-day step: no critical alert", !items(base(), dl30 - 11 * H).some(i => i.urgency === "critical"));
// short money before the 30-day step
const short = base();   // 45,000 held and paid at signing; the 10-day step needs 90,000
ok("13 hours before the deadline with money missing: not yet critical", !items(short, dl10 - 13 * H).some(i => i.urgency === "critical"));
let it = items(short, dl10 - 11 * H).find(i => i.urgency === "critical");
ok("11 hours before: critical, with the amount and the time to cancel by", !!it && /client money missing USD 45,000/.test(it.what) && /2026-11-28 10:00 UTC/.test(it.what) && !/Anna/.test(it.what), it);
ok("the trip's broker is involved", it && it.broker === B);
// the operator's second payment: money held, operator not paid
it = items({ ...base(), receipts: [{ amount: 90000 }] }, dl10 - 6 * H).find(i => i.urgency === "critical");
ok("money held but the operator not paid 6 hours before its payment date: critical 'pay the operator'", !!it && /pay the operator USD 45,000/.test(it.what), it);
// deadline passed without the money
it = items(short, dl10 + 1 * H).find(i => i.key.startsWith("money-passed"));
ok("after the deadline: critical 'deadline passed' with the exposure", !!it && it.urgency === "critical" && /exposed USD 45,000/.test(it.what), it);
// overdue client payment (dated instalment) and lapsed offer
const unsigned = { ...base(), signed: null, book: {}, receipts: [] };
ok("offer past its validity and unsigned: lapsed (normal)", items(unsigned, Date.parse("2026-11-03T03:00:00Z")).some(i => i.key.startsWith("money-lapse") && i.urgency === "normal"));
it = items({ ...base(), receipts: [{ amount: 20000 }], book: {} }, Date.parse("2026-11-02T08:00:00Z")).find(i => i.key.startsWith("money-due"));
ok("signature payment missing 24 hours after signing: urgent", !!it && it.urgency === "urgent" && /USD 25,000/.test(it.what), it);
// the runner: everyone involved, day or night, every 10 minutes, email every hour, until resolved
function mem(s, settings) {
  const tbl = { trips: [{ owner_id: B, id: "t1", data: x }], trip_status: [{ owner_id: B, id: "t1", data: s }], step_requests: [], website_enquiries: [], intel: [{ key: "backup", value: { lastRun: new Date().toISOString() } }, { key: "assign", value: { lastRun: new Date().toISOString() } }],
    config: [{ key: "terms", value: { margin: 0.09 } }, { key: "company", value: { email: "charter@example.com", phone: "+65 0000 0000" } }],
    alert_settings: [{ id: "settings", data: { recipients: [{ uid: "own1", name: "Owner", email: "own@example.com", events: { approve: true } }], ...settings } }, { id: "digest", data: { day: "2099-01-01" } }],
    profiles: [{ id: "own1", role: "owner", active: true }, { id: "ops1", role: "ops", active: true }, { id: B, role: "broker", active: true }],
    push_subs: [{ owner_id: "own1", id: "d1", data: { endpoint: "https://push.example.com/own" } }, { owner_id: "ops1", id: "d2", data: { endpoint: "https://push.example.com/ops" } }, { owner_id: B, id: "d3", data: { endpoint: "https://push.example.com/broker" } }, { owner_id: "other", id: "d4", data: { endpoint: "https://push.example.com/other" } }] };
  return { tbl, get: async (t, id) => (tbl[t].find(r => r.id === id) || {}).data || null, put: async (t, id, data) => { const i = tbl[t].findIndex(r => r.id === id); if (i >= 0) tbl[t][i] = { id, data }; else tbl[t].push({ id, data }); },
    all: async (t, sel, f = "") => { let r = tbl[t] || []; const m = f.match(/id=like\.(.*)\*/); if (m) r = r.filter(q => q.id.startsWith(m[1])); return r; },
    del: async (t, f) => { const m = f.match(/id=eq\.([^&]+)$/); tbl[t] = tbl[t].filter(q => q.id !== decodeURIComponent(m[1])); } };
}
const sent = []; const send = { push: async (s, v, m) => { sent.push(["push", s.endpoint, m.title, m.body]); return 201; }, email: async (to, subj, txt) => { sent.push(["email", to, subj, txt]); return "ok"; }, client: async (to, mail, co) => { sent.push(["client", to, mail.subject, mail.text, co]); return "ok"; } };
const P = () => sent.filter(q => q[0] === "push"), E = () => sent.filter(q => q[0] === "email"), C = () => sent.filter(q => q[0] === "client");
const night = dl10 - 11 * H;   // 23:00 UTC = 06:00 Bangkok; then through the night
const M = mem(JSON.parse(JSON.stringify(short)));
await runAlerts(M, night, send);
ok("critical: owner, operations and the trip's broker get the phone alert; nobody else", ["own", "ops", "broker"].every(k => P().some(q => q[1].endsWith("/" + k))) && !P().some(q => q[1].endsWith("/other")) && P().every(q => /CRITICAL \(AOG\)/.test(q[2])), P());
ok("critical: an email at once to the alert list", E().filter(q => /CRITICAL/.test(q[2])).length === 1);
sent.length = 0; await runAlerts(M, night + 5 * 60e3, send); ok("not again within 10 minutes", P().length === 0);
sent.length = 0; for (let k = 1; k <= 9; k++) await runAlerts(M, night + k * 10 * 60e3 + 60e3, send);
ok("every 10 minutes with no limit (9 more rounds in 90 minutes), 3 devices each", P().length === 27, P().length);
ok("one more email after an hour", E().filter(q => /CRITICAL/.test(q[2])).length === 1, E().length);
M.tbl.trip_status[0].data.receipts.push({ date: "2026-11-27", amount: 45000 }); M.tbl.trip_status[0].data.payouts.push({ date: "2026-11-27", amount: 45000 });
sent.length = 0; await runAlerts(M, night + 2 * H, send);
ok("money cleared: the critical alert stops and its log is closed", P().length === 0 && !M.tbl.alert_settings.some(q => q.id.startsWith("log:money-aog")));
// payment reminders to clients
const R0 = mem(JSON.parse(JSON.stringify(base())), {});
sent.length = 0; await runAlerts(R0, Date.parse("2026-11-23T01:00:00Z"), send);
ok("reminders off: nothing to clients", C().length === 0);
const R1 = mem(JSON.parse(JSON.stringify(base())), { clientReminders: { on: true, version: "2026-10-29" } });
sent.length = 0; await runAlerts(R1, Date.parse("2026-11-23T01:00:00Z"), send);
ok("3 days before the 26 Nov payment: one reminder to the client, copy to the bookings address", C().length === 1 && C()[0][1] === "anna@example.com" && /USD 45,000 is due by 26 Nov 2026/.test(C()[0][3]) && C()[0][4] === "charter@example.com", C());
sent.length = 0; await runAlerts(R1, Date.parse("2026-11-23T09:00:00Z"), send); ok("same day: not again", C().length === 0);
sent.length = 0; await runAlerts(R1, Date.parse("2026-11-25T01:00:00Z"), send); ok("1 day before: the second reminder", C().length === 1 && /tomorrow/.test(C()[0][3]));
const R2 = mem({ ...JSON.parse(JSON.stringify(base())), receipts: [{ amount: 90000 }] }, { clientReminders: { on: true, version: "2026-10-29" } });
sent.length = 0; await runAlerts(R2, Date.parse("2026-11-23T01:00:00Z"), send); ok("already paid: no reminder", C().length === 0);
const R3 = mem(JSON.parse(JSON.stringify(base())), { clientReminders: { on: true, version: "old" } });
sent.length = 0; await runAlerts(R3, Date.parse("2026-11-23T01:00:00Z"), send); ok("wording changed since the owner approved it: nothing sent", C().length === 0);
// the cancellation notice
const c = cancellation(x, { ...base(), receipts: [{ amount: 25000 }], payouts: [], book: {} }, { reason: "missing", opCharge: 13500, company: { phone: "+65 0000 0000", email: "charter@example.com" }, nowMs: Date.parse("2026-11-06T03:00:00Z") });
ok("cancellation for missing money: the A9 charge for the period, what was received, still due", c.record.clientCharge === Math.ceil(98902 * 0.25) && c.record.received === 25000 && c.record.refund === 1 * 0 + Math.max(0, 25000 - Math.ceil(98902 * 0.25)) && /has not reached us/.test(c.mail.text) && /Cancellation charge under A9/.test(c.mail.text), c.record);
const c2 = cancellation(x, base(), { reason: "client", noticeDate: "2026-11-20", opCharge: 45000, nowMs: Date.parse("2026-11-20T03:00:00Z") });
ok("client's written cancellation inside 30 days: the operator's 50% plus our fee", c2.record.clientCharge === 45000 + (98902 - 90000) && /received in writing on 20 Nov 2026/.test(c2.mail.text) && c2.record.stillDue === 45000 + 8902 - 45000, c2.record);
let thr = false; try { cancellation(x, base(), { reason: "missing", nowMs: Date.parse("2026-11-03T03:00:00Z") }); } catch (e) { thr = /No client payment is overdue/.test(e.message); }
ok("no 'payment missing' cancellation while nothing is overdue", thr);
process.exitCode = fails ? 1 : 0;
