/* ---------- Booking with the operator: terms, insurance, money (Morten, 29 Oct 2026) ----------
   "We need failure proof procedure where it is always the higher fee of the operator. We will not carry liability
   insurance the first 2-3 months, so any insurance is on operator. Money flow is we can only pay when money is received
   from client, then we pay [the operator] minus our margin. Minimum margin is 9% and only special circumstances can
   change for higher or lower and it is my decision. The procedure needs to be a natural but strict flow merged into our
   internal flow, eliminate any double tasks; we always save data that are not locked, for our IP improvement."
   One flow, each step once:
   Broker  1. Operator terms from its quote or contract on Avinode: cancellation scale, payment terms, insurance
              (prefilled from the operator library when the operator is known). The pre-issue ticks for insurance and
              operator terms follow this record; they cannot be ticked by hand.
   Ops     2. Request to Book on Avinode, how long the operator holds the aircraft, the operator's contract attached
              and confirmed to match. 3. Issue: the confirmation prints this booking's payment schedule (A3) and
              cancellation charges (A9). The offer cannot run past the operator's hold.
           4. Client money recorded as it clears. 5. The operator's contract is signed only once the client money held
              covers what the operator wants at signing and its cancellation charge. 6. Operator payments only from
              money received, never more than the operator price.
   Today shows overdue client payments with the date to cancel with the operator before its next charge.
   Margin: the price is always the 9% price unless the owner sets another margin on the trip, with the reason. */
