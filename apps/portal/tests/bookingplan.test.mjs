// The booking arithmetic (src-modules/bookingplan-core.js): the higher cancellation charge, and Archē never pre-funds.
// Property test over many example operator terms. Example figures only.
import { createRequire } from "module"; const require = createRequire(import.meta.url);
const BP = require("../src-modules/bookingplan-core.js");
let fails = 0; const ok = (k, v, x) => { console.log((v ? "PASS " : "FAIL ") + k + (v || x === undefined ? "" : "  -> " + JSON.stringify(x).slice(0, 300))); if (!v) fails++; };
const t0 = BP.cancelTable(100000, 90000, 1000, []);
ok("no operator scale: our A9 scale exactly", JSON.stringify(t0.map(r => [r.label, r.pctOfPrice])) === JSON.stringify([["More than 14 days", 25], ["7 to 14 days", 40], ["72 hours to under 7 days", 65], ["24 hours to under 72 hours", 85], ["Under 24 hours, or no-show", 100]]), t0);
let rnd = 7; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
let bad = [];
for (let k = 0; k < 400; k++) {
  const O = 20000 + Math.round(R() * 300000), D = Math.round(R() * 5000), P = Math.ceil((O + D) / 0.91);
  const scale = [], pay = []; const nC = Math.floor(R() * 4); for (let i = 0; i < nC; i++) scale.push(R() < 0.25 ? { days: "booking", pct: Math.round(R() * 30) } : { days: Math.round(1 + R() * 60), unit: R() < 0.2 ? "hours" : "days", pct: Math.round(R() * 100) });
  let left = 100; const nP = 1 + Math.floor(R() * 3); for (let i = 0; i < nP; i++) { const pct = i === nP - 1 ? left : Math.round(R() * left); left -= pct; pay.push(R() < 0.4 ? { days: "booking", pct } : { days: Math.round(R() * 30), pct }); }
  const issue = "2026-11-01", dep = BP.addDays(issue, Math.round(R() * 90));
  const sc = BP.schedule({ P, O, dep, issue, scale, pay });
  const ct = BP.cancelTable(P, O, D, scale);
  // 1. the client charge is never below our scale nor below the operator's charge plus our fee
  for (let t = 0.01; t < 100; t += 0.37) { const row = ct.find(r => t < r.hi && t >= r.lo); const need = Math.max(Math.ceil(P * BP.pctAt(BP.OUR, t) / 100), Math.min(Math.ceil(P), Math.ceil(O * BP.pctAt(BP.rows(scale), t) / 100 + (P - O - D)))); if (!row || row.amount < need) { bad.push({ k, t, row, need }); break; } }
  // 2. never pre-fund: on every day, what the client must have paid two days earlier covers the operator's charge and payments due
  const days = BP.diff(issue, dep);
  for (let i = 0; i <= days; i++) { const date = BP.addDays(issue, i), tl = days - i;
    const payDue = BP.rows(pay).filter(r => r.days === Infinity || tl <= Math.ceil(r.days)).reduce((a, r) => a + r.pct, 0);
    const need = Math.max(Math.ceil(O * BP.pctAt(BP.rows(scale), tl) / 100), Math.ceil(O * Math.min(payDue, 100) / 100));
    const paid = BP.dueBy(sc, date); if (paid + 0.5 < Math.min(need, P)) { bad.push({ k, date, need, paid, sc, scale, pay, dep }); break; } }
  // 3. the schedule ends at the full price and never decreases
  if (!sc.length || sc[sc.length - 1].cum !== P || sc.some((x, i) => i && x.cum <= sc[i - 1].cum)) bad.push({ k, sc });
}
ok("400 example bookings: the client is always charged the higher amount, and the money due always covers the operator first", !bad.length, bad[0]);
ok("may sign only when covered", !BP.maySign({ O: 100000, scale: [{ days: "booking", pct: 20 }], pay: [{ days: "booking", pct: 50 }], received: 49999, daysLeft: 40 }).ok && BP.maySign({ O: 100000, scale: [], pay: [{ days: "booking", pct: 50 }], received: 50000, daysLeft: 40 }).ok);
ok("may pay only from money received, never above the operator price", !BP.mayPay({ O: 90000, received: 50000, paid: 10000, amount: 40001 }).ok && BP.mayPay({ O: 90000, received: 50000, paid: 10000, amount: 40000 }).ok && !BP.mayPay({ O: 90000, received: 99000, paid: 80000, amount: 10001 }).ok);
process.exitCode = fails ? 1 : 0;
