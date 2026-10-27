/* ---------- Sanctions watch (Morten, 27 Oct 2026) ----------
   The weekly job (jobs/regimes.mjs) reads which sanctions programmes the official UN, US, EU and UK lists contain and
   writes intel/sanctions-regimes. When a programme is added or removed, or a list could not be read twice in a row,
   the owner sees it on Today and in Team, reviews the website's excluded places (apps/website/content/excluded.json),
   manual Appendix G.2 and KYC, asks Claude to update them if needed, then presses "Mark reviewed".
   People and companies are screened per booking and per operator against the same lists. */
(function(){
  S.sw = S.sw || {loaded: false, data: null};
  function load(){
    if (S.sw.loading || S.sw.loaded || !S.isOwner) return; S.sw.loading = true;
    S.db.doc("intel/sanctions-regimes").get().then(d => { S.sw.data = d.exists ? d.data() : null; }, () => { S.sw.data = null; })
      .finally(() => { S.sw.loading = false; S.sw.loaded = true; render(); });
  }
  const LIST = {"OFAC SDN": "United States (OFAC)", "UN": "United Nations", "EU": "European Union", "UK": "United Kingdom"};
  function panel(){
    if (!S.isOwner || acting() !== "owner") return ""; load(); const d = S.sw.data;
    const head = `<div class="panel" style="margin-bottom:16px"><h2>Sanctions watch</h2><p class="small muted">Every Monday the portal reads the official UN, US, EU and UK sanctions lists. A new or ended sanctions programme, or a list that cannot be read, shows here so the website's excluded places, the manual and KYC stay current. People and companies are screened on every booking and operator against the same lists.</p>`;
    if (!S.sw.loaded) return head + `<p class="small muted">Loading…</p></div>`;
    if (!d) return head + `<p class="small">Not run yet. The first run on Monday stores today's programmes as the starting point. To run it now: GitHub → Actions → Portal jobs → Run workflow → regimes.</p></div>`;
    const lists = Object.entries(d.latest || {}).map(([k, v]) => `${LIST[k] || k}: ${v.length} programmes`).join(" · ");
    const open = (d.open || []).map(c => `<div class="flag"><span class="sev high" aria-hidden="true"></span><div><p>${esc(LIST[c.list] || c.list)}: ${c.added.length ? "new " + esc(c.added.join(", ")) : ""}${c.added.length && c.removed.length ? "; " : ""}${c.removed.length ? "ended " + esc(c.removed.join(", ")) : ""}</p><p class="small muted">Seen ${esc(fmtD(c.at))}</p></div></div>`).join("");
    const fail = (d.failed || []).length ? `<div class="note warn small">Could not read: ${esc(d.failed.map(x => LIST[x] || x).join(", "))}${d.failRuns >= 2 ? " (two runs in a row; check the job in GitHub Actions)" : " (will try again next week)"}.</div>` : "";
    return head + `<p class="small">Last checked ${esc(fmtT(d.checkedAt))}. ${esc(lists)}.</p>${fail}${open}
      ${d.review ? `<p class="small">Review: ask Claude to compare the change with the website's excluded places, manual Appendix G.2 and KYC, and update them where needed. Then mark it reviewed.</p><button class="btn small primary" type="button" data-sw="ok">Mark reviewed</button>` : `<p class="small muted">Nothing to review.</p>`}</div>`;
  }
  window.sanctionsPrompt = function(){
    if (!S.isOwner || acting() !== "owner") return ""; load(); const d = S.sw.data;
    if (!d || !d.review) return "";
    return `<div class="note warn" style="margin-bottom:16px"><b>Sanctions lists changed.</b> A sanctions programme was added or ended, or a list could not be read. <a href="#" data-view="team">Review it in Team</a>.</div>`;
  };
  const _vTeam = vTeam; vTeam = function(){ return afterHead(_vTeam(), panel()); };
  const _vToday = vToday; vToday = function(){ return afterHead(_vToday(), sanctionsPrompt()); };
  document.addEventListener("click", async ev => {
    const b = ev.target.closest("[data-sw]"); if (!b || !S.isOwner) return; ev.preventDefault();
    const d = S.sw.data; if (!d) return;
    const next = {...d, baseline: {...(d.baseline || {}), ...(d.latest || {})}, open: [], review: false, failRuns: 0, reviewedAt: now(), reviewedBy: S.uid};
    try { await S.db.doc("intel/sanctions-regimes").set(next); S.sw.data = next; audit("Sanctions changes reviewed", (d.open || []).map(c => c.list).join(", ")); toast("Marked reviewed."); render(); }
    catch(e){ toast("Could not save."); }
  });
})();
