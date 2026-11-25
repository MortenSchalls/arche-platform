/* ---------- Options for the client (Morten, 25 Nov 2026, peer proposal P2: "All") ----------
   Next to the main quote a broker can hold up to two more aircraft for the same journey, so the client compares them side
   by side (as on the client page). The main quote stays the one every check, the authorisation and the confirmation use;
   "Make this the main option" swaps an alternative in, and the trip checks run on it at once. Each price is worked out the
   same way as the main one: (operator price + direct trip costs, with conversion and card costs) ÷ 0.91. */
(function(){
  const ALT_MAX = 2;
  function altPrice(a, q){ const own = num(a.direct), pc = payCostOf(a.opPrice, own, a.cur || "USD", !!q.card); return priceOf(a.opPrice, own + pc.total); }
  function optionsBlock(t){
    const d = t.d, q = d.quote || {}, alts = d.alts || [], r = acting();
    const mine = t.bid === S.uid && (r === "broker" || (S.role === "owner" && !S.preview)), open = mine && !["review","issued","clientPaid","flown","cancelled"].includes(t.stage);
    if (!num(q.opPrice) && !alts.length) return "";
    const row = (o, main, i) => `<tr><td>${main ? `<span class="chip c-flown">Main</span>` : `<span class="chip">Option ${i + 2}</span>`}</td><td><b>${esc(o.aircraft || "–")}</b><br><span class="muted">${esc(o.operator || "–")}${o.opCountry ? ", " + esc(o.opCountry) : ""}</span></td><td>${esc(o.audit || (main ? "See Operator safety" : "–"))}</td><td class="mono">${usd(num(o.opPrice))}</td><td class="mono"><b>${usd(main ? priceOf(q.opPrice, q.direct) : altPrice(o, q))}</b></td>
      <td>${!main && open ? `<div class="row" style="gap:6px"><button class="btn small" type="button" data-alt="main|${i}">Make this the main option</button><button class="btn small" type="button" data-alt="del|${i}">Remove</button></div>` : ""}</td></tr>`;
    const form = S.altForm === t.did ? `<form id="altForm" class="fgrid" style="margin-top:8px">
        <label class="f" for="al_op">Operator legal name, as on its AOC<input id="al_op" required></label>
        <label class="f" for="al_oc">Operator's country<input id="al_oc"></label>
        <label class="f" for="al_ac">Aircraft type<input id="al_ac" required></label>
        <label class="f" for="al_au">Safety audit (e.g. ARGUS Platinum)<input id="al_au"></label>
        <label class="f" for="al_pr">Operator price (USD)<input id="al_pr" inputmode="decimal" required></label>
        <label class="f" for="al_dc">Direct trip costs not in the operator price (USD)<input id="al_dc" inputmode="decimal"></label>
        <div class="row" style="grid-column:1/-1"><button class="btn primary small" type="submit">Add this option</button><button class="btn small" type="button" data-alt="cancel|0">Cancel</button></div></form>` : "";
    return `<div id="secOptions"><h3>Options for the client</h3><p class="small muted">Up to three aircraft for the same journey, compared side by side. The main option is the one checked, authorised and confirmed; make another one main when the client chooses it, and its trip checks run at once.</p>
      <div style="overflow-x:auto;max-width:100%"><table class="tbl small"><thead><tr><th scope=col></th><th scope=col>Aircraft and operator</th><th scope=col>Safety audit</th><th scope=col>Operator price</th><th scope=col>Client price</th><th scope=col></th></tr></thead><tbody>
      ${num(q.opPrice) ? row(q, true, -1) : ""}${alts.map((a, i) => row(a, false, i)).join("")}</tbody></table></div>
      <div class="row" style="margin-top:8px">${open && alts.length < ALT_MAX && !form ? `<button class="btn small" type="button" data-alt="add|0">Add an option</button>` : ""}${alts.length ? `<button class="btn small" type="button" data-alt="copy|0">Copy the options for the client</button>` : ""}</div>${form}</div>`;
  }
  function optionsText(t){
    const d = t.d, q = d.quote || {}, legs = ((d.trip || {}).legs || []).map(l => `${l.from} to ${l.to}, ${fmtD(l.date)}`).join("; ");
    const all = [{...q, price: priceOf(q.opPrice, q.direct)}, ...(d.alts || []).map(a => ({...a, price: altPrice(a, q)}))];
    return [`Your options for ${legs}:`, ...all.map((o, i) => `${i + 1}. ${o.aircraft}, operated by ${o.operator}${o.audit ? " (" + o.audit + ")" : ""}: USD ${o.price.toLocaleString("en-US")}, all included as listed in the confirmation.`),
      "Each option is held subject to availability. Tell me which you prefer and I will confirm it with the operator."].join("\n");
  }
  const _tf = tripFile;
  tripFile = function(t){ const h = _tf(t), b = optionsBlock(t); if (!b) return h; const k = h.indexOf(`<div><h3>Price at `); return k < 0 ? h + b : h.slice(0, k) + b + h.slice(k); };
  document.addEventListener("click", async ev => {
    const b = ev.target.closest && ev.target.closest("[data-alt]"); if (!b) return; ev.preventDefault();
    const t = tripById(S.sel); if (!t) return; const [a, iS] = b.dataset.alt.split("|"), i = +iS, alts = [...(t.d.alts || [])];
    if (a === "add") { S.altForm = t.did; render(); return; }
    if (a === "cancel") { S.altForm = null; render(); return; }
    if (a === "copy") { try { await navigator.clipboard.writeText(optionsText(t)); toast("Options copied. Paste them into your email or WhatsApp to the client."); } catch(e){ toast("Could not copy here."); } return; }
    if (a === "del") { alts.splice(i, 1); await deskWrite(t, {alts}, "Option removed"); toast("Option removed."); return; }
    if (a === "main") { const q = t.d.quote || {}, alt = alts[i]; if (!alt) return;
      const old = {operator: q.operator || "", opCountry: q.opCountry || "", aircraft: q.aircraft || "", audit: q.audit || "", opPrice: num(q.opPrice), direct: num(q.directOwn ?? q.direct)};
      const own = num(alt.direct), pc = payCostOf(alt.opPrice, own, "USD", !!q.card);
      const quote = {...q, operator: alt.operator, opCountry: alt.opCountry || "", aircraft: alt.aircraft, audit: alt.audit || "", tail: "", opPrice: num(alt.opPrice), directOwn: own, direct: own + pc.total, payFx: pc.fx, payCard: pc.card, cur: "USD"};
      delete quote.curAmt; delete quote.rate; alts[i] = old;
      await deskWrite(t, {quote, alts}, `Main option changed to ${alt.aircraft} (${alt.operator})`); toast("Main option changed. Its trip checks and operator safety now apply."); return; }
  });
  document.addEventListener("submit", async ev => {
    if (ev.target.id !== "altForm") return; ev.preventDefault();
    const t = tripById(S.sel); if (!t) return; const v = id => ($(id) || {}).value ? $(id).value.trim() : "";
    const alt = {operator: v("al_op"), opCountry: v("al_oc"), aircraft: v("al_ac"), audit: v("al_au"), opPrice: num(v("al_pr")), direct: num(v("al_dc"))};
    if (!alt.operator || !alt.aircraft || !alt.opPrice) { toast("Add the operator, aircraft and operator price."); return; }
    const alts = [...(t.d.alts || []), alt].slice(0, ALT_MAX); S.altForm = null;
    await deskWrite(t, {alts}, `Option added: ${alt.aircraft} (${alt.operator})`); toast("Option added.");
  });
  window.optionsText = optionsText;
})();
