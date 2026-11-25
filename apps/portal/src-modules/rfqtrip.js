/* ---------- Supplier quotes take the trip's facts, and an awarded quote goes into the trip's price (Morten, 25 Nov
   2026: duplicates to remove, "supplier quote prefill") ----------
   Choosing the trip on a new supplier request fills the service date, aircraft, passengers and times from the trip and
   picks the trip's airport when it is in the list; the person checks and changes what differs. When a quote for a trip
   is awarded before the confirmation is issued, its amount is added to the trip's direct trip costs (cost ÷ 0.91 like
   every cost), once, with the request reference; after issue it is a cost beyond the price for the Director. */
(function(){
  document.addEventListener("change", ev => {
    if (!ev.target || ev.target.id !== "rq_trip") return;
    const tv = ev.target.value, t = tv ? allTrips().find(x => x.bid + "|" + x.did === tv) : null; if (!t) return;
    const legs = ((t.d.trip || {}).legs || []), q = t.d.quote || {}, ap = $("rq_ap"), set = (id, v) => { const el = $(id); if (el && v && !el.value) { el.value = v; el.classList.add("filled"); } };
    let leg = legs[0] || {};
    if (ap) { const opts = [...ap.options].map(o => o.value).filter(Boolean); const hit = legs.find(l => opts.some(o => o.includes(l.to) || o.includes(l.from))); if (hit) { const o = opts.find(o => o.includes(hit.to)) || opts.find(o => o.includes(hit.from)); if (o && !ap.value) { ap.value = o; ap.dispatchEvent(new Event("change", {bubbles: true})); } leg = hit; } }
    setTimeout(() => { set("rq_date", leg.date); set("rq_ac", q.aircraft); set("rq_pax", leg.pax); set("rq_dep", leg.time ? leg.time + " local" : ""); }, 60);
  });
  window.sqAwardToTrip = async function(r, q){
    if (!r || !r.trip || !q) return "";
    const t = allTrips().find(x => x.bid === r.trip.bid && x.did === r.trip.did); if (!t) return "";
    const done = (t.d.supplierCosts || []).some(x => x.rq === r.ref); if (done) return "";
    if ((t.st || {}).confIssued || !["enquiry", "quoted", "returned", "submitted", "review"].includes(t.stage)) return " The confirmation is issued: the Director adds it under Costs beyond the price.";
    const qq = {...(t.d.quote || {})}, own = num(qq.directOwn ?? qq.direct) + num(q.usd), pc = payCostOf(num(qq.opPrice), own, qq.cur || "USD", !!qq.card);
    Object.assign(qq, {directOwn: own, direct: own + pc.total, payFx: pc.fx, payCard: pc.card});
    await deskWrite(t, {quote: qq, supplierCosts: [...(t.d.supplierCosts || []), {rq: r.ref, org: q.org, usd: num(q.usd), at: now(), by: S.uid}]}, `Supplier cost added to the direct trip costs: ${q.org} ${usd(num(q.usd))} (${r.ref})`);
    const sent = ["submitted", "review"].includes(t.stage), ap = ((t.st || {}).approval || {}).state === "approved";
    return ` ${usd(num(q.usd))} added to the trip's direct trip costs: the client price is now ${usd(priceOf(num(qq.opPrice), qq.direct))}.${ap ? " The approval no longer matches the price: it goes back to the Director." : sent ? " The trip is with the Director: tell the broker." : " Tell the client before the confirmation."}`;
  };
})();
