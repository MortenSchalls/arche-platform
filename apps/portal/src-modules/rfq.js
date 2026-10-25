/* ---------- Supplier quotes: request, compare and award quotes from service partners (Morten, 21 Oct 2026) ----------
   The first working piece of the AeroBridge idea, used by Archē as its first buyer. Kept as its own module with its own
   table (rfqs) and its own record shape, so it can later be lifted out into a separate, neutral company:
     request  {ref, airport, category, trip, neededBy, terms, scope, status, createdBy, createdAt}
     suppliers[{pid, org, eligible, reasons, sentAt, sentBy}]   eligibility is checked when the request is made
     quotes[{pid, org, usd, original, validUntil, deviations, receivedAt, by}]   all amounts in USD
     award {pid, org, usd, reason, by, at}   four-eyes: whoever made the request cannot award it (owner exempt)
     log[{t, by, note}]   append-only history
   Nothing is sent from the portal: a person copies the prepared message, sends it and marks it as sent.
   Staff only (owner and operations), enforced by the database rule in supabase/migrations/0006_rfqs.sql. */
const SQ_TERMS = ["IATA SGHA 2018, Annex B (one-off)", "IATA SGHA 2023, Annex B (one-off)", "Supplier's standard terms"];
const SQ_STATUS = {open: "Open", awarded: "Awarded", cancelled: "Cancelled"};
const SQ_SERVICES = {
  "FBO and ground handling": ["Ramp handling", "Passenger lounge", "Customs and immigration", "Crew transport", "Fuel arrangement", "Hangar", "Lavatory and water service", "Parking"],
  "Trip support": ["Landing permits", "Overflight permits", "Slots", "Flight planning", "Weather and NOTAM briefing"],
  "In-flight catering": ["Passenger catering", "Crew meals", "Special diets", "Bar and drinks", "Flowers and amenities"],
  "Crew hotels": ["Single rooms for crew", "Crew rate", "Day rooms", "Late check-out", "Quiet or blackout rooms", "24-hour reception", "Breakfast"]};
