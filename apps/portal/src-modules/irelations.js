/* ---------- Navoryx investor relations: owner only (Morten, 5 Nov 2026) ----------
   The portal is the engine: who may open the private Navoryx investor briefing, invitations, access requests from the
   Navoryx investor page, briefing openings, stages and the waiting line per version. Stored on each record of the
   Director-only investor list (owner_prospects, data.ir). Emails are sent by /api/ir only when the Director presses Send. */
const IR_ST = {prospect: "Prospect", invited: "Invited", requested: "Asked for access", approved: "Access given", opened: "Briefing opened",
  conversation: "Conversation", nda: "NDA signed", documents: "Documents shared", committed: "Committed", notnow: "Not now"};
const IR_INT = {undecided: "Undecided", income: "Income", time: "Income and time aboard", both: "Both"};
const irOf = p => p.ir || {};
const irWaiting = p => Object.values(irOf(p).access || {}).some(a => a.requestedAt && !a.approved && !a.revoked);
const irOpened = p => Object.values(irOf(p).access || {}).some(a => (a.opens || []).length);
const irLine = p => ["conversation", "nda", "documents", "committed"].includes(irOf(p).stage) || (irOf(p).interest && irOf(p).interest !== "undecided" && irOf(p).stage !== "notnow");
async function irApi(body){
  const s = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
  if (!s) throw new Error("Not available in the test version.");
  const r = await fetch("/api/ir", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + s.access_token}, body: JSON.stringify(body)});
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || ("error " + r.status)); return j;
}
// summary above the investor list; each figure filters the list
function irOverview(all){
  const F = S.invF || {};
  const n = {wait: all.filter(irWaiting).length, given: all.filter(p => Object.values(irOf(p).access || {}).some(a => a.approved && !a.revoked)).length, opened: all.filter(irOpened).length};
  const line = all.filter(irLine).sort((a, b) => String(irOf(a).interestAt || "9").localeCompare(String(irOf(b).interestAt || "9")));
  const per = k => line.filter(p => (irOf(p).interest || "undecided") === k).length;
  const btn = (k, l, v) => `<button type="button" class="kpi kbtn" data-irf="${k}" aria-pressed="${F.ir === k}"><div class="l">${l}</div><div class="v">${v}</div></button>`;
  return `<div class="panel" style="margin-bottom:12px"><h2 style="margin:0 0 6px">Navoryx investor relations</h2>
    <p class="small muted"><button class="btn small" type="button" data-ir="preview" style="float:right;margin:0 0 6px 12px">Open the briefing</button>Who may open the private investor briefing on the Navoryx website. Requests from its investor page arrive here with their sanctions result; nobody gets access until you give it.</p>
    <div class="kpis">${btn("wait", "Asked for access, waiting for you", n.wait)}${btn("given", "Access given", n.given)}${btn("opened", "Opened the briefing", n.opened)}${btn("line", "Waiting line", line.length)}</div>
    ${line.length ? `<p class="small">Waiting line, in order of interest: ${["income", "time", "both", "undecided"].map(k => `${IR_INT[k]} ${per(k)}`).join(" · ")}</p>` : ""}</div>`;
}
function irFilter(p, f){
  return !f || (f === "wait" ? irWaiting(p) : f === "given" ? Object.values(irOf(p).access || {}).some(a => a.approved && !a.revoked) : f === "opened" ? irOpened(p) : f === "line" ? irLine(p) : true);
}
function irPanel(p){
  const ir = irOf(p), acc = ir.access || {}, reqs = (ir.requests || []).slice().reverse();
  const offered = (p.contacts || []).filter(c => c.email && !acc[String(c.email).toLowerCase()]);
  const C = S.irC && S.irC.id === p.id ? S.irC : null;
  const row = ([k, a]) => `<li><b>${esc(k)}</b> · ${a.revoked ? `<span class="chip c-cancelled">Withdrawn</span>` : a.approved ? `<span class="chip c-flown">Access given ${fmtD(a.at)}</span>` : `<span class="chip c-review">Asked ${fmtD(a.requestedAt)}</span>`}
    <br><span class="small muted">${a.invitedAt ? "invited " + fmtD(a.invitedAt) + " · " : ""}${(a.codes || []).length} code${(a.codes || []).length === 1 ? "" : "s"} · ${(a.opens || []).length} opening${(a.opens || []).length === 1 ? "" : "s"}${(a.opens || []).length ? ", last " + fmtT(a.opens[a.opens.length - 1]) : ""}</span>
    <span class="row" style="margin-top:4px">${a.approved && !a.revoked ? `<button class="btn small danger" type="button" data-ir="revoke" data-id="${esc(p.id)}" data-em="${esc(k)}">Withdraw access</button>`
      : k.startsWith("@") ? `<button class="btn small" type="button" data-ir="plain" data-id="${esc(p.id)}" data-em="${esc(k)}">Give access again</button>`
      : `<button class="btn small primary" type="button" data-ir="compose" data-kind="${a.requestedAt ? "approve" : "invite"}" data-id="${esc(p.id)}" data-em="${esc(k)}">${a.requestedAt ? "Write the approval email" : "Write the invitation"}</button><button class="btn small" type="button" data-ir="plain" data-id="${esc(p.id)}" data-em="${esc(k)}">Give access without email</button>`}</span></li>`;
  return `<div class="panel stack" id="irBox"><h3 style="margin:0">Navoryx investor relations</h3>
    <div class="row"><label class="f" for="irStage" style="flex:1">Stage<select id="irStage">${Object.entries(IR_ST).map(([k, v]) => `<option value="${k}" ${(ir.stage || "prospect") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="f" for="irInt" style="flex:1">Interest<select id="irInt">${Object.entries(IR_INT).map(([k, v]) => `<option value="${k}" ${(ir.interest || "undecided") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <button class="btn" type="button" data-ir="save" data-id="${esc(p.id)}" style="align-self:end">Save</button></div>
    ${ir.interestAt ? `<p class="small muted">In the waiting line since ${fmtD(ir.interestAt)}.</p>` : ""}
    ${reqs.length ? `<div><h3>Requests from the investor page</h3><ul class="avs">${reqs.slice(0, 5).map(r => `<li><span class="avt">${fmtD(r.at)}</span> <b>${esc(r.name)}</b> · ${esc(r.role || "")}${r.organisation ? " · " + esc(r.organisation) : ""} · ${esc(r.country || "")}
      <br><span class="small">Sanctions: <b>${esc((r.screening || {}).result || "not screened")}</b>${((r.screening || {}).hits || []).length ? " (" + r.screening.hits.map(h => esc(h.name) + " ≈ " + esc(h.listed) + " on " + esc(h.list)).join("; ") + ")" : ""}</span>${r.message ? `<br><span class="small muted">"${esc(r.message)}"</span>` : ""}</li>`).join("")}</ul></div>` : ""}
    <div><h3>Access to the briefing</h3>${Object.keys(acc).length ? `<ul class="avs">${Object.entries(acc).map(row).join("")}</ul>` : `<p class="small muted">Nobody on this record has access yet.</p>`}
      ${offered.length ? `<p class="small">Invite a contact on this record: ${offered.map(c => `<button class="btn small" type="button" data-ir="compose" data-kind="invite" data-id="${esc(p.id)}" data-em="${esc(String(c.email).toLowerCase())}">${esc(c.name)}</button>`).join(" ")}</p>` : `<p class="small muted">To invite someone, add them as a business contact above with their work email.</p>`}
      <details class="small"><summary>Give a whole organisation access by its email domain</summary><div class="row" style="margin-top:6px"><label class="f" for="irDom" style="flex:1">Domain<input id="irDom" placeholder="@family-office.com"></label><button class="btn small" type="button" data-ir="domain" data-id="${esc(p.id)}" style="align-self:end">Give access</button></div></details></div>
    ${C ? `<form class="panel stack" id="irMailForm" data-id="${esc(p.id)}"><h3 style="margin:0">${C.kind === "approve" ? "Approval email" : "Invitation"} to ${esc(C.email)}</h3>
      <p class="small muted">Read and change it as you like. Nothing is sent until you press Send; access is given only once the email has gone.</p>
      <label class="f" for="irSubj">Subject<input id="irSubj" value="${esc(C.subject || "")}"></label>
      <label class="f" for="irText">Text<textarea id="irText" rows="14">${esc(C.text || "")}</textarea></label>
      <div class="row"><button class="btn primary" type="submit">Send</button><button class="btn" type="button" data-ir="cancel">Cancel</button></div></form>` : ""}
    ${(ir.log || []).length ? `<details class="small"><summary>Investor relations log (${ir.log.length})</summary><div class="hist">${ir.log.slice().reverse().slice(0, 60).map(h => `<div><span class="muted mono">${fmtT(h.t)}</span><span>${esc(h.note)}</span></div>`).join("")}</div></details>` : ""}
  </div>`;
}
document.addEventListener("click", async e => {
  const f = e.target.closest("[data-irf]");
  if (f && invOwner()) { const F = S.invF || (S.invF = {q:"", track:"", for:"", status:"", potential:"", interest:"", industry:"", ticket:""}); F.ir = F.ir === f.dataset.irf ? "" : f.dataset.irf; render(); return; }
  const el = e.target.closest("[data-ir]"); if (!el || !invOwner()) return;
  const a = el.dataset.ir, id = el.dataset.id, em = el.dataset.em, p = id && (S.inv || {})[id];
  if (a === "preview") {   // opens the briefing as investors see it, no code; counted as your preview, not an investor opening
    const w = window.open("", "_blank");
    try { const j = await irApi({action: "preview"}); if (w) w.location.href = j.url; else location.href = j.url; }
    catch (err) { if (w) w.close(); toast(String(err.message || err)); }
    return;
  }
  if (a === "cancel") { S.irC = null; render(); return; }
  if (a === "save" && p) {
    const stage = $("irStage").value, interest = $("irInt").value; if (!IR_ST[stage] || !IR_INT[interest]) return;
    const ir = {...irOf(p)}, at = now(), notes = [];
    if (stage !== (ir.stage || "prospect")) notes.push("Stage: " + IR_ST[stage]);
    if (interest !== (ir.interest || "undecided")) { notes.push("Interest: " + IR_INT[interest]); if (!ir.interestAt && interest !== "undecided") ir.interestAt = at; }
    if (!notes.length) { toast("Nothing changed."); return; }
    await invSet(id, {...p, ir: {...ir, stage, interest, log: [...(ir.log || []), ...notes.map(n => ({t: at, note: n}))].slice(-200)}}); toast("Saved."); return;
  }
  try {
    if (a === "compose") { el.disabled = true; const d = await irApi({action: "draft", id, email: em, kind: el.dataset.kind}); S.irC = {id, email: em, kind: el.dataset.kind, ...d}; render(); const t = $("irText"); if (t) t.focus(); return; }
    if (a === "plain" || a === "domain") {
      const target = a === "domain" ? ($("irDom").value || "").trim().toLowerCase() : em;
      if (a === "domain" && !/^@[^@\s]+\.[a-z]{2,}$/.test(target)) { toast("Write the domain as @company.com"); return; }
      if (!el.dataset.armed) { el.dataset.armed = "1"; el.textContent = "Click again to give access"; setTimeout(() => { if (el.isConnected) delete el.dataset.armed; }, 6000); return; }
      await irApi({action: "approve", id, email: target}); toast("Access given. No email was sent: let them know yourself."); return;
    }
    if (a === "revoke") {
      if (!el.dataset.armed) { el.dataset.armed = "1"; el.textContent = "Click again to withdraw"; setTimeout(() => { if (el.isConnected) delete el.dataset.armed; }, 6000); return; }
      await irApi({action: "revoke", id, email: em}); toast("Access withdrawn. Codes already sent stop working at their 10-minute limit; an open briefing ends within 12 hours."); return;
    }
  } catch (err) { el.disabled = false; toast(String(err.message || err)); }
});
document.addEventListener("submit", async e => {
  if (e.target.id !== "irMailForm" || !invOwner()) return; e.preventDefault();
  const C = S.irC, btn = e.target.querySelector("button[type=submit]"); if (!C) return;
  btn.disabled = true; btn.textContent = "Sending…";
  try { await irApi({action: "send", id: C.id, email: C.email, kind: C.kind, subject: $("irSubj").value, text: $("irText").value}); S.irC = null; toast("Sent. Access given."); render(); }
  catch (err) { btn.disabled = false; btn.textContent = "Send"; toast(String(err.message || err)); }
});
