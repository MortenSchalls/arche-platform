/* ---------- Booking plan: money and cancellation, the arithmetic (Morten, 29 Oct 2026: "failure proof procedure where it is
   always the higher fee of the operator"; "we can only pay when money is received from client"; "minimum margin is 9%").
   Pure functions, no screen: used by the trip file, the charter confirmation, Today and the tests.
   Times are "days before the first departure". An operator row {days: 14, pct: 50} means: cancelled less than 14 days
   before departure, the operator keeps 50% of its price. days = Infinity means from booking (signing its contract).
   The client always pays the higher of Archē's scale (A9) and the operator's charge plus Archē's fee. Archē never
   pre-funds: before each date on which the operator wants money, or its charge rises, the client has paid at least that
   much, two days early. */
(function(root){
  const INF = Infinity, BUFFER = 2;
  const OUR = [{days: INF, pct: 25}, {days: 14, pct: 40}, {days: 7, pct: 65}, {days: 3, pct: 85}, {days: 1, pct: 100}];
  const OUR_LABEL = {"inf-14": "More than 14 days", "14-7": "7 to 14 days", "7-3": "72 hours to under 7 days", "3-1": "24 hours to under 72 hours", "1-0": "Under 24 hours, or no-show"};
  const n = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
  const daysOf = r => r.days === "booking" || r.days === INF || r.days == null || r.days === "" ? INF : n(r.days) * (r.unit === "hours" ? 1 / 24 : 1);
  // operator rows from the trip form: [{days, unit, pct}] → [{days (in days, INF = from booking), pct}]
  function rows(list){ return (list || []).map(r => ({days: daysOf(r), pct: Math.max(0, Math.min(100, n(r.pct)))})).filter(r => r.pct > 0); }
  // percentage that applies when cancelled with t days left (the highest of every row already reached)
  function pctAt(list, t){ return list.reduce((m, r) => (t < r.days ? Math.max(m, r.pct) : m), 0); }
  function span(d){ if (d === INF) return "booking"; if (d >= 2 && Math.abs(d - Math.round(d)) < 1e-9) return `${Math.round(d)} days`; const h = Math.round(d * 24); return `${h} hours`; }
  function label(hi, lo){
    const k = `${hi === INF ? "inf" : +hi.toFixed(4)}-${+lo.toFixed(4)}`; if (OUR_LABEL[k]) return OUR_LABEL[k];
    if (hi === INF) return `More than ${span(lo)}`;
    if (lo === 0) return `Under ${span(hi)}, or no-show`;
    const a = span(lo), b = span(hi), unit = s => s.split(" ")[1];
    return unit(a) === unit(b) ? `${a.split(" ")[0]} to under ${b}` : `${a} to under ${b}`;
  }
  /* the cancellation table for one booking: P client charter price, O operator price, D direct costs, scale = operator rows */
  function cancelTable(P, O, D, scale){
    const op = rows(scale), fee = Math.max(0, n(P) - n(O) - n(D));
    const cuts = [...new Set([...OUR.map(r => r.days), ...op.map(r => r.days)].filter(d => d !== INF && d > 0))].sort((a, b) => b - a);
    const bounds = [INF, ...cuts, 0], out = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      const hi = bounds[i], lo = bounds[i + 1], t = lo + (hi === INF ? 1 : (hi - lo) / 2);
      const ours = pctAt(OUR, t), opp = pctAt(op, t);
      const a = Math.ceil(n(P) * ours / 100), b = opp ? Math.ceil(n(O) * opp / 100 + fee) : 0;
      out.push({hi, lo, label: label(hi, lo), ourPct: ours, opPct: opp, amount: Math.min(Math.max(a, b), Math.ceil(n(P))), operatorHigher: b > a, pctOfPrice: n(P) ? Math.min(100, Math.round(Math.max(a, b) / n(P) * 1000) / 10) : 0});
    }
    // merge neighbours that charge the same
    const m = []; out.forEach(r => { const p = m[m.length - 1]; if (p && p.amount === r.amount && p.operatorHigher === r.operatorHigher) { p.lo = r.lo; p.label = label(p.hi, p.lo); } else m.push({...r}); });
    return m;
  }
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = (s, k) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + k); return iso(d); };
  const diff = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5);
  /* the client's payment schedule: P price, F fixed extras (client amount), O operator price, dep first departure date,
     issue date, scale (operator cancellation rows), pay (operator payment rows {days, unit, pct}).
     Returns [{due: "signature" | ISO date, cum, amount, why: []}] with cum rising to P + F. */
  function schedule({P, F = 0, O, dep, issue, scale, pay, buffer = BUFFER}){
    P = n(P); F = n(F); O = n(O); const T = Math.ceil(P + F);
    if (!T || !dep || !issue) return [];
    const left = diff(issue, dep), pts = [];
    const at = days => days === INF ? "signature" : (() => { const d = addDays(dep, -Math.ceil(days + buffer)); return d <= issue ? "signature" : d; })();
    if (left < 7) pts.push({due: "signature", cum: T, why: ["departure within 7 days"]});
    else { pts.push({due: "signature", cum: Math.min(P, Math.ceil(Math.max(P * 0.25, 2500))), why: ["deposit"]}); pts.push({due: addDays(dep, -7), cum: T, why: ["balance"]}); }
    let acc = 0; rows(pay).sort((a, b) => b.days - a.days).forEach(r => { acc += r.pct; pts.push({due: at(r.days), cum: Math.ceil(O * Math.min(acc, 100) / 100), why: ["the operator's payment terms"]}); });
    rows(scale).forEach(r => pts.push({due: at(r.days), cum: Math.ceil(O * r.pct / 100), why: ["the operator's cancellation charge"]}));
    const key = d => d === "signature" ? "0000" : d;
    pts.sort((a, b) => key(a.due).localeCompare(key(b.due)));
    const out = []; let run = 0;
    pts.forEach(p => { const c = Math.min(T, Math.max(run, p.cum)); if (c <= run) return; const last = out[out.length - 1];
      if (last && last.due === p.due) { last.amount += c - run; last.cum = c; if (!last.why.includes(p.why[0])) last.why.push(p.why[0]); }
      else out.push({due: p.due, cum: c, amount: c - run, why: [...p.why]});
      run = c; });
    return out;
  }
  /* what the client has paid against the schedule, as of a date */
  function dueBy(sched, date){ return sched.filter(s => s.due === "signature" || s.due <= date).reduce((m, s) => Math.max(m, s.cum), 0); }
  /* what Archē would owe the operator if cancelled with t days left, once its contract is signed */
  function exposure(O, scale, t){ return Math.ceil(n(O) * pctAt(rows(scale), t) / 100); }
  /* may the operator's contract be signed now? received = cleared client money */
  function maySign({O, scale, pay, received, daysLeft}){
    const atSign = rows(pay).filter(r => daysLeft < r.days || r.days === INF).reduce((a, r) => a + r.pct, 0);
    const need = Math.max(exposure(O, scale, daysLeft), Math.ceil(n(O) * Math.min(atSign, 100) / 100));
    return {ok: n(received) >= need, need};
  }
  /* may Archē pay the operator this amount? never more than received, never more than the operator price */
  function mayPay({O, received, paid, amount}){
    const a = n(amount), room = Math.min(n(received), n(O)) - n(paid);
    return {ok: a > 0 && a <= room + 0.005, room: Math.max(0, room)};
  }
  /* the next date the operator's charge or payment rises (to cancel before it if the client has not paid) */
  function nextStep({dep, today, scale, pay}){
    const t = diff(today, dep), nxt = [...rows(scale), ...rows(pay)].map(r => r.days).filter(d => d !== INF && d < t).sort((a, b) => b - a)[0];
    return nxt == null ? null : addDays(dep, -Math.ceil(nxt));
  }
  const BP = {OUR, rows, pctAt, cancelTable, schedule, dueBy, exposure, maySign, mayPay, nextStep, addDays, diff, BUFFER};
  root.BP = BP;
  if (typeof module !== "undefined" && module.exports) module.exports = BP;
})(typeof window !== "undefined" ? window : globalThis);
