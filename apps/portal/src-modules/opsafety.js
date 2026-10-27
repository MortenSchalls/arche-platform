/* ---------- Operator safety standard on every trip (Morten, 27 Oct 2026: "proceed with your proposed rule and ensure
   we can enforce it, otherwise remove"). Manual Module 8.2, 8.3 and 8.5.
   Tier 1, no approval needed: ARGUS Platinum or Platinum Elite, WYVERN Wingman or Wingman PRO, IS-BAO Stage 2 or 3,
     current on the last flight date, checked at the source no more than 14 days ago, link and evidence saved.
   Tier 2, everything else: the director (owner) approves on the trip, all 8.3 checks done, crew minimums confirmed,
     and the client told in writing before signing (the email attached to the trip).
   Every operator: two pilots on every jet flight; passenger liability at least USD 50M (jet) or USD 25M (turboprop);
     five years clear of fatal accidents, serious incidents and sanctions (otherwise director approval); suspended
     operators (after an accident or serious incident, until the director's review) cannot be used.
   Enforced: "Send to operations" stays closed until the record is complete; a breach is a red trip check that also
   blocks approval and issue; the safety-audit tick cannot be set by hand before the record is complete. */
(function(){
  const T1 = {"argus-plat": "ARGUS Platinum", "argus-elite": "ARGUS Platinum Elite", "wyv-wingman": "WYVERN Wingman", "wyv-pro": "WYVERN Wingman PRO", "isbao-2": "IS-BAO Stage 2", "isbao-3": "IS-BAO Stage 3"};
  const T2 = {"argus-gold": "ARGUS Gold", "argus-goldcert": "ARGUS Gold Certified", "isbao-1": "IS-BAO Stage 1", "wyv-reg": "WYVERN Registered (no audit)", "other": "Another audit", "none": "No audit"};
  const LABEL = {...T1, ...T2};
  const MIN_INS = {jet: 50e6, turboprop: 25e6};
  const CREW = {cap: 3000, capType: 250, fo: 1000};
  const CHECKS83 = [["aocAuth", "AOC and aircraft confirmed with the issuing authority or its public register"], ["insInsurer", "Insurance confirmed by the insurer or the operator's insurance broker, not only by a copy"], ["sms", "IS-BAO registration, or the Archē operator questionnaire completed"], ["noAdverse", "No adverse history in public accident databases"], ["refs", "Two references from brokers or clients who have flown with the operator"]];
  const DAY = 864e5, today = () => new Date().toISOString().slice(0, 10);
  const normOp = s => String(s || "").toLowerCase().replace(/\b(ltd|limited|pte|llc|inc|co|corp|plc|sa|ag|gmbh)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const lastDate = d => (((d.trip || {}).legs) || []).map(l => l.date).filter(Boolean).sort().pop() || "";
  const docOf = (d, kind) => (d.docs || []).some(x => x.kind === kind);
  const tripOf = d => { try { return allTrips().find(x => x.d === d) || null; } catch(e){ return null; } };
  const suspended = name => { const n = normOp(name); return n && ((S.opSusp || {}).list || []).find(x => normOp(x.name) === n) || null; };
  const fpOf = d => { const s = d.safety || {}, q = d.quote || {}; return [normOp(q.operator), s.audit || "", s.history || ""].join("|"); };
  const needsApproval = s => !!s && (!!T2[s.audit] || s.history === "event");
  window.safetyApproved = (d, st) => { const a = (st || {}).safetyApproval; return !!a && a.fp === fpOf(d); };

  // what is still missing (blocks "Send to operations")
  window.safetyNeeds = function(d, st){
    const s = d.safety || {}, out = [];
    if (!s.audit) { out.push("operator safety: audit held by the operator"); return out; }
    if (!s.cls) out.push("operator safety: jet or turboprop");
    if (s.cls === "jet" && s.twoPilots !== "yes") out.push("operator safety: two pilots confirmed");
    if (!(Number(s.ins) > 0)) out.push("operator safety: passenger liability insurance amount");
    if (!s.history) out.push("operator safety: five-year accident and sanction history");
    if (T1[s.audit]) {
      if (!s.expiry) out.push("operator safety: audit expiry date");
      if (!s.checkedAt) out.push("operator safety: date the audit was checked at the source");
      if (!/^https:\/\//.test(s.link || "")) out.push("operator safety: link to the auditor's registry entry or certificate");
      if (!docOf(d, "Safety audit")) out.push("operator safety: audit evidence attached (document type Safety audit)");
    } else {
      CHECKS83.forEach(([k]) => { if (!(s.c83 || {})[k]) out.push("operator safety: all five checks for operators below the audit standard"); });
      if (!(s.cap > 0 && s.capType > 0 && s.fo > 0)) out.push("operator safety: crew hours confirmed by the operator");
      if (!s.toldAt || !docOf(d, "Client safety disclosure")) out.push("operator safety: client told in writing (date and email attached as Client safety disclosure)");
    }
    if (needsApproval(s) && !safetyApproved(d, st)) out.push("operator safety: the director's approval on this trip");
    return [...new Set(out)];
  };
  // breaches of the standard (red: stop the trip)
  window.safetyBreaches = function(d){
    const s = d.safety || {}, q = d.quote || {}, out = [];
    const sp = suspended(q.operator); if (sp) out.push(`${esc(q.operator)} is suspended by the director (${esc(fmtD(sp.at))}${sp.note ? ": " + esc(sp.note) : ""}). It cannot be used until the suspension is lifted.`);
    if (s.cls === "jet" && s.twoPilots === "no") out.push("Single-pilot jet flight: Archē requires two pilots on every jet flight (manual 8.2).");
    if (s.cls && Number(s.ins) > 0 && Number(s.ins) < MIN_INS[s.cls]) out.push(`Passenger liability insurance ${usd(Number(s.ins))} is below the minimum of ${usd(MIN_INS[s.cls])} for a ${s.cls} (manual 8.2).`);
    if (T1[s.audit]) {
      const last = lastDate(d);
      if (s.expiry && last && s.expiry < last) out.push(`The ${esc(LABEL[s.audit])} audit expires ${esc(fmtD(s.expiry))}, before the last flight (${esc(fmtD(last))}).`);
      if (s.checkedAt && (Date.now() - new Date(s.checkedAt).getTime()) / DAY > 14 && !["review","issued","clientPaid","flown"].includes(stageOf(d, {}))) out.push(`The audit was checked at the source on ${esc(fmtD(s.checkedAt))}, more than 14 days ago. Check it again and update the date.`);
    } else if (s.audit && (s.cap > 0 || s.capType > 0 || s.fo > 0) && (s.cap < CREW.cap || s.capType < CREW.capType || s.fo < CREW.fo)) {
      out.push(`Crew below the minimums for an operator without an accepted audit: captain ${CREW.cap.toLocaleString("en-US")} hours total and ${CREW.capType} on type, first officer ${CREW.fo.toLocaleString("en-US")} hours (manual 8.3).`);
    }
    return out;
  };
  // red items join the trip checks, so the existing gates (send, approve, issue) stop the trip
  const _tc = window.tripChecks;
  if (_tc) window.tripChecks = function(d, st){ return _tc(d, st).concat(safetyBreaches(d).map((text, i) => ({key: "safety|" + i, sev: "red", leg: null, text}))); };
  // the send list includes the safety record
  const _sn = window.sendNeeds;
  window.sendNeeds = function(d){ const t = tripOf(d); return _sn(d).concat(safetyNeeds(d, t ? t.st : {})); };

  function watch(){ if (S.opSuspW || typeof watchDoc !== "function") return; S.opSuspW = true; try { watchDoc("config/opsuspend", snap => { S.opSusp = snap.exists ? snap.data() : {list: []}; render(); }); } catch(e){} }

  window.safetyBlock = function(t){
    watch();
    const d = t.d, st = t.st || {}, s = d.safety || {}, q = d.quote || {};
    const mine = t.bid === S.uid, locked = ["review","issued","clientPaid","flown","cancelled"].includes(t.stage);
    const can = mine && !locked;
    const dis = can ? "" : "disabled";
    const tier = T1[s.audit] ? 1 : s.audit ? 2 : 0;
    const needs = safetyNeeds(d, st), red = safetyBreaches(d);
    const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${v === k ? "selected" : ""}>${esc(l)}</option>`).join("");
    const head = red.length ? `<div class="note bad small">${red.map(x => `<div>${x}</div>`).join("")}</div>`
      : needs.length ? `<div class="note warn small"><b>Still needed:</b> ${needs.map(x => esc(x.replace("operator safety: ", ""))).join(" · ")}</div>`
      : `<div class="note ok small"><b>Meets the standard</b>${tier === 1 ? ` · ${esc(LABEL[s.audit])}, expires ${esc(fmtD(s.expiry))}, checked ${esc(fmtD(s.checkedAt))}` : ` · approved by the director ${esc(fmtT((st.safetyApproval || {}).at))}`}</div>`;
    const t1 = tier === 1 ? `<div class="fgrid">
      <label class="f" for="sf_exp">Audit expiry date<input type="date" id="sf_exp" data-sf="expiry" value="${esc(s.expiry || "")}" ${dis}></label>
      <label class="f" for="sf_chk">Checked at the source on<input type="date" id="sf_chk" data-sf="checkedAt" value="${esc(s.checkedAt || "")}" max="${today()}" ${dis}></label>
      <label class="f wide" for="sf_link">Link to the auditor's registry entry or certificate<input id="sf_link" data-sf="link" value="${esc(s.link || "")}" placeholder="https://" ${dis}></label></div>
      <p class="small muted">Check the operator in the auditor's own registry (ARGUS registry, WYVERN Wingman directory, IS-BAO certificate) for the AOC that flies this trip. Attach a screenshot or the certificate as document type "Safety audit".</p>` : "";
    const t2 = tier === 2 ? `<p class="small"><b>Below the audit standard (manual 8.3).</b> Allowed only with the director's approval, all five checks, the crew minimums and the client told in writing before signing.</p>
      ${CHECKS83.map(([k, l]) => `<label class="check" for="sf83_${k}"><input type="checkbox" id="sf83_${k}" data-sf83="${k}" ${(s.c83 || {})[k] ? "checked" : ""} ${dis}><span>${esc(l)}</span></label>`).join("")}
      <div class="fgrid">
      <label class="f" for="sf_cap">Captain: total hours<input id="sf_cap" inputmode="numeric" data-sfn="cap" value="${esc(s.cap || "")}" ${dis}></label>
      <label class="f" for="sf_capt">Captain: hours on type<input id="sf_capt" inputmode="numeric" data-sfn="capType" value="${esc(s.capType || "")}" ${dis}></label>
      <label class="f" for="sf_fo">First officer: total hours<input id="sf_fo" inputmode="numeric" data-sfn="fo" value="${esc(s.fo || "")}" ${dis}></label>
      <label class="f" for="sf_told">Client told in writing on<input type="date" id="sf_told" data-sf="toldAt" value="${esc(s.toldAt || "")}" max="${today()}" ${dis}></label></div>
      <p class="small muted">Tell the client which audit the operator holds, or that it holds none, and attach the email as document type "Client safety disclosure".</p>` : "";
    const appr = needsApproval(s) ? (safetyApproved(d, st) ? `<p class="small">Approved by the director ${esc(fmtT(st.safetyApproval.at))}: ${esc(st.safetyApproval.note || "")}</p>`
      : (S.isOwner && acting() === "owner" ? `<div class="fgrid"><label class="f wide" for="sf_apn">Director: why this operator is acceptable for this trip<input id="sf_apn" placeholder="e.g. IS-BAO Stage 1 renewed 2026, references from two brokers, crew hours confirmed"></label></div><div class="row"><button class="btn small primary" type="button" data-sfa="approve">Approve this operator for this trip</button></div>`
        : `<p class="small muted">Waiting for the director's approval on this trip.</p>`)) : "";
    const sp = suspended(q.operator);
    const susp = S.isOwner && acting() === "owner" && q.operator ? (sp ? `<div class="row"><button class="btn small" type="button" data-sfa="unsuspend">Lift the suspension of ${esc(q.operator)}</button></div>`
      : `<details class="small" style="margin-top:8px"><summary>Suspend this operator (after an accident or serious incident)</summary><div class="fgrid"><label class="f wide" for="sf_sn">Reason<input id="sf_sn"></label></div><button class="btn small danger" type="button" data-sfa="suspend">Suspend ${esc(q.operator)} on every trip</button></details>`) : "";
    return `<div class="panel" id="secSafety" style="padding:16px;margin:8px 0"><h3 style="margin-top:0">Operator safety${q.operator ? " · " + esc(q.operator) : ""}</h3>${head}
      <div class="fgrid">
      <label class="f" for="sf_aud">Audit held by the operator (for the AOC that flies this trip)<select id="sf_aud" data-sf="audit" ${dis}><option value="">Choose</option><optgroup label="Accepted (manual 8.2)">${opt(T1, s.audit)}</optgroup><optgroup label="Director approval needed (manual 8.3)">${opt(T2, s.audit)}</optgroup></select></label>
      <label class="f" for="sf_cls">Aircraft<select id="sf_cls" data-sf="cls" ${dis}><option value="">Choose</option><option value="jet" ${s.cls === "jet" ? "selected" : ""}>Jet</option><option value="turboprop" ${s.cls === "turboprop" ? "selected" : ""}>Turboprop</option></select></label>
      <label class="f" for="sf_2p">Two pilots on every flight, confirmed by the operator<select id="sf_2p" data-sf="twoPilots" ${dis}><option value="">Choose</option><option value="yes" ${s.twoPilots === "yes" ? "selected" : ""}>Yes, in writing</option><option value="no" ${s.twoPilots === "no" ? "selected" : ""}>No, single pilot</option></select></label>
      <label class="f" for="sf_ins">Passenger liability insurance (USD)<input id="sf_ins" inputmode="numeric" data-sfn="ins" value="${esc(s.ins || "")}" placeholder="e.g. 50000000" ${dis}></label>
      <label class="f" for="sf_hist">Last five years: fatal accident, serious incident or sanction?<select id="sf_hist" data-sf="history" ${dis}><option value="">Choose</option><option value="clear" ${s.history === "clear" ? "selected" : ""}>None found (databases checked, operator confirms)</option><option value="event" ${s.history === "event" ? "selected" : ""}>Yes: needs the director's approval</option></select></label>
      </div>${t1}${t2}${appr}${susp}
      <p class="small muted">Minimums for every operator: two pilots on every jet flight; insurance at least USD 50 million (jet) or 25 million (turboprop); five years clear, otherwise the director decides. Manual Module 8.</p></div>`;
  };

  async function save(t, patch, line){ const s = {...(t.d.safety || {}), ...patch, at: now()}; await deskWrite(t, {safety: s}, line); }
  document.addEventListener("change", async e => {
    const el = e.target; if (!el.closest || !el.closest("#secSafety")) return;
    const t = tripById(S.sel); if (!t) return;
    try {
      if (el.dataset.sf) await save(t, {[el.dataset.sf]: el.value.trim()}, `Operator safety: ${el.dataset.sf} ${el.dataset.sf === "audit" ? LABEL[el.value] || "" : ""}`.trim());
      else if (el.dataset.sfn) await save(t, {[el.dataset.sfn]: Math.max(0, Math.round(num(el.value)))}, `Operator safety: ${el.dataset.sfn} updated`);
      else if (el.dataset.sf83) await save(t, {c83: {...((t.d.safety || {}).c83 || {}), [el.dataset.sf83]: el.checked}}, `Operator safety: check ${el.dataset.sf83} ${el.checked ? "done" : "undone"}`);
    } catch(err){ toast("Could not save. Try again."); }
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-sfa]"); if (!b) return;
    const t = tripById(S.sel); if (!t || !(S.isOwner && acting() === "owner")) return;
    const q = t.d.quote || {}, a = b.dataset.sfa;
    try {
      if (a === "approve") { const note = (($("sf_apn") || {}).value || "").trim(); if (note.length < 15) { toast("Write why the operator is acceptable (at least 15 characters)."); return; }
        await statusWrite(t, {safetyApproval: {fp: fpOf(t.d), by: S.uid, at: now(), note, audit: (t.d.safety || {}).audit || ""}}, `Operator approved below the audit standard: ${q.operator || ""} (${LABEL[(t.d.safety || {}).audit] || ""}). ${note}`);
        audit("Operator approved below the audit standard", `${q.operator || ""} · ${(t.st || {}).ref || t.did} · ${note.slice(0, 80)}`); toast("Approved for this trip."); return; }
      const cur = (S.opSusp && S.opSusp.list) || [];
      if (a === "suspend") { const note = (($("sf_sn") || {}).value || "").trim(); if (note.length < 10) { toast("Write the reason (at least 10 characters)."); return; }
        await S.db.doc("config/opsuspend").set({list: [...cur.filter(x => normOp(x.name) !== normOp(q.operator)), {name: q.operator, at: now(), by: S.uid, note}]});
        audit("Operator suspended", `${q.operator} · ${note.slice(0, 80)}`); toast(`${q.operator} is suspended on every trip.`); return; }
      if (a === "unsuspend") { await S.db.doc("config/opsuspend").set({list: cur.filter(x => normOp(x.name) !== normOp(q.operator))}); audit("Operator suspension lifted", q.operator || ""); toast("Suspension lifted."); return; }
    } catch(err){ toast("Could not save. Try again."); }
  });
  // the safety-audit tick follows the record: it cannot be ticked by hand before the record is complete
  document.addEventListener("change", e => {
    const el = e.target; if (!el.dataset || el.dataset.ck !== "audit" || !el.checked) return;
    const t = tripById(S.sel); if (!t) return;
    const n = safetyNeeds(t.d, t.st), r = safetyBreaches(t.d);
    if (n.length || r.length) { el.checked = false; e.stopImmediatePropagation(); toast("Complete the Operator safety record first: " + (r.length ? "it shows a red item" : n[0].replace("operator safety: ", "")) + "."); const s = $("secSafety"); if (s) s.scrollIntoView({block: "start", behavior: "smooth"}); }
  }, true);
  // operations cannot approve or issue a trip whose record is not complete
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest('[data-ap="ok"],[data-act="confIssue"],[data-act="issue"]'); if (!b) return;
    const t = b.dataset.ap ? (() => { const [bid, did] = (b.dataset.id || "").split("|"); return allTrips().find(x => x.bid === bid && x.did === did); })() : tripById(S.sel);
    if (!t) return; const n = safetyNeeds(t.d, t.st);
    if (n.length) { e.stopImmediatePropagation(); e.preventDefault(); toast("Operator safety record not complete: " + n.map(x => x.replace("operator safety: ", "")).join(", ") + "."); }
  }, true);
})();
