/* ---------- KYC record and the 12-month refresh (CLAUDE.md KYC/KYB; Morten, 16 Nov 2026: "yes build, but ensure we have
   all aligned with our privacy policy") ----------
   On the trip the broker records when the person or company who signs and pays was identified, how, and the portal's own
   reference. No ID, passport or bank numbers are stored (Data Protection Policy, "KYC/KYB and sanctions screening
   results": results only, kept with the booking for 5 years after the relationship ends); a reference that looks like
   one is refused. The record is reused on the client's next trips until 12 months after the check, unless something
   changed: a new payer, another country or name, or a possible sanctions match. Then the check is done again before the
   booking can be authorised or issued. A trip with the KYC tick but no record yet (older trips) is asked for one. */
const KYC_MONTHS = 12;
const KYC_HOW = [["id", "Identity document seen (no copy or number kept here)"], ["registry", "Company registry, owners and signatory checked"], ["service", "Identity check service result"], ["inperson", "Met in person with the document"]];
const kycKey = c => String((c && (c.company || c.name)) || "").toLowerCase().replace(/\s+/g, " ").trim();
const kycLow = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
function kycDue(rec){
  if (!rec || !/^\d{4}-\d{2}-\d{2}$/.test(rec.checkedAt || "")) return "";
  const d = new Date(rec.checkedAt + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + KYC_MONTHS); return d.toISOString().slice(0, 10);
}
const kycRefOk = s => !/\d{6,}/.test(String(s || "").replace(/[\s.\/-]/g, ""));   // our own reference, never an ID or account number
/* the portal numbers every check itself (Morten, 25 Nov 2026: "automate the KYC/KYB reference, so numbering is generated
   by us"): KYB for a company, KYC for a person, the year of the check and four characters the portal draws, e.g. KYB-2026-4F7A;
   never a typed number, so no ID or account number can end up here */
function kycNewRef(t, at){
  const c = (t.d || {}).client || {}, used = new Set(allTrips().map(x => ((x.d || {}).kycRec || {}).ref).filter(Boolean));
  const pre = (c.company ? "KYB" : "KYC") + "-" + String(at || now()).slice(0, 4) + "-";
  let h = 0; const seed = t.did + "|" + now();
  for (let i = 0; i < 40; i++) { for (const ch of seed + i) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const r = pre + h.toString(36).toUpperCase().padStart(4, "0").slice(-4); if (!used.has(r)) return r; }
  return pre + Date.now().toString(36).toUpperCase().slice(-4);
}
function kycPrior(t){
  const k = kycKey((t.d || {}).client); if (!k) return null;
  let best = null;
  for (const x of allTrips()) {
    if (x.did === t.did) continue;
    const r = (x.d || {}).kycRec; if (!r || !r.checkedAt || kycKey(x.d.client) !== k) continue;
    if (!best || r.checkedAt > best.rec.checkedAt) best = {rec: r, ref: (x.st || {}).ref || x.did, did: x.did};
  }
  return best;
}
function kycChanges(rec, t){
  const c = (t.d || {}).client || {}, out = []; if (!rec) return out;
  if (kycLow(rec.payer) !== kycLow(c.payer)) out.push(c.payer ? "a new payer" : "the payer changed");
  if (rec.country && c.country && kycLow(rec.country) !== kycLow(c.country)) out.push("another country");
  if (rec.name && kycLow(rec.name) !== kycKey(c)) out.push("another name");
  const sc = (t.st || {}).screen; if (sc && sc.outcome === "possible match") out.push("a possible sanctions match");
  return out;
}
function kycState(t){
  const rec = (t.d || {}).kycRec || null, today = now().slice(0, 10), due = kycDue(rec);
  if (!rec) return {ok: false, rec: null, prior: kycPrior(t), why: "no KYC record (date and how the client was checked)"};
  if (due && due <= today) return {ok: false, rec, due, why: `KYC from ${fmtD(rec.checkedAt)} is more than 12 months old: check again`};
  const ch = kycChanges(rec, t); if (ch.length) return {ok: false, rec, due, why: `KYC must be done again: ${ch.join(", ")}`};
  return {ok: true, rec, due, soon: due && due <= new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)};
}
// what stops authorisation or issue (null when the record is fine)
function kycBlockReason(t){ const s = kycState(t); return s.ok ? null : s.why; }

