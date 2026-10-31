/* ---------- Exchange rates for quotes in other currencies (Morten, 31 Oct 2026: checked in the background, free official
   sources first). The daily screen job saves the ECB euro reference rates as USD per unit (config/fx). The rate field is
   filled from it when empty, and a rate more than 3% away from the ECB rate is flagged on the field, with the date. ---------- */
(function(){
  const fx = () => (S.fx && S.fx.usdPer) ? S.fx : null;
  let watching = false;
  const watch = () => { if (watching || !S.db) return; watching = true; try { watchDoc("config/fx", snap => { if (snap.exists) S.fx = snap.data(); }); } catch(e){ watching = false; } };
  function note(){
    const c = $("q_cur"), r = $("q_rate"); if (!c || !r) return;
    let m = r.parentElement.querySelector(".fxnote"); if (!m) { m = document.createElement("span"); m.className = "fxnote small"; m.style.cssText = "display:block;margin-top:4px"; r.parentElement.appendChild(m); }
    const f = fx(), ecb = f && f.usdPer[c.value];
    if (c.value === "USD" || !ecb) { m.textContent = ""; m.style.color = ""; return; }
    const v = num(r.value), off = v ? Math.abs(v / ecb - 1) : 0;
    m.textContent = `ECB reference rate ${fmtD(f.date)}: ${ecb.toFixed(4)} USD` + (v && off > 0.03 ? ` · your rate is ${(off * 100).toFixed(1)}% away: check it against the operator's quote.` : "");
    m.style.color = v && off > 0.03 ? "var(--warn, #b7791f)" : "var(--muted)";
  }
  document.addEventListener("change", e => {
    if (!e.target || e.target.id !== "q_cur") return; watch();
    // the portal's own currency handler runs after this one (it waits for another step), so the fill happens a moment later
    setTimeout(() => { const r = $("q_rate"), f = fx(); if (r && !r.disabled && !r.value && f && f.usdPer[e.target.value]) { r.value = String(f.usdPer[e.target.value]); if (typeof curSync === "function") curSync(); } note(); }, 0);
  });
  document.addEventListener("input", e => { if (e.target && (e.target.id === "q_rate" || e.target.id === "q_amt")) note(); });
  document.addEventListener("focusin", e => { if (e.target && e.target.closest && e.target.closest("#edForm")) { watch(); note(); } });
})();
