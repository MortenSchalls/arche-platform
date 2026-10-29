// Operator library (Morten, 29 Oct 2026: "we always save data that are not locked, for our IP improvement").
// Each issued, flown or cancelled booking adds one entry per operator: its cancellation and payment terms, insurance,
// aircraft, route codes, dates, passenger counts and prices. No client names or contact details, no bulk copy of
// Avinode data. Kept in intel 'oplib' (staff read it in Control). The server builds the entry from the database itself,
// never from what the browser sends.
// POST { action: "get", operator }      any active member: the last terms and insurance on file, to prefill a trip
// POST { action: "save", bid, did, event } owner or operations: add or update this booking's entry
const normOp = s => String(s || "").toLowerCase().replace(/\b(ltd|limited|pte|llc|inc|co|corp|plc|sa|ag|gmbh)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const num = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
const isId = s => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);

// the same entry the portal builds in the test version (src-modules/bookingplan.js oplibEntry); tests compare the two
export function entryFrom(d, st, event, nowIso = new Date().toISOString(), margin = 0.09) {
  d = d || {}; st = st || {};
  const q = d.quote || {}, s = d.safety || {}, o = d.opTerms || {}, i = o.ins || {}, b = st.book || {};
  const O = num(st.opPrice ?? q.opPrice), D = num(st.direct ?? q.direct);
  const P = num(st.price) || (O + D > 0 ? Math.ceil((O + D) / (1 - margin)) : 0);
  return {
    ref: st.ref || "", at: nowIso, event, operator: q.operator || "", aircraft: q.aircraft || "", reg: q.tail || "", category: (d.trip || {}).category || "",
    legs: ((d.trip || {}).legs || []).map(l => ({ from: l.from || "", to: l.to || "", date: l.date || "", pax: num(l.pax) })),
    opPrice: O, direct: D, price: P, marginPct: P ? Math.round((P - O - D) / P * 1000) / 10 : 0,
    terms: { cancel: o.cancel || [], cancelNone: !!o.cancelNone, pay: o.pay || [] },
    ins: { insurer: i.insurer || "", expiry: i.expiry || "", amount: num(s.ins), how: i.how || "", verifiedAt: i.verifiedAt || "" },
    audit: s.audit || "", holdHours: b.rtbAt && b.holdUntil ? Math.round((Date.parse(b.holdUntil) - Date.parse(b.rtbAt)) / 36e5) : null,
    outcome: st.state === "flown" ? "flown" : st.state === "cancelled" ? "cancelled" : "booked", opCancelCharge: num(st.opCancelCharge) || 0,
  };
}
export function merge(lib, e) {
  const L = { ops: {}, ...(lib || {}) }, k = normOp(e.operator); if (!k) return L;
  const cur = L.ops[k] || { name: e.operator, trips: [] };
  const trips = [...(cur.trips || []).filter(x => x.ref !== e.ref), e].slice(-200);
  L.ops = { ...L.ops, [k]: { name: e.operator, last: { terms: e.terms, ins: e.ins, at: e.at, ref: e.ref }, regs: [...new Set([...(cur.regs || []), e.reg].filter(Boolean))], trips } };
  L.updatedAt = e.at; return L;
}
// what a broker may see: the operator's terms and insurance, never other trips' prices or routes
export function publicEntry(e) { return e ? { name: e.name, last: e.last, trips: (e.trips || []).length, regs: e.regs || [] } : null; }

async function sb(path, opt = {}) {
  const KEY = process.env.SUPABASE_SECRET_KEY;
  const r = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...opt, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(opt.headers || {}) } });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).json({ error: "not set up" });
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, ""), PK = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY;
    const who = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PK, authorization: `Bearer ${token}` } });
    if (!who.ok) return res.status(401).json({ error: "Sign in again." });
    const me = await who.json();
    const pr = await sb(`/rest/v1/profiles?select=role,active&id=eq.${me.id}`), prof = (pr.body || [])[0];
    if (!prof || prof.active === false || !prof.role) return res.status(403).json({ error: "No access." });
    const b = req.body || {}, cur = await sb("/rest/v1/intel?select=value&key=eq.oplib"), lib = ((cur.body || [])[0] || {}).value || { ops: {} };
    if (b.action === "get") return res.status(200).json({ entry: publicEntry((lib.ops || {})[normOp(b.operator)]) });
    if (b.action === "save") {
      if (!["owner", "ops"].includes(prof.role)) return res.status(403).json({ error: "Operations only." });
      if (!isId(b.bid) || !/^[\w-]{1,80}$/.test(String(b.did || ""))) return res.status(400).json({ error: "Unknown trip." });
      const event = ["issued", "flown", "cancelled"].includes(b.event) ? b.event : "issued";
      const [t, s, terms] = await Promise.all([sb(`/rest/v1/trips?select=data&owner_id=eq.${b.bid}&id=eq.${encodeURIComponent(b.did)}`), sb(`/rest/v1/trip_status?select=data&owner_id=eq.${b.bid}&id=eq.${encodeURIComponent(b.did)}`), sb("/rest/v1/config?select=value&key=eq.terms")]);
      const d = ((t.body || [])[0] || {}).data, st = ((s.body || [])[0] || {}).data;
      if (!d || !st || !st.confIssued) return res.status(409).json({ error: "Only issued bookings are saved." });
      const e = entryFrom(d, st, event, new Date().toISOString(), num((((terms.body || [])[0] || {}).value || {}).margin) || 0.09);
      if (!e.ref) e.ref = b.did;
      const w = await sb("/rest/v1/intel?on_conflict=key", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "oplib", value: merge(lib, e), updated_at: new Date().toISOString() }) });
      return w.ok ? res.status(200).json({ ok: true }) : res.status(500).json({ error: "Could not save." });
    }
    return res.status(400).json({ error: "Unknown action." });
  } catch (e) { return res.status(400).json({ error: String(e.message || e).slice(0, 160) }); }
}
