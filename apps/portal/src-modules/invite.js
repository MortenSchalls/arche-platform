/* ---------- Invite someone to join (Morten, 28 Oct 2026: "I simply invite a person from the portal, and they receive all
   the needed on an email, log in and they are done") ----------
   Owner only, on Team. Name and email → /api/invite creates the login and emails a personal one-time link from the
   company domain. The person opens it, chooses a password and sees step 1, the offer. If the email cannot be sent, the
   owner gets the link to send by WhatsApp or another way. Recent invitations are listed (owner only, intel/invites). */
(function(){
  function panel(){
    if (!S.isOwner || S.preview) return "";
    if (!S.subs["intel/invites"]) watchDoc("intel/invites", snap => { S.invites = snap.exists ? (snap.data() || {}).list || [] : []; render(); });
    const r = S.invRes, list = (S.invites || []).slice(0, 8);
    return `<div class="panel stack" id="invPanel" style="margin-bottom:16px"><h2>Invite someone to join</h2>
      <p class="small muted">They get an email with a personal link. They choose a password and start at step 1: the offer, then the academy, assessment and agreement.</p>
      <form id="joinInvForm" class="fgrid"><label class="f" for="inv_name">First and last name<input id="inv_name" autocomplete="off" required value="${esc((S.invForm || {}).name || "")}"></label>
        <label class="f" for="inv_mail">Email<input id="inv_mail" type="email" autocomplete="off" required value="${esc((S.invForm || {}).email || "")}"></label>
        <div class="row" style="grid-column:1/-1"><button class="btn primary" type="submit" ${S.invBusy ? "disabled" : ""}>${S.invBusy ? "Sending…" : "Send invitation"}</button></div></form>
      ${r ? (r.ok ? `<div class="note ${r.sent === "sent" ? "info" : "warn"} small" id="invResult"><p><b>${r.sent === "sent" ? `Invitation emailed to ${esc(r.email)}.` : `Login created for ${esc(r.email)}, but the email was ${esc(r.sent)}.`}</b></p>
          <p>${r.sent === "sent" ? "If it does not arrive (check spam), send the link yourself:" : "Send this personal link yourself, by WhatsApp or email:"}</p>
          <div class="row"><button class="btn small" type="button" data-inv="copy">Copy the personal link</button></div><p class="muted">The link works once, for 24 hours. Send it only to this person.</p></div>`
        : `<div class="note warn small" id="invResult"><p>${esc(r.error || "Could not send the invitation.")}</p></div>`) : ""}
      ${list.length ? `<h3 style="margin:6px 0 0">Recent invitations</h3><div class="tbl"><table class="small"><thead><tr><th scope=col>Name</th><th scope=col>Email</th><th scope=col>Invited</th><th scope=col>Email sent</th></tr></thead><tbody>${list.map(x => `<tr><td>${esc(x.name || "")}</td><td>${esc(x.email || "")}</td><td>${fmtT(x.at)}</td><td>${x.sent ? "Yes" : "No: link given to you"}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>`;
  }
  async function send(){
    const name = ($("inv_name") || {}).value || "", email = ($("inv_mail") || {}).value || "";
    S.invForm = {name, email}; S.invBusy = true; S.invRes = null; render();
    try {
      const sess = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
      const r = await fetch("/api/invite", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || "")}, body: JSON.stringify({name: name.trim(), email: email.trim()})});
      const j = await r.json().catch(() => ({}));
      S.invRes = {...j, email: email.trim(), error: j.error || (r.ok ? "" : "The invitation service did not answer (" + r.status + ").")};
      if (j.ok) { S.invForm = null; S.invLink = j.link || ""; toast(j.sent === "sent" ? "Invitation sent." : "Login created. Send the link yourself."); }
    } catch(e){ S.invRes = {ok: false, error: "The invitation service could not be reached. Try again."}; }
    S.invBusy = false; render();
  }
  document.addEventListener("submit", e => { if (e.target && e.target.id === "joinInvForm") { e.preventDefault(); if (!S.invBusy) send(); } });
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-inv]"); if (!b) return; e.preventDefault();
    if (b.dataset.inv === "copy") { try { await navigator.clipboard.writeText(S.invLink || ""); toast("Link copied. Send it only to this person."); } catch(err){ prompt("Copy this personal link:", S.invLink || ""); } }
  });
  const _vTeamInv = vTeam; vTeam = function(){ return afterHead(_vTeamInv(), panel()); };
})();
