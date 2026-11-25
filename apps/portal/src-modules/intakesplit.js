/* ---------- Enquiry first, operator quote later (a broker's booking practice, 25 Nov 2026: "Could we separate the
   first client section with the second operator section in the portal? And add in the Client Section the checklist of the
   intake file ... 1. Write all Client details down ... with the Intake File 2. Start looking through Avinode ... 3. Go back
   to our Portal to fill in the blanks regarding Operator, Price ...") ----------
   The trip editor opens in one of two parts. "Client and trip" holds the client, the legs and the intake checklist of
   manual Template B.1 (asked once, here, and used later: the lead passenger goes to the confirmation and to screening,
   the payment method sets "the client pays by card"). Saving it gives the ready-written quote request for Avinode
   (Template B.2, filled from the trip, with no client name). "Operator quote" is opened when the operators reply.
   Both parts are one form: the part not shown keeps its values, so one Save stores both. */
const INTAKE_SOURCES = ["", "Phone call", "Email", "Website", "WhatsApp, LINE or WeChat", "Referral", "Returning client", "From my leads", "Enquiry pool", "Other"];
const INTAKE_FIELDS = [
  ["lead", "e_ilead", "Lead passenger (if not the client)", "Name as on the passport"],
  ["booker", "e_ibook", "Booker (if not the client): name and contact", "e.g. an assistant or office"],
  ["flex", "e_iflex", "Flexibility on dates and times", "e.g. ±1 day, any time after 10:00"],
  ["kids", "e_ikids", "Of the passengers: children and infants", "e.g. 1 child, 1 infant"],
  ["nat", "e_inat", "Nationalities (for entry and permits)", "Countries only, never passport numbers"],
  ["bags", "e_ibags", "Luggage and special items", "e.g. 2 golf bags, skis, oversize cases"],
  ["pets", "e_ipets", "Pets", "Kind, size, travels in the cabin?"],
  ["purpose", "e_ipurp", "Purpose of travel (if a permit needs it)", "e.g. leisure, business, government"],
  ["budget", "e_ibudg", "Budget (USD, if the client gave one)", ""],
  ["ops", "e_iops", "For the operators (goes into the Avinode request)", "e.g. catering for 4, car at arrival; no names or health details"]];
