/* ---------- Next steps: one guide per trip, no AI needed (Morten, 27 Oct 2026) ----------
   "It does not suggest what needs to be filled to succeed, so I had to guess." Every trip now shows its steps from
   enquiry to follow-up: what is done, what is missing, who does it, and a button that goes straight to the field.
   The trip form marks the fields needed to send to operations and lists what is still missing as you type.
   "Send to operations" opens only when every needed item is in, so operations gets a complete file the first time. */
(function(){
  const css = document.createElement("style");
  css.textContent = `.ns-steps{display:grid;gap:6px;margin:6px 0 0}.ns-step{border:1px solid var(--line);border-radius:10px;padding:10px 12px}
  .ns-step.now{border-color:var(--steel);box-shadow:0 0 0 1px var(--steel) inset}.ns-step.done{opacity:.75}
  .ns-h{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}.ns-h b{font-size:15px}
  .ns-n{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1px solid var(--line);font-size:12px;margin-right:6px;flex:none}
  .ns-step.done .ns-n{background:var(--ok-soft);border-color:var(--ok);color:var(--ok)}.ns-step.now .ns-n{background:var(--primary-bg);border-color:var(--primary-bg);color:var(--primary-ink);font-weight:700}
  .ns-items{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:4px}.ns-items li{display:flex;gap:8px;align-items:flex-start;font-size:14px;line-height:1.4}
  .ns-items li .ic{flex:none;width:16px;text-align:center;font-weight:700}.ns-items li.ok{color:var(--muted)}.ns-items li.ok .ic{color:var(--ok)}
  .ns-items li.need .ic{color:var(--bad)}.ns-items li.should .ic{color:var(--warn)}
  .ns-go{margin-left:auto;flex:none}.req-star{color:var(--bad);font-weight:700;margin-left:2px}
  #edNeed ul{margin:6px 0 0 18px;padding:0}#edNeed li{margin:2px 0}`;
  document.head.appendChild(css);

  const has = v => v !== undefined && v !== null && String(v).trim() !== "";
  const isMine = t => t.bid === S.uid;
  const docOf = (d, kind) => (d.docs || []).some(x => x.kind === kind);
  
  // what the broker must have in before the trip can go to operations; each item: [ok, text, jump, need]
  function brokerItems(d){
    const c = d.client || {}, q = d.quote || {}, legs = ((d.trip || {}).legs) || [];
    const A = [], B = [];
    A.push([has(c.name), "Client name", "e_cn", true]);
    A.push([has(c.email) || has(c.phone), "Client email or phone", "e_em", true]);
    A.push([has(c.country), "Client's country of residence (for the sanctions check)", "e_ct", true]);
    if (!legs.length) A.push([false, "At least one leg: from, to, date, local time and passengers", "leg|0|from", true]);
    legs.forEach((l, i) => {
      const n = legs.length > 1 ? `Leg ${i + 1}: ` : "Leg: ";
      const miss = [["from", "from"], ["to", "to"], ["date", "date"], ["time", "local time"], ["pax", "passengers"]].filter(([k]) => !has(l[k]));
      A.push([!miss.length, miss.length ? n + miss.map(m => m[1]).join(", ") : n + `${l.from} → ${l.to}, ${l.date} ${l.time}, ${l.pax} pax`, "leg|" + i + "|" + (miss[0] ? miss[0][0] : "from"), true]);
    });
    B.push([has(q.operator), "Operator legal name, as on its AOC", "q_op", true]);
    B.push([has(q.opCountry), "Operator's country (for the cabotage check)", "q_oc", true]);
    B.push([has(q.aircraft), "Aircraft type", "q_ac", true]);
    B.push([has(q.tail), "Registration", "q_tl", false]);
    B.push([num(q.opPrice) > 0, "Operator price", "q_pr", true]);
    return {A, B};
  }
  function checkItems(t){
    const d = t.d, out = [];
    if (typeof tripBlockers === "function" && window.TC_READY !== false) {
      const {red, amberOpen} = tripBlockers(d, t.st);
      out.push([!red.length, red.length ? `Trip checks: ${red.length} red item${red.length > 1 ? "s" : ""} stop the trip` : "Trip checks: nothing red", "sec|secTC", true]);
      out.push([!amberOpen.length, amberOpen.length ? `Trip checks: confirm ${amberOpen.length} amber item${amberOpen.length > 1 ? "s" : ""} with the operator` : "Trip checks: amber items confirmed", "sec|secTC", true]);
    }
    const ck = d.checks || {}, open = BROKER_CHECKS.filter(([k]) => !ck[k]);
    out.push([!open.length, open.length ? `Tick the pre-issue checks (${BROKER_CHECKS.length - open.length} of ${BROKER_CHECKS.length} done)` : `Pre-issue checks: all ${BROKER_CHECKS.length} ticked`, "sec|secChecks", true]);
    const docs = [["AOC", "AOC"], ["Insurance certificate", "insurance certificate"], ["Operator quote", "operator's quote"]], dm = docs.filter(([k]) => !docOf(d, k));
    out.push([!dm.length, dm.length ? "Attach the " + dm.map(x => x[1]).join(", ") : "AOC, insurance and operator's quote attached", "doc|" + (dm[0] || docs[0])[0], false]);
    return out;
  }
  // details the confirmation needs that are not in the trip form (Settings and ticks are covered elsewhere)
  function confItems(t){
    try {
      const ev = CONF.evaluate(confData(t, t.d.conf ? confDraftFrom(t) : confDraftFrom(t), null));
      const skip = /\(Settings\)|Never-sell|risk screen|KYC|AOC on file|insurance on file|Safety audit|Routing and permits|Operator terms|Payment request|Charter price|Operator price|At least one leg|Date on leg|Aircraft type|Operator legal name|Charterer name|Advisor name|^Registration$|Charterer email/i;
      const miss = ev.ch.missing.filter(m => !skip.test(m));
      return {miss, err: ev.ch.err};
    } catch(e){ return {miss: [], err: []}; }
  }

  window.sendNeeds = function(d){
    const {A, B} = brokerItems(d), out = [...A, ...B].filter(x => x[3] && !x[0]).map(x => x[1]);
    const ck = d.checks || {}, open = BROKER_CHECKS.filter(([k]) => !ck[k]).length; if (open) out.push(`${open} pre-issue check${open > 1 ? "s" : ""}`);
    if (typeof tripBlockers === "function") { const {red, amberOpen} = tripBlockers(d, {}); if (red.length) out.push(`${red.length} red trip check${red.length > 1 ? "s" : ""}`); if (amberOpen.length) out.push(`${amberOpen.length} amber trip check${amberOpen.length > 1 ? "s" : ""} to confirm`); }
    return out;
  };
  // the stricter rule: everything operations needs from the broker, so the file is complete the first time
  submitReady = function(d){ return !sendNeeds(d).length; };

  window.tripSteps = function(t){
    const d = t.d, st = t.st || {}, stage = t.stage, {A, B} = brokerItems(d), C = checkItems(t), cf = confItems(t);
    const sent = !["enquiry", "quoted", "returned"].includes(stage) || !!d.submittedAt && stage !== "returned";
    const issued = !!(st.confIssued || st.issuedAt), ap = typeof apOn === "function" && apOn();
    const steps = [
      {title: "Client and trip", who: "Broker", items: A},
      {title: "Operator quote", who: "Broker", items: B},
      {title: "Checks and documents", who: "Broker", items: C},
      {title: "Confirmation details", who: "Broker or operations", items: [[!cf.miss.length, cf.miss.length ? `Still empty on the confirmation (${cf.miss.length}): ${cf.miss.slice(0, 5).join(", ")}${cf.miss.length > 5 ? "…" : ""}` : "Everything the confirmation needs is in", "conf", false]], note: cf.err.length ? cf.err.join(" ") : ""},
      {title: "Send to operations", who: "Broker", items: [[sent, sent ? "Sent to operations" + (d.submittedAt ? " " + fmtT(d.submittedAt) : "") : stage === "returned" ? "Returned by operations: fix the note and send again" : "Press Send to operations", "sec|secSend", true]]},
      {title: "Operations check", who: "Operations", items: [
        [num(st.opPrice) > 0, "Operator price confirmed on Avinode, then Save", "el|o_op", true],
        [!!st.kyc, "Charterer KYC recorded, then Save", "el|o_kyc", true],
        [typeof screenOk === "function" ? screenOk(t, st) : !!st.screen, "Sanctions screening: Screen names now, then Save this screening record", "el|scr_names_" + t.did, true],
        [!!st.paynodeRef, "Payment request reference, then Save", "el|o_pn", true],
        ...(ap ? [[typeof apState === "function" && apState(t).ok, "Owner approval (the owner approves on Today or on this trip)", "sec|secOps", true]] : []),
        [issued, "Confirmation issued", "conf", true]]},
      {title: "Signature and payment", who: "Broker and operations", items: [
        [!!st.sigSentAt || !!st.signed, "Confirmation sent to the charterer for signature", "sec|secSig", true],
        [!!st.signed, "Signed confirmation saved", "sec|secSig", true],
        [!!st.clientPaid, "Client payment recorded", "sec|secOps", true],
        [!!st.operatorPaid, "Operator paid", "sec|secOps", true]]},
      {title: "Flight and follow-up", who: "Operations and broker", items: [
        [!!st.flownDate, "Last leg flown and recorded", "sec|secOps", true],
        [!!d.followUp, "Broker follow-up within 24 hours of landing", "sec|secAfter", true],
        [!!d.ratingReq, "Rating request sent to the client", "sec|secAfter", true]]}
    ];
    steps.forEach(s => s.done = s.items.filter(x => x[3]).every(x => x[0]) && (s.title !== "Confirmation details" || !cf.miss.length || sent));
    // later steps done means earlier ones are done too (data from before these rules)
    for (let i = steps.length - 1; i > 0; i--) if (steps[i].done && i >= 5) for (let j = 0; j < i; j++) steps[j].done = true;
    return steps;
  };

  window.tripNextBlock = function(t){
    if (!t || t.stage === "cancelled") return "";
    const steps = tripSteps(t), cur = steps.findIndex(s => !s.done);
    if (cur < 0) return `<div class="note ok small" id="secNext"><b>All steps done.</b> Paid, flown and followed up.</div>`;
    const r = acting(), staff = isStaff() && r !== "broker", mine = isMine(t);
    const yours = s => (/Broker/.test(s.who) && mine) || (/perations/.test(s.who) && staff && !mine);
    const canGo = (go, s) => { if (/^(e_|q_|leg\|)/.test(go)) return mine && ["enquiry", "quoted", "returned"].includes(t.stage); if (go === "sec|secChecks" || go.startsWith("doc|")) return mine; return true; };
    const goLabel = go => /^(e_|q_|leg\|)/.test(go) ? "Fill in" : go === "conf" ? "Open confirmation" : go.startsWith("doc|") ? "Attach" : "Go there";
    const head = steps[cur], need = head.items.filter(x => !x[0] && x[3]).length;
    const show = steps.map((s, i) => {
      const open = i === cur || (i < cur + 2 && !s.done && i > cur) ;
      const items = (i === cur || (!s.done && i < 4 && cur < 4)) ? `<ul class="ns-items">${s.items.map(x => `<li class="${x[0] ? "ok" : x[3] ? "need" : "should"}"><span class="ic" aria-hidden="true">${x[0] ? "✓" : x[3] ? "•" : "○"}</span><span>${esc(x[1])}${!x[0] && !x[3] ? ' <span class="muted">(recommended)</span>' : ""}</span>${!x[0] && canGo(x[2], s) ? `<button class="btn small ns-go" type="button" data-ns="${esc(x[2])}">${goLabel(x[2])}</button>` : ""}</li>`).join("")}</ul>${s.note ? `<p class="small" style="color:var(--bad);margin:6px 0 0">${esc(s.note)}</p>` : ""}` : "";
      return `<div class="ns-step ${s.done ? "done" : i === cur ? "now" : ""}"><div class="ns-h"><span><span class="ns-n">${s.done ? "✓" : i + 1}</span><b>${esc(s.title)}</b></span><span class="small muted">${esc(s.who)}${i === cur && yours(s) ? ' · <b style="color:var(--steel)">your turn</b>' : ""}</span></div>${s.done && i !== cur ? "" : items}</div>`;
    }).join("");
    const lead = need ? `<p class="small" style="margin:0"><b>Next:</b> ${esc(head.title)} · ${need} item${need > 1 ? "s" : ""} to do · <span class="muted">${esc(head.who)}</span></p>`
      : `<p class="small" style="margin:0"><b>Next:</b> ${esc(head.title)} <span class="muted">(recommended, not required)</span>${cur < 4 && submitReady(t.d) ? " · or press <b>Send to operations</b> now" : ""}</p>`;
    return `<details class="panel" id="secNext" style="padding:14px 16px;margin:8px 0" ${S.nsClosed ? "" : "open"}><summary style="cursor:pointer;list-style:revert"><b>Steps to book this trip</b> <span class="small muted">(${steps.filter(s => s.done).length} of ${steps.length} done)</span></summary>${lead}<div class="ns-steps">${show}</div></details>`;
  };

  // under the Send button: exactly what is still missing
  window.sendMissingNote = function(t){
    const n = sendNeeds(t.d); if (!n.length) return "";
    return `<p class="small" style="margin:4px 0 0"><b>Still needed to send to operations:</b> ${n.map(esc).join(" · ")}. <a href="#secNext" data-ns="sec|secNext">See the steps</a>.</p>`;
  };

  // jump to the place where the missing item is filled in
  function jump(go){
    const t = tripById(S.sel); if (!t) return;
    if (/^(e_|q_|leg\|)/.test(go)) {
      openEditor(t);
      setTimeout(() => {
        let el;
        if (go.startsWith("leg|")) { const [, i, k] = go.split("|"); const row = document.querySelector(`.leg[data-leg="${i}"]`) || document.querySelector(".leg"); el = row && row.querySelector(`[data-l="${k}"]`); }
        else el = $(go);
        if (el) { el.scrollIntoView({block: "center"}); el.focus(); }
      }, 60);
      return;
    }
    if (go === "conf") { const b = document.querySelector('[data-act="openConf"]'); if (b) b.click(); return; }
    if (go.startsWith("doc|")) { const k = go.slice(4), sel = $("docKind"); if (sel) { sel.value = k; sel.scrollIntoView({block: "center"}); const f = $("docFile"); if (f) f.focus(); } return; }
    if (go.startsWith("el|")) { const el = $(go.slice(3)); if (el) { el.scrollIntoView({block: "center", behavior: "smooth"}); setTimeout(() => el.focus({preventScroll: true}), 300); } else toast("That part opens later in the process."); return; }
    if (go.startsWith("sec|")) { const el = $(go.slice(4)); if (el) { if (el.tagName === "DETAILS") el.open = true; el.scrollIntoView({block: "start", behavior: "smooth"}); const f = el.querySelector("input:not([disabled]),button:not([disabled]),textarea,select"); if (f && go !== "sec|secNext") setTimeout(() => f.focus({preventScroll: true}), 300); } else toast("That part opens later in the process."); }
  }
  document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest("[data-ns]"); if (!b) return; ev.preventDefault(); jump(b.dataset.ns); });
  document.addEventListener("toggle", ev => { if (ev.target && ev.target.id === "secNext") S.nsClosed = !ev.target.open; }, true);

  // the trip form: required marks and a live list of what is still missing
  const REQ_IDS = ["e_cn", "e_ct", "q_op", "q_oc", "q_ac", "q_pr"];
  function star(el){ const lab = el && el.closest("label"); if (lab && !lab.querySelector(".req-star")) { const s = document.createElement("span"); s.className = "req-star"; s.textContent = "*"; s.title = "Needed to send to operations"; lab.insertBefore(s, lab.firstChild.nextSibling); } }
  function formBody(){
    const f = $("edForm"); if (!f) return null;
    const v = id => (($(id) || {}).value || "").trim();
    const legs = [...f.querySelectorAll(".leg")].map(r => ({from: r.querySelector('[data-l="from"]').value.trim(), to: r.querySelector('[data-l="to"]').value.trim(), date: r.querySelector('[data-l="date"]').value, time: r.querySelector('[data-l="time"]').value, pax: r.querySelector('[data-l="pax"]').value.trim()})).filter(l => l.from || l.to || l.date);
    return {client: {name: v("e_cn"), email: v("e_em"), phone: v("e_ph"), country: v("e_ct")}, trip: {legs}, quote: {operator: v("q_op"), opCountry: v("q_oc"), aircraft: v("q_ac"), tail: v("q_tl"), opPrice: num(v("q_pr")) || (v("q_cur") && v("q_cur") !== "USD" ? num(v("q_amt")) * num(v("q_rate")) : 0)}};
  }
  function refreshNeed(){
    const f = $("edForm"); if (!f) return;
    REQ_IDS.forEach(id => star($(id))); star($("e_em")); f.querySelectorAll('.leg [data-l]').forEach(star);
    let box = $("edNeed"); if (!box) { box = document.createElement("div"); box.id = "edNeed"; box.className = "note small"; box.setAttribute("aria-live", "polite"); const row = f.querySelector('button[type="submit"]').closest(".row"); row.parentNode.insertBefore(box, row); }
    const b = formBody(), {A, B} = brokerItems(b), miss = [...A, ...B].filter(x => x[3] && !x[0]);
    box.className = "note small " + (miss.length ? "info" : "ok");
    box.innerHTML = miss.length
      ? `<b>Save any time.</b> To send this trip to operations you still need (<span class="req-star">*</span>):<ul>${miss.map(x => `<li>${esc(x[1])}</li>`).join("")}</ul><span class="muted">After saving: tick the pre-issue checks and attach the AOC and insurance on the trip.</span>`
      : `<b>The form is complete.</b> Save, then tick the pre-issue checks and send to operations.`;
  }
  document.addEventListener("input", ev => { if (ev.target.closest && ev.target.closest("#edForm")) refreshNeed(); });
  document.addEventListener("change", ev => { if (ev.target.closest && ev.target.closest("#edForm")) refreshNeed(); });
  const _open = openEditor;
  openEditor = function(t){ _open(t); refreshNeed(); };
  document.addEventListener("click", ev => { if (ev.target.closest && ev.target.closest('#edForm [data-act="addLeg"],#edForm [data-act="delLeg"]')) setTimeout(refreshNeed, 30); });

  // after saving: say what comes next instead of only "Saved"
  const _save = saveEditor;
  saveEditor = async function(f){
    await _save(f);
    if (S.editing) return;   // the save did not go through; its own message stays
    let t = null; for (let k = 0; k < 10 && !(t = tripById(S.sel)); k++) await new Promise(r => setTimeout(r, 100));
    if (!t) return;
    const steps = tripSteps(t), cur = steps.find(s => !s.done);
    const red = typeof tripBlockers === "function" ? tripBlockers(t.d, t.st).red.length : 0;
    if (red) toast(`Saved. ${red} red item${red > 1 ? "s" : ""} in Trip checks stop this trip.`);
    else if (cur) { const n = cur.items.filter(x => !x[0] && x[3]); toast(`Saved. Next: ${cur.title}${n.length ? " – " + n.slice(0, 3).map(x => x[1].split(" (")[0]).join(", ") + (n.length > 3 ? "…" : "") : ""}.`); }
    else toast("Saved");
  };
})();
