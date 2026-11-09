/* ---------- Invite someone to join (Morten, 28 Oct 2026: "I simply invite a person from the portal, and they receive all
   the needed on an email, log in and they are done") ----------
   Owner only, on Team. Name and email → /api/invite creates the login and emails a personal one-time link from the
   company domain. The person opens it, chooses a password and sees step 1, the offer. If the email cannot be sent, the
   owner gets the link to send by WhatsApp or another way. Recent invitations are listed (owner only, intel/invites). */
(function(){
  function panel(){
    if (!S.isOwner || S.preview) return "";
    if (!S.subs["intel/invites"]) watchDoc("intel/invites", snap => { S.invites = snap.exists ? (snap.data() || {}).list || [] : []; S.invStAt = 0; render(); });
    states();
    const r = S.invRes, list = [...(S.invites || []).slice(0, 30), ...(S.invExtra || [])];
    return `<style>#invPanel .invm{display:none}@media (max-width:640px){#invPanel .tbl table,#invPanel .tbl tbody,#invPanel .tbl tr,#invPanel .tbl td{display:block;width:auto}#invPanel .tbl thead{display:none}#invPanel .tbl tr{padding:10px 0;border-bottom:1px solid var(--line,rgba(127,127,127,.25))}#invPanel .tbl td{border:0;padding:2px 0;white-space:normal}#invPanel .tbl tr:not(.invlog) td:first-child{font-weight:600}#invPanel .invm{display:inline!important}#invPanel .tbl tr.invlog{padding-top:0}}</style><div class="panel stack" id="invPanel" style="margin-bottom:16px"><h2>Invite someone to join</h2>
      <p class="small muted">They get an email with a personal link. They choose a password and start at step 1: the offer, then the academy, assessment and agreement.</p>
      <form id="joinInvForm" class="fgrid"><label class="f" for="inv_name">First and last name<input id="inv_name" autocomplete="off" required value="${esc((S.invForm || {}).name || "")}"></label>
        <label class="f" for="inv_mail">Email<input id="inv_mail" type="email" autocomplete="off" required value="${esc((S.invForm || {}).email || "")}"></label>
        <div class="row" style="grid-column:1/-1"><button class="btn primary" type="submit" ${S.invBusy ? "disabled" : ""}>${S.invBusy ? "Sending…" : "Send invitation"}</button></div></form>
      ${r ? (r.ok ? `<div class="note ${r.sent === "sent" ? "info" : "warn"} small" id="invResult"><p><b>${r.sent === "sent" ? `Invitation emailed to ${esc(r.email)}.` : `Login created for ${esc(r.email)}, but the email was ${esc(r.sent)}.`}</b></p>
          <p>${r.sent === "sent" ? "If it does not arrive (check spam), send the link yourself:" : "Send this personal link yourself, by WhatsApp or email:"}</p>
          <div class="row"><button class="btn small" type="button" data-inv="copy">Copy the personal link</button></div><p class="muted">The link works once and only for a short time. Send it only to this person.</p></div>`
        : `<div class="note warn small" id="invResult"><p>${esc(r.error || "Could not send the invitation.")}</p></div>`) : ""}
      ${list.length ? `<h3 style="margin:6px 0 0">Invitations: ${(() => { const st = S.invStates || {}, acc = list.filter(x => (st[x.email] || {}).accepted).length; return S.invStates ? `${list.length - acc} pending, ${acc} accepted` : "pending and accepted"; })()}</h3>${(() => { const st = S.invStates || {}, due = list.filter(x => { const g = (st[x.email] || {}).progress; return g && g.remind && g.remind.due; }), pw = list.filter(x => ((st[x.email] || {}).progress || {}).alert);
        const can = list.filter(x => { const s = st[x.email] || {}; return s.progress && s.progress.remind && s.step !== "On the team"; });
        const all = can.length ? `<div class="row" style="margin:6px 0"><button class="btn small" type="button" data-inv="remindall" aria-expanded="${S.invAll ? "true" : "false"}">Remind all (${can.length})</button></div>${S.invAll ? `<div class="note info small" id="invAllBox"><p><b>Send the reminder to ${can.length} ${can.length === 1 ? "person" : "people"}:</b> ${can.map(x => esc(x.name || x.email)).join(", ")}.</p><p class="muted">Everyone who has a login and is not yet on the team, quiet or not. Each gets their own next step and a fresh personal link; replies come to you. Nothing goes out until you press Send.</p><pre style="white-space:pre-wrap;font:inherit;margin:0;padding:10px;border:1px solid var(--line, rgba(127,127,127,.25));border-radius:6px">${esc(((st[can[0].email] || {}).progress.remind || {}).preview || "")}</pre><div class="row"><button class="btn small primary" type="button" data-inv="remindallgo" ${S.invBusy ? "disabled" : ""}>${S.invBusy ? "Sending…" : `Send to ${can.length}`}</button><button class="btn small" type="button" data-inv="remindall">Cancel</button></div></div>` : ""}` : "";
        return all + (due.length || pw.length ? `<div class="note info small" id="invTodo">${due.length ? `<p><b>Reminders ready: ${due.length}.</b> ${due.map(x => esc(x.name || x.email)).join(", ")} ${due.length > 1 ? "have" : "has"} been quiet for ${S.invRemDays || 3} days or more. Press Remind to read the email, then Send. Nothing goes out without you.</p>` : ""}${pw.length ? `<p><b>Password never set: ${pw.map(x => esc(x.name || x.email)).join(", ")}.</b> Press Send again to email a new password link.</p>` : ""}</div>` : ""); })()}<div class="tbl"><table class="small"><thead><tr><th scope=col>Name</th><th scope=col>Email</th><th scope=col>Invited</th><th scope=col>Email sent</th><th scope=col>Accepted</th><th scope=col>Progress</th><th scope=col></th></tr></thead><tbody>${list.map(x => { const st = (S.invStates || {})[x.email];
        const pg = st && st.progress, open = (S.invLog || {})[x.email];
        return `<tr><td>${esc(x.name || "")}</td><td>${esc(x.email || "")}</td><td>${fmtT(x.first || x.at)}${x.first && x.at && x.first !== x.at ? `<br><span class="muted">again ${fmtT(x.at)}</span>` : ""}</td><td><span class="invm">Email sent: </span>${x.notInvited ? `<span class="muted">Not invited from Team</span>` : x.sent ? "Yes" : "No: link given to you"}</td><td><span class="invm">Accepted: </span>${!st ? `<span class="muted">Checking…</span>` : st.accepted ? `<span class="chip c-flown">Yes</span> <span class="muted">${fmtT(st.signedIn)}</span>` : `<span class="chip c-enquiry">Not yet</span>`}${pg ? "" : `<br><span class="muted">${esc(st ? st.step : "")}</span>`}</td>
          <td style="min-width:200px">${pg ? invBar(pg) + invFlags(x, pg) : `<span class="muted">${st ? "" : "Checking…"}</span>`}</td><td><div class="row" style="flex-wrap:nowrap">${pg ? `<button class="btn small" type="button" data-inv="log|${esc(x.email)}" aria-expanded="${open ? "true" : "false"}">${open ? "Hide log" : "Log"}</button>` : ""}<button class="btn small" type="button" data-inv="again|${esc(x.email)}|${esc(x.name || "")}">Send again</button>${st && st.step === "On the team" ? "" : `<button class="btn small" type="button" data-inv="del|${esc(x.email)}" aria-expanded="${(S.invDel || "") === x.email ? "true" : "false"}">Delete</button>`}</div></td></tr>
          ${(S.invDel || "") === x.email ? `<tr class="invlog"><td colspan="7"><div class="note warn small" id="invDelBox"><p><b>Delete ${esc(x.name || x.email)} and everything kept about them?</b> This cannot be undone. Their login, joining progress, academy progress, training, uploaded files and this invitation are deleted, and their name is taken out of the audit log (the actions stay). It is refused if they have a signed agreement, trips, payouts or screening records; use End engagement for those.</p><div class="row"><button class="btn small danger" type="button" data-inv="delgo|${esc(x.email)}|${esc(x.name || "")}" ${S.invBusy ? "disabled" : ""}>Delete everything</button><button class="btn small" type="button" data-inv="del|${esc(x.email)}">Cancel</button></div></div></td></tr>` : ""}
          ${pg && (S.invRem || {})[x.email] && pg.remind ? `<tr class="invlog"><td colspan="7">${invRemind(x, pg)}</td></tr>` : ""}
          ${pg && open ? `<tr class="invlog"><td colspan="7">${invLog(x, pg)}</td></tr>` : ""}`; }).join("")}</tbody></table></div>` : ""}</div>`;
  }
  // exact progress: a bar, the step they are on, and a log the Director can open (Morten, 2 Nov 2026)
  function invBar(pg){
    return `<div class="small"><div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pg.pct}" aria-label="Joining progress" style="height:6px;background:var(--line, rgba(127,127,127,.25));border-radius:3px;overflow:hidden;margin:2px 0 6px"><div style="height:100%;width:${Math.max(2, pg.pct)}%;background:var(--primary-bg)"></div></div>
      <b>${pg.pct}%</b> · ${pg.done} of ${pg.of} steps<br><span>${esc(pg.label)}</span>${pg.lastSeen ? `<br><span class="muted">Last signed in ${fmtT(pg.lastSeen)}</span>` : ""}</div>`;
  }
  // flags under the bar: no password set; reminder ready (Morten, 4 Nov 2026)
  function invFlags(x, pg){
    const r = pg.remind, out = [];
    if (pg.alert) out.push(`<span class="chip c-review">No password set</span> <span class="muted">Send again gives a new password link</span>`);
    if (r && r.next) out.push(`<span class="muted">Next: ${esc(r.next.title)}${r.next.min ? ` · about ${r.next.min} min` : ""}</span>`);
    if (r && r.due) out.push(`<span class="chip c-enquiry">Quiet ${r.quiet} days</span> <button class="btn small" type="button" data-inv="remind|${esc(x.email)}" aria-expanded="${(S.invRem || {})[x.email] ? "true" : "false"}">Remind</button>`);
    else if (r && r.lastSent) out.push(`<span class="muted">Reminder sent ${fmtT(r.lastSent)}</span>`);
    return out.length ? `<div class="small" style="margin-top:4px;display:flex;flex-direction:column;gap:3px">${out.map(o => `<div>${o}</div>`).join("")}</div>` : "";
  }
  function invRemind(x, pg){
    const r = pg.remind;
    return `<div class="stack small" id="invRem_${esc(x.email).replace(/[^a-z0-9]/gi, "_")}"><h3 style="margin:4px 0">Reminder to ${esc(x.name || x.email)}</h3>
      <p class="muted">Subject: Your next step with Archē Executive. Sent from Archē's welcome address; replies come to you, and you get a hidden copy. Their personal link is added when you send.${r.sent ? ` Sent before: ${r.sent} time${r.sent > 1 ? "s" : ""}, last ${fmtT(r.lastSent)}.` : ""}</p>
      <pre style="white-space:pre-wrap;font:inherit;margin:0;padding:10px;border:1px solid var(--line, rgba(127,127,127,.25));border-radius:6px">${esc(r.preview || "")}</pre>
      <div class="row"><button class="btn small primary" type="button" data-inv="remindsend|${esc(x.email)}|${esc(x.name || "")}" ${S.invBusy ? "disabled" : ""}>Send this reminder</button><button class="btn small" type="button" data-inv="remind|${esc(x.email)}">Cancel</button></div></div>`;
  }
  function invLog(x, pg){
    const steps = `<ol class="small" style="margin:0;padding-left:20px">${pg.steps.map(s => `<li style="margin:2px 0">${s.done ? '<span class="chip c-flown">Done</span>' : s === pg.steps.find(z => !z.done) ? '<span class="chip c-review">Now</span>' : '<span class="chip c-enquiry">Next</span>'} <b>${esc(s.t)}</b>${s.at ? ` <span class="muted">${fmtT(s.at)}</span>` : ""}${s.note ? ` <span class="muted">· ${esc(s.note)}</span>` : ""}</li>`).join("")}</ol>`;
    const log = pg.log.length ? `<ul class="small" style="margin:0;padding-left:18px">${pg.log.map(l => `<li style="margin:2px 0"><span class="muted mono">${l.at ? fmtT(l.at) : "no date"}</span> ${esc(l.t)}</li>`).join("")}</ul>` : `<p class="small muted">Nothing recorded yet.</p>`;
    return `<div class="fgrid" id="invLog_${esc(x.email).replace(/[^a-z0-9]/gi, "_")}" style="align-items:start"><div><h3 style="margin:4px 0">Steps: ${esc(x.name || x.email)}</h3>${steps}</div><div><h3 style="margin:4px 0">Log, newest first</h3>${log}${pg.history === "partial" ? `<p class="small muted" style="margin-top:6px">Every sign-in and password change appears here once SQL 0021 (joining history) has run: see your list on Today.</p>` : ""}</div></div>`;
  }
  async function states(){   // who has accepted: asked at most once a minute while Team is open
    if (S.invStBusy || (S.invStAt && Date.now() - S.invStAt < 60e3)) return;
    S.invStBusy = true; S.invStAt = Date.now();
    try { const sess = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
      const r = await fetch("/api/invite", {headers: {authorization: "Bearer " + ((sess || {}).access_token || "")}}); const j = await r.json().catch(() => ({}));
      if (j.states) { S.invStates = j.states; S.invExtra = j.extra || []; S.peopleEmails = j.people || S.peopleEmails || {}; render(); } } catch(e){}
    S.invStBusy = false;
  }
  // every reminder in one go (Morten, 9 Nov 2026), one person after another, each with their own next step and link
  async function remindAll(){
    const st = S.invStates || {}, list = [...(S.invites || []).slice(0, 30), ...(S.invExtra || [])].filter(x => { const s = st[x.email] || {}; return s.progress && s.progress.remind && s.step !== "On the team"; });
    S.invBusy = true; render(); let ok = 0, no = [];
    const sess = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
    for (const x of list) {
      try { const r = await fetch("/api/invite", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || "")}, body: JSON.stringify({name: (x.name || x.email).trim(), email: x.email, mode: "remind"})});
        const j = await r.json().catch(() => ({})); if (j.ok && j.sent === "sent") ok++; else no.push(x.name || x.email); } catch(e){ no.push(x.name || x.email); }
    }
    S.invBusy = false; S.invAll = false; S.invStAt = 0;
    toast(`Reminders sent: ${ok}.` + (no.length ? ` Not sent: ${no.join(", ")} (send those one by one).` : "")); render();
  }
  async function send(again, mode){
    const name = again ? again.name : ($("inv_name") || {}).value || "", email = again ? again.email : ($("inv_mail") || {}).value || "";
    S.invForm = {name, email}; S.invBusy = true; S.invRes = null; render();
    try {
      const sess = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
      const r = await fetch("/api/invite", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || "")}, body: JSON.stringify({name: name.trim(), email: email.trim(), ...(mode ? {mode} : {})})});
      const j = await r.json().catch(() => ({}));
      S.invRes = {...j, email: email.trim(), error: j.error || (r.ok ? "" : "The invitation service did not answer (" + r.status + ").")};
      if (j.ok && mode === "remind") { S.invForm = null; S.invLink = j.link || ""; S.invStAt = 0; (S.invRem || {})[email] = false; S.invRes = j.sent === "sent" ? null : S.invRes; toast(j.sent === "sent" ? "Reminder sent to " + email + "." : "Reminder not emailed (" + j.sent + "). Send the link yourself."); }
      else if (j.ok) { if (!again) S.invForm = null; S.invLink = j.link || ""; S.invStAt = 0; toast(j.sent === "sent" ? (again ? "New link sent to " + email + "." : "Invitation sent.") : "Login ready. Send the link yourself."); }
    } catch(e){ S.invRes = {ok: false, error: "The invitation service could not be reached. Try again."}; }
    S.invBusy = false; render();
  }
  document.addEventListener("submit", e => { if (e.target && e.target.id === "joinInvForm") { e.preventDefault(); if (!S.invBusy) send(); } });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-inv]"); if (!b) return; e.preventDefault();
    if (b.dataset.inv.startsWith("log|")) { const em = b.dataset.inv.slice(4); S.invLog = S.invLog || {}; S.invLog[em] = !S.invLog[em]; if (S.invLog[em]) S.invStAt = 0; render(); return; }
    if (b.dataset.inv.startsWith("remind|")) { const em = b.dataset.inv.slice(7); S.invRem = S.invRem || {}; S.invRem[em] = !S.invRem[em]; render(); return; }
    if (b.dataset.inv === "remindall") { S.invAll = !S.invAll; render(); return; }
    if (b.dataset.inv === "remindallgo") { if (!S.invBusy) remindAll(); return; }
    if (b.dataset.inv.startsWith("remindsend|")) { const [, email, name] = b.dataset.inv.split("|"); if (!S.invBusy) send({email, name: name || email}, "remind"); return; }
    if (b.dataset.inv.startsWith("del|")) { const em = b.dataset.inv.slice(4); S.invDel = S.invDel === em ? "" : em; render(); return; }
    if (b.dataset.inv.startsWith("delgo|")) { const [, email, name] = b.dataset.inv.split("|"); if (S.invBusy) return; S.invBusy = true; render();
      try { const sess = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
        const r = await fetch("/api/invite", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || "")}, body: JSON.stringify({mode: "delete", email, name})});
        const j = await r.json().catch(() => ({}));
        if (j.ok) { S.invDel = ""; delete (S.invStates || {})[email]; S.invites = (S.invites || []).filter(z => z.email !== email); S.invExtra = (S.invExtra || []).filter(z => z.email !== email); S.invStAt = 0; S.invRes = null; toast((name || email) + " and all their data deleted."); }
        else S.invRes = {ok: false, error: j.error || "Could not delete (" + r.status + ")."};
      } catch(err){ S.invRes = {ok: false, error: "The invitation service could not be reached. Try again."}; }
      S.invBusy = false; S.invStAt = 0; render(); return; }
    if (b.dataset.inv.startsWith("again|")) { const [, email, name] = b.dataset.inv.split("|"); if (!S.invBusy) send({email, name: name || email}); return; }
    if (b.dataset.inv === "copy") { try { await navigator.clipboard.writeText(S.invLink || ""); toast("Link copied. Send it only to this person."); } catch(err){ prompt("Copy this personal link:", S.invLink || ""); } }
  });
  const _vTeamInv = vTeam; vTeam = function(){ return afterHead(_vTeamInv(), panel()); };
})();
