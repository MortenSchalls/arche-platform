/* ---------- Start joining again (Morten, 28 Oct 2026: "completely reset her now, so she starts from the commercial offer
   and then contract etc") ----------
   Owner only, on the Team page. For one person it removes: their request to join, their agreement (sent or signed, not
   yet countersigned or countersigned), their academy progress and their team membership (profile set back to not active,
   no role rights). Their login stays, so they sign in as before and see step 1, the offer. Their own leads, trips and
   training records are kept. Every reset is written to the audit log. */
(function(){
  const sbx = () => window.__sb || null;
  async function people(){
    if (S.rjAt && Date.now() - S.rjAt < 30e3) return; S.rjAt = Date.now();
    const o = {};
    Object.keys(S.access || {}).forEach(id => o[id] = {});
    Object.entries(S.joins || {}).forEach(([id, j]) => o[id] = {...o[id], join: j});
    Object.entries(S.roster || {}).forEach(([id, r]) => o[id] = {...o[id], roster: r});
    Object.entries(S.agrs || {}).forEach(([id, a]) => o[id] = {...o[id], agr: a});
    if (sbx()) { try { const {data} = await sbx().from("profiles").select("id,role,active,contract_name"); (data || []).forEach(r => { if (r.role === "owner") { delete o[r.id]; return; } o[r.id] = {...(o[r.id] || {}), prof: r}; }); } catch(e){} }
    delete o[S.uid]; S.rjPeople = o; render();
  }
  const nameOfP = (id, p) => (p.roster && p.roster.contractName) || (p.join && p.join.contractName) || (p.agr && p.agr.signedName) || (p.prof && p.prof.contract_name) || (S.names || {})[id] || "";
  const stageOf = p => p.roster && p.roster.active !== false ? "Team member" : p.agr ? "Agreement " + (p.agr.status || "") : p.join ? "Asked for assessment" : "Joining steps";
  function panel(){
    if (!S.isOwner || S.preview) return "";
    people();
    const rows = Object.entries(S.rjPeople || {}).filter(([id]) => id !== S.uid).sort((a, b) => nameOfP(...a).localeCompare(nameOfP(...b)));
    return `<div class="panel stack" id="rjPanel" style="margin-bottom:16px"><h2>Start joining again</h2>
      <p class="small muted">Sends one person back to step 1 (the offer), then the academy, assessment and agreement. Removes their request, agreement, academy progress and team access; their login stays. Their own leads and trips are kept.</p>
      ${rows.length ? `<div class="tbl"><table class="small"><thead><tr><th scope=col>Person</th><th scope=col>Where they are</th><th scope=col>Last opened</th><th scope=col></th></tr></thead><tbody>${rows.map(([id, p]) => `<tr><td>${esc(nameOfP(id, p) || "Name not given yet")}<br><span class="muted">${esc(((S.peopleEmails || {})[id] || {}).email || id.slice(0, 8))}</span></td><td>${esc(stageOf(p))}</td><td>${(S.access || {})[id] ? fmtT(S.access[id].lastSeen) : "–"}</td><td>${S.rjAsk === id ? `<button class="btn small danger" type="button" data-rj="yes|${id}">Yes, start again</button> <button class="btn small" type="button" data-rj="no|${id}">Keep</button>` : `<button class="btn small" type="button" data-rj="ask|${id}">Start joining again</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<p class="small muted">Nobody has signed in yet apart from the owners.</p>`}</div>`;
  }
  async function reset(id){
    const p = (S.rjPeople || {})[id] || {}, who = nameOfP(id, p) || id.slice(0, 8), done = [];
    const del = async (path, what) => { try { await S.db.doc(path).delete(); done.push(what); } catch(e){} };
    await del("join/" + id, "request"); await del("agr/" + id, "agreement"); await del("progress/" + id, "academy progress");
    if (sbx()) { try { const {error} = await sbx().from("profiles").update({active: false, book: false, supervised: false, contract_name: "", data: {}}).eq("id", id); if (!error) done.push("team access"); } catch(e){} }
    else await del("roster/" + id, "team access");
    if (S.joins) delete S.joins[id]; if (S.agrs) delete S.agrs[id]; if (S.roster) delete S.roster[id]; if (S.obProg) delete S.obProg[id];
    await audit("Joining started again", `${who}: ${done.join(", ") || "nothing to remove"}`);
    S.rjAsk = null; S.rjAt = 0; toast(`${who} starts again from the offer.`); render();
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-rj]"); if (!b || !S.isOwner) return; e.preventDefault();
    const [a, id] = b.dataset.rj.split("|");
    if (a === "ask") { S.rjAsk = id; render(); return; }
    if (a === "no") { S.rjAsk = null; render(); return; }
    if (a === "yes") { b.disabled = true; reset(id).catch(() => toast("Could not reset. Try again.")); }
  });
  const _vTeamRJ = vTeam; vTeam = function(){ return afterHead(_vTeamRJ(), panel()); };
  // reset at next sign-in (api/resetcheck.mjs): asked once per page load by everyone except owners, on the live portal only
  let rcDone = false;
  const _rnRC = renderNow; renderNow = function(){ _rnRC();
    if (rcDone || !window.__sb || window.__TEST_AS || !S.uid || S.isOwner || !S.role || S.role === "loading") return; rcDone = true;
    (async () => { try { const sess = (await window.__sb.auth.getSession()).data.session; if (!sess) return;
      const r = await fetch("/api/resetcheck", {method: "POST", headers: {authorization: "Bearer " + sess.access_token}}); const j = await r.json().catch(() => ({}));
      if (j.reset) { toast("Your joining steps start again from the offer."); setTimeout(() => location.reload(), 1200); } } catch(e){} })();
  };
  window.__rj = {reset};
})();
