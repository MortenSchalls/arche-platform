/* ---------- Website enquiries on Today (new platform only) ---------- */
(function(){
  if (!window.__sb) return;                                   // claude.ai version has no website feed
  let started = false;
  function watch(){ if (started || !isStaff()) return; started = true; watchCol("enquiries", snap => { S.enq = snap.docs.map(d => ({id: d.id, ...d.data()})); render(); }); }
  function line(e){
    if (e.type === "callback") return `<b>Call back</b> ${esc(e.phone || "")}${typeof enqSourceTag === "function" ? enqSourceTag(e) : ""}`;
    if (e.type === "alert") return `<b>Empty-leg alerts</b> ${esc(e.email || "")}${e.route ? " · " + esc(e.route) : ""}. Email only legs that fit, each with an unsubscribe line; on unsubscribe press Delete.`;
    const legs = (e.legs || []).map(l => `${esc(l.from)} → ${esc(l.to)}${l.date ? " " + esc(fmtD(l.date)) : ""}`).join(" · ");
    return `<b>Quote</b> ${legs} · ${esc(e.pax || "?")} pax · ${esc(e.name || "")} · ${esc(e.reach || "")} (${esc(e.reply || "")})${e.flown ? " · flown privately before: " + esc(e.flown) : ""}${e.news ? " · <b>wants empty-leg alerts and news</b>" : ""}${typeof enqSourceTag === "function" ? enqSourceTag(e) : ""}`;
  }
  function panel(){
    watch(); const open = (S.enq || []).filter(e => !e.handled);
    if (!open.length) return "";
    return `<div class="panel" style="margin-bottom:16px"><h2>Website enquiries (${open.length})</h2><p class="small muted">From the quote, call-back and empty-leg alert forms on archeaviation.com. Reply within 15 minutes, then open a trip as usual and mark the enquiry handled.</p>${open.slice(0, 20).map(e => `<div class="flag"><span class="sev ${e.type === "callback" ? "high" : "med"}" aria-hidden="true"></span><div style="flex:1;min-width:0"><p>${line(e)}</p><p class="small muted">${fmtT(e.at)}${e.lang && e.lang !== "en" ? " · language " + esc(e.lang) : ""}</p><div class="row" style="margin-top:6px">${e.type === "alert" ? `<button class="btn small" type="button" data-enq="${esc(e.id)}">Added to the alert list</button> <button class="btn small" type="button" data-enqdel="${esc(e.id)}">Delete (unsubscribe)</button>` : `<button class="btn small" type="button" data-enq="${esc(e.id)}">Mark handled</button>`}</div></div></div>`).join("")}</div>`;
  }
  const _vT = vToday; vToday = function(){ return afterHead(_vT(), panel()); };
  document.addEventListener("click", async ev => {
    const dl = ev.target.closest("[data-enqdel]");
    if (dl && isStaff()) { if (!confirm("Delete this sign-up? The email is removed at once and cannot be restored.")) return; try { await S.db.doc("enquiries/" + dl.dataset.enqdel).delete(); audit("Website alert sign-up deleted (unsubscribe)", ""); S.enq = (S.enq || []).filter(x => x.id !== dl.dataset.enqdel); toast("Deleted. If it shows again after a reload, run SQL 0019 (Today) first."); render(); } catch(err){ toast("Could not delete. Run SQL 0019 first."); } return; }
    const b = ev.target.closest("[data-enq]"); if (!b || !isStaff()) return;
    const e = (S.enq || []).find(x => x.id === b.dataset.enq); if (!e) return;
    try { await S.db.doc("enquiries/" + e.id).set({...e, handled: true}); audit("Website enquiry handled", e.type); toast("Marked handled."); } catch(err){ toast("Could not save."); }
  });
})();
