/* ---------- Sanctions screening record on every booking (Morten, 27 Oct 2026) ----------
   Operations (or the owner) lists every name to screen: the charterer, its company, the payer, owners of 25% or more
   and anyone who controls the company, every passenger, the operator and the aircraft owner (manual 3.2).
   "Screen names now" checks them against the official UN, US (OFAC), EU and UK lists (api/screen.mjs, index built
   daily by jobs/screen.mjs). The result is saved on the trip with date, person, lists and outcome.
   A confirmation cannot be issued without a clear record that still covers the charterer and company on the trip.
   A possible match stops the booking: only the owner can record a decision after checking the details. */
(function(){
  S.scr = S.scr || {};
  const tripNames = t => { const c = t.d.client || {}, q = t.d.quote || {}; return [c.name, c.company, q.operator].filter(x => x && String(x).trim()); };
  const key = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  window.screenOk = function(t, st){
    const s = (st || {}).screen; if (!s) return false;
    if (!(s.outcome === "clear" || (s.outcome === "possible match" && s.ownerDecision && s.ownerDecision.verdict === "proceed"))) return false;
    const done = new Set((s.names || []).map(key));
    return tripNames(t).filter(n => n !== (t.d.quote || {}).operator).every(n => done.has(key(n)));   // charterer and company on the trip now were screened
  };
  window.screenBlock = function(t, st){
    const s = st.screen, live = S.scr[t.did] || {}, ok = screenOk(t, st);
    const pre = live.text !== undefined ? live.text : ((s && s.names) || tripNames(t)).join("\n");
    const res = live.results ? `<table class="small" style="margin-top:8px"><thead><tr><th>Name</th><th>Result</th></tr></thead><tbody>${live.results.map(r => `<tr><td>${esc(r.name)}</td><td>${r.result === "no match" ? "No match" : `<b>Possible match</b>: ${esc(r.hits.map(h => h.listed + " (" + h.list + ")").join("; "))}`}</td></tr>`).join("")}</tbody></table>
      <p class="small muted">Lists: ${esc((live.lists || []).join(", "))}, loaded ${esc(fmtT(live.at))}${live.stale ? " · <b>older than 48 hours</b>: also check the official search pages below" : ""}${(live.failed || []).length ? " · could not load " + esc(live.failed.join(", ")) : ""}.</p>
      <button class="btn small primary" type="button" data-scr="save|${esc(t.did)}">Save this screening record</button>` : "";
    const rec = s ? `<div class="note ${s.outcome === "clear" ? "ok" : "bad"} small" style="margin-top:8px">Recorded ${esc(fmtT(s.at))} by ${esc(nm(s.by))}: <b>${s.outcome === "clear" ? "no match" : "possible match"}</b> · ${s.names.length} names · ${esc((s.lists || []).join(", "))}${s.ownerDecision ? ` · owner decision: <b>${esc(s.ownerDecision.verdict)}</b> (${esc(s.ownerDecision.note)})` : ""}${!ok && s.outcome === "clear" ? " · <b>the charterer or company has changed since: screen again</b>" : ""}</div>` : "";
    const decide = s && s.outcome === "possible match" && !s.ownerDecision ? (S.isOwner && acting() === "owner" ? `<div class="fgrid" style="margin-top:8px"><label class="f wide" for="scr_note">Owner decision after checking dates of birth, nationality and addresses against the listing<input id="scr_note" placeholder="e.g. different person: listed person born 1961, our client born 1985"></label></div><div class="row"><button class="btn small" type="button" data-scr="proceed|${esc(t.did)}">Not the listed person: proceed</button><button class="btn small danger" type="button" data-scr="stop|${esc(t.did)}">Stop the booking</button></div>` : `<div class="note bad small">Stop. Do not tell the client why and take no payment. The owner decides (manual 3.2).</div>`) : "";
    return `<div class="panel" style="margin:12px 0;padding:16px"><h3 style="margin-top:0">Sanctions screening</h3>
      <p class="small muted">One name per line: charterer, company, payer, owners of 25% or more and anyone who controls the company, every passenger, the operator and the aircraft owner. Add date of birth after a person's name if known.</p>
      <label class="f wide" for="scr_names_${esc(t.did)}">Names to screen<textarea id="scr_names_${esc(t.did)}" rows="6" data-scrtext="${esc(t.did)}">${esc(pre)}</textarea></label>
      <div class="row"><button class="btn small" type="button" data-scr="run|${esc(t.did)}">Screen names now</button>
      <a class="small" href="https://sanctionssearch.ofac.treas.gov/" target="_blank" rel="noopener">OFAC search</a> · <a class="small" href="https://www.sanctionsmap.eu/" target="_blank" rel="noopener">EU map</a> · <a class="small" href="https://search-uk-sanctions-list.service.gov.uk/" target="_blank" rel="noopener">UK list</a> · <a class="small" href="https://main.un.org/securitycouncil/content/un-sc-consolidated-list" target="_blank" rel="noopener">UN list</a></div>
      ${res}${rec}${decide}</div>`;
  };
  document.addEventListener("input", ev => { const el = ev.target.closest("[data-scrtext]"); if (el) { S.scr[el.dataset.scrtext] = {...(S.scr[el.dataset.scrtext] || {}), text: el.value, results: null}; } });
  document.addEventListener("click", async ev => {
    const b = ev.target.closest("[data-scr]"); if (!b) return; ev.preventDefault();
    const [a, did] = b.dataset.scr.split("|"); const t = tripById(did); if (!t) return;
    if (ownTrip(t) && a !== "run") { toast("Another operations member or the owner must record the screening on your own trip."); return; }
    const box = $("scr_names_" + did), names = (box ? box.value : "").split("\n").map(x => x.trim()).filter(Boolean);
    if (a === "run") {
      if (!names.length) { toast("Add the names to screen."); return; }
      b.disabled = true; b.textContent = "Screening…";
      try {
        const s = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
        const r = await fetch("/api/screen", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + (s ? s.access_token : "")}, body: JSON.stringify({names: names.map(n => n.replace(/\s*\(?\b(19|20)\d\d[-/.]\d\d?[-/.]\d\d?\)?\s*$/, ""))})});
        const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status);
        j.results.forEach((x, i) => { x.name = names[i]; });
        S.scr[did] = {text: names.join("\n"), results: j.results, lists: j.lists, at: j.at, stale: j.stale, failed: j.failed};
      } catch(e){ toast("Screening not available: " + String(e.message || e).slice(0, 140) + ". Use the official search pages and record the result in a note."); }
      render(); return;
    }
    if (a === "save") {
      const L = S.scr[did]; if (!L || !L.results) return;
      const hit = L.results.some(r => r.result !== "no match");
      const screen = {at: now(), by: S.uid, names: L.results.map(r => r.name), lists: L.lists, listsAt: L.at, stale: !!L.stale, outcome: hit ? "possible match" : "clear", hits: L.results.filter(r => r.result !== "no match").map(r => ({name: r.name, hits: r.hits}))};
      await statusWrite(t, {screen}, hit ? "Sanctions screening: possible match, owner to decide" : "Sanctions screening: no match");
      audit("Sanctions screening recorded", `${(t.st || {}).ref || t.did} · ${hit ? "possible match" : "no match"} · ${screen.names.length} names`);
      S.scr[did] = {}; toast(hit ? "Recorded. The booking stops until the owner decides." : "Recorded: no match."); return;
    }
    if ((a === "proceed" || a === "stop") && S.isOwner) {
      const note = ($("scr_note") || {}).value || ""; if (note.trim().length < 15) { toast("Write what you checked (at least 15 characters)."); return; }
      const s = {...(t.st || {}).screen, ownerDecision: {verdict: a, note: note.trim(), at: now(), by: S.uid}};
      await statusWrite(t, {screen: s}, a === "proceed" ? "Owner: not the listed person, proceed" : "Owner: booking stopped after sanctions screening");
      audit("Sanctions decision", `${(t.st || {}).ref || t.did} · ${a}`); toast("Decision recorded."); return;
    }
  });
})();