function kycBlock(t, canEdit){
  const s = kycState(t), rec = s.rec, c = (t.d || {}).client || {};
  const head = s.ok
    ? `<div class="note ${s.soon ? "warn" : "ok"} small">KYC on file: checked ${fmtD(rec.checkedAt)} (${esc((KYC_HOW.find(h => h[0] === rec.how) || [0, rec.how || ""])[1])})${rec.ref ? `, reference ${esc(rec.ref)}` : ""}${rec.reusedFrom ? `, from trip ${esc(rec.reusedFrom)}` : ""}. Valid to ${fmtD(s.due)}${s.soon ? ": refresh it soon" : ""}.</div>`
    : `<div class="note warn small">${esc(s.why[0].toUpperCase() + s.why.slice(1))}.</div>`;
  if (!canEdit) return `<div id="kycRec" style="margin:6px 0 8px">${head}</div>`;
  const p = s.prior, pOk = p && kycDue(p.rec) > now().slice(0, 10) && !kycChanges(p.rec, t).length;
  const reuse = !rec && pOk ? `<p class="small" style="margin:6px 0">${esc(c.company || c.name)} was checked on ${fmtD(p.rec.checkedAt)} (trip ${esc(p.ref)}), valid to ${fmtD(kycDue(p.rec))}. <button class="btn small" type="button" data-kyc="reuse" data-did="${t.did}">Use that check</button></p>` : "";
  return `<div id="kycRec" style="margin:6px 0 8px">${head}${reuse}
    <details class="small"${rec && s.ok ? "" : " open"}><summary>${rec ? "Record a new check" : "Record the KYC check"}</summary>
    <div class="row" style="margin-top:6px"><label class="f" for="kyc_at" style="max-width:170px">Checked on<input id="kyc_at" type="date" value="${esc(now().slice(0, 10))}"></label>
    <label class="f" for="kyc_how" style="max-width:340px">How<select id="kyc_how">${KYC_HOW.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select></label>
    <p class="f muted" style="max-width:240px;margin:0">Reference<br><span class="mono">${(t.d.client || {}).company ? "KYB" : "KYC"}-…</span> set by the portal when you save</p>
    <button class="btn small" type="button" data-kyc="save" data-did="${t.did}">Save KYC record</button></div>
    <p class="muted" style="margin:6px 0 0">Never type an ID, passport or bank number here. The record keeps only the date, how, our reference, the name, country and payer it covers; it is kept with the booking as the privacy policy says. It is reused for this client until 12 months after the check, unless the payer, country or name changes or screening finds a possible match.</p></details></div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-kyc]"); if (!b) return; e.preventDefault();
  const t = tripById(b.dataset.did); if (!t) return;
  const c = (t.d || {}).client || {}, base = {name: kycKey(c), country: c.country || "", payer: c.payer || "", by: S.uid, at: now()};
  let rec;
  if (b.dataset.kyc === "reuse") {
    const p = kycPrior(t); if (!p) { toast("No earlier check found."); return; }
    rec = {...p.rec, ...base, checkedAt: p.rec.checkedAt, how: p.rec.how, ref: p.rec.ref || "", reusedFrom: p.ref};
  } else {
    const at = ($("kyc_at") || {}).value || "", how = ($("kyc_how") || {}).value || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(at) || at > now().slice(0, 10)) { toast("Enter the date of the check (not in the future)."); return; }
    rec = {...base, checkedAt: at, how, ref: kycNewRef(t, at)};
  }
  try { await deskWrite(t, {kycRec: rec, checks: {...(t.d.checks || {}), kyc: true}}, `KYC record: checked ${rec.checkedAt}${rec.reusedFrom ? " (from " + rec.reusedFrom + ")" : ""}`); audit("KYC recorded", `${(t.st || {}).ref || t.did} · ${rec.checkedAt}`); toast(`KYC record saved: ${rec.ref || "reference from the earlier check"}.`); render(); }
  catch(err){ toast("Could not save."); }
});