const sqStaff = () => isStaff() && acting() !== "broker";
const sqList = () => Object.entries(S.rfqs || {}).map(([id, r]) => ({id, ...r})).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
async function sqSet(id, data){ await S.db.doc("rfqs/" + id).set(data); }
function sqLog(r, note){ return [...(r.log || []), {t: now(), by: S.uid, note: String(note).slice(0, 500)}]; }
function sqNextRef(){
  const ym = new Date().toISOString().slice(2, 7).replace("-", "");
  const n = sqList().filter(r => (r.ref || "").startsWith("RQ-" + ym)).length + 1;
  return `RQ-${ym}-${String(n).padStart(2, "0")}`;
}
/* compliance gate: who may be asked to quote */
function sqEligible(p, cat){
  const reasons = [], flags = [], sc = (p.screen || {}).auto;
  if (p.status === "dnc") reasons.push("asked not to be contacted");
  if (p.status === "duplicate") reasons.push("duplicate record");
  if (p.status === "review" || (sc && sc.result === "possible match")) reasons.push("possible sanctions match");
  if (!sc) reasons.push("sanctions check not run yet (runs every morning)");
  if (cat === "FBO and ground handling" && !p.isbah) flags.push("No IS-BAH found");
  if (cat === "Crew hotels" && !(p.hotel && (p.hotel.type === "agency" || (p.hotel.minutes > 0 && p.hotel.minutes <= 15 && p.hotel.shuttle)))) reasons.push("not shown to be within 15 minutes of the airport with a dedicated airport shuttle");
  if (!(p.avenues || []).length && !p.website) flags.push("No contact route on file");
  return {eligible: !reasons.length, reasons, flags};
}
function sqCandidates(airport, cat){
  return Object.entries(S.prospects || {}).map(([id, p]) => ({id, ...p}))
    .filter(p => p.kind === "service" && p.category === cat && (p.airports || []).includes(airport))
    .map(p => ({p, ...sqEligible(p, cat)}));
}
/* explainable score out of 100: the reasons are shown next to every number; a person decides */
function sqScore(q, r, quotes){
  const p = (S.prospects || {})[q.pid] || {}, low = Math.min(...quotes.map(x => num(x.usd)).filter(x => x > 0));
  const parts = [];
  const price = num(q.usd) > 0 && isFinite(low) ? Math.round(50 * low / num(q.usd)) : 0;
  parts.push([price, `Price ${price}/50 (${num(q.usd) === low ? "lowest" : Math.round((num(q.usd) / low - 1) * 100) + "% above lowest"})`]);
  const qual = r.category === "FBO and ground handling" ? (p.isbah ? 20 : 0) : ((p.evidence || []).length ? 20 : 0);
  parts.push([qual, r.category === "FBO and ground handling" ? (p.isbah ? "IS-BAH registered 20/20" : "No IS-BAH 0/20") : ((p.evidence || []).length ? "Quality evidence on file 20/20" : "No quality evidence 0/20")]);
  const terms = q.deviations ? 0 : 15; parts.push([terms, q.deviations ? "Changes to our terms 0/15" : `Accepts ${r.terms} 15/15`]);
  const valid = !q.validUntil || !r.neededBy || q.validUntil >= r.neededBy ? 15 : 0; parts.push([valid, valid ? "Valid until needed 15/15" : "Expires before it is needed 0/15"]);
  return {total: parts.reduce((s, x) => s + x[0], 0), parts: parts.map(x => x[1])};
}
function sqMessage(r, s){
  const sc = r.scope || {};
  return `Subject: Quote request ${r.ref}: ${r.category}, ${r.airport}, ${sc.date ? fmtD(sc.date) : "date to follow"}

Dear ${s.org} team,

Archē Executive would like a quote for ${r.category.toLowerCase()} at ${r.airport}.

Aircraft: ${sc.aircraft || "to follow"}
Arrival (UTC): ${sc.arr || "to follow"}
Departure (UTC): ${sc.dep || "to follow"}
${r.category === "Crew hotels" ? `Crew: ${sc.crew || "to follow"} · Rooms: ${sc.rooms || "to follow"} · Nights: ${sc.nights || "to follow"}` : `Passengers: ${sc.pax || "to follow"} · Crew: ${sc.crew || "to follow"}`}
Services: ${(sc.services || []).join(", ") || "as discussed"}
${sc.notes ? "Notes: " + sc.notes + "\n" : ""}${r.category === "Crew hotels" ? "Required: the hotel is at most 15 minutes by road from the airport and has its own dedicated airport shuttle for the crew, both ways. Please confirm both in your quote.\n" : ""}Terms: ${r.terms}
Please quote in USD, itemised, with how long the quote is valid, by ${r.neededBy ? fmtD(r.neededBy) : "return"}. Tell us if anything in the terms does not suit you.

We found your details on your organisation's published pages. If you would rather not receive requests from us, reply and we will remove you.

Kind regards,
Archē Executive operations`;
}
function vQuotes(){
  if (!sqStaff()) return `<div class="panel empty"><p>Supplier quotes are for operations and the owner.</p></div>`;
  const all = sqList(), F = S.sqF || (S.sqF = {status: "open"});
  const list = all.filter(r => !F.status || (r.status || "open") === F.status);
  const sel = all.find(r => r.id === S.sqSel);
  const cnt = k => all.filter(r => (r.status || "open") === k).length;
  return `<div class="head"><div><h1>Supplier quotes</h1><p class="muted small">Ask the service partners at an airport for quotes, compare them on one screen and award one. Only suppliers that pass the checks can be asked. Nothing is sent from here: you send the prepared message and mark it as sent. Whoever makes a request cannot award it. All amounts in USD.</p></div>
    <div class="row"><button class="btn" type="button" data-rq="new">New quote request</button></div></div>
  <div class="kpis">${Object.entries(SQ_STATUS).map(([k, l]) => `<button type="button" class="kpi kbtn" data-rq="filter" data-st="${k}" aria-pressed="${F.status === k}"><div class="l">${l}</div><div class="v">${cnt(k)}</div></button>`).join("")}</div>
  <div class="grid2"><div class="panel"><div class="list">${list.map(r => `<div class="item" role="option" tabindex="0" data-rqsel="${esc(r.id)}" aria-selected="${S.sqSel === r.id}">
      <div class="t">${esc(r.ref)} · ${esc(r.airport)} · ${esc(r.category)}</div>
      <div class="small muted">${(r.quotes || []).length} of ${(r.suppliers || []).length} quoted${r.neededBy ? " · needed by " + fmtD(r.neededBy) : ""}${r.award ? " · awarded to " + esc(r.award.org) + " " + usd(r.award.usd) : ""}${r.trip ? " · trip " + esc(r.trip.ref) : ""}</div></div>`).join("") || `<div class="empty"><p class="small">No ${esc((SQ_STATUS[F.status] || "").toLowerCase())} requests.</p></div>`}</div></div>
  <div class="pdetail">${S.sqNew ? sqForm() : sel ? sqDetail(sel) : `<div class="panel empty"><p>Select a request, or make a new one.</p></div>`}</div></div>`;
}
function sqForm(){
  const D = S.sqDraft || (S.sqDraft = {airport: "", category: "FBO and ground handling"});
  const airports = [...new Set(Object.values(S.prospects || {}).filter(p => p.kind === "service").flatMap(p => p.airports || []))].sort();
  const trips = allTrips().filter(t => !["cancelled", "flown"].includes(t.stage));
  const cands = D.airport ? sqCandidates(D.airport, D.category) : [];
  return `<form id="sqForm" class="panel stack"><h2>New quote request</h2>
    <div class="fgrid">
      <label class="f" for="rq_ap">Airport<select id="rq_ap" data-rqd="airport"><option value="">Choose</option>${airports.map(a => `<option ${D.airport === a ? "selected" : ""}>${esc(a)}</option>`).join("")}</select></label>
      <label class="f" for="rq_cat">Service<select id="rq_cat" data-rqd="category">${Object.keys(SQ_SERVICES).map(c => `<option ${D.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
      <label class="f" for="rq_trip">For trip (optional)<select id="rq_trip"><option value="">None</option>${trips.map(t => `<option value="${esc(t.bid + "|" + t.did)}">${esc((t.st && t.st.ref) || (t.d.client && (t.d.client.company || t.d.client.name)) || t.did)}</option>`).join("")}</select></label>
      <label class="f" for="rq_need">Quotes needed by<input id="rq_need" type="date" required></label>
      <label class="f" for="rq_terms">Terms<select id="rq_terms">${SQ_TERMS.map(t => `<option>${esc(t)}</option>`).join("")}</select></label>
      <label class="f" for="rq_date">Service date<input id="rq_date" type="date"></label>
      <label class="f" for="rq_ac">Aircraft<input id="rq_ac" placeholder="Global 7500"></label>
      <label class="f" for="rq_arr">Arrival (UTC)<input id="rq_arr" placeholder="14:30"></label>
      <label class="f" for="rq_dep">Departure (UTC)<input id="rq_dep" placeholder="09:00 next day"></label>
      <label class="f" for="rq_pax">Passengers<input id="rq_pax" inputmode="numeric"></label>
      <label class="f" for="rq_crew">Crew<input id="rq_crew" inputmode="numeric"></label>
      ${D.category === "Crew hotels" ? `<label class="f" for="rq_rooms">Rooms<input id="rq_rooms" inputmode="numeric"></label><label class="f" for="rq_nights">Nights<input id="rq_nights" inputmode="numeric"></label>` : ""}
    </div>
    <fieldset class="small"><legend>Services needed</legend>${SQ_SERVICES[D.category].map((s, i) => `<label class="check" for="rq_s${i}"><input type="checkbox" id="rq_s${i}" data-rqsvc="${esc(s)}"><span>${esc(s)}</span></label>`).join("")}</fieldset>
    <label class="f" for="rq_notes">Notes for the supplier (no client names)<textarea id="rq_notes" rows="2"></textarea></label>
    <div><h3>Suppliers at ${esc(D.airport || "the airport")}</h3>${!D.airport ? `<p class="small muted">Choose an airport to see its suppliers.</p>` : cands.length ? `<ul class="avs">${cands.map(c => `<li><label class="check" for="rq_p_${esc(c.p.id)}"><input type="checkbox" id="rq_p_${esc(c.p.id)}" data-rqpick="${esc(c.p.id)}" ${c.eligible ? "checked" : "disabled"}><span><b>${esc(c.p.org)}</b>${c.eligible ? "" : ` · <span class="bad-ink">cannot be asked: ${esc(c.reasons.join("; "))}</span>`}${c.flags.length ? ` · <span class="muted">${esc(c.flags.join("; "))}</span>` : ""}</span></label></li>`).join("")}</ul>` : `<p class="small muted">No ${esc(D.category.toLowerCase())} suppliers on file at ${esc(D.airport)}. Add them under Prospects › Service partners first.</p>`}</div>
    <div class="row"><button class="btn primary" type="submit">Create request</button><button class="btn" type="button" data-rq="cancelNew">Cancel</button></div></form>`;
}
function sqDetail(r){
  const st = r.status || "open", quotes = r.quotes || [], mine = r.createdBy === S.uid && !S.isOwner;
  const scored = quotes.map(q => ({q, s: sqScore(q, r, quotes)})).sort((a, b) => b.s.total - a.s.total);
  const sc = r.scope || {};
  return `<div class="panel stack"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(r.ref)}</h2><span class="chip ${st === "awarded" ? "c-flown" : st === "cancelled" ? "c-returned" : "c-quoted"}">${SQ_STATUS[st]}</span></div>
    <p class="small muted">${esc(r.category)} at ${esc(r.airport)}${sc.date ? " · " + fmtD(sc.date) : ""}${r.trip ? " · trip " + esc(r.trip.ref) : ""} · needed by ${fmtD(r.neededBy)} · terms: ${esc(r.terms)}</p>
    <p class="small">${esc([sc.aircraft, sc.arr && "arrives " + sc.arr + " UTC", sc.dep && "departs " + sc.dep + " UTC", sc.pax && sc.pax + " passengers", sc.crew && sc.crew + " crew", sc.rooms && sc.rooms + " rooms", sc.nights && sc.nights + " nights"].filter(Boolean).join(" · "))}${(sc.services || []).length ? "<br>Services: " + esc(sc.services.join(", ")) : ""}</p>
    ${r.award ? `<div class="note info small"><b>Awarded to ${esc(r.award.org)} for ${usd(r.award.usd)}</b> on ${fmtD(r.award.at)}.${r.award.reason ? " Reason: " + esc(r.award.reason) : ""} Add it to the trip's direct costs in Operations${r.trip ? " (trip " + esc(r.trip.ref) + ")" : ""}; a price change after approval goes back to the owner.</div>` : ""}
    <div><h3>Suppliers asked</h3><ul class="avs">${(r.suppliers || []).map((s, i) => {
      const p = (S.prospects || {})[s.pid], gate = p ? sqEligible(p, r.category) : {eligible: false, reasons: ["no longer on file"], flags: []};
      const q = quotes.find(x => x.pid === s.pid);
      return `<li><b>${esc(s.org)}</b> · ${q ? `quoted ${usd(q.usd)}` : s.sentAt ? `asked ${fmtD(s.sentAt)}, waiting` : "not asked yet"}${!gate.eligible ? ` · <span class="bad-ink">now blocked: ${esc(gate.reasons.join("; "))}</span>` : ""}
        ${st === "open" && !s.sentAt && gate.eligible ? `<details class="small"><summary>Prepare the message</summary>${p ? avenuesHtml(p) : ""}<textarea readonly rows="14" id="rq_msg_${i}" style="width:100%;margin-top:6px">${esc(sqMessage(r, s))}</textarea>
          <div class="row"><button class="btn small" type="button" data-rq="copy" data-i="${i}">Copy message</button><button class="btn small primary" type="button" data-rq="sent" data-i="${i}">I have sent it</button></div></details>` : ""}</li>`; }).join("")}</ul></div>
    ${st === "open" ? `<details class="small"><summary>Record a quote received</summary><form id="sqQuote" class="fgrid" style="margin-top:8px">
      <label class="f" for="rq_qs">Supplier<select id="rq_qs">${(r.suppliers || []).filter(s => s.sentAt).map(s => `<option value="${esc(s.pid)}">${esc(s.org)}</option>`).join("")}</select></label>
      <label class="f" for="rq_qu">Total in USD<input id="rq_qu" inputmode="decimal" required></label>
      <label class="f" for="rq_qo">Quoted in another currency? (for example "EUR 1,200")<input id="rq_qo"></label>
      <label class="f" for="rq_qv">Valid until<input id="rq_qv" type="date"></label>
      <label class="f" for="rq_qd">Changes to our terms (leave empty if none)<input id="rq_qd"></label>
      <div class="row" style="align-self:end"><button class="btn primary" type="submit">Save quote</button></div></form>${!(r.suppliers || []).some(s => s.sentAt) ? `<p class="muted">Mark at least one message as sent first.</p>` : ""}</details>` : ""}
    ${scored.length ? `<div><h3>Comparison</h3><div class="tbl"><table class="ptable"><thead><tr><th>Supplier</th><th>USD</th><th>Score</th><th>Why</th>${st === "open" ? "<th></th>" : ""}</tr></thead><tbody>
      ${scored.map(({q, s}, i) => `<tr><td><b>${esc(q.org)}</b>${q.original ? `<br><span class="small muted">quoted ${esc(q.original)}</span>` : ""}${q.deviations ? `<br><span class="small">Changes: ${esc(q.deviations)}</span>` : ""}</td><td class="mono">${usd(q.usd)}</td><td class="mono">${s.total}</td><td class="small">${s.parts.map(esc).join("<br>")}</td>${st === "open" ? `<td>${mine ? `<span class="small muted">Someone else awards</span>` : `<button class="btn small" type="button" data-rq="award" data-pid="${esc(q.pid)}">Award</button>`}</td>` : ""}</tr>`).join("")}
    </tbody></table></div><p class="small muted">The score only explains the comparison. A person decides; if you choose anyone other than the top score, or an FBO without IS-BAH, write why.</p>
    ${S.sqAward && S.sqAward.id === r.id ? `<form id="sqAwardForm" class="stack"><label class="f" for="rq_ar">Reason for this choice${S.sqAward.need ? " (needed)" : " (optional)"}<input id="rq_ar" ${S.sqAward.need ? "required" : ""}></label><div class="row"><button class="btn primary" type="submit">Confirm award to ${esc(S.sqAward.org)}</button><button class="btn" type="button" data-rq="awardCancel">Cancel</button></div></form>` : ""}</div>` : ""}
    ${st === "open" ? `<div class="row"><button class="btn danger small" type="button" data-rq="cancelReq">Cancel request</button></div>` : ""}
    <details class="small"><summary>History (${(r.log || []).length})</summary><ul>${(r.log || []).map(l => `<li>${fmtT(l.t)} · ${esc(S.names[l.by] || "")} ${esc(l.note)}</li>`).join("")}</ul></details>
  </div>`;
}
document.addEventListener("change", e => {
  const d = e.target.closest("[data-rqd]"); if (!d || !sqStaff()) return;
  S.sqDraft = {...(S.sqDraft || {}), [d.dataset.rqd]: d.value}; render();
});
document.addEventListener("click", async e => {
  const sel = e.target.closest("[data-rqsel]");
  if (sel && sqStaff()) { S.sqSel = sel.dataset.rqsel; S.sqNew = false; S.sqAward = null; render(); return; }
  const el = e.target.closest("[data-rq]"); if (!el || !sqStaff()) return;
  const a = el.dataset.rq, r = S.sqSel && (S.rfqs || {})[S.sqSel], id = S.sqSel;
  if (a === "new") { S.sqNew = true; S.sqSel = null; S.sqDraft = null; render(); return; }
  if (a === "cancelNew") { S.sqNew = false; render(); return; }
  if (a === "filter") { S.sqF = {status: S.sqF && S.sqF.status === el.dataset.st ? "" : el.dataset.st}; render(); return; }
  if (!r) return;
  const i = +el.dataset.i;
  if (a === "copy") { const t = $("rq_msg_" + i); try { await navigator.clipboard.writeText(t.value); toast("Copied. Send it from your work email."); } catch(err) { t.select(); toast("Selected: copy it with Ctrl+C or Cmd+C."); } return; }
  if (a === "sent") {
    const s = (r.suppliers || [])[i]; if (!s) return;
    const p = (S.prospects || {})[s.pid]; if (!p || !sqEligible(p, r.category).eligible) { toast("This supplier no longer passes the checks."); return; }
    if (await gateHold("supplier", id + "-" + s.pid, "sent", `Send quote request ${r.ref} to ${s.org}`, `${r.category || ""} at ${r.airport || ""}`)) return;
    const sup = r.suppliers.slice(); sup[i] = {...s, sentAt: now(), sentBy: S.uid};
    await sqSet(id, {...r, suppliers: sup, log: sqLog(r, "Request sent to " + s.org)}); toast("Marked as sent."); return;
  }
  if (a === "award") {
    if (r.createdBy === S.uid && !S.isOwner) { toast("You made this request, so someone else awards it."); return; }
    const quotes = r.quotes || [], q = quotes.find(x => x.pid === el.dataset.pid); if (!q) return;
    const top = quotes.map(x => ({x, s: sqScore(x, r, quotes).total})).sort((m, n) => n.s - m.s)[0].x;
    const p = (S.prospects || {})[q.pid] || {};
    S.sqAward = {id, pid: q.pid, org: q.org, need: top.pid !== q.pid || (r.category === "FBO and ground handling" && !p.isbah)}; render(); return;
  }
  if (a === "awardCancel") { S.sqAward = null; render(); return; }
  if (a === "cancelReq") {
    if (!el.dataset.armed) { el.dataset.armed = "1"; el.textContent = "Click again to cancel the request"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = "Cancel request"; } }, 6000); return; }
    await sqSet(id, {...r, status: "cancelled", log: sqLog(r, "Request cancelled")}); toast("Request cancelled."); return;
  }
});
document.addEventListener("submit", async e => {
  const f = e.target; if (!sqStaff() || !["sqForm", "sqQuote", "sqAwardForm"].includes(f.id)) return; e.preventDefault();
  try {
    if (f.id === "sqForm") {
      const D = S.sqDraft || {}; if (!D.airport) { toast("Choose the airport."); return; }
      const need = $("rq_need").value; if (!need) { toast("Say when the quotes are needed."); return; }
      const picks = [...document.querySelectorAll("[data-rqpick]:checked")].map(x => x.dataset.rqpick);
      const cands = sqCandidates(D.airport, D.category).filter(c => c.eligible && picks.includes(c.p.id));
      if (!cands.length) { toast("Choose at least one supplier that passes the checks."); return; }
      const tv = $("rq_trip").value, t = tv ? allTrips().find(x => x.bid + "|" + x.did === tv) : null;
      const rid = newId("q"), ref = sqNextRef();
      const rec = {ref, airport: D.airport, category: D.category, status: "open", neededBy: need, terms: $("rq_terms").value,
        trip: t ? {bid: t.bid, did: t.did, ref: (t.st && t.st.ref) || t.did} : null,
        scope: {date: $("rq_date").value, aircraft: $("rq_ac").value.trim().slice(0, 60), arr: $("rq_arr").value.trim().slice(0, 40), dep: $("rq_dep").value.trim().slice(0, 40),
          pax: $("rq_pax").value.trim().slice(0, 4), crew: $("rq_crew").value.trim().slice(0, 4), rooms: $("rq_rooms") ? $("rq_rooms").value.trim().slice(0, 4) : "", nights: $("rq_nights") ? $("rq_nights").value.trim().slice(0, 4) : "", services: [...document.querySelectorAll("[data-rqsvc]:checked")].map(x => x.dataset.rqsvc), notes: $("rq_notes").value.trim().slice(0, 600)},
        suppliers: cands.map(c => ({pid: c.p.id, org: c.p.org, eligible: true, flags: c.flags})), quotes: [], createdBy: S.uid, createdAt: now(), log: [{t: now(), by: S.uid, note: `Request made for ${cands.length} supplier${cands.length > 1 ? "s" : ""}`}]};
      await sqSet(rid, rec); audit("Supplier quote request made", ref + " " + D.airport + " " + D.category);
      S.sqNew = false; S.sqSel = rid; S.sqDraft = null; S.sqF = {status: "open"}; toast("Request " + ref + " made. Prepare and send the messages."); render(); return;
    }
    const r = (S.rfqs || {})[S.sqSel], id = S.sqSel; if (!r) return;
    if (f.id === "sqQuote") {
      const pid = $("rq_qs").value, s = (r.suppliers || []).find(x => x.pid === pid), amt = num($("rq_qu").value);
      if (!s || !s.sentAt) { toast("Choose a supplier you have asked."); return; }
      if (!(amt > 0)) { toast("Enter the total in USD."); return; }
      const q = {pid, org: s.org, usd: amt, original: $("rq_qo").value.trim().slice(0, 40), validUntil: $("rq_qv").value, deviations: $("rq_qd").value.trim().slice(0, 300), receivedAt: now(), by: S.uid};
      await sqSet(id, {...r, quotes: [...(r.quotes || []).filter(x => x.pid !== pid), q], log: sqLog(r, `Quote from ${s.org}: ${usd(amt)}`)}); toast("Quote saved."); return;
    }
    if (f.id === "sqAwardForm") {
      const A = S.sqAward; if (!A || A.id !== id) return;
      if (r.createdBy === S.uid && !S.isOwner) { toast("You made this request, so someone else awards it."); return; }
      const reason = $("rq_ar").value.trim(); if (A.need && !reason) { toast("Write why you chose this supplier."); return; }
      { const q0 = (r.quotes || []).find(x => x.pid === A.pid) || {}; if (await gateHold("supplier", id + "-award-" + A.pid, "award", `Award ${r.ref} to ${A.org}${q0.usd ? ", " + usd(q0.usd) : ""}`, reason)) return; }
      const q = (r.quotes || []).find(x => x.pid === A.pid); if (!q) return;
      await sqSet(id, {...r, status: "awarded", award: {pid: q.pid, org: q.org, usd: q.usd, reason: reason.slice(0, 300), by: S.uid, at: now()}, log: sqLog(r, `Awarded to ${q.org} for ${usd(q.usd)}${reason ? ": " + reason : ""}`)});
      audit("Supplier quote awarded", `${r.ref} ${q.org} ${usd(q.usd)}`); S.sqAward = null; toast("Awarded. Add the cost to the trip in Operations."); return;
    }
  } catch (err) { toast(err.code === "permission_denied" ? "Supplier quotes are not set up yet (run 0006 in Supabase)." : "Could not save. Try again."); }
});
