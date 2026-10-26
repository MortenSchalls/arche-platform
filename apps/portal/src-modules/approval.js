/* ---------- Beta 21: owner approval of every booking, with a one-screen decision card ---------- */
const apOn = () => S.terms.ownerApproval !== false;
function apFigures(t){
  const st = t.st || {}, q = t.d.quote || {};
  const op = num(st.opPrice ?? q.opPrice), dc = num(st.direct ?? q.direct), price = num(st.price) || priceOf(op, dc);
  const fixed = (t.d.extras || []).concat(t.d.requests || []).filter(x => x.basis === "fixed" && num(x.amount));
  const fixedClient = fixed.reduce((a, x) => a + Math.ceil(num(x.amount) / (1 - S.terms.margin)), 0);
  const atCost = (t.d.extras || []).concat(t.d.requests || []).filter(x => x.basis === "cost").length;
  const margin = price - op - dc, pct = price ? margin / price : 0;
  const legs = legsOf(t), dep = legs[0] && legs[0].date ? new Date(legs[0].date + "T" + (legs[0].time || "12:00") + ":00") : null;
  const days = dep ? Math.floor((dep - Date.now()) / 864e5) : null;
  const deposit = days !== null && days < 7 ? price + fixedClient : Math.min(price, Math.max(Math.ceil(price * 0.25), 2500));
  const balDue = dep && days >= 7 ? new Date(dep.getTime() - 7 * 864e5).toISOString().slice(0, 10) : null;
  return {op, dc, price, margin, pct, fixedClient, nFixed: fixed.length, atCost, days, deposit, balance: price + fixedClient - deposit, balDue, brokerOp: num(q.opPrice)};
}
function apState(t){
  const a = (t.st || {}).approval; if (!a) return {ok:false, why:"Not approved yet"};
  if (a.state !== "approved") return {ok:false, why:"Changes requested"};
  const f = apFigures(t); if (num(a.price) !== f.price || num(a.opPrice) !== f.op) return {ok:false, why:`Price changed since approval (${usd(num(a.price))} → ${usd(f.price)})`, changed:true};
  return {ok:true, a};
}
function apNeeds(t){ return apOn() && ["submitted","review"].includes(t.stage) && !apState(t).ok && !(t.st && t.st.state === "returned"); }
function apChecks(t){
  const st = t.st || {}, chk = t.d.checks || {}, f = apFigures(t), out = [];
  const bc = BROKER_CHECKS.filter(([k]) => chk[k]).length;
  out.push([bc === BROKER_CHECKS.length, `Broker checks ${bc} of ${BROKER_CHECKS.length}`]);
  out.push([!!num(st.opPrice), num(st.opPrice) ? "Operator price confirmed by operations" : "Operator price not confirmed by operations"]);
  out.push([!!st.kyc, st.kyc ? "KYC and sanctions done" : "KYC and sanctions not done"]);
  out.push([!!st.paynodeRef, st.paynodeRef ? "Paynode request ready" : "Paynode request not created"]);
  const okM = f.pct >= S.terms.margin - 0.0005; out.push([okM, `Margin ${(f.pct * 100).toFixed(1)}%${okM ? "" : `: below ${(S.terms.margin * 100).toFixed(0)}%`}`]);
  if (f.brokerOp && f.op && f.brokerOp !== f.op) out.push([false, `Broker quoted the operator at ${usd(f.brokerOp)}, operations confirmed ${usd(f.op)}`]);
  if (f.days !== null) out.push([f.days >= 2, f.days < 0 ? "Departure date has passed" : `Departs in ${f.days} day${f.days === 1 ? "" : "s"}${f.days < 7 ? ": full payment on signature" : ""}`]);
  return out;
}
function apCard(t, compact){
  const d = t.d, c = d.client || {}, q = d.quote || {}, f = apFigures(t), legs = legsOf(t), s = apState(t);
  const flags = controlFlags().filter(x => x[2] && x[2].did === t.did).map(x => x[1]);
  const chk = apChecks(t), bad = chk.filter(x => !x[0]).length + flags.length;
  const route = legs.map(l => `${esc(l.from)}→${esc(l.to)} <span class="muted">${fmtD(l.date)}${l.time ? " " + esc(l.time) : ""} · ${esc(l.pax || "?")} pax</span>`).join("<br>");
  const rows = [["Client", `${esc(c.company || c.name || "–")}${c.company && c.name ? ` <span class="muted">(${esc(c.name)})</span>` : ""}${c.country ? ` · ${esc(c.country)}` : ""}${c.payer ? `<br><span class="muted">Payer: ${esc(c.payer)}</span>` : ""}`],
    ["Trip", route || "–"], ["Aircraft", `${esc(q.aircraft || d.trip && d.trip.category || "–")}${q.tail ? ` · ${esc(q.tail)}` : ""}<br><span class="muted">${esc(q.operator || "Operator not set")}</span>`],
    ["Operator price", usd(f.op) + (f.dc ? ` + direct costs ${usd(f.dc)}` : "")], ["Client price", `<b>${usd(f.price)}</b>${f.nFixed ? ` + ${f.nFixed} fixed extra${f.nFixed > 1 ? "s" : ""} ${usd(f.fixedClient)}` : ""}${f.atCost ? ` · ${f.atCost} at cost` : ""}`],
    ["Archē margin", `<b>${usd(f.margin)}</b> (${(f.pct * 100).toFixed(1)}%)`],
    ["Payment", `Deposit ${usd(f.deposit)}${f.balDue ? ` · balance ${usd(f.balance)} by ${fmtD(f.balDue)}` : " on signature"}`], ["Broker", `${esc(nm(t.bid))} · win ${winScore(t)}%`]];
  return `<div class="panel stack apcard" style="border-left:3px solid ${bad ? "var(--warn)" : "var(--ok)"}"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(c.company || c.name || "Trip")} · ${usd(f.price)}</h3><span class="row" style="gap:6px">${ageChip(t)}${s.changed ? `<span class="chip c-returned">Price changed</span>` : ""}<span class="chip ${bad ? "c-review" : "c-flown"}">${bad ? bad + " to check" : "All clear"}</span></span></div>
    <div class="tbl"><table class="small"><tbody>${rows.map(([k, v]) => `<tr><th scope="row" style="width:32%;font-weight:600">${k}</th><td>${v}</td></tr>`).join("")}</tbody></table></div>
    <div class="row" style="gap:6px">${chk.map(([ok, l]) => `<span class="chip ${ok ? "c-flown" : "c-returned"}" style="white-space:normal;height:auto;text-align:left">${esc(l)}</span>`).join("")}</div>
    ${flags.map(x => `<div class="note warn small">${esc(x)}</div>`).join("")}
    ${(d.trip && d.trip.notes) ? `<p class="small muted">Broker notes: ${esc(d.trip.notes)}</p>` : ""}
    ${(S.isOwner || (typeof canRight === "function" && canRight("approve") && t.bid !== S.uid)) && !S.preview ? `<label class="f" for="ap_n_${t.did}">Note (needed to ask for changes)<input id="ap_n_${t.did}" placeholder="For example: get a second operator quote"></label>
    <div class="row"><button class="btn primary" type="button" data-ap="ok" data-id="${t.bid}|${t.did}">Approve booking</button><button class="btn" type="button" data-ap="no" data-id="${t.bid}|${t.did}">Ask for changes</button>${compact ? `<a class="btn" href="#" data-open="${t.bid}|${t.did}" data-goto="trips">Open trip</a>` : ""}</div>
    <p class="small muted">Approving lets operations issue the confirmation once KYC, Paynode and the checks are done. If the price changes afterwards, it comes back to you.</p>` : `<p class="small"><b>Waiting for the owner's approval.</b> Operations can prepare everything; the confirmation can be issued only after approval.</p>`}</div>`;
}
function apPanel(){
  if (!S.isOwner) return "";
  const list = allTrips().filter(apNeeds).sort((a, b) => (apFigures(a).days ?? 999) - (apFigures(b).days ?? 999));
  const head = `<div class="row" style="justify-content:space-between;margin:4px 0 8px"><h2 style="margin:0">Bookings to approve${list.length ? ` (${list.length})` : ""}</h2><label class="check" style="margin:0"><input type="checkbox" data-apset ${apOn() ? "checked" : ""}><span class="small">Owner approves every booking</span></label></div>`;
  if (!apOn()) return `<div style="margin-bottom:16px">${head}<p class="small muted">Off: operations issues confirmations without your approval.</p></div>`;
  return `<div style="margin-bottom:16px">${head}${list.length ? `<p class="small muted">Soonest departure first. Everything you need is on each card; green chips are done, red ones need attention.</p><div class="stack">${list.map(t => apCard(t, true)).join("")}</div>` : `<div class="panel empty"><p><b>No bookings waiting for your approval.</b></p></div>`}</div>`;
}
/* the trip file shows the same card, and the approval status once given */
function apTripBlock(t){
  if (!apOn() || !["submitted","review","issued","clientPaid","flown"].includes(t.stage)) return "";
  const s = apState(t), a = (t.st || {}).approval;
  if (s.ok) return `<div class="note ok small"><b>Approved by the owner</b> ${fmtT(a.at)} at ${usd(num(a.price))}${a.note ? ` · ${esc(a.note)}` : ""}</div>`;
  if (!["submitted","review"].includes(t.stage)) return "";
  if (S.isOwner || isStaff()) return apCard(t, false);
  return `<div class="note info small"><b>Waiting for the owner's approval.</b>${a && a.state === "changes" ? ` Changes asked: ${esc(a.note || "")}` : ""}</div>`;
}
(function(){
  const _td = todayDecisions;
  todayDecisions = function(){
    const out = _td(); if (!apOn()) return out;
    const keep = out.filter(h => !/Trip waiting for operations/.test(h) || !allTrips().some(t => apNeeds(t) && h.includes(`data-open="${t.bid}|${t.did}"`)));
    const ap = allTrips().filter(apNeeds).map(t => { const f = apFigures(t), c = t.d.client || {}; return `<div class="flag"><span class="sev high" aria-hidden="true"></span><div><p><b>Approve booking:</b> ${esc(c.company || c.name || "")} · ${usd(f.price)} · margin ${(f.pct * 100).toFixed(1)}%${f.days !== null ? ` · departs in ${f.days} d` : ""}</p><p class="small muted">${esc(nm(t.bid))} · <a href="#apList">See the card below</a></p></div></div>`; });
    return ap.concat(keep.map(h => h.replace(/<p>Trip waiting for operations:/, "<p><b>Operations to act:</b>")));
  };
  const _vT = vToday; vToday = function(){ return afterHead(_vT(), `<div id="apList">${apPanel()}</div>`); };
  const _tf = tripFile; tripFile = function(t){ const h = _tf(t), b = apTripBlock(t); return b ? h.replace(`<div><h3>History</h3>`, b + `<div><h3>History</h3>`) : h; };
  const _ic = issueConf; issueConf = async function(btn){ const t = tripById(S.sel); if (t && !S.isOwner && ((t.st || {}).approval || {}).by === S.uid) { toast("You approved this booking, so someone else issues the confirmation."); return; } if (t && apOn() && !apState(t).ok && !S.isOwner) { toast("Waiting for the owner's approval: " + apState(t).why + "."); return; } if (t && apOn() && S.isOwner && !apState(t).ok) await apWrite(t, "approved", "Approved when issuing"); return _ic(btn); };
})();
async function apWrite(t, state, note){
  const f = apFigures(t);
  const sh = state === "approved" && typeof supShareFor === "function" ? supShareFor(t.bid) : null;
  await statusWrite(t, {approval: {state, at: now(), by: S.uid, note: note || "", price: f.price, opPrice: f.op}, ...(sh ? {supShare: sh} : {}), ...(state === "changes" ? {state: "returned", note} : {})}, state === "approved" ? `Approved by ${S.isOwner ? "the owner" : nm(S.uid) + " (supervisor)"} at ${usd(f.price)}` : `Owner asked for changes: ${note}`);
  audit(state === "approved" ? "Booking approved" : "Booking returned by the owner", `${nm(t.bid)} · ${(t.d.client && (t.d.client.company || t.d.client.name)) || t.did} · ${usd(f.price)}`);
}
document.addEventListener("click", e => {
  const b = e.target.closest('[data-act="issue"]'); if (!b || !apOn()) return;
  const t = tripById(S.sel); if (!t || apState(t).ok || S.isOwner) return;
  e.stopImmediatePropagation(); e.preventDefault(); toast("Waiting for the owner's approval: " + apState(t).why + ".");
}, true);
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-ap]"); if (!b || !(S.isOwner || (typeof canRight === "function" && canRight("approve")))) return;
  { const [bb] = (b.dataset.id || "").split("|"); if (!S.isOwner && bb === S.uid) { toast("You cannot approve your own trip."); return; } }
  const [bid, did] = b.dataset.id.split("|"), t = allTrips().find(x => x.bid === bid && x.did === did); if (!t) return;
  const note = ((document.getElementById("ap_n_" + did) || {}).value || "").trim();
  try {
    if (b.dataset.ap === "ok") { await apWrite(t, "approved", note); toast("Approved. Operations can issue the confirmation."); }
    else { if (note.length < 5) { toast("Write what needs to change first."); return; } await apWrite(t, "changes", note); toast("Sent back to the broker with your note."); }
  } catch(err){ toast("Could not save. Try again."); }
});
document.addEventListener("change", async e => {
  if (!e.target.matches("[data-apset]") || !S.isOwner) return;
  try { await S.db.doc("config/terms").set({...S.terms, ownerApproval: e.target.checked}); audit("Owner approval of bookings " + (e.target.checked ? "turned on" : "turned off"), ""); toast(e.target.checked ? "You now approve every booking." : "Approval turned off."); } catch(err){ toast("Could not change."); }
});
