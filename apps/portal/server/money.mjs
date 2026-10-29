// The money state of one booking on the server (alerts and the cancellation notice), from the database rows.
// Same arithmetic as the portal (src-modules/bookingplan-core.js).
import BP from "../src-modules/bookingplan-core.js";
export { BP };
const n = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
const sum = xs => (xs || []).reduce((a, x) => a + n(x.amount), 0);
const H = 3600e3;

export function tripMoney(x, s, margin = 0.09, nowMs = Date.now()) {
  if (!x || !x.opTerms || !s || !s.confIssued || ["cancelled", "flown"].includes(s.state)) return null;
  const q = x.quote || {}, O = n(s.opPrice ?? q.opPrice), D = n(s.direct ?? q.direct), P = n(s.price) || (O + D > 0 ? Math.ceil((O + D) / (1 - margin)) : 0);
  const F = [...(x.requests || []), ...(x.extras || [])].filter(i => i.basis === "fixed").reduce((a, i) => a + (n(i.amount) ? Math.ceil(n(i.amount) / (1 - margin)) : 0), 0);
  const legs = ((x.trip || {}).legs || []).filter(l => l.date).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const first = legs[0]; if (!first) return null;
  const dep = first.date, depAt = `${first.date}T${first.time || "00:00"}:00Z`;
  const o = x.opTerms, scale = o.cancelNone ? [] : (o.cancel || []), pay = o.pay || [];
  const issue = String(s.confIssued.at || "").slice(0, 10) || new Date(nowMs).toISOString().slice(0, 10);
  const sched = BP.schedule({ P, F, O, dep, issue, scale, pay });
  const received = sum(s.receipts), paid = sum(s.payouts), today = new Date(nowMs).toISOString().slice(0, 10);
  const signedAt = s.signed && s.signed.at ? Date.parse(s.signed.at) : 0;
  // overdue: what is due on signature, 24 hours after the signature; a dated payment, after its due date
  let dueNow = 0, firstMissing = null;
  for (const i of sched) {
    const late = i.due === "signature" ? !!signedAt && nowMs > signedAt + 24 * H : i.due < today;
    if (late) { dueNow = Math.max(dueNow, i.cum); if (received < i.cum && !firstMissing) firstMissing = i; }
  }
  const valid = (((x.conf || {}).valid) || {}).date || "";
  const lapsed = !signedAt && !!valid && valid < today;
  const book = s.book || {}, dl = book.signedAt ? BP.deadline({ depAt, nowMs, O, scale, pay, received, paid }) : null;
  // after a deadline has passed: what Archē owes the operator now against what it holds
  const tl = (Date.parse(depAt) - nowMs) / 864e5;
  const payNow = BP.rows(pay).filter(r => r.days === Infinity || tl < r.days).reduce((a, r) => a + r.pct, 0);
  const owedNow = book.signedAt ? Math.max(BP.exposure(O, scale, tl), Math.ceil(O * Math.min(payNow, 100) / 100)) : 0;
  return { O, D, P, F, dep, depAt, scale, pay, sched, received, paid, dueNow, missing: Math.max(0, dueNow - received), firstMissing, lapsed, signed: !!signedAt, contractSigned: !!book.signedAt, deadline: dl,
    exposedNow: book.signedAt && received < owedNow ? owedNow - received : 0, unpaidNow: book.signedAt && paid < Math.ceil(O * Math.min(payNow, 100) / 100) && received >= Math.ceil(O * Math.min(payNow, 100) / 100),
    cancelRow: BP.cancelTable(P, O, D, scale).find(r => tl < r.hi && tl >= r.lo) || null };
}
