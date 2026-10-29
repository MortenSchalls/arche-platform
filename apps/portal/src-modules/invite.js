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
    const r = S.invRes, list = (S.invites || []).slice(0, 8);
    return `<div class="panel stack" id="invPanel" style="margin-bottom:16px"><h2>Invite someone to join</h2>
      <p class="small muted">They get an email with a personal link. They choose a password and start at step 1: the offer, then the academy, assessment and agreement.</p>
      <form id="joinInvForm" class="fgrid"><label class="f" for="inv_name">First and last name<input id="inv_name" autocomplete="off" required value="${esc((S.invForm || {}).name || "")}"></label>
        <label class="f" for="inv_mail">Email<input id="inv_mail" type="email" autocomplete="off" required value="${esc((S.invForm || {}).email || "")}"></label>
        <div class="row" style="grid-column:1/-1"><button class="btn primary" type="submit" ${S.invBusy ? "disabled" : ""}>${S.invBusy ? "Sending…" : "Send invitation"}</button></div></form>
      ${r ? (r.ok ? `<div class="note ${r.sent === "sent" ? "info" : "warn"} small" id="invResult"><p><b>${r.sent === "sent" ? `Invitation emailed to ${esc(r.email)}.` : `Login created for ${esc(r.email)}, but the email was ${esc(r.sent)}.`}</b></p>
          <p>${r.sent === "sent" ? "If it does not arrive (check spam), send the link yourself:" : "Send this personal link yourself, by WhatsApp or email:"}</p>
          <div class="row"><button class="btn small" type="button" data-inv="copy">Copy the personal link</button></div><p class="muted">The link works once and only for a short time. Send it only to this person.</p></div>`
        : `<div class="note warn small" id="invResult"><p>${esc(r.error || "Could not send the invitation.")}</p></div>`) : ""}
      ${list.length ? `<h3 style="margin:6px 0 0">Invitations: ${(() => { const st = S.invStates || {}, acc = list.filter(x => (st[x.email] || {}).accepted).length; return S.invStates ? `${list.length - acc} pending, ${acc} accepted` : "pending and accepted"; })()}</h3><div class="tbl"><table class="small"><thead><tr><th scope=col>Name</th><th scope=col>Email</th><th scope=col>Invited</th><th scope=col>Email sent</th><th scope=col>Accepted</th><th scope=col></th></tr></thead><tbody>${list.map(x => { const st = (S.invStates || {})[x.email];
        return `<tr><td>${esc(x.name || "")}</td><td>${esc(x.email || "")}</td><td>${fmtT(x.at)}</td><td>${x.sent ? "Yes" : "No: link given to you"}</td><td>${!st ? `<span class="muted">Checking…</span>` : st.accepted ? `<span class="chip c-flown">Yes</span> <span class="muted">${fmtT(st.signedIn)}</span><br><span class="muted">${esc(st.step)}</span>` : `<span class="chip c-enquiry">Not yet</span><br><span class="muted">${esc(st.step)}</span>`}</td><td><button class="btn small" type="button" data-inv="again|${esc(x.email)}|${esc(x.name || "")}">Send again</button></td></tr>`; }).join("")}</tbody></table></div>` : ""}</div>`;
  }
  async function states(){   // who has accepted: asked at most once a minute while Team is open
    if (S.invStBusy || (S.invStAt && Date.now() - S.invStAt < 60e3)) return;
    S.invStBusy = true; S.invStAt = Date.now();
    try { const sess = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
      const r = await fetch("/api/invite", {headers: {authorization: "Bearer " + ((sess || {}).access_token || "")}}); const j = await r.json().catch(() => ({}));
      if (j.states) { S.invStates = j.states; S.peopleEmails = j.people || S.peopleEmails || {}; render(); } } catch(e){}
    S.invStBusy = false;
  }
  async function send(again){
    const name = again ? again.name : ($("inv_name") || {}).value || "", email = again ? again.email : ($("inv_mail") || {}).value || "";
    S.invForm = {name, email}; S.invBusy = true; S.invRes = null; render();
    try {
      const sess = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
      const r = await fetch("/api/invite", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || "")}, body: JSON.stringify({name: name.trim(), email: email.trim()})});
      const j = await r.json().catch(() => ({}));
      S.invRes = {...j, email: email.trim(), error: j.error || (r.ok ? "" : "The invitation service did not answer (" + r.status + ").")};
      if (j.ok) { if (!again) S.invForm = null; S.invLink = j.link || ""; S.invStAt = 0; toast(j.sent === "sent" ? (again ? "New link sent to " + email + "." : "Invitation sent.") : "Login ready. Send the link yourself."); }
    } catch(e){ S.invRes = {ok: false, error: "The invitation service could not be reached. Try again."}; }
    S.invBusy = false; render();
  }
  document.addEventListener("submit", e => { if (e.target && e.target.id === "joinInvForm") { e.preventDefault(); if (!S.invBusy) send(); } });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-inv]"); if (!b) return; e.preventDefault();
    if (b.dataset.inv.startsWith("again|")) { const [, email, name] = b.dataset.inv.split("|"); if (!S.invBusy) send({email, name: name || email}); return; }
    if (b.dataset.inv === "copy") { try { await navigator.clipboard.writeText(S.invLink || ""); toast("Link copied. Send it only to this person."); } catch(err){ prompt("Copy this personal link:", S.invLink || ""); } }
  });
  const _vTeamInv = vTeam; vTeam = function(){ return afterHead(_vTeamInv(), panel()); };
})();