function intakeOf(d){ return (d && d.intake) || {}; }
function intakeCount(d){ const i = intakeOf(d); return ["flex", "bags", "pets", "purpose", "pay", "source"].filter(k => String(i[k] || "").trim()).length; }
function intakeRead(prev){
  const o = {...(prev || {})};
  INTAKE_FIELDS.forEach(([k, id]) => { const el = $(id); if (el) o[k] = el.value.trim(); });
  const pm = $("e_ipay"), sr = $("e_isrc"); if (pm) o.pay = pm.value; if (sr) o.source = sr.value;
  if (/\d{5,}/.test(String(o.nat || "").replace(/[\s.\/-]/g, ""))) { o.nat = ""; if (typeof toast === "function") toast("Nationalities: countries only. The number was not saved."); }   // never a passport number
  return o;
}
function intakeHtml(d){
  const i = intakeOf(d), src = i.source || (S.fromLead ? "From my leads" : S.fromPool ? "Enquiry pool" : "");
  return `<div id="secIntake"><h3>Intake checklist</h3><p class="small muted" style="margin:0 0 8px">Template B.1. Ask what you can on the first call; everything here is optional and used later (lead passenger on the confirmation and in screening, payment method in the price).</p><div class="fgrid">
    ${INTAKE_FIELDS.map(([k, id, label, ph]) => `<label class="f${k === "bags" || k === "booker" || k === "ops" ? " wide" : ""}" for="${id}">${esc(label)}<input id="${id}" value="${esc(i[k] || "")}" ${ph ? `placeholder="${esc(ph)}"` : ""} ${k === "budget" ? 'inputmode="decimal"' : ""}></label>`).join("")}
    <label class="f" for="e_ipay">Payment method<select id="e_ipay">${["", "Bank transfer", "Card"].map(x => `<option ${i.pay === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label class="f" for="e_isrc">Source of enquiry<select id="e_isrc">${INTAKE_SOURCES.map(x => `<option ${src === x ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
    <p class="small muted" style="margin:6px 0 0">KYC and the trip risk screen are on the trip once it is saved.</p></div>`;
}
/* Template B.2, filled from the trip: no client name, contact, nationality or the broker's own notes go to operators */
function avinodeRequest(d){
  const tr = (d && d.trip) || {}, i = intakeOf(d), name = c => (typeof aptName === "function" && aptName(c)) || "";
  const legs = (tr.legs || []).filter(l => l.from || l.to).map((l, n) => `Leg ${n + 1}: ${l.from || "?"}${name(l.from) ? " " + name(l.from) : ""} to ${l.to || "?"}${name(l.to) ? " " + name(l.to) : ""}, ${l.date ? fmtD(l.date) : "date to follow"}${l.time ? " " + l.time + " local" : ""}, ${l.pax || "?"} passenger${l.pax == 1 ? "" : "s"}`);
  const extra = [tr.category ? "Aircraft category: " + tr.category : "", i.flex ? "Flexibility: " + i.flex : "", i.kids ? "Children and infants: " + i.kids : "", i.bags ? "Luggage and special items: " + i.bags : "", i.pets ? "Pets: " + i.pets : "", i.ops ? "Requests: " + i.ops : ""].filter(Boolean);   // the trip notes stay with Archē: only what the broker wrote for the operators goes (review 25 Nov 2026)
  return "Please quote an all-in price for the trip below. Please list what is included and excluded (positioning, crew overnights, landing, handling and parking, navigation, catering, fuel and surcharges, taxes, de-icing, Wi-Fi, permits), the aircraft registration and year, your safety audit status, and the quote expiry. Please also confirm whether the trip is non-stop for this load and season, and any crew-duty or permit constraints.\n\n" + legs.join("\n") + (extra.length ? "\n" + extra.join("\n") : "");
}
function avinodeBox(t){
  const d = t.d || {}, q = d.quote || {}, has = num(q.opPrice) > 0;
  return `<details class="panel" id="secAvinode" style="padding:12px 16px;margin:8px 0" ${has ? "" : "open"}><summary style="cursor:pointer;list-style:revert"><b>Ask operators on Avinode</b> <span class="small muted">${has ? "(quote entered)" : d.avReqAt ? "(request copied " + esc(fmtT(d.avReqAt)) + ")" : "(next step)"}</span></summary>
    <p class="small" style="margin:6px 0">Copy the request into Avinode and send it to the operators that fit. When they reply, press <b>Enter the operator quote</b> (or paste the operator's quote there).</p>
    <pre class="small" id="avReqText" style="white-space:pre-wrap;user-select:all;background:var(--panel2,rgba(127,127,127,.08));padding:10px;border-radius:6px;margin:0 0 8px">${esc(avinodeRequest(d))}</pre>
    <div class="row" style="gap:8px"><button class="btn small" type="button" data-act="avCopy">Copy the request</button><button class="btn small primary" type="button" data-act="editQuote">${has ? "Edit the operator quote" : "Enter the operator quote"}</button></div></details>`;
}
(function(){
  const _open = openEditor;
  openEditor = function(t, part){
    _open(t);
    const f = $("edForm"); if (!f) return;
    const d = (t && t.d) || {}, isNew = !(t && t.did);
    part = part || S.edPart || "client"; S.edPart = null;
    const secs = [...f.children].filter(x => x.tagName === "DIV" && x.querySelector("h3"));
    const byH = h => secs.find(x => (x.querySelector("h3") || {}).textContent === h);
    const cli = byH("Client"), trip = byH("Trip"), quote = byH("Operator quote");
    if (trip) trip.insertAdjacentHTML("afterend", intakeHtml(d));
    const intake = $("secIntake");
    // payment method decides "the client pays by card" unless the broker set it on the quote
    const pm = $("e_ipay"), card = $("q_card");
    if (card && pm && (d.quote || {}).card === undefined && intakeOf(d).pay === "Card") { card.checked = true; if (typeof updatePreview === "function") updatePreview(); }
    if (pm && card) pm.addEventListener("change", () => { card.checked = pm.value === "Card"; if (typeof updatePreview === "function") updatePreview(); });
    const h1 = f.querySelector("h1"), save = f.querySelector('button[type="submit"]');
    f.dataset.part = part;
    // a required field in the hidden part (e.g. the client name) opens that part instead of blocking Save in silence
    f.addEventListener("invalid", ev => { const sec = ev.target.closest("#edForm > div[hidden]"); if (sec) { sec.hidden = false; toast("Fill in the client details first."); } }, true);
    if (part === "quote") {
      [cli, trip, intake].forEach(x => x && (x.hidden = true));
      if (h1) h1.textContent = "Operator quote";
      const c = d.client || {}, legs = ((d.trip || {}).legs || []).map(l => (l.from || "?") + "–" + (l.to || "?") + (l.date ? " " + fmtD(l.date) : "")).join(", ");
      quote && quote.insertAdjacentHTML("beforebegin", `<p class="small" style="margin:0"><b>${esc(c.company || c.name || "Client")}</b> · ${esc(legs)} <button class="btn small" type="button" data-act="edPart" data-part="client">Edit client and trip</button></p>`);
      if (save) save.textContent = "Save the quote";
    } else {
      if (quote) quote.hidden = true;
      if (h1) h1.textContent = isNew ? "New enquiry" : "Client and trip";
      if (save) { save.textContent = isNew ? "Save the enquiry" : "Save"; save.insertAdjacentHTML("afterend", `<span class="small muted" style="align-self:center">Next: ask operators on Avinode; the operator quote is entered when they reply.${isNew ? ` Already have the operator's reply? <button class="btn small" type="button" data-act="edPart" data-part="quote">Enter the operator quote now</button>` : ` <button class="btn small" type="button" data-act="edPart" data-part="quote">Operator quote</button>`}</span>`); }
    }
  };
  document.addEventListener("click", async ev => {
    const b = ev.target.closest && ev.target.closest('[data-act="edPart"],[data-act="editQuote"],[data-act="avCopy"]'); if (!b) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const a = b.dataset.act;
    if (a === "edPart") {   // switch part without losing what was typed: show the other sections
      const f = $("edForm"); if (!f) return; const toQuote = b.dataset.part === "quote";
      const secs = [...f.children].filter(x => x.tagName === "DIV" && (x.querySelector("h3") || x.id === "secIntake"));
      secs.forEach(x => { const h = (x.querySelector("h3") || {}).textContent; x.hidden = toQuote ? h !== "Operator quote" : h === "Operator quote"; });
      b.closest("p, span") && b.closest("p, span").remove(); f.dataset.part = toQuote ? "quote" : "client";
      const h1 = f.querySelector("h1"); if (h1) h1.textContent = toQuote ? "Operator quote" : "Client and trip";
      const s = f.querySelector('button[type="submit"]'); if (s) s.textContent = "Save";
      window.scrollTo(0, 0); return;
    }
    const t = tripById(S.sel); if (!t) return;
    if (a === "editQuote") { openEditor(t, "quote"); return; }
    if (a === "avCopy") {
      const txt = avinodeRequest(t.d);
      try { await navigator.clipboard.writeText(txt); toast("Request copied: paste it into Avinode."); }
      catch(e){ const el = $("avReqText"); if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } toast("Copy is blocked here: the request is selected below, copy it from there."); }
      if (!t.d.avReqAt && t.bid === S.uid) { try { await deskWrite(t, {avReqAt: now()}, "Avinode quote request copied"); } catch(e){} }
    }
  }, true);
})();
