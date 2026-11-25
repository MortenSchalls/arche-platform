/* ---------- One tap per document still needed (workflow audit, Morten 25 Nov 2026: "smarter, not harder") ----------
   Above the documents list, a button for each document the booking still needs (operator quote, AOC, insurance
   certificate, safety audit evidence): one tap opens the file chooser and the file is attached under the right type at
   once. No picking the type from a list first. */
(function(){
  const docOf = (d, kind) => (d.docs || []).some(x => x.kind === kind && (!x.op || !(d.quote || {}).operator || x.op === d.quote.operator)), lockedStage = t => ["review","issued","clientPaid","flown","cancelled"].includes(t.stage);
  const NEED = [["Operator quote", "the operator's quote"], ["AOC", "the AOC"], ["Insurance certificate", "the insurance certificate"], ["Safety audit", "the safety audit"]];
  const _tf = tripFile;
  tripFile = function(t){
    const h = _tf(t); if (!t || !(t.bid === S.uid && !lockedStage(t)) && !(typeof staffOn === "function" && staffOn(t))) return h;
    const miss = NEED.filter(([k]) => !docOf(t.d, k) && !(k === "Safety audit" && !((t.d.safety || {}).audit)));
    if (!miss.length || h.indexOf('id="docKind"') < 0) return h;
    const row = `<div class="row" id="docQuick" style="margin:4px 0 8px"><span class="small muted">Still needed:</span>${miss.map(([k, l]) => `<button class="btn small" type="button" data-dq="${esc(k)}">Attach ${esc(l)}</button>`).join("")}</div>`;
    return h.replace('<div id="secDocs"><h3>Documents</h3>', '<div id="secDocs"><h3>Documents</h3>' + row);
  };
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest("[data-dq]"); if (!b) return; ev.preventDefault();
    const k = $("docKind"), f = $("docFile"); if (!k || !f) return;
    k.value = b.dataset.dq; S.docQuick = true; f.value = ""; f.click();
    // a cancelled picker leaves nothing armed: the next file chosen by hand waits for Attach (review 25 Nov 2026)
    f.addEventListener("cancel", () => { S.docQuick = false; }, {once: true});
  });
  document.addEventListener("change", async ev => {
    if (ev.target.id !== "docFile" || !S.docQuick) return; S.docQuick = false;
    const t = tripById(S.sel); if (t && ev.target.files[0]) await uploadDoc(t);
  });
})();
