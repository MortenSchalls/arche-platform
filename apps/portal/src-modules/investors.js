/* ---------- Investors and strategic partners: owner only (Morten, 20 Oct 2026) ----------
   Data lives in the owner_prospects table, which the database shows to the owner and nobody else.
   Nothing here is written to the shared audit log, assigned, rotated or shown in preview mode. */
const INV_STATUS = {new:"New", review:"Your decision", researching:"Researching", contacted:"Contacted", talks:"In talks", notnow:"Not now", dnc:"Do not contact"};
const INV_TRACKS = ["Family office or UHNW office", "Aviation lender or lessor", "Private equity or private credit", "Bank or private bank", "Distribution partner for notes", "Strategic partner", "Adviser or placement agent"];
const INV_FOR = ["Navoryx aircraft notes", "Archē Executive", "Whole platform"];
const invOwner = () => S.isOwner && !S.preview;
function invTab(){
  if (!invOwner()) return "";
  const n = Object.keys(S.inv || {}).filter(k => k !== "_status").length;
  return `<button type="button" role="tab" class="btn ${S.pSec === "inv" ? "primary" : ""}" aria-selected="${S.pSec === "inv"}" data-act="pSec" data-sec="inv">Investors and partners · only you (${n})</button>`;
}
function vInvestors(){
  const every = Object.entries(S.prospects).map(([id, p]) => ({id, ...p})), nOps = every.filter(p => p.kind === "operator").length;
  const st = (S.inv || {})._status || null;
  const all = Object.entries(S.inv || {}).filter(([k]) => k !== "_status").map(([id, p]) => ({id, ...p}));
  const F = S.invF || (S.invF = {q:"", track:"", for:"", status:"", potential:"", interest:"", industry:"", ticket:""});
  const pr = p => p.profile || {};
  const q = F.q.trim().toLowerCase();
  const list = all.filter(p => (!F.track || p.track === F.track) && (!F.for || p.for === F.for) && (!F.status || (p.status || "new") === F.status)
    && (!F.potential || (p.potential || "Not scored") === F.potential) && (!F.interest || (pr(p).interests || []).includes(F.interest))
    && (!F.industry || (pr(p).industries || []).includes(F.industry)) && (!F.ticket || pr(p).ticket === F.ticket)
    && (!q || [p.org, p.type, p.country, p.city, p.why, p.track, ...(pr(p).industries || [])].join(" ").toLowerCase().includes(q)))
    .sort((a, b) => (a.status === "review" ? -1 : 0) - (b.status === "review" ? -1 : 0) || (b.score || 0) - (a.score || 0) || String(b.added || "").localeCompare(String(a.added || "")));
  const uniq = arr => [...new Set(arr.filter(Boolean))].sort();
  const counts = {High: 0, Medium: 0, Low: 0}; all.forEach(p => { if (counts[p.potential] !== undefined) counts[p.potential]++; });
  const sel = all.find(p => p.id === S.invSel);
  const sOpt = (id, label, vals, cur) => `<label class="f" for="${id}">${label}<select id="${id}" data-invf="${id.slice(3)}"><option value="">All</option>${vals.map(v => `<option value="${esc(v)}" ${cur === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
  return `<div class="head"><div><h1>Prospects</h1><p class="muted small">${all.length} ${all.length === 1 ? "investor or strategic partner" : "investors and strategic partners"}. <b>Only you can see this list:</b> the database shows it to no one else, and it is never assigned, rotated or written to the shared log.</p></div>
    <div class="row"><button class="btn" type="button" data-inv="new">Add investor or partner</button></div></div>
  <div class="row" role="tablist" aria-label="Prospect sections" style="margin-bottom:12px"><button type="button" role="tab" class="btn" aria-selected="false" data-act="pSec" data-sec="sales">Clients and partners (${every.length - nOps})</button><button type="button" role="tab" class="btn" aria-selected="false" data-act="pSec" data-sec="ops">Operators (${nOps})</button>${invTab()}</div>
  <div class="panel ai small" style="margin-bottom:12px"><b>AI review:</b> ${st ? `last run ${fmtT(st.lastRun)} · ${st.lastAdded || 0} added · next focus: ${esc(st.nextFocus || "rotating")}<br>${esc(st.note || "")}` : "runs every morning with the other research and covers three areas a day and adds up to 45 investors or partners, each with its public source, evidence and a sanctions pre-screen."}</div>
  <div class="kpis">${["High", "Medium", "Low"].map(k => `<button type="button" class="kpi kbtn" data-inv="pot" data-pot="${k}" aria-pressed="${F.potential === k}"><div class="l">${k} potential</div><div class="v">${counts[k]}</div></button>`).join("")}</div>
  <div class="panel filters">
    <label class="f" for="if_q">Search<input id="if_q" data-invf="q" value="${esc(F.q)}" placeholder="Name, country, type…"></label>
    ${sOpt("if_track", "Track", INV_TRACKS, F.track)}
    ${sOpt("if_for", "For", INV_FOR, F.for)}
    ${sOpt("if_potential", "Potential", ["High", "Medium", "Low", "Not scored"], F.potential)}
    ${sOpt("if_interest", "Interest", uniq(all.flatMap(p => pr(p).interests || [])), F.interest)}
    ${sOpt("if_industry", "Industry", uniq(all.flatMap(p => pr(p).industries || [])), F.industry)}
    ${sOpt("if_ticket", "Ticket size", ["Under USD 1m", "USD 1–10m", "USD 10–50m", "Over USD 50m", "Unknown"], F.ticket)}
    <label class="f" for="if_status">Status<select id="if_status" data-invf="status"><option value="">All</option>${Object.entries(INV_STATUS).map(([k, v]) => `<option value="${k}" ${F.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
    <div class="row" style="align-self:end"><span class="small muted">${list.length} shown</span><button class="btn small" type="button" data-inv="clear">Clear filters</button></div>
  </div>
  <div class="grid2"><div class="panel"><div class="tbl"><table class="ptable"><thead><tr><th>Organisation</th><th>Country</th><th>Status</th></tr></thead><tbody>
    ${list.map(p => `<tr data-invsel="${esc(p.id)}" tabindex="0" aria-selected="${S.invSel === p.id}" class="${S.invSel === p.id ? "sel" : ""}"><td><b>${esc(p.org)}</b>${p.potential ? ` <span class="chip ${p.potential === "High" ? "c-flown" : p.potential === "Medium" ? "c-quoted" : "c-returned"}">${esc(p.potential)} · ${p.score}</span>` : ""}<br><span class="small muted">${esc(p.track || "")}${p.for ? " · " + esc(p.for) : ""}</span></td><td>${esc(p.country || "")}</td><td><span class="chip ${p.status === "review" ? "c-review" : p.status === "talks" ? "c-flown" : p.status === "dnc" ? "c-cancelled" : "c-quoted"}">${INV_STATUS[p.status || "new"] || "New"}</span></td></tr>`).join("") || `<tr><td colspan="3" class="muted">No investors or partners match these filters.</td></tr>`}
  </tbody></table></div></div>
  <div class="pdetail">${S.invNew ? invForm() : sel ? invDetail(sel) : `<div class="panel empty"><p>Select an investor or partner.</p></div>`}</div></div>`;
}
function invDetail(p){
  const sc = (p.screen || {}).auto;
  return `<div class="panel stack"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(p.org)}</h2><span class="chip c-quoted">${INV_STATUS[p.status || "new"] || "New"}</span></div>
    <p class="small muted">${esc(p.track || "")} · for ${esc(p.for || "Whole platform")}${p.type ? " · " + esc(p.type) : ""} · ${esc([p.city, p.country].filter(Boolean).join(", "))}</p>
    ${p.status === "review" ? `<div class="note warn small"><b>Your decision:</b> possible sanctions match. Check the names against the list before any contact.</div>` : ""}
    <div><h3>Why them</h3><p>${esc(p.why || "")}</p></div>
    ${invProfile(p)}
    ${(p.evidence || []).length ? `<div><h3>Evidence</h3><ul class="small">${p.evidence.map(x => `<li>${esc(x.summary)} · <a href="${esc(x.url)}" target="_blank" rel="noopener">source</a></li>`).join("")}</ul></div>` : ""}
    <div><h3>How to approach</h3><p>${esc(p.approach || "")}</p></div>
    <div><h3>Contact routes</h3>${avenuesHtml(p)}</div>
    <div><h3>Source</h3><p class="small">${p.source ? `<a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.source)}</a>` : "Added by hand"}${p.aiReviewed ? ` · AI reviewed ${fmtD(p.aiReviewed)}` : ""}${p.movedFrom ? ` · moved from the shared prospect list ${fmtD(p.movedAt)}` : ""}</p></div>
    <div><h3>Sanctions</h3><p class="small">${sc ? `Automatic check ${fmtD(sc.at)} against ${esc((sc.lists || []).join(", ") || "no lists")}: <b>${esc(sc.result)}</b>${(sc.hits || []).length ? ` (${sc.hits.map(h => esc(h.name) + " ≈ " + esc(h.listed) + " on " + esc(h.list)).join("; ")})` : ""}.` : "Not checked yet: the morning run screens it."} Screen the organisation and its owners yourself before any agreement.</p></div>
    <div class="row"><label class="f" for="invStatus" style="flex:1">Status<select id="invStatus">${Object.entries(INV_STATUS).map(([k, v]) => `<option value="${k}" ${(p.status || "new") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label><button class="btn primary" type="button" data-inv="status" data-id="${esc(p.id)}">Save status</button></div>
    <div><h3>Notes</h3><label class="f" for="invNote">New note<textarea id="invNote" rows="3" placeholder="Meeting, introduction, next step…"></textarea></label><div class="row" style="margin-top:6px"><button class="btn" type="button" data-inv="note" data-id="${esc(p.id)}">Add note</button></div>
      ${(p.log || []).length ? `<div class="hist">${p.log.slice().reverse().map(h => `<div><span class="muted mono">${fmtT(h.t)}</span><span>${esc(h.note)}</span></div>`).join("")}</div>` : ""}</div>
  </div>`;
}
function invProfile(p){
  const pr = p.profile; if (!pr) return `<div><h3>Profile</h3><p class="small muted">Not researched yet: the morning run adds portfolio size, interests, industries and a fit score.</p></div>`;
  return `<div><h3>Profile and fit</h3>
    <p>${p.potential ? `<span class="chip ${p.potential === "High" ? "c-flown" : p.potential === "Medium" ? "c-quoted" : "c-returned"}">${esc(p.potential)} potential · ${p.score}/100</span>` : ""}</p>
    ${(p.reasons || []).length ? `<ul class="small">${p.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
    <ul class="avs">
      <li><span class="avt">Portfolio</span> ${pr.aum ? esc(pr.aum) + (pr.aumSource ? ` · <a href="${esc(pr.aumSource)}" target="_blank" rel="noopener">source</a>` : "") : "not published"}</li>
      <li><span class="avt">Ticket size</span> ${esc(pr.ticket || "Unknown")}</li>
      <li><span class="avt">Interests</span> ${esc((pr.interests || []).join(", ") || "not found")}</li>
      <li><span class="avt">Industries</span> ${esc((pr.industries || []).join(", ") || "not found")}</li>
      <li><span class="avt">Aviation</span> ${esc({direct: "invests in or finances aviation", indirect: "transport or adjacent exposure", none: "none found"}[pr.aviation] || "none found")}</li>
      <li><span class="avt">Invests in</span> ${esc((pr.geo || []).join(", ") || "not found")}</li>
    </ul><p class="small muted">The score ranks fit only. Whether they want to be involved is for your conversation.</p></div>`;
}
function invForm(){
  return `<form id="invForm" class="panel stack"><h2>Add investor or partner</h2><p class="small muted">Organisations only. Keep a public source for every entry.</p><div class="fgrid">
    <label class="f" for="iv_org">Organisation<input id="iv_org" required></label>
    <label class="f" for="iv_track">Track<select id="iv_track">${INV_TRACKS.map(t => `<option>${esc(t)}</option>`).join("")}</select></label>
    <label class="f" for="iv_for">For<select id="iv_for">${INV_FOR.map(t => `<option>${esc(t)}</option>`).join("")}</select></label>
    <label class="f" for="iv_cty">Country<input id="iv_cty"></label>
    <label class="f" for="iv_web">Website<input id="iv_web" placeholder="https://"></label>
    <label class="f" for="iv_src">Public source<input id="iv_src" placeholder="https://"></label></div>
    <label class="f" for="iv_why">Why them<textarea id="iv_why" rows="3"></textarea></label>
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-inv="cancel">Cancel</button></div></form>`;
}
async function invSet(id, data){ await S.db.doc("owner/" + id).set(data); }
function invNextId(){ const n = Object.keys(S.inv || {}).reduce((m, k) => Math.max(m, parseInt(k.replace(/\D/g, ""), 10) || 0), 0); return "i" + String(n + 1).padStart(3, "0"); }
document.addEventListener("click", async e => {
  const sel = e.target.closest("[data-invsel]");
  if (sel && invOwner()) { S.invSel = sel.dataset.invsel; S.invNew = false; render(); return; }
  const el = e.target.closest("[data-inv]"); if (!el || !invOwner()) return;
  const a = el.dataset.inv, id = el.dataset.id, p = id && (S.inv || {})[id];
  if (a === "new") { S.invNew = true; S.invSel = null; render(); return; }
  if (a === "cancel") { S.invNew = false; render(); return; }
  if (a === "clear") { S.invF = null; render(); return; }
  if (a === "pot") { const F = S.invF || (S.invF = {q:"", track:"", for:"", status:"", potential:"", interest:"", industry:"", ticket:""}); F.potential = F.potential === el.dataset.pot ? "" : el.dataset.pot; render(); return; }
  if (a === "status" && p) { const v = $("invStatus").value; if (!INV_STATUS[v]) return; await invSet(id, {...p, status: v, log: [...(p.log || []), {t: now(), note: "Status: " + INV_STATUS[v]}]}); toast("Status saved."); return; }
  if (a === "note" && p) { const n = $("invNote").value.trim(); if (!n) { toast("Write the note first."); return; } await invSet(id, {...p, log: [...(p.log || []), {t: now(), note: n.slice(0, 2000)}]}); toast("Note added."); return; }
  if (a === "moveFrom") {   // from the shared prospect list into the owner-only list; two clicks so it is never done by accident
    const src = S.prospects[id]; if (!src) return;
    if (!el.dataset.armed) { el.dataset.armed = "1"; el.textContent = "Click again to move (only you will see it)"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = "Move to investors and partners"; } }, 6000); return; }
    const nid = invNextId(), keep = ({org, country, city, region, website, source, why, approach, avenues}) => ({org, country, city, region, website, source, why, approach, avenues});
    try {
      await invSet(nid, {...keep(src), track: "Strategic partner", for: "Whole platform", type: src.segment || "", status: "new", added: now(), movedFrom: true, movedAt: now(), log: [{t: now(), note: "Moved from the shared prospect list"}]});
      await S.db.doc("prospects/" + id).delete();
      S.pSec = "inv"; S.invSel = nid; S.pSel = null; toast("Moved. Only you can see it now."); render();
    } catch (err) { toast("Could not move: " + (err.code === "permission_denied" ? "the owner-only table is not set up yet (run 0004 in Supabase)." : "try again.")); }
  }
});
document.addEventListener("input", e => { const k = e.target.dataset && e.target.dataset.invf; if (!k || !invOwner()) return; (S.invF || (S.invF = {q:"", track:"", for:"", status:"", potential:"", interest:"", industry:"", ticket:""}))[k] = e.target.value; if (e.target.tagName === "SELECT") render(); else { clearTimeout(S.invT); S.invT = setTimeout(() => { render(); const i = $("if_q"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); } });
document.addEventListener("submit", async e => {
  if (e.target.id !== "invForm" || !invOwner()) return; e.preventDefault();
  const org = $("iv_org").value.trim(); if (!org) { toast("Add the organisation's name."); return; }
  const nid = invNextId();
  try { await invSet(nid, {org, track: $("iv_track").value, for: $("iv_for").value, country: $("iv_cty").value.trim(), website: $("iv_web").value.trim(), source: $("iv_src").value.trim(), why: $("iv_why").value.trim(), status: "new", added: now(), addedBy: S.uid, log: []});
    S.invNew = false; S.invSel = nid; toast("Saved. Only you can see it."); render(); }
  catch (err) { toast(err.code === "permission_denied" ? "The owner-only table is not set up yet (run 0004 in Supabase)." : "Could not save."); }
});
