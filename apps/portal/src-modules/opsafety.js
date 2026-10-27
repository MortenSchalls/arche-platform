/* ---------- Operator safety standard on every trip (Morten, 27 Oct 2026: "proceed with your proposed rule and ensure
   we can enforce it, otherwise remove"). Manual Module 8.2, 8.3 and 8.5.
   Tier 1, no approval needed: ARGUS Platinum or Platinum Elite, WYVERN Wingman or Wingman PRO, IS-BAO Stage 2 or 3,
     current on the last flight date, checked at the source no more than 14 days ago, link and evidence saved.
   Tier 2, everything else (Morten, 27 Oct 2026, manual 8.3): an Archē-approved operator (the director approves the
     operator once, for twelve months, after the 8.3 checks; list in config/opapproved), or the director's approval for
     that one trip after the same checks and the crew hours. Every quote and confirmation carries one safety line
     (safetyLine), so the client always sees the audit or the approval; no separate disclosure email.
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
  const CHECKS12 = [["docs", "Safety documents reviewed (safety management manual, training and maintenance records), with a visit where practical"], ["crew", "The operator's written commitment that every crew flying our trips meets the crew minimums"]];
  const CHECKS83 = [["aocAuth", "AOC and aircraft confirmed with the issuing authority or its public register"], ["insInsurer", "Insurance confirmed by the insurer or the operator's insurance broker, not only by a copy"], ["sms", "IS-BAO registration, or the Archē operator questionnaire completed"], ["noAdverse", "No adverse history in public accident databases"], ["refs", "Two references from brokers or clients who have flown with the operator"]];
  const DAY = 864e5, today = () => new Date().toISOString().slice(0, 10);
  const normOp = s => String(s || "").toLowerCase().replace(/\b(ltd|limited|pte|llc|inc|co|corp|plc|sa|ag|gmbh)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const lastDate = d => (((d.trip || {}).legs) || []).map(l => l.date).filter(Boolean).sort().pop() || "";
  const docOf = (d, kind) => (d.docs || []).some(x => x.kind === kind);
  const tripOf = d => { try { return allTrips().find(x => x.d === d) || null; } catch(e){ return null; } };
  const suspended = name => { const n = normOp(name); return n && ((S.opSusp || {}).list || []).find(x => normOp(x.name) === n) || null; };
  const longD = iso => iso ? new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-GB", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}) : "";
  const plusYear = () => { const x = new Date(); x.setUTCFullYear(x.getUTCFullYear() + 1); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };
  // Archē-approved operators (config/opapproved): {state: "none"|"valid"|"expires"|"expired", e}
  const approvedOp = d => { const n = normOp((d.quote || {}).operator); if (!n) return {state: "none"};
    const e = ((S.opAppr || {}).list || []).find(x => normOp(x.name) === n); if (!e) return {state: "none"};
    const last = lastDate(d) || today(); return {state: e.until >= last ? "valid" : e.until >= today() ? "expires" : "expired", e}; };
  window.approvedOperator = approvedOp;
  const fpOf = d => { const s = d.safety || {}, q = d.quote || {}; return [normOp(q.operator), s.audit || "", s.history || "", regMismatch(d) ? "reg" : ""].join("|"); };
  // the auditors' own registries (jobs/audits.mjs → api/auditcheck.mjs): a level the registry does not confirm needs the director
  const REG = {"argus-plat": ["ARGUS", "Platinum"], "argus-elite": ["ARGUS", "Platinum Elite"], "wyv-wingman": ["WYVERN", "Wingman"], "wyv-pro": ["WYVERN", "Wingman"]};   // the WYVERN directory lists Wingman and Wingman PRO together (both tier 1)
  const RANK = {"Gold": 1, "Gold Certified": 2, "Platinum": 3, "Platinum Elite": 4, "Wingman": 3, "Wingman PRO": 4};
  S.regc = S.regc || {};
  function regFetch(name){
    const k = normOp(name); if (!k || S.regc[k]) return;
    S.regc[k] = {status: "loading"};
    (async () => {
      try { const sess = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
        const r = await fetch("/api/auditcheck", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + (sess ? sess.access_token : "")}, body: JSON.stringify({name})});
        const j = await r.json(); S.regc[k] = r.ok ? {status: "ok", ...j} : {status: "unavailable", error: j.error || r.status}; }
      catch(e){ S.regc[k] = {status: "unavailable", error: String(e.message || e)}; }
      render();
    })();
  }
  // {state: "na"|"loading"|"unread"|"confirmed"|"mismatch", text}
  window.safetyRegistry = function(d){
    const s = d.safety || {}, q = d.quote || {}, map = REG[s.audit];
    if (!map || !q.operator) return {state: "na"};
    const k = normOp(q.operator); regFetch(q.operator); const r = S.regc[k] || {status: "loading"};
    if (r.status === "loading") return {state: "loading", text: "Checking the " + map[0] + " registry…"};
    const src = r.status === "ok" ? (r.sources || {})[map[0]] : null;
    if (!src || !src.ok) return {state: "unread", text: `The ${map[0]} registry could not be read automatically${r.error ? " (" + r.error + ")" : ""}. Your own registry check, link and evidence are the proof.`};
    const hits = (r.matches || []).filter(m => m.prog === map[0]);
    const best = hits.sort((a, b) => (RANK[b.level] || 0) - (RANK[a.level] || 0))[0];
    if (best && (RANK[best.level] || 0) >= (RANK[map[1]] || 9)) return {state: "confirmed", text: `${map[0]} registry (read ${fmtD(src.readAt || r.at)}): ${best.name}, ${best.level}.`, url: src.url};
    return {state: "mismatch", text: best ? `${map[0]} registry (read ${fmtD(src.readAt || r.at)}) lists ${best.name} as ${best.level}, not ${map[1]}.` : `${map[0]} registry (read ${fmtD(src.readAt || r.at)}) does not list ${q.operator}. The name may differ from the AOC holder's.`};
  };
  const regMismatch = d => safetyRegistry(d).state === "mismatch";
  const needsApproval = (s, d) => !!s && ((!!T2[s.audit] && !(d && approvedOp(d).state === "valid")) || s.history === "event" || (!!d && regMismatch(d)));
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
      const ap = approvedOp(d);
      if (ap.state !== "valid") {
        if (ap.state === "expires") out.push(`operator safety: the Archē approval of this operator ends ${fmtD(ap.e.until)}, before the last flight; the director renews it or approves this trip`);
        CHECKS83.forEach(([k]) => { if (!(s.c83 || {})[k]) out.push("operator safety: all five checks for operators below the audit standard"); });
        if (!(s.cap > 0 && s.capType > 0 && s.fo > 0)) out.push("operator safety: crew hours confirmed by the operator");
      }
    }
    if (T1[s.audit]) { const rg = safetyRegistry(d); if (rg.state === "loading") out.push("operator safety: registry check in progress"); }
    if (needsApproval(s, d) && !safetyApproved(d, st)) out.push(regMismatch(d) ? "operator safety: the registry does not confirm the audit; the director must check the evidence and approve" : "operator safety: the director's approval on this trip");
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
    } else if (s.audit && approvedOp(d).state !== "valid" && (s.cap > 0 || s.capType > 0 || s.fo > 0) && (s.cap < CREW.cap || s.capType < CREW.capType || s.fo < CREW.fo)) {
      out.push(`Crew below the minimums for an operator without an accepted audit: captain ${CREW.cap.toLocaleString("en-US")} hours total and ${CREW.capType} on type, first officer ${CREW.fo.toLocaleString("en-US")} hours (manual 8.3).`);
    }
    return out;
  };
  // one line for the quote and the charter confirmation (manual 8.3): the client always sees the audit or our approval
  window.safetyLine = function(d, st){
    const s = d.safety || {}; if (!s.audit) return "";
    if (T1[s.audit]) return `${LABEL[s.audit]}${s.expiry ? ", valid to " + longD(s.expiry) : ""}`;
    const held = s.audit === "none" ? "the operator holds no ARGUS, WYVERN or IS-BAO audit" : `the operator holds ${LABEL[s.audit].replace(/ \(no audit\)$/, "")}, below our audit standard`;
    const ap = approvedOp(d);
    if (ap.state === "valid") return `Archē-approved operator, approval valid to ${longD(ap.e.until)} (our own review; ${held})`;
    if (safetyApproved(d, st)) return `Approved by Archē's director for this trip (our own review; ${held})`;
    return "";
  };
  // red items join the trip checks, so the existing gates (send, approve, issue) stop the trip
  const _tc = window.tripChecks;
  if (_tc) window.tripChecks = function(d, st){ return _tc(d, st).concat(safetyBreaches(d).map((text, i) => ({key: "safety|" + i, sev: "red", leg: null, text}))); };
  // the send list includes the safety record
  const _sn = window.sendNeeds;
  window.sendNeeds = function(d){ const t = tripOf(d); return _sn(d).concat(safetyNeeds(d, t ? t.st : {})); };

  function watch(){ if (S.opSuspW || typeof watchDoc !== "function") return; S.opSuspW = true;
    try { watchDoc("config/opsuspend", snap => { S.opSusp = snap.exists ? snap.data() : {list: []}; render(); }); } catch(e){}
    try { watchDoc("config/opapproved", snap => { S.opAppr = snap.exists ? snap.data() : {list: []}; render(); }); } catch(e){} }
  window.opSafetyWatch = watch;

  window.safetyBlock = function(t){
    watch();
    const d = t.d, st = t.st || {}, s = d.safety || {}, q = d.quote || {};
    const mine = t.bid === S.uid, locked = ["review","issued","clientPaid","flown","cancelled"].includes(t.stage);
    const can = mine && !locked;
    const dis = can ? "" : "disabled";
    const tier = T1[s.audit] ? 1 : s.audit ? 2 : 0;
    const needs = safetyNeeds(d, st), red = safetyBreaches(d), apS = approvedOp(d);
    const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${v === k ? "selected" : ""}>${esc(l)}</option>`).join("");
    const head = red.length ? `<div class="note bad small">${red.map(x => `<div>${x}</div>`).join("")}</div>`
      : needs.length ? `<div class="note warn small"><b>Still needed:</b> ${needs.map(x => esc(x.replace("operator safety: ", ""))).join(" · ")}</div>`
      : `<div class="note ok small"><b>Meets the standard</b>${tier === 1 ? ` · ${esc(LABEL[s.audit])}, expires ${esc(fmtD(s.expiry))}, checked ${esc(fmtD(s.checkedAt))}` : apS.state === "valid" ? ` · Archē-approved operator, approval valid to ${esc(fmtD(apS.e.until))}` : ` · approved by the director ${esc(fmtT((st.safetyApproval || {}).at))}`}</div>`;
    const line = safetyLine(d, st);
    const lineBox = line ? `<div class="note info small"><b>Safety line for your quote and the confirmation:</b> <span id="sfLine">${esc(line)}</span> <button class="btn small" type="button" data-sfcopy="1">Copy</button></div>` : "";
    const rg = safetyRegistry(d);
    const regLine = rg.state === "na" ? "" : `<div class="note ${rg.state === "confirmed" ? "ok" : rg.state === "mismatch" ? "bad" : "info"} small">${esc(rg.text || "")}${rg.state === "confirmed" && can && (s.checkedAt !== today() || s.link !== rg.url) ? ` <button class="btn small" type="button" data-sfr="use">Use this check (today, registry link)</button>` : ""}</div>`;
    const t1 = tier === 1 ? regLine + `<div class="fgrid">
      <label class="f" for="sf_exp">Audit expiry date<input type="date" id="sf_exp" data-sf="expiry" value="${esc(s.expiry || "")}" ${dis}></label>
      <label class="f" for="sf_chk">Checked at the source on<input type="date" id="sf_chk" data-sf="checkedAt" value="${esc(s.checkedAt || "")}" max="${today()}" ${dis}></label>
      <label class="f wide" for="sf_link">Link to the auditor's registry entry or certificate<input id="sf_link" data-sf="link" value="${esc(s.link || "")}" placeholder="https://" ${dis}></label></div>
      <p class="small muted">Check the operator in the auditor's own registry (ARGUS registry, WYVERN Wingman directory, IS-BAO certificate) for the AOC that flies this trip. Attach a screenshot or the certificate as document type "Safety audit".</p>` : "";
    const owner = S.isOwner && acting() === "owner";
    const ck = ([k, l], extra) => `<label class="check" for="sf83_${k}"><input type="checkbox" id="sf83_${k}" data-sf83="${k}" ${(s.c83 || {})[k] ? "checked" : ""} ${dis}><span>${esc(l)}${extra || ""}</span></label>`;
    const t2 = tier !== 2 ? "" : apS.state === "valid" ? `<p class="small"><b>Archē-approved operator</b> (manual 8.3): approved by the director ${esc(fmtD(apS.e.at))}, valid to ${esc(fmtD(apS.e.until))}${apS.e.note ? ". " + esc(apS.e.note) : ""}. The per-trip checks above still apply.</p>`
      : `<p class="small"><b>Below the audit standard (manual 8.3).</b> ${apS.state === "expires" ? `The Archē approval of this operator ends ${esc(fmtD(apS.e.until))}, before the last flight. ` : apS.state === "expired" ? `The Archē approval of this operator ended ${esc(fmtD(apS.e.until))}. ` : ""}The director approves this trip after the five checks and the crew hours, or approves the operator for twelve months (two more checks).</p>
      ${CHECKS83.map(c => ck(c)).join("")}
      <div class="fgrid">
      <label class="f" for="sf_cap">Captain: total hours<input id="sf_cap" inputmode="numeric" data-sfn="cap" value="${esc(s.cap || "")}" ${dis}></label>
      <label class="f" for="sf_capt">Captain: hours on type<input id="sf_capt" inputmode="numeric" data-sfn="capType" value="${esc(s.capType || "")}" ${dis}></label>
      <label class="f" for="sf_fo">First officer: total hours<input id="sf_fo" inputmode="numeric" data-sfn="fo" value="${esc(s.fo || "")}" ${dis}></label></div>
      <p class="small muted" style="margin-bottom:4px">For a twelve-month approval, also:</p>
      ${CHECKS12.map(c => ck(c)).join("")}`;
    const appr = needsApproval(s, d) ? (safetyApproved(d, st) ? `<p class="small">Approved by the director ${esc(fmtT(st.safetyApproval.at))}: ${esc(st.safetyApproval.note || "")}</p>`
      : (owner ? `<div class="fgrid"><label class="f wide" for="sf_apn">Director: why this operator is acceptable<input id="sf_apn" placeholder="e.g. IS-BAO Stage 1 renewed 2026, references from two brokers, crew hours confirmed"></label></div><div class="row"><button class="btn small primary" type="button" data-sfa="approve">Approve for this trip</button>${tier === 2 && s.history !== "event" ? ` <button class="btn small" type="button" data-sfa="approve12">Approve ${esc(q.operator || "the operator")} for twelve months</button>` : ""}</div>`
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
      </div>${t1}${t2}${appr}${lineBox}${susp}
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
    const b = e.target.closest && e.target.closest("[data-sfr]"); if (!b) return;
    const t = tripById(S.sel); if (!t) return; const rg = safetyRegistry(t.d); if (rg.state !== "confirmed") return;
    try { await save(t, {checkedAt: today(), link: rg.url, regAt: (S.regc[normOp((t.d.quote || {}).operator)] || {}).at || ""}, "Operator safety: audit confirmed in the auditor's registry"); toast("Registry check recorded. Attach a screenshot of the entry as \"Safety audit\"."); } catch(err){ toast("Could not save."); }
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-sfa]"); if (!b) return;
    const t = tripById(S.sel); if (!t || !(S.isOwner && acting() === "owner")) return;
    const q = t.d.quote || {}, a = b.dataset.sfa;
    try {
      if (a === "approve") { const note = (($("sf_apn") || {}).value || "").trim(); if (note.length < 15) { toast("Write why the operator is acceptable (at least 15 characters)."); return; }
        await statusWrite(t, {safetyApproval: {fp: fpOf(t.d), by: S.uid, at: now(), note, audit: (t.d.safety || {}).audit || ""}}, `Operator approved below the audit standard: ${q.operator || ""} (${LABEL[(t.d.safety || {}).audit] || ""}). ${note}`);
        audit("Operator approved below the audit standard", `${q.operator || ""} · ${(t.st || {}).ref || t.did} · ${note.slice(0, 80)}`); toast("Approved for this trip."); return; }
      if (a === "approve12") { const note = (($("sf_apn") || {}).value || "").trim(); if (note.length < 15) { toast("Write why the operator is acceptable (at least 15 characters)."); return; }
        const s = t.d.safety || {}; const miss = [...CHECKS83, ...CHECKS12].filter(([k]) => !(s.c83 || {})[k]);
        if (miss.length) { toast("Tick all seven checks first (five checks and the two for a twelve-month approval)."); return; }
        await opApprove({name: q.operator, audit: s.audit || "", note, checks: Object.fromEntries([...CHECKS83, ...CHECKS12].map(([k]) => [k, true])), trip: (t.st || {}).ref || t.did}); return; }
      const cur = (S.opSusp && S.opSusp.list) || [];
      if (a === "suspend") { const note = (($("sf_sn") || {}).value || "").trim(); if (note.length < 10) { toast("Write the reason (at least 10 characters)."); return; }
        await S.db.doc("config/opsuspend").set({list: [...cur.filter(x => normOp(x.name) !== normOp(q.operator)), {name: q.operator, at: now(), by: S.uid, note}]});
        audit("Operator suspended", `${q.operator} · ${note.slice(0, 80)}`);
        const apl = (S.opAppr || {}).list || []; if (apl.some(x => normOp(x.name) === normOp(q.operator))) { await S.db.doc("config/opapproved").set({list: apl.filter(x => normOp(x.name) !== normOp(q.operator))}); audit("Operator approval ended (suspended)", q.operator); }
        toast(`${q.operator} is suspended on every trip.`); return; }
      if (a === "unsuspend") { await S.db.doc("config/opsuspend").set({list: cur.filter(x => normOp(x.name) !== normOp(q.operator))}); audit("Operator suspension lifted", q.operator || ""); toast("Suspension lifted."); return; }
    } catch(err){ toast("Could not save. Try again."); }
  });
  // Archē-approved operators: the director approves an operator once, for twelve months (manual 8.3)
  async function opApprove(e){
    const list = ((S.opAppr || {}).list || []).filter(x => normOp(x.name) !== normOp(e.name));
    const entry = {name: e.name, audit: e.audit || "", note: e.note, checks: e.checks, at: now(), by: S.uid, until: e.until || plusYear(), trip: e.trip || ""};
    await S.db.doc("config/opapproved").set({list: [...list, entry]}); S.opAppr = {list: [...list, entry]};
    audit("Operator approved for twelve months", `${e.name} · until ${entry.until} · ${e.note.slice(0, 80)}`); toast(`${e.name} is an Archē-approved operator until ${fmtD(entry.until)}.`); render();
  }
  function apPanel(){
    if (!S.isOwner || acting() !== "owner") return ""; watch();
    const list = [...((S.opAppr || {}).list || [])].sort((a, b) => a.name.localeCompare(b.name)), t = today(), soon = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10);
    const rows = list.map(e => `<div class="flag"><span class="sev ${e.until < t ? "high" : e.until <= soon ? "med" : "low"}" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc(e.name)}</b> · ${esc(LABEL[e.audit] || "audit not recorded")} · ${e.until < t ? "ended" : "valid to"} ${esc(fmtD(e.until))}</p><p class="small muted">Approved ${esc(fmtD(e.at))}${e.trip ? " from trip " + esc(e.trip) : ""}. ${esc(e.note || "")}</p><div class="row" style="margin-top:6px"><button class="btn small" type="button" data-apw="${esc(e.name)}">Withdraw</button></div></div></div>`).join("");
    const form = `<details class="small" style="margin-top:10px"><summary>Approve an operator without a trip</summary><div class="fgrid"><label class="f wide" for="ap_name">Operator (legal name on the AOC)<input id="ap_name"></label><label class="f" for="ap_aud">Audit held<select id="ap_aud"><option value="">Choose</option>${Object.entries(T2).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select></label><label class="f wide" for="ap_note">Why it is acceptable<input id="ap_note"></label></div>
      ${[...CHECKS83, ...CHECKS12].map(([k, l]) => `<label class="check" for="ap_${k}"><input type="checkbox" id="ap_${k}" data-apck="${k}"><span>${esc(l)}</span></label>`).join("")}
      <button class="btn small primary" type="button" data-apadd="1">Approve for twelve months</button></details>`;
    return `<div class="panel" style="margin-bottom:16px"><h2>Archē-approved operators</h2><p class="small muted">Operators without an accepted audit that you have approved for twelve months after the checks in manual 8.3. Brokers can quote them like an audited operator; every quote and confirmation says "Archē-approved operator". An approval ends early if you withdraw it or suspend the operator.</p>${rows || `<p class="small muted">None yet.</p>`}${form}</div>`;
  }
  document.addEventListener("click", async e => {
    const w = e.target.closest && e.target.closest("[data-apw]"), add = e.target.closest && e.target.closest("[data-apadd]");
    if ((!w && !add) || !S.isOwner || acting() !== "owner") return;
    try {
      if (w) { const name = w.dataset.apw; if (!confirm(`Withdraw the approval of ${name}? Its trips then need the director's approval again.`)) return;
        await S.db.doc("config/opapproved").set({list: ((S.opAppr || {}).list || []).filter(x => x.name !== name)}); audit("Operator approval withdrawn", name); toast("Approval withdrawn."); return; }
      const name = (($("ap_name") || {}).value || "").trim(), aud = ($("ap_aud") || {}).value || "", note = (($("ap_note") || {}).value || "").trim();
      const checks = Object.fromEntries([...document.querySelectorAll("[data-apck]")].map(x => [x.dataset.apck, x.checked]));
      if (name.length < 3 || !aud || note.length < 15) { toast("Fill in the operator, the audit it holds and why it is acceptable (at least 15 characters)."); return; }
      if (Object.values(checks).some(v => !v)) { toast("Tick all seven checks first."); return; }
      await opApprove({name, audit: aud, note, checks});
    } catch(err){ toast("Could not save. Try again."); }
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-sfcopy]"); if (!b) return;
    const txt = ($("sfLine") || {}).textContent || ""; try { await navigator.clipboard.writeText(txt); toast("Safety line copied."); } catch(err){ toast("Select the line and copy it."); }
  });
  // Team → Audit watch: the daily audit job's registry status and any change in how ARGUS, WYVERN or IBAC describe their levels
  S.aw = S.aw || {};
  function awLoad(){ if (S.aw.loading || S.aw.loaded || !S.isOwner) return; S.aw.loading = true;
    Promise.all([S.db.doc("intel/audit-programmes").get().then(x => { S.aw.prog = x.exists ? x.data() : null; }, () => {}), S.db.doc("intel/audit-registries").get().then(x => { S.aw.reg = x.exists ? x.data() : null; }, () => {})])
      .finally(() => { S.aw.loading = false; S.aw.loaded = true; render(); }); }
  function awPanel(){
    if (!S.isOwner || acting() !== "owner") return ""; awLoad();
    const P = S.aw.prog, R = S.aw.reg;
    const head = `<div class="panel" style="margin-bottom:16px"><h2>Audit watch</h2><p class="small muted">Every morning the portal reads the ARGUS operator registry and the WYVERN Wingman directory, so each trip's Operator safety record is checked against the auditor's own list, and it watches the pages where ARGUS, WYVERN and IBAC describe their levels. A level added, renamed or dropped shows here for you to review the standard (manual Module 8).</p>`;
    if (!S.aw.loaded) return head + `<p class="small muted">Loading…</p></div>`;
    if (!R && !P) return head + `<p class="small">Not run yet. GitHub → Actions → Portal jobs → Run workflow → audits. It runs by itself every morning at 06:53 Bangkok time.</p></div>`;
    const reg = R ? Object.entries(R.sources || {}).map(([k, v]) => `${k} registry: ${v.ok ? v.count + " operators" : "<b>not readable</b> (" + esc(v.error || "") + "): brokers check by hand, with link and evidence"}`).join("<br>") : "";
    const open = ((P || {}).open || []).map(c => `<div class="flag"><span class="sev high" aria-hidden="true"></span><div><p>${esc(c.id)}: ${c.added.length ? "now mentions " + esc(c.added.join(", ")) : ""}${c.added.length && c.removed.length ? "; " : ""}${c.removed.length ? "no longer mentions " + esc(c.removed.join(", ")) : ""}</p><p class="small muted">Seen ${esc(fmtD(c.at))}</p></div></div>`).join("");
    return head + `<p class="small">Last run ${esc(fmtT((R || P).at || (P || {}).checkedAt))}.<br>${reg}</p>${(P && (P.failed || []).length) ? `<div class="note warn small">Could not read: ${esc(P.failed.join(", "))}.</div>` : ""}${open}
      ${P && P.review ? `<p class="small">Review: ask Claude to compare the change with the standard (manual 8.2, the portal's Operator safety, the website guide), update them if needed, then mark it reviewed.</p><button class="btn small primary" type="button" data-aw="ok">Mark reviewed</button>` : `<p class="small muted">Nothing to review.</p>`}</div>`;
  }
  const _vTeamAW = vTeam; vTeam = function(){ return afterHead(_vTeamAW(), apPanel() + awPanel()); };
  const _vTodayAW = vToday; vToday = function(){ awLoad(); watch(); const P = S.aw.prog, own = S.isOwner && acting() === "owner";
    const soon = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10), ending = ((S.opAppr || {}).list || []).filter(x => x.until >= today() && x.until <= soon);
    return afterHead(_vTodayAW(), (own && P && P.review ? `<div class="note warn" style="margin-bottom:16px"><b>Audit levels changed.</b> ARGUS, WYVERN or IBAC changed how they describe their levels. <a href="#" data-view="team">Review it in Team</a>.</div>` : "")
      + (own && ending.length ? `<div class="note warn" style="margin-bottom:16px"><b>Operator approvals ending within 30 days:</b> ${ending.map(x => esc(x.name) + " (" + esc(fmtD(x.until)) + ")").join(", ")}. Renew after the checks, or let them end. <a href="#" data-view="team">Team</a></div>` : "")); };
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-aw]"); if (!b || !S.isOwner) return; e.preventDefault();
    const P = S.aw.prog; if (!P) return;
    const next = {...P, baseline: {...(P.baseline || {}), ...(P.latest || {})}, open: [], review: false, failRuns: 0, reviewedAt: now(), reviewedBy: S.uid};
    try { await S.db.doc("intel/audit-programmes").set(next); S.aw.prog = next; audit("Audit level changes reviewed", (P.open || []).map(c => c.id).join(", ")); toast("Marked reviewed."); render(); } catch(err){ toast("Could not save."); }
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
    if (!n.length) return;
    e.stopImmediatePropagation(); e.preventDefault();
    // the registry is still being read (first time this operator is looked at): wait for it, then press again once
    if (n.every(x => /registry check in progress/.test(x)) && !b.dataset.sfWait) {
      b.dataset.sfWait = "1"; toast("Checking the operator in the auditor's registry…");
      (async () => { for (let i = 0; i < 30 && safetyNeeds(t.d, t.st).some(x => /in progress/.test(x)); i++) await new Promise(r => setTimeout(r, 200));
        const again = document.querySelector(b.dataset.ap ? `[data-ap="ok"][data-id="${b.dataset.id}"]` : `[data-act="${b.dataset.act}"]`) || b; again.dataset.sfWait = "1"; again.click(); delete again.dataset.sfWait; delete b.dataset.sfWait; })();
      return;
    }
    toast("Operator safety record not complete: " + n.map(x => x.replace("operator safety: ", "")).join(", ") + ".");
  }, true);
})();