(function(){
  const INS_MIN = {jet: 50e6, turboprop: 25e6};
  const today = () => new Date().toISOString().slice(0, 10);
  const lastDate = d => (((d.trip || {}).legs) || []).map(l => l.date).filter(Boolean).sort().pop() || "";
  const firstDate = d => (((d.trip || {}).legs) || []).map(l => l.date).filter(Boolean).sort()[0] || "";
  const docOf = (d, kind) => (d.docs || []).some(x => x.kind === kind);
  const OT = d => d.opTerms || {};
  const lockedStage = t => ["review","issued","clientPaid","flown","cancelled"].includes(t.stage);
  const staffOn = t => isStaff() && acting() !== "broker" && !(typeof ownTrip === "function" && ownTrip(t));
  const sum = xs => (xs || []).reduce((a, x) => a + num(x.amount), 0);

  // ---------- margin: 9% unless the owner decides otherwise on this trip ----------
  window.tripPrice = function(t, op, dc){ const ex = ((t && t.st) || {}).marginEx; const cost = num(op) + num(dc);
    return ex && num(ex.pct) > 0 && num(ex.pct) < 0.5 ? (cost > 0 ? Math.ceil(cost / (1 - num(ex.pct))) : 0) : priceOf(op, dc); };
  const figs = t => { const st = t.st || {}, q = t.d.quote || {}; const O = num(st.opPrice ?? q.opPrice), D = num(st.direct ?? q.direct);
    return {O, D, P: num(st.price) || tripPrice(t, O, D), F: typeof xsFixed === "function" ? xsFixed(t.d) : 0}; };
  window.marginOk = function(t){ const st = t.st || {}; if (!num(st.price) || !num(st.opPrice)) return true;
    return num(st.price) === tripPrice(t, st.opPrice, st.direct); };

  // ---------- the broker's record: what is missing, what stops the trip ----------
  window.opTermsNeeds = function(d){
    const o = OT(d), i = o.ins || {}, out = [];
    if (!(o.cancel || []).some(r => num(r.pct) > 0) && !o.cancelNone) out.push("operator terms: cancellation scale");
    const pp = (o.pay || []).reduce((a, r) => a + num(r.pct), 0);
    if (Math.round(pp) !== 100) out.push("operator terms: payment terms adding up to 100%");
    if (!String(i.insurer || "").trim()) out.push("operator insurance: insurer");
    if (!i.expiry) out.push("operator insurance: certificate valid until");
    if (i.regOn !== "yes") out.push("operator insurance: aircraft registration on the certificate");
    if (i.territory !== "yes") out.push("operator insurance: route inside the policy's cover");
    if (!String(i.how || "").trim() || !i.verifiedAt) out.push("operator insurance: confirmed with the insurer or its broker");
    if (!docOf(d, "Insurance certificate")) out.push("operator insurance: certificate attached (document type Insurance certificate)");
    return out;
  };
  window.opTermsBreaches = function(d){
    const o = OT(d), i = o.ins || {}, out = [], last = lastDate(d), s = d.safety || {};
    if (i.expiry && last && i.expiry < last) out.push(`The operator's insurance certificate ends ${fmtD(i.expiry)}, before the last flight (${fmtD(last)}). Archē carries no insurance of its own: get the renewed certificate.`);
    if (i.regOn === "no") out.push(`The aircraft ${esc((d.quote || {}).tail || "")} is not on the operator's insurance certificate.`);
    if (i.territory === "no") out.push("The route is outside the operator's insurance cover.");
    if (s.cls && num(s.ins) > 0 && num(s.ins) < INS_MIN[s.cls]) out.push(`Passenger liability ${usd(num(s.ins))} is below the minimum of ${usd(INS_MIN[s.cls])}.`);
    const pp = (o.pay || []).reduce((a, r) => a + num(r.pct), 0); if (pp > 100.5) out.push(`The operator's payment terms add up to ${Math.round(pp)}%, more than 100%.`);
    return out;
  };
  const termsDone = d => !opTermsNeeds(d).length && !opTermsBreaches(d).length;
  window.opTermsDone = termsDone;
  // the two pre-issue ticks follow the record (no double task)
  const autoChecks = d => { const ok = termsDone(d); return {...(d.checks || {}), ins: ok, terms: ok}; };

  // ---------- operations before issue ----------
  window.bookNeeds = function(t, validDate){
    const st = t.st || {}, b = st.book || {}, out = [];
    if (!b.rtbAt) out.push("Request to Book sent on Avinode");
    if (!b.holdUntil) out.push("how long the operator holds the aircraft");
    if (!docOf(t.d, "Operator contract")) out.push("the operator's contract attached (document type Operator contract)");
    if (!(b.contract && b.contract.matches)) out.push("the operator's contract checked against the operator terms on this trip");
    const vd = validDate || ((t.d.conf || {}).valid || {}).date;
    if (b.holdUntil && vd && vd > b.holdUntil.slice(0, 10)) out.push(`the offer expiry (${fmtD(vd)}) set no later than the operator's hold (${fmtD(b.holdUntil)})`);
    if (!marginOk(t)) out.push("the price at the trip's margin (save the operations panel again)");
    return out;
  };

  // ---------- the plan for this booking ----------
  window.bookingPlan = function(t){
    const d = t.d, st = t.st || {}, o = OT(d), f = figs(t), dep = firstDate(d);
    const issue = st.confIssued ? st.confIssued.at.slice(0, 10) : today();
    const scale = o.cancelNone ? [] : (o.cancel || []), pay = o.pay || [];
    return {f, dep, issue, scale, pay, cancel: BP.cancelTable(f.P, f.O, f.D, scale), sched: BP.schedule({P: f.P, F: f.F, O: f.O, dep, issue, scale, pay})};
  };
  const money = t => { const st = t.st || {}; return {received: sum(st.receipts), paid: sum(st.payouts)}; };

  // ---------- the charter confirmation carries the plan; its ticks come from the records ----------
  const _confData = confData;
  confData = function(t, cf, opts){ const data = _confData(t, cf, opts); if (!t.d.opTerms) return data;
    const pl = bookingPlan(t); data.plan = {cancel: pl.cancel, sched: pl.sched}; data.opScale = false;
    const ok = termsDone(t.d); data.ck = {...data.ck, ins: ok, terms: ok}; return data; };

  // ---------- gates: Send, trip checks, issue ----------
  const _sendNeeds = window.sendNeeds;
  if (_sendNeeds) window.sendNeeds = function(d){ const out = _sendNeeds(d).filter(x => !/^Operator insurance certificate|^Operator's cancellation and payment terms/.test(x)); return out.concat(opTermsNeeds(d)); };
  const _tc = window.tripChecks;
  if (_tc) window.tripChecks = function(d, st){ return _tc(d, st).concat(opTermsBreaches(d).map((text, i) => ({key: "opterms|" + i, sev: "red", leg: null, text}))); };
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest('[data-act="confIssue"],[data-act="issue"]'); if (!b) return;
    const t = tripById(S.sel); if (!t) return;
    const need = [...opTermsNeeds(t.d).map(x => x.replace(/^operator (terms|insurance): /, "")), ...bookNeeds(t, ((S.confDraft || {}).valid || {}).date)];
    if (!need.length) return;
    e.stopImmediatePropagation(); e.preventDefault();
    toast("Before issuing: " + need.join(", ") + ".");
    const s = $(opTermsNeeds(t.d).length ? "secOpTerms" : "secBook"); if (s) s.scrollIntoView({block: "start", behavior: "smooth"});
  }, true);
  // the insurance and operator-terms ticks cannot be set by hand
  document.addEventListener("change", e => {
    const el = e.target; if (!el.dataset || !["ins", "terms"].includes(el.dataset.ck)) return;
    e.stopImmediatePropagation(); const t = tripById(S.sel); if (!t) return;
    el.checked = !!autoChecks(t.d)[el.dataset.ck];
    toast("This tick follows the Operator terms and insurance record. Complete it there.");
    const s = $("secOpTerms"); if (s) s.scrollIntoView({block: "start", behavior: "smooth"});
  }, true);

  // ---------- operator library (Archē's own know-how: no client personal data) ----------
  S.oplib = S.oplib || {};
  const normOp = s => String(s || "").toLowerCase().replace(/\b(ltd|limited|pte|llc|inc|co|corp|plc|sa|ag|gmbh)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  async function api(path, body){ const sess = (await window.__sb.auth.getSession()).data.session;
    const r = await fetch(path, {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || "")}, body: JSON.stringify(body)});
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Could not reach the operator library."); return j; }
  const local = () => !window.__sb || !!window.__TEST_AS;
  // one trip's entry: business data only (operator, aircraft, route codes, dates, figures, terms, insurance)
  window.oplibEntry = function(t, event){
    const d = t.d, st = t.st || {}, q = d.quote || {}, s = d.safety || {}, o = OT(d), i = o.ins || {}, f = figs(t), b = st.book || {};
    return {ref: st.ref || t.did, at: new Date().toISOString(), event, operator: q.operator || "", aircraft: q.aircraft || "", reg: q.tail || "", category: (d.trip || {}).category || "",
      legs: ((d.trip || {}).legs || []).map(l => ({from: l.from || "", to: l.to || "", date: l.date || "", pax: num(l.pax)})),
      opPrice: f.O, direct: f.D, price: f.P, marginPct: f.P ? Math.round((f.P - f.O - f.D) / f.P * 1000) / 10 : 0,
      terms: {cancel: o.cancel || [], cancelNone: !!o.cancelNone, pay: o.pay || []},
      ins: {insurer: i.insurer || "", expiry: i.expiry || "", amount: num(s.ins), how: i.how || "", verifiedAt: i.verifiedAt || ""},
      audit: s.audit || "", holdHours: b.rtbAt && b.holdUntil ? Math.round((Date.parse(b.holdUntil) - Date.parse(b.rtbAt)) / 36e5) : null,
      outcome: st.state === "flown" ? "flown" : st.state === "cancelled" ? "cancelled" : "booked", opCancelCharge: num(st.opCancelCharge) || 0};
  };
  window.oplibMerge = function(lib, e){
    const L = {ops: {}, ...(lib || {})}, k = normOp(e.operator); if (!k) return L;
    const cur = L.ops[k] || {name: e.operator, trips: []};
    const trips = [...(cur.trips || []).filter(x => x.ref !== e.ref), e].slice(-200);
    L.ops = {...L.ops, [k]: {name: e.operator, last: {terms: e.terms, ins: e.ins, at: e.at, ref: e.ref}, regs: [...new Set([...(cur.regs || []), e.reg].filter(Boolean))], trips}};
    L.updatedAt = e.at; return L;
  };
  async function libSave(t, event){
    try { if (local()) { const g = await S.db.doc("intel/oplib").get(); await S.db.doc("intel/oplib").set(oplibMerge(g.exists ? g.data() : {}, oplibEntry(t, event))); }
      else await api("/api/oplib", {action: "save", bid: t.bid, did: t.did, event}); }
    catch(e){ console.warn("oplib", e); }
  }
  window.oplibSave = libSave;
  function libGet(name){
    const k = normOp(name); if (!k || S.oplib[k]) return S.oplib[k];
    S.oplib[k] = {loading: true};
    (async () => { try {
      if (local()) { const g = await S.db.doc("intel/oplib").get(); const e = g.exists ? ((g.data().ops || {})[k]) : null; S.oplib[k] = e ? {name: e.name, last: e.last, trips: (e.trips || []).length, regs: e.regs || []} : {none: true}; }
      else { const j = await api("/api/oplib", {action: "get", operator: name}); S.oplib[k] = j.entry || {none: true}; }
    } catch(e){ S.oplib[k] = {none: true}; } render(); })();
    return S.oplib[k];
  }

  // ---------- the broker's block (after Operator safety) ----------
  const unitSel = (v, attrs) => `<select ${attrs} style="width:auto"><option value="days" ${v !== "hours" ? "selected" : ""}>days</option><option value="hours" ${v === "hours" ? "selected" : ""}>hours</option></select>`;
  function rowsHtml(kind, list, dis){
    return (list || []).map((r, ix) => {
      const book = r.days === "booking";
      const when = `<select data-otw="${kind}|${ix}" style="width:auto" ${dis}><option value="booking" ${book ? "selected" : ""}>${kind === "cancel" ? "from booking" : "on signing its contract"}</option><option value="before" ${book ? "" : "selected"}>${kind === "cancel" ? "if cancelled under" : "by"}</option></select>`;
      const days = book ? "" : `<input data-otd="${kind}|${ix}" inputmode="decimal" value="${esc(r.days ?? "")}" style="width:70px" aria-label="Time before departure" ${dis}> ${unitSel(r.unit, `data-otu="${kind}|${ix}" aria-label="Unit" ${dis}`)} before departure`;
      return `<div class="row" style="gap:6px;align-items:center;margin:0 0 6px">${kind === "cancel" ? "The operator keeps" : "Pay the operator"} <input data-otp="${kind}|${ix}" inputmode="decimal" value="${esc(r.pct ?? "")}" style="width:64px" aria-label="Percent" ${dis}>% of its price ${when} ${days} ${dis ? "" : `<button class="btn small" type="button" data-otx="${kind}|${ix}" aria-label="Remove this line">Remove</button>`}</div>`;
    }).join("");
  }
  function previewHtml(t){
    if (!t.d.opTerms) return "";
    const pl = bookingPlan(t); if (!pl.f.P || !pl.dep) return `<p class="small muted">The client's charges and payment dates appear here once the operator price and the first flight date are in.</p>`;
    return `<div class="stack" style="gap:12px;margin-top:8px"><div><p class="small" style="margin:0 0 4px"><b>If the client cancels</b> (A9: the higher of our scale and the operator's charge plus our fee)</p><table class="small"><tbody>${pl.cancel.map(r => `<tr><td>${esc(r.label)}</td><td class="n">${r.pctOfPrice}%</td><td class="n">${usd(r.amount)}${r.operatorHigher ? ' <span class="muted">(operator)</span>' : ""}</td></tr>`).join("")}</tbody></table></div>
      <div><p class="small" style="margin:0 0 4px"><b>The client pays</b> (A3 for this booking)</p><table class="small"><tbody>${pl.sched.map((x, i, all) => `<tr><td>${x.due === "signature" ? "On signature" : (i === all.length - 1 ? "Balance by " : "By ") + fmtD(x.due)}</td><td class="n">${usd(x.amount)}</td><td class="small muted">${esc(x.why.join(", "))}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  window.opTermsBlock = function(t){
    const d = t.d, o = OT(d), i = o.ins || {}, q = d.quote || {}, s = d.safety || {};
    const can = (t.bid === S.uid && !lockedStage(t)) || (staffOn(t) && !(t.st || {}).confIssued);
    const dis = can ? "" : "disabled";
    const need = opTermsNeeds(d), red = opTermsBreaches(d);
    const head = red.length ? `<div class="note bad small">${red.map(x => `<div>${x}</div>`).join("")}</div>`
      : need.length ? `<div class="note warn small"><b>Still needed:</b> ${need.map(x => esc(x.replace(/^operator (terms|insurance): /, ""))).join(" · ")}</div>`
      : `<div class="note ok small"><b>Complete.</b> The pre-issue ticks for insurance and operator terms are set from this record.</div>`;
    const L = q.operator ? libGet(q.operator) : null;
    const lib = can && L && L.last && !L.loading ? `<div class="note info small"><b>${esc(L.name || q.operator)} is in the operator library</b> (last trip ${esc(fmtD(L.last.at))}, ${L.trips || 1} trip${(L.trips || 1) > 1 ? "s" : ""}). <button class="btn small" type="button" data-otlib="1">Use the terms on file</button> Then check them against this quote: terms change.</div>` : "";
    const pp = (o.pay || []).reduce((a, r) => a + num(r.pct), 0);
    return `<div class="panel" id="secOpTerms" style="padding:16px;margin:8px 0"><h3 style="margin-top:0">Operator terms and insurance${q.operator ? " · " + esc(q.operator) : ""}</h3>${head}${lib}
      <p class="small muted">From the operator's quote or contract on Avinode. The client always pays the higher cancellation charge, and pays before the operator wants money or its charges rise (manual 10.1, 10.2).</p>
      <p class="small" style="margin:10px 0 4px"><b>Cancellation charges</b></p>
      ${o.cancelNone ? "" : rowsHtml("cancel", o.cancel, dis)}
      <div class="row" style="gap:8px">${can && !o.cancelNone ? `<button class="btn small" type="button" data-otadd="cancel">Add a line</button>` : ""}<label class="check" style="margin:0"><input type="checkbox" data-otnone="1" ${o.cancelNone ? "checked" : ""} ${dis}><span class="small">The operator's terms state no cancellation charge (checked)</span></label></div>
      <p class="small" style="margin:12px 0 4px"><b>Payment terms</b> <span class="muted">(${Math.round(pp)}% of 100%)</span></p>
      ${rowsHtml("pay", o.pay, dis)}
      ${can ? `<button class="btn small" type="button" data-otadd="pay">Add a line</button>` : ""}
      <p class="small" style="margin:12px 0 4px"><b>Insurance</b> <span class="muted">(Archē carries none of its own: the operator's must cover everything)</span></p>
      <div class="fgrid">
        <label class="f" for="oi_ins">Insurer<input id="oi_ins" data-oi="insurer" value="${esc(i.insurer || "")}" ${dis}></label>
        <label class="f" for="oi_exp">Certificate valid until<input type="date" id="oi_exp" data-oi="expiry" value="${esc(i.expiry || "")}" ${dis}></label>
        <label class="f" for="oi_amt">Passenger liability (USD)<input id="oi_amt" value="${num(s.ins) ? usd(num(s.ins)) : "Enter it under Operator safety"}" disabled></label>
        <label class="f" for="oi_reg">Aircraft ${esc(q.tail || "")} on the certificate<select id="oi_reg" data-oi="regOn" ${dis}><option value="">Choose</option><option value="yes" ${i.regOn === "yes" ? "selected" : ""}>Yes</option><option value="no" ${i.regOn === "no" ? "selected" : ""}>No</option></select></label>
        <label class="f" for="oi_ter">Every leg inside the policy's territorial cover<select id="oi_ter" data-oi="territory" ${dis}><option value="">Choose</option><option value="yes" ${i.territory === "yes" ? "selected" : ""}>Yes</option><option value="no" ${i.territory === "no" ? "selected" : ""}>No</option></select></label>
        <label class="f" for="oi_how">Confirmed with the insurer or its broker: how<input id="oi_how" data-oi="how" value="${esc(i.how || "")}" placeholder="e.g. email from the insurer's broker (firm name)" ${dis}></label>
        <label class="f" for="oi_at">Confirmed on<input type="date" id="oi_at" data-oi="verifiedAt" value="${esc(i.verifiedAt || "")}" max="${today()}" ${dis}></label>
      </div>
      ${previewHtml(t)}</div>`;
  };
  const _sb = window.safetyBlock;
  window.safetyBlock = function(t){ return (_sb ? _sb(t) : "") + opTermsBlock(t); };
  // show the two automatic ticks as automatic
  const _tf = tripFile;
  tripFile = function(t){ let h = _tf(t); const ac = autoChecks(t.d);
    ["ins", "terms"].forEach(k => { h = h.replace(new RegExp(`(<input type="checkbox" id="ck_${k}" data-ck="${k}")[^>]*>`), `$1 ${ac[k] ? "checked" : ""} disabled>`).replace(new RegExp(`(id="ck_${k}"[^]*?<span>)([^<]*)(</span>)`), `$1$2 <span class="muted">(set from Operator terms and insurance)</span>$3`); });
    const bk = bookBlock(t); if (bk) h = h.replace(`<div><h3>History</h3>`, bk + `<div><h3>History</h3>`);
    return h; };

  async function saveTerms(t, patch, line){
    const o = {...OT(t.d), ...patch, at: now()}, nd = {...t.d, opTerms: o};
    await deskWrite(t, {opTerms: o, checks: autoChecks(nd)}, line);
  }
  const edit = (t, kind, ix, f) => { const list = [...((OT(t.d))[kind] || [])].map(x => ({...x})); f(list, ix); return list; };
  document.addEventListener("change", async e => {
    const el = e.target; if (!el.closest || !el.closest("#secOpTerms")) return;
    const t = tripById(S.sel); if (!t) return; const ds = el.dataset;
    try {
      if (ds.oi) { const i = {...(OT(t.d).ins || {}), [ds.oi]: el.value.trim()}; await saveTerms(t, {ins: i}, `Operator insurance: ${ds.oi}`); return; }
      if (ds.otnone) { await saveTerms(t, {cancelNone: el.checked}, el.checked ? "Operator terms: no cancellation charge stated" : "Operator terms: cancellation charges"); return; }
      const key = ds.otp || ds.otd || ds.otu || ds.otw; if (!key) return; const [kind, ix] = key.split("|");
      const list = edit(t, kind, +ix, (l, k) => {
        if (ds.otp) l[k].pct = Math.max(0, Math.min(100, num(el.value)));
        if (ds.otd) l[k].days = Math.max(0, num(el.value));
        if (ds.otu) l[k].unit = el.value;
        if (ds.otw) { if (el.value === "booking") l[k].days = "booking"; else if (l[k].days === "booking") l[k].days = kind === "cancel" ? 14 : 7; }
      });
      await saveTerms(t, {[kind]: list}, `Operator terms: ${kind === "cancel" ? "cancellation" : "payment"} updated`);
    } catch(err){ toast("Could not save. Try again."); }
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("#secOpTerms [data-otadd],#secOpTerms [data-otx],#secOpTerms [data-otlib]"); if (!b) return;
    const t = tripById(S.sel); if (!t) return;
    try {
      if (b.dataset.otadd) { const kind = b.dataset.otadd, list = [...(OT(t.d)[kind] || []), kind === "cancel" ? {days: 14, unit: "days", pct: ""} : {days: (OT(t.d).pay || []).length ? 7 : "booking", unit: "days", pct: ""}];
        await saveTerms(t, {[kind]: list}, "Operator terms: line added"); return; }
      if (b.dataset.otx) { const [kind, ix] = b.dataset.otx.split("|"); const list = (OT(t.d)[kind] || []).filter((x, k) => k !== +ix); await saveTerms(t, {[kind]: list}, "Operator terms: line removed"); return; }
      if (b.dataset.otlib) { const L = S.oplib[normOp((t.d.quote || {}).operator)]; if (!L || !L.last) return;
        const li = L.last.ins || {}, cur = OT(t.d).ins || {};
        await saveTerms(t, {cancel: L.last.terms.cancel || [], cancelNone: !!L.last.terms.cancelNone, pay: L.last.terms.pay || [], ins: {...cur, insurer: li.insurer || cur.insurer || "", expiry: li.expiry || cur.expiry || "", how: li.how || cur.how || "", verifiedAt: li.verifiedAt || cur.verifiedAt || "", regOn: "", territory: ""}, from: {lib: L.last.at, ref: L.last.ref}},
          `Operator terms taken from the operator library (${L.last.ref || ""})`);
        toast("Taken from the library. Check them against this quote, and confirm the aircraft and route for this trip."); return; }
    } catch(err){ toast("Could not save. Try again."); }
  });

  // ---------- operations: booking with the operator and the money ----------
  function bookBlock(t){
    if (!isStaff() || S.preview || !t.d.opTerms || !["review","issued","clientPaid","flown"].includes(t.stage)) return "";
    if (typeof ownTrip === "function" && ownTrip(t)) return "";
    const st = t.st || {}, b = st.book || {}, issued = !!st.confIssued, pl = bookingPlan(t), m = money(t), f = pl.f;
    const own = S.isOwner && acting() === "owner", can = staffOn(t);
    const dt = v => { if (!v) return ""; const x = new Date(v); return isNaN(x) ? "" : new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };   // shown in local time
    const need = bookNeeds(t);
    // before issue
    const pre = `<div class="fgrid">
        <label class="f" for="bk_rtb">Request to Book sent on Avinode<input type="datetime-local" id="bk_rtb" data-bk="rtbAt" value="${esc(dt(b.rtbAt))}" ${can && !issued ? "" : "disabled"}></label>
        <label class="f" for="bk_hold">The operator holds the aircraft until<input type="datetime-local" id="bk_hold" data-bk="holdUntil" value="${esc(dt(b.holdUntil))}" ${can && !issued ? "" : "disabled"}></label></div>
      ${can && !issued ? `<div class="row" style="gap:6px"><input type="file" id="bkFile" style="width:auto" aria-label="Operator contract file"><button class="btn small" type="button" data-bka="doc">Attach the operator's contract</button></div>` : ""}
      <label class="check"><input type="checkbox" data-bkc="1" ${b.contract && b.contract.matches ? "checked" : ""} ${can && !issued ? "" : "disabled"}><span>The operator's contract matches the operator terms on this trip: cancellation charges, payment terms, aircraft and registration, itinerary and price${b.contract && b.contract.matches ? ` <span class="muted">(${esc(nm(b.contract.by))}, ${esc(fmtT(b.contract.at))})</span>` : ""}</span></label>
      ${need.length && !issued ? `<div class="note warn small"><b>Before issuing:</b> ${need.map(esc).join(" · ")}</div>` : ""}`;
    // margin
    const ex = st.marginEx, pct = f.P ? (f.P - f.O - f.D) / f.P * 100 : 0;
    const marg = `<p class="small" style="margin:8px 0 4px"><b>Margin</b> ${f.P ? `${pct.toFixed(1)}% · ${usd(f.P - f.O - f.D)}` : ""}${ex ? ` <span class="chip c-review">Set by the owner: ${(num(ex.pct) * 100).toFixed(1)}%</span> <span class="muted">${esc(ex.reason)} (${esc(fmtT(ex.at))})</span>` : ` <span class="muted">(${(S.terms.margin * 100).toFixed(0)}%, the rule)</span>`}</p>
      ${own && !issued ? `<details class="small"><summary>Owner: another margin on this trip (special circumstances)</summary><div class="fgrid"><label class="f" for="bk_mp">Margin for this trip (%)<input id="bk_mp" inputmode="decimal" value="${ex ? (num(ex.pct) * 100).toFixed(1) : ""}"></label><label class="f wide" for="bk_mr">Reason (kept in the audit log)<input id="bk_mr" value="${esc(ex ? ex.reason : "")}"></label></div><div class="row"><button class="btn small primary" type="button" data-bka="margin">Save the margin</button>${ex ? `<button class="btn small" type="button" data-bka="marginOff">Back to ${(S.terms.margin * 100).toFixed(0)}%</button>` : ""}</div></details>` : ""}`;
    // after issue
    const dToday = today(), cumDue = BP.dueBy(pl.sched, dToday);
    const schedRows = pl.sched.map((x, i, all) => { const due = x.due === "signature" ? "On signature" : (i === all.length - 1 ? "Balance by " : "By ") + fmtD(x.due);
      const paid = m.received >= x.cum, late = !paid && (x.due === "signature" ? !!st.signed : x.due < dToday);
      return `<tr><td>${due}</td><td class="n">${usd(x.amount)}</td><td>${paid ? `<span class="chip c-flown">Received</span>` : late ? `<span class="chip c-returned">Overdue</span>` : `<span class="chip c-enquiry">Open</span>`}</td><td class="small muted">${esc(x.why.join(", "))}</td></tr>`; }).join("");
    const daysLeft = pl.dep ? BP.diff(dToday, pl.dep) : 999, sign = BP.maySign({O: f.O, scale: pl.scale, pay: pl.pay, received: m.received, daysLeft});
    const exp = b.signedAt ? BP.exposure(f.O, pl.scale, daysLeft) : 0;
    const total = f.P + f.F, room = BP.mayPay({O: f.O, received: m.received, paid: m.paid, amount: 0}).room;
    const nxt = BP.nextStep({dep: pl.dep, today: dToday, scale: pl.scale, pay: pl.pay});
    const post = !issued ? "" : `<p class="small" style="margin:12px 0 4px"><b>The client pays</b> (this booking's schedule, A3) · received ${usd(m.received)} of ${usd(total)}</p>
      <div class="tbl"><table class="small"><tbody>${schedRows}</tbody></table></div>
      ${can && m.received < total ? `<div class="row" style="gap:6px;align-items:flex-end"><label class="f" for="bk_ra">Client money cleared (USD)<input id="bk_ra" inputmode="decimal" value="${Math.max(0, cumDue - m.received) || ""}"></label><label class="f" for="bk_rd">Cleared on<input type="date" id="bk_rd" max="${dToday}"></label><button class="btn small" type="button" data-bka="receipt">Record client money</button></div>` : ""}
      ${(st.receipts || []).length ? `<p class="small muted">${st.receipts.map(r => `${usd(num(r.amount))} cleared ${fmtD(r.date)}`).join(" · ")}</p>` : ""}
      <p class="small" style="margin:12px 0 4px"><b>The operator's contract</b></p>
      ${b.signedAt ? `<p class="small">Signed on Avinode ${esc(fmtT(b.signedAt))} by ${esc(nm(b.signedBy))}. If cancelled today, Archē would owe the operator ${usd(exp)}; client money held ${usd(m.received - m.paid)} of ${usd(m.received)} received.</p>`
        : `<p class="small">${!st.signed ? "Sign it only after the client has signed the confirmation and paid." : sign.ok ? `<b>Covered:</b> the client money received (${usd(m.received)}) covers what the operator wants at signing and its charge from now (${usd(sign.need)}).` : `<b>Not yet:</b> the operator wants ${usd(sign.need)} at signing or as its charge from now; received ${usd(m.received)}.`}</p>
          ${can ? `<button class="btn small ${st.signed && sign.ok ? "primary" : ""}" type="button" data-bka="signed" ${st.signed && sign.ok ? "" : "disabled"}>Record: operator's contract signed on Avinode</button>` : ""}`}
      <p class="small" style="margin:12px 0 4px"><b>The operator is paid</b> · ${usd(m.paid)} of ${usd(f.O)} · can be paid now: ${usd(room)}</p>
      ${(pl.pay || []).length ? `<p class="small muted">The operator wants: ${(pl.pay || []).map(r => `${num(r.pct)}% ${r.days === "booking" ? "when its contract is signed" : `by ${fmtD(BP.addDays(pl.dep, -Math.ceil(num(r.days) * (r.unit === "hours" ? 1 / 24 : 1))))}`}`).join(" · ")}</p>` : ""}
      ${can && b.signedAt && m.paid < f.O ? `<div class="row" style="gap:6px;align-items:flex-end"><label class="f" for="bk_pa">Paid to the operator (USD)<input id="bk_pa" inputmode="decimal" value="${room || ""}"></label><label class="f" for="bk_pd">Paid on<input type="date" id="bk_pd" max="${dToday}"></label><button class="btn small" type="button" data-bka="payout" ${room > 0 ? "" : "disabled"}>Record operator payment</button></div>` : ""}
      ${(st.payouts || []).length ? `<p class="small muted">${st.payouts.map(r => `${usd(num(r.amount))} paid ${fmtD(r.date)}`).join(" · ")}</p>` : ""}
      ${m.received < cumDue && nxt ? `<div class="note bad small"><b>Client payment missing:</b> ${usd(cumDue - m.received)} was due. Cancel with the operator before ${esc(fmtD(nxt))}, when its charge or payment rises, unless the money has cleared.</div>` : ""}`;
    const lapse = issued && offerLapsed(t) ? `<div class="note bad small"><b>Offer lapsed unsigned</b> (valid until ${esc(fmtD(((t.d.conf || {}).valid || {}).date))}). The operator's hold may have ended: confirm it with the operator before accepting a signature or money, or close the offer.</div>` : "";
    return `<div class="panel stack" id="secBook" style="background:var(--raised)"><h2>Booking with the operator</h2>${aogLine(t)}${lapse}${pre}${marg}${post}${issued && can ? cancelPanel(t) : ""}</div>`;
  }
  window.bookBlock = bookBlock;

  // ---------- deadlines, lapsed offers and the critical operator-deadline alert (Morten, 29 Oct 2026; called critical, not AOG, which is for aircraft) ----------
  const depAtOf = t => { const l = (((t.d.trip || {}).legs) || []).filter(x => x.date).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))[0]; return l ? `${l.date}T${l.time || "00:00"}:00Z` : ""; };
  window.offerLapsed = t => { const st = t.st || {}, v = ((t.d.conf || {}).valid || {}).date; return !!(st.confIssued && !st.signed && v && v < today() && st.state !== "cancelled"); };
  const utc = ms => new Date(ms).toISOString().slice(0, 16).replace("T", " ") + " UTC";
  // {level: "aog" | "passed", text} for a booking whose operator contract is signed
  window.aogOf = function(t, nowMs = Date.now()){
    const st = t.st || {}; if (!t.d.opTerms || !st.confIssued || !(st.book || {}).signedAt || ["cancelled", "flown"].includes(st.state)) return null;
    const pl = bookingPlan(t), m = money(t), depAt = depAtOf(t); if (!depAt) return null;
    const dl = BP.deadline({depAt, nowMs, O: pl.f.O, scale: pl.scale, pay: pl.pay, received: m.received, paid: m.paid});
    const tl = (Date.parse(depAt) - nowMs) / 864e5, payNow = BP.rows(pl.pay).filter(r => r.days === Infinity || tl < r.days).reduce((a, r) => a + r.pct, 0);
    const owed = Math.max(BP.exposure(pl.f.O, pl.scale, tl), Math.ceil(pl.f.O * Math.min(payNow, 100) / 100)), payDue = Math.ceil(pl.f.O * Math.min(payNow, 100) / 100);
    if (m.received < owed) return {level: "passed", text: `Operator deadline passed: Archē is exposed ${usd(owed - m.received)}. Cancel on Avinode now, or collect the money.`};
    if (m.paid < payDue && m.received >= payDue) return {level: "passed", text: `Operator payment overdue: pay the operator ${usd(payDue - m.paid)} now from the client money held.`};
    if (dl && dl.at - nowMs <= 12 * 3600e3 && (dl.short || dl.unpaid)) return {level: "aog", at: dl.at, text: dl.short ? `Client money missing ${usd(dl.need - m.received)}: cancel with the operator on Avinode before ${utc(dl.at)}, or collect it.` : `Pay the operator ${usd(dl.payNeed - m.paid)} before ${utc(dl.at)}.`};
    return null;
  };
  const aogLine = t => { const a = aogOf(t); return a ? `<div class="note bad" style="border-width:2px"><b>CRITICAL: operator deadline.</b> ${esc(a.text)}</div>` : ""; };
  function aogAll(){ return allTrips().filter(t => (isStaff() || t.bid === S.uid) && !S.preview).map(t => ({t, a: aogOf(t)})).filter(x => x.a); }
  window.aogAll = aogAll;
  // a red bar on every page for everyone involved (operations, the owner, the trip's broker) until it is resolved
  const _rn = renderNow; renderNow = function(){ _rn(); const main = document.getElementById("main"); if (!main) return;
    const list = aogAll(), old = document.getElementById("aogBar"); if (old) old.remove(); if (!list.length) return;
    const d = document.createElement("div"); d.id = "aogBar";
    d.innerHTML = `<div class="note bad" role="alert" style="border-width:2px;margin-bottom:12px"><b>CRITICAL: operator deadline on ${list.length} booking${list.length > 1 ? "s" : ""}.</b>${list.map(({t, a}) => `<div class="small" style="margin-top:4px">${esc(((t.d.client || {}).company || (t.d.client || {}).name || (t.st || {}).ref || ""))} · ${esc(a.text)} <a href="#" data-open="${t.bid}|${t.did}" data-goto="trips">Open</a></div>`).join("")}</div>`;
    main.insertBefore(d, main.firstChild); };

  // ---------- the one-click cancellation ----------
  function cancelInputs(t){ const r = ($("cx_reason") || {}).value || (money(t).received < BP.dueBy(bookingPlan(t).sched, today()) ? "missing" : "client"); return {reason: r, noticeDate: ($("cx_date") || {}).value || today(), opCharge: num(($("cx_op") || {}).value), avinode: !!($("cx_av") || {}).checked}; }
  window.cancelPreview = function(t, inp){
    const pl = bookingPlan(t), m = money(t), co = S.company || {}, depAt = depAtOf(t), tl = depAt ? (Date.parse(depAt) - Date.now()) / 864e5 : 0;
    const row0 = pl.cancel.find(r => tl < r.hi && tl >= r.lo) || {amount: pl.f.P, label: "Under 24 hours, or no-show"};
    // always the higher: the operator's actual charge plus our fee, if above the table (the same rule as the server)
    const opC = Math.min(pl.f.O, Math.max(0, Math.round(num(inp.opCharge)))), row = {...row0, amount: Math.max(row0.amount, opC ? opC + Math.max(0, pl.f.P - pl.f.O - pl.f.D) : 0)};
    let miss = null; for (const i of pl.sched) { const late = i.due === "signature" ? !!(t.st || {}).signed && Date.now() > Date.parse(t.st.signed.at) + 864e5 : i.due < today(); if (late && m.received < i.cum) { miss = i; break; } }
    const mail = BP.cancelText({name: (t.d.client || {}).name, ref: (t.st || {}).ref || "", reason: inp.reason, missing: miss ? miss.cum - m.received : 0, missingDue: miss ? miss.due : "", charge: row.amount, period: row.label.toLowerCase(), received: m.received, phone: co.phone, email: co.email, noticeDate: inp.reason === "client" ? inp.noticeDate : today()});
    return {mail, row, miss, received: m.received};
  };
  function cancelPanel(t){
    if (["cancelled", "flown"].includes(t.stage)) return "";
    const inp = S.cxIn && S.cxIn.did === t.did ? S.cxIn : {did: t.did, ...cancelInputs(t)}, pv = cancelPreview(t, inp), q = t.d.quote || {};
    const a = aogOf(t), dl = a && a.at ? ` before ${utc(a.at)}` : "";
    return `<details class="small" style="margin-top:10px" ${a || inp.open ? "open" : ""}><summary><b>Cancel this booking</b> ${a ? '<span class="chip c-returned">Do it now</span>' : ""}</summary>
      <div class="fgrid"><label class="f" for="cx_reason">Reason<select id="cx_reason" data-cx="1"><option value="missing" ${inp.reason === "missing" ? "selected" : ""}>Client payment missing (A3)</option><option value="client" ${inp.reason === "client" ? "selected" : ""}>The client cancelled in writing (A9)</option></select></label>
      ${inp.reason === "client" ? `<label class="f" for="cx_date">The client's notice arrived on<input type="date" id="cx_date" data-cx="1" value="${esc(inp.noticeDate)}" max="${today()}"></label>` : ""}</div>
      <p style="margin:6px 0">Client charge now (A9, ${esc(pv.row.label.toLowerCase())}; the higher of the table and the operator's charge plus our fee): <b>${usd(pv.row.amount)}</b> · received ${usd(pv.received)} · ${pv.received > pv.row.amount ? "refund " + usd(pv.received - pv.row.amount) : pv.received < pv.row.amount ? "still due " + usd(pv.row.amount - pv.received) : "nothing either way"}.</p>
      <ol style="margin:4px 0 6px 18px;padding:0"><li>Cancel on Avinode${q.avinode ? ", trip " + esc(q.avinode) : ""}${esc(dl)}, and get the operator's written confirmation of its charge.</li><li>Enter the operator's charge and tick that it is cancelled on Avinode.</li><li>Press the button: the notice below goes to the client (copy to the bookings address) and the cancellation is recorded.</li></ol>
      <div class="fgrid"><label class="f" for="cx_op">The operator's cancellation charge (USD)<input id="cx_op" data-cx="1" inputmode="decimal" value="${inp.opCharge || ""}"></label></div>
      <label class="check"><input type="checkbox" id="cx_av" data-cx="1" ${inp.avinode ? "checked" : ""}><span>Cancelled on Avinode, the operator's confirmation received</span></label>
      <label class="f" for="cx_txt">The notice to the client<textarea id="cx_txt" rows="12" readonly>${esc(pv.mail.subject + "\n\n" + pv.mail.text)}</textarea></label>
      ${inp.reason === "missing" && !pv.miss ? `<p class="small muted">No client payment is overdue: choose the client's written cancellation, or wait.</p>` : ""}
      <button class="btn small danger" type="button" data-bka="cancel" ${inp.avinode && (inp.reason !== "missing" || pv.miss) ? "" : "disabled"}>Send the notice to the client and record the cancellation</button></details>`;
  }
  document.addEventListener("change", e => { const el = e.target; if (!el.dataset || !el.dataset.cx) return; const t = tripById(S.sel); if (!t) return;
    S.cxIn = {did: t.did, open: true, ...cancelInputs(t)}; render(); });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest('#secBook [data-bka="cancel"]'); if (!b) return; e.stopImmediatePropagation();
    const t = tripById(S.sel); if (!t || !staffOn(t)) { toast("Another operations member or another owner must do this on your own trip."); return; }
    const inp = cancelInputs(t); if (!inp.avinode) { toast("Cancel on Avinode first, then tick it."); return; }
    b.disabled = true;
    try {
      if (local()) { const pv = cancelPreview(t, inp), m = money(t);
        await statusWrite(t, {state: "cancelled", opCancelCharge: inp.opCharge, cancelled: {reason: inp.reason, noticeDate: inp.reason === "client" ? inp.noticeDate : today(), clientCharge: pv.row.amount, period: pv.row.label, received: m.received, opCancelCharge: inp.opCharge, refund: Math.max(0, m.received - pv.row.amount), stillDue: Math.max(0, pv.row.amount - m.received), at: now(), by: S.uid, avinode: true, noticeSentAt: null}}, "Cancelled (test version: no email sent)");
        toast("Cancelled. Test version: no email was sent."); }
      else { const j = await api("/api/notice", {bid: t.bid, did: t.did, ...inp}); toast(`Cancelled. The notice went to the client. Client charge ${usd(j.record.clientCharge)}.`); }
      audit("Booking cancelled", `${(t.st || {}).ref || t.did} · ${inp.reason}`); S.cxIn = null;
      setTimeout(() => { const t2 = tripById(S.sel); if (t2) libSave(t2, "cancelled"); }, 1500);
    } catch(err){ toast(err.message || "Could not cancel. Try again."); b.disabled = false; }
  }, true);
  // the old one-click payment buttons give way to the amounts above on trips with operator terms
  const _ops = opsBlock;
  opsBlock = function(t){ let h = _ops(t); if (!t.d.opTerms) return h;
    return h.replace(/<label class="f" for="o_cpd">[\s\S]*?data-act="clientPaid">Record client payment<\/button>/, "").replace(/<p class="small muted">Record the client's payment once the signed contract is saved above\.<\/p>/, "")
      .replace(/<label class="f" for="o_opd">[\s\S]*?data-act="operatorPaid">Record operator payment<\/button>/, "")
      .replace(/<div class="row"><button class="btn danger small" type="button" data-act="cancelAsk">Cancel trip<\/button><\/div><div id="cancelBox"><\/div>/, (t.st || {}).confIssued ? "" : "$&"); };

  async function stWrite(t, patch, line){ await statusWrite(t, patch, line); }
  document.addEventListener("change", async e => {
    const el = e.target; if (!el.closest || !el.closest("#secBook")) return;
    const t = tripById(S.sel); if (!t || !staffOn(t)) return;
    try {
      if (el.dataset.bk) { const v = el.value ? new Date(el.value).toISOString() : ""; await stWrite(t, {book: {...((t.st || {}).book || {}), [el.dataset.bk]: v}}, el.dataset.bk === "rtbAt" ? "Request to Book sent on Avinode" : `The operator holds the aircraft until ${el.value.replace("T", " ")}`); return; }
      if (el.dataset.bkc) { await stWrite(t, {book: {...((t.st || {}).book || {}), contract: el.checked ? {matches: true, at: now(), by: S.uid} : null}}, el.checked ? "Operator contract checked: matches the operator terms" : "Operator contract check withdrawn"); if (el.checked) audit("Operator contract checked", `${(t.st || {}).ref || t.did} · ${(t.d.quote || {}).operator || ""}`); return; }
    } catch(err){ toast("Could not save. Try again."); }
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("#secBook [data-bka]"); if (!b) return;
    const t = tripById(S.sel); if (!t) return; const a = b.dataset.bka, st = t.st || {};
    if (a.startsWith("margin")) { if (!(S.isOwner && acting() === "owner")) return;
      try { if (a === "marginOff") { await stWrite(t, {marginEx: null, price: priceOf(st.opPrice, st.direct)}, "Margin back to the rule"); audit("Trip margin back to the rule", st.ref || t.did); toast("Back to the rule."); return; }
        const pct = num(($("bk_mp") || {}).value) / 100, why = (($("bk_mr") || {}).value || "").trim();
        if (!(pct > 0 && pct < 0.5)) { toast("Enter the margin in percent, e.g. 8 or 12."); return; } if (why.length < 10) { toast("Write the reason (at least 10 characters)."); return; }
        const ex = {pct, reason: why, by: S.uid, at: now()}, price = tripPrice({st: {marginEx: ex}}, st.opPrice, st.direct);
        await stWrite(t, {marginEx: ex, price}, `Margin for this trip set by the owner: ${(pct * 100).toFixed(1)}% (${why})`); audit("Trip margin set by the owner", `${st.ref || t.did} · ${(pct * 100).toFixed(1)}% · ${why.slice(0, 80)}`); toast(`Margin ${(pct * 100).toFixed(1)}%: price ${usd(price)}.`); } catch(err){ toast("Could not save."); }
      return; }
    if (!staffOn(t)) { toast("Another operations member or another owner must do this on your own trip."); return; }
    try {
      if (a === "doc") { const fl = ($("bkFile") || {}).files && $("bkFile").files[0]; if (!fl) { toast("Choose the contract file first."); return; }
        const assets = await claude.use("assets"); if (!assets) { toast("Document upload is not available here."); return; }
        const r = await assets.upload(fl); await deskWrite(t, {docs: [...(t.d.docs || []), {id: r.id, name: fl.name, kind: "Operator contract", at: now()}]}, "Document attached: Operator contract"); toast("Operator contract attached."); return; }
      const pl = bookingPlan(t), m = money(t), f = pl.f;
      if (a === "receipt") { if (st.confIssued && !st.signed) { toast("Save the signed confirmation first."); return; }
        const amt = num(($("bk_ra") || {}).value), d = ($("bk_rd") || {}).value; if (!(amt > 0) || !d) { toast("Enter the amount and the date it cleared."); return; }
        if (await gateHold("pay", t.did + "-client-" + d, "client|" + d + "|" + amt, `Record client money: ${st.ref || t.did}, ${usd(amt)} cleared ${d}`, "", {tripBid: t.bid, tripDid: t.did})) return;
        const receipts = [...(st.receipts || []), {date: d, amount: amt, at: now(), by: S.uid}], got = sum(receipts), full = got >= f.P + f.F;
        const patch = {receipts, ...(full ? {state: st.state === "flown" ? "flown" : "clientPaid", clientPaid: true, clientPaidDate: d} : {})};
        await stWrite(t, patch, `Client money cleared: ${usd(amt)} (${usd(got)} of ${usd(f.P + f.F)})`); audit("Client money recorded", `${st.ref || t.did} · ${usd(amt)} · ${d}`); toast(full ? "Paid in full." : "Recorded."); return; }
      if (a === "signed") { const dl = pl.dep ? BP.diff(today(), pl.dep) : 999, s = BP.maySign({O: f.O, scale: pl.scale, pay: pl.pay, received: m.received, daysLeft: dl});
        if (!st.signed) { toast("The client must sign the confirmation first."); return; }
        if (!s.ok) { toast(`Not covered: the operator wants ${usd(s.need)}; client money received ${usd(m.received)}. Collect it first.`); return; }
        await stWrite(t, {book: {...(st.book || {}), signedAt: now(), signedBy: S.uid}}, "Operator contract signed on Avinode"); audit("Operator contract signed", `${st.ref || t.did} · ${(t.d.quote || {}).operator || ""}`); toast("Recorded."); return; }
      if (a === "payout") { if (!(st.book || {}).signedAt) { toast("Record the operator's contract as signed first."); return; }
        const amt = num(($("bk_pa") || {}).value), d = ($("bk_pd") || {}).value; if (!(amt > 0) || !d) { toast("Enter the amount and the payment date."); return; }
        const ok = BP.mayPay({O: f.O, received: m.received, paid: m.paid, amount: amt});
        if (!ok.ok) { toast(`Archē never pays the operator before the client: at most ${usd(ok.room)} can be paid now.`); return; }
        if (await gateHold("pay", t.did + "-operator-" + d, "operator|" + d + "|" + amt, `Record operator payment: ${st.ref || t.did}, ${usd(amt)} paid ${d}`, "", {tripBid: t.bid, tripDid: t.did})) return;
        const payouts = [...(st.payouts || []), {date: d, amount: amt, at: now(), by: S.uid}], full = sum(payouts) >= f.O - 0.5;
        await stWrite(t, {payouts, ...(full ? {operatorPaid: true, operatorPaidDate: d} : {})}, `Operator paid ${usd(amt)} from the payment account (${usd(sum(payouts))} of ${usd(f.O)})`); audit("Operator payment recorded", `${st.ref || t.did} · ${usd(amt)} · ${d}`); toast("Recorded."); return; }
    } catch(err){ toast("Could not save. Try again."); }
  });

  // ---------- the library learns at issue, flight and cancellation ----------
  const _issue = issueConf;
  issueConf = async function(btn){ const t = tripById(S.sel), was = !!(t && t.st && t.st.confIssued); await _issue(btn); const t2 = tripById(S.sel); if (t2 && t2.d.opTerms && !was) setTimeout(() => libSave(tripById(S.sel) || t2, "issued"), 800); };
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest('[data-act="flown"],[data-act="cancelYes"],[data-ac="legFlown"]'); if (!b) return; const t = tripById(S.sel); if (!t || !t.d.opTerms || !(t.st || {}).confIssued) return;
    setTimeout(() => { const t2 = tripById(S.sel); if (t2) libSave(t2, b.dataset.act === "cancelYes" ? "cancelled" : "flown"); }, 1500); });

  // ---------- Today: money on bookings (operations and owner) ----------
  function moneyFlags(){
    if (!isStaff() || S.preview) return [];
    const out = [], d0 = today();
    allTrips().filter(t => t.d.opTerms && t.st && t.st.confIssued && ["issued","clientPaid"].includes(t.stage) && !(typeof ownTrip === "function" && ownTrip(t))).forEach(t => {
      const pl = bookingPlan(t), m = money(t), due = BP.dueBy(pl.sched, d0), c = t.d.client || {}, nmC = esc(c.company || c.name || t.st.ref || "");
      const nxt = BP.nextStep({dep: pl.dep, today: d0, scale: pl.scale, pay: pl.pay});
      if (t.st.signed && m.received < due) out.push(`<div class="flag"><span class="sev high" aria-hidden="true"></span><div><p><b>Client payment missing:</b> ${nmC} · ${usd(due - m.received)} was due${nxt ? `. Cancel with the operator before ${esc(fmtD(nxt))} unless it clears` : ""}.</p><p class="small muted"><a href="#" data-open="${t.bid}|${t.did}" data-goto="trips">Open trip</a></p></div></div>`);
      const b = t.st.book || {}, s = BP.maySign({O: pl.f.O, scale: pl.scale, pay: pl.pay, received: m.received, daysLeft: pl.dep ? BP.diff(d0, pl.dep) : 999});
      if (t.st.signed && !b.signedAt && s.ok) out.push(`<div class="flag"><span class="sev med" aria-hidden="true"></span><div><p><b>Sign the operator's contract on Avinode:</b> ${nmC} · the client money covers it.</p><p class="small muted"><a href="#" data-open="${t.bid}|${t.did}" data-goto="trips">Open trip</a></p></div></div>`);
      if (b.signedAt) (pl.pay || []).forEach(r => { const when = r.days === "booking" ? d0 : BP.addDays(pl.dep, -Math.ceil(num(r.days) * (r.unit === "hours" ? 1 / 24 : 1)));
        let acc = 0; (pl.pay || []).forEach(x => { const w = x.days === "booking" ? d0 : BP.addDays(pl.dep, -Math.ceil(num(x.days) * (x.unit === "hours" ? 1 / 24 : 1))); if (w <= when) acc += num(x.pct); });
        const want = Math.ceil(pl.f.O * Math.min(acc, 100) / 100); if (when <= BP.addDays(d0, 3) && m.paid < want) out.push(`<div class="flag"><span class="sev med" aria-hidden="true"></span><div><p><b>Operator payment due ${esc(fmtD(when))}:</b> ${nmC} · ${usd(want - m.paid)} (from client money held: ${usd(m.received - m.paid)}).</p><p class="small muted"><a href="#" data-open="${t.bid}|${t.did}" data-goto="trips">Open trip</a></p></div></div>`); });
    });
    allTrips().filter(t => t.d.opTerms && offerLapsed(t) && !(typeof ownTrip === "function" && ownTrip(t))).forEach(t => { const c = t.d.client || {};
      out.push(`<div class="flag"><span class="sev med" aria-hidden="true"></span><div><p><b>Offer lapsed unsigned:</b> ${esc(c.company || c.name || (t.st || {}).ref || "")} · confirm the operator's hold or close it.</p><p class="small muted"><a href="#" data-open="${t.bid}|${t.did}" data-goto="trips">Open trip</a></p></div></div>`); });
    const aog = aogAll().map(({t, a}) => `<div class="flag"><span class="sev high" aria-hidden="true"></span><div><p><b>CRITICAL, operator deadline:</b> ${esc(((t.d.client || {}).company || (t.d.client || {}).name || ""))} · ${esc(a.text)}</p><p class="small muted"><a href="#" data-open="${t.bid}|${t.did}" data-goto="trips">Open trip</a></p></div></div>`);
    return [...new Set([...aog, ...out])];
  }
  window.moneyFlags = moneyFlags;
  const _vT = vToday; vToday = function(){ const fl = moneyFlags(); return afterHead(_vT(), fl.length ? `<div class="panel" style="margin-bottom:16px" id="moneyPanel"><h2>Money on bookings (${fl.length})</h2>${fl.join("")}</div>` : ""); };

  // ---------- owner and operations: the operator library ----------
  function libPanel(){
    if (!isStaff() || S.preview) return "";
    if (!S.oplibAll && !S.oplibAllLoading) { S.oplibAllLoading = true; S.db.doc("intel/oplib").get().then(g => { S.oplibAll = g.exists ? g.data() : {ops: {}}; render(); }, () => { S.oplibAll = {ops: {}}; render(); }); }
    const ops = Object.values((S.oplibAll || {}).ops || {}).sort((a, b) => (b.last || {}).at > (a.last || {}).at ? 1 : -1);
    const fmtRows = rs => (rs || []).map(r => `${num(r.pct)}% ${r.days === "booking" ? "from booking" : "< " + num(r.days) + " " + (r.unit === "hours" ? "h" : "d")}`).join(", ") || "–";
    return `<div class="panel tbl" style="margin-bottom:16px"><h2>Operator library</h2><p class="small muted">Saved from every issued, flown and cancelled booking: each operator's cancellation and payment terms, insurance, aircraft, routes and prices. Archē's own know-how: no client details. Brokers are offered the terms on file for the next trip.</p>
      ${!S.oplibAll ? `<p class="small muted">Loading…</p>` : ops.length ? `<table class="small"><thead><tr><th scope=col>Operator</th><th scope=col>Trips</th><th scope=col>Cancellation</th><th scope=col>Payment</th><th scope=col>Insurance</th><th scope=col>Last</th></tr></thead><tbody>${ops.map(o => { const l = o.last || {}, i = l.ins || {}, tr = o.trips || [];
        const flown = tr.filter(x => x.outcome === "flown").length, avgM = tr.length ? (tr.reduce((a, x) => a + num(x.marginPct), 0) / tr.length).toFixed(1) : "–";
        return `<tr><td>${esc(o.name)}<br><span class="muted">${esc((o.regs || []).join(", "))}</span></td><td>${tr.length} <span class="muted">(${flown} flown, margin ${avgM}%)</span></td><td>${(l.terms || {}).cancelNone ? "none stated" : esc(fmtRows((l.terms || {}).cancel))}</td><td>${esc(fmtRows((l.terms || {}).pay))}</td><td>${esc(i.insurer || "–")}${i.expiry ? `<br><span class="${i.expiry < today() ? "" : "muted"}">to ${esc(fmtD(i.expiry))}</span>` : ""}</td><td>${esc(fmtD(l.at))}<br><span class="muted">${esc(l.ref || "")}</span></td></tr>`; }).join("")}</tbody></table>` : `<p class="small">Empty until the first booking with operator terms is issued.</p>`}</div>`;
  }
  window.oplibPanel = libPanel;
  if (typeof ALERT_EVENTS === "object") ALERT_EVENTS.money = "Booking money: client payment overdue, offer lapsed (critical operator-deadline alerts reach everyone involved anyway)";
  function remindPanel(){
    if (!S.isOwner || S.preview || acting() !== "owner") return "";
    const A = S.alerts || {}, rm = A.clientReminders || {}, on = !!rm.on && rm.version === BP.REMIND_VERSION, co = S.company || {};
    const ex = BP.reminderText({name: "Anna Example", ref: "AE-261101-123", amount: 45000, due: BP.addDays(today(), 3), phone: co.phone, email: co.email, days: 3});
    return `<div class="panel" id="remindPanel" style="margin-bottom:16px"><h2>Payment reminders to clients</h2>
      <p class="small">${on ? `<b>On</b> since ${esc(fmtT(rm.at))}.` : "<b>Off.</b> Nothing is sent to clients."} When on, every client with a signed confirmation gets an email 3 days and 1 day before each payment in its schedule, until the money has cleared. Sent from operations@archeaviation.com, with a copy to the bookings address and replies going there.</p>
      <label class="f" for="rm_txt">The wording (example)<textarea id="rm_txt" rows="13" readonly>${esc(ex.subject + "\n\n" + ex.text)}</textarea></label>
      <div class="row">${on ? `<button class="btn small" type="button" data-rm="off">Turn reminders off</button>` : `<button class="btn small primary" type="button" data-rm="on">I approve this wording: turn reminders on</button>`}</div>
      <h3 style="margin:10px 0 0">Critical: operator deadline</h3><p class="small">From 12 hours before an operator's charge or payment rises on a booking whose operator contract is signed, while the client money does not cover it or the operator is not paid, and after such a deadline has passed: everyone on the alert list, every owner and operations member and the trip's broker get a phone alert every 10 minutes, day or night, and an email every hour, and a red bar on every page, until the money clears, the operator is paid or the booking is cancelled.</p></div>`;
  }
  if (typeof alertsPanel === "function") { const _ap = alertsPanel; alertsPanel = function(){ return _ap() + remindPanel(); }; }
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-rm]"); if (!b || !S.isOwner) return;
    const on = b.dataset.rm === "on", A = S.alerts || {recipients: []};
    const next = {...A, clientReminders: on ? {on: true, version: BP.REMIND_VERSION, at: now(), by: S.uid} : {on: false, at: now(), by: S.uid}};
    if (typeof alertSave === "function") await alertSave(next, on ? `Payment reminders to clients turned on (wording ${BP.REMIND_VERSION} approved)` : "Payment reminders to clients turned off");
  });
  // the owner's approval card: margin by the rule (or the owner's own decision), operator terms complete
  if (typeof apChecks === "function") { const _apc = apChecks; apChecks = function(t){
    const out = _apc(t).filter(x => !/^Margin /.test(x[1])), st = t.st || {}, f = apFigures(t), ex = st.marginEx;
    out.push(ex ? [true, `Margin ${(f.pct * 100).toFixed(1)}%, set by the owner: ${ex.reason}`] : [marginOk(t) && f.pct >= S.terms.margin - 0.0005, `Margin ${(f.pct * 100).toFixed(1)}%${f.pct >= S.terms.margin - 0.0005 ? "" : `: below ${(S.terms.margin * 100).toFixed(0)}%`}`]);
    const nd = opTermsNeeds(t.d), rd = opTermsBreaches(t.d); out.push([!nd.length && !rd.length, rd.length ? "Operator terms or insurance: red item" : nd.length ? "Operator terms or insurance incomplete" : "Operator terms and insurance complete"]);
    return out; }; }
  const _vControl = vControl; vControl = function(){ return _vControl() + libPanel(); };
})();
