/* ---------- Request to Book by the broker (Morten, 25 Nov 2026: "Request to Book by the broker" in the duplicates to
   remove) ----------
   The broker sends Request to Book on Avinode, so the broker records it, with how long the operator holds the aircraft and
   the operator's contract when it arrives, before sending for authorisation. The Director, or a person the Director has
   mandated, only checks that the contract matches the operator terms (the four-eyes step) and can correct the dates.
   Stored with the trip (d.book), as brokers cannot write the authorisation record. */
function brokerBookBlock(t, can){
  const b = (t.d || {}).book || {}, dt = v => { if (!v) return ""; const x = new Date(v); return isNaN(x) ? "" : new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
  const hasC = (t.d.docs || []).some(x => x.kind === "Operator contract");
  return `<div class="panel" id="secRtb" style="padding:14px 16px;margin:8px 0"><h3 style="margin-top:0">Request to Book</h3>
    <p class="small muted" style="margin:0 0 6px">When the client accepts the quote, send Request to Book on Avinode and record it here. The Director checks the operator's contract against the operator terms before issue.</p>
    <div class="fgrid"><label class="f" for="rb_rtb">Request to Book sent on Avinode<input type="datetime-local" id="rb_rtb" data-rb="rtbAt" value="${esc(dt(b.rtbAt))}" ${can ? "" : "disabled"}></label>
    <label class="f" for="rb_hold">The operator holds the aircraft until<input type="datetime-local" id="rb_hold" data-rb="holdUntil" value="${esc(dt(b.holdUntil))}" ${can ? "" : "disabled"}></label></div>
    <p class="small" style="margin:6px 0 0">${hasC ? "✓ The operator's contract is attached (Documents)." : `The operator's contract: ${can ? `<button class="btn small" type="button" data-dq="Operator contract">Attach the operator's contract</button>` : "not attached yet"}`}</p></div>`;
}
(function(){
  const _tf = tripFile;
  tripFile = function(t){
    const h = _tf(t); if (!t || !(t.d || {}).quote || !num(t.d.quote.opPrice) || ["cancelled"].includes(t.stage)) return h;
    const mine = t.bid === S.uid && !S.preview, can = mine && ["enquiry", "quoted", "returned"].includes(t.stage);
    if (!mine && !(t.d.book || {}).rtbAt) return h;
    return h.replace(`<div><h3>History</h3>`, brokerBookBlock(t, can) + `<div><h3>History</h3>`);
  };
  document.addEventListener("change", async ev => {
    const el = ev.target.closest && ev.target.closest("[data-rb]"); if (!el) return;
    const t = tripById(S.sel); if (!t || t.bid !== S.uid) return;
    const v = el.value ? new Date(el.value).toISOString() : "";
    try { await deskWrite(t, {book: {...(freshTrip(t).d.book || {}), [el.dataset.rb]: v, by: S.uid}}, el.dataset.rb === "rtbAt" ? "Request to Book sent on Avinode" : `The operator holds the aircraft until ${el.value.replace("T", " ")}`); toast("Saved."); }
    catch(e){ toast("Could not save. Try again."); }
  });
})();
