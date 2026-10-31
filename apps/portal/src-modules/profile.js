/* ---------- My profile (Morten, 29 Oct 2026: "a page where staff can insert and amend their own user profile and also
   change password") ----------
   Everyone signed in, including people still joining. Shows what Archē holds (name on the agreement, role, country,
   Archē email, sign-in email: changed only by the owner) and lets the person change their own contact details and
   their password. Saved through /api/me (only the allowed fields); the password through the sign-in service. */
(function(){
  const TZ = ["Asia/Bangkok", "Asia/Singapore", "Asia/Hong_Kong", "Asia/Tokyo", "Asia/Dubai", "Europe/London", "Europe/Copenhagen", "Europe/Bratislava", "Europe/Rome", "America/New_York"];
  async function load(){
    if (S.prLoading) return; S.prLoading = true;
    try {
      if (window.__sb && !window.__TEST_AS) { const u = (await window.__sb.auth.getUser()).data.user || {}; const {data} = await window.__sb.from("profiles").select("contract_name,role,base,data").eq("id", S.uid).maybeSingle();
        S.pr = {uid: S.uid, email: S.asUser ? ((data || {}).data || {}).email || ((data || {}).data || {}).invitedEmail || "" : u.email || "", name: (data || {}).contract_name || "", role: (data || {}).role || "", base: (data || {}).base || "", work: ((data || {}).data || {}).workEmail || "", self: ((data || {}).data || {}).self || {}}; }
      else { const d = await S.db.doc("roster/" + S.uid).get(), x = d.exists ? d.data() : {}; S.pr = {uid: S.uid, email: S.asUser ? (x.email || "") : "you@example.com", name: x.contractName || "", role: x.role || "", base: x.base || "", work: x.workEmail || "", self: x.self || {}}; }
    } catch(e){ S.pr = {self: {}}; }
    S.prLoading = false; render();
  }
  window.vProfile = function(){
    if (S.pr && S.pr.uid !== S.uid) S.pr = null;
    if (!S.pr) { load(); return `<div class="panel"><h1>My profile</h1><p class="small muted">Loading…</p></div>`; }
    const p = S.pr, s = p.self || {}, role = {owner: "Owner", ops: "Operations", broker: "Broker", consultant: "Charter consultant"}[p.role] || "Joining";
    const f = (id, label, v, extra = "") => `<label class="f" for="${id}">${label}<input id="${id}" value="${esc(v || "")}" ${extra}></label>`;
    return `<div class="head"><div><h1>My profile</h1><p class="muted small">Your details at Archē Executive, and your password.</p></div>${acting() === "pending" ? `<div class="row"><button class="btn" type="button" data-pr="back">Back to joining</button></div>` : ""}</div>
      <div class="grid2"><div class="panel stack"><h2>What Archē holds</h2>
        <table class="small"><tbody>
          <tr><th scope=row style="text-align:left">Name on your agreement</th><td>${esc(p.name || "Not given yet")}</td></tr>
          <tr><th scope=row style="text-align:left">Role</th><td>${esc(role)}</td></tr>
          <tr><th scope=row style="text-align:left">Country you work from</th><td>${esc(p.base || "Not given yet")}</td></tr>
          <tr><th scope=row style="text-align:left">Archē email</th><td>${esc(p.work || "Given when your agreement is countersigned")}</td></tr>
          <tr><th scope=row style="text-align:left">Sign-in email</th><td>${esc(p.email || (S.asUser ? "Not shown while seeing as someone" : ""))}</td></tr></tbody></table>
        <p class="small muted">To correct any of these, message the owner. Your name must match your passport.</p></div>
      <div class="stack"><form id="prForm" class="panel stack"><h2>Your contact details</h2><div class="fgrid">
          ${f("pr_pref", "Name you like to be called", s.preferredName, 'autocomplete="nickname"')}
          ${f("pr_mob", "Mobile, with country code", s.mobile, 'type="tel" autocomplete="tel" placeholder="+66 81 234 5678"')}
          ${f("pr_wa", "WhatsApp, if different", s.whatsapp, 'type="tel" placeholder="+66 81 234 5678"')}
          <label class="f" for="pr_tz">Your time zone<select id="pr_tz">${["", ...TZ].map(z => `<option value="${z}" ${s.timezone === z ? "selected" : ""}>${z ? z.replace("_", " ") : "Choose"}</option>`).join("")}</select></label>
          ${f("pr_lang", "Languages you work in", s.languages, 'placeholder="English, Thai"')}
          ${f("pr_av", "When you can usually be reached", s.availability, 'placeholder="Weekdays 09:00 to 18:00"')}</div>
          <div class="row"><button class="btn primary" type="submit">Save my details</button></div>
          <p class="small muted">Seen by Archē operations and the owner, to reach you about your trips. Never shown to clients.</p></form>
        ${S.asUser ? `<div class="panel"><h2>Change password</h2><p class="small muted">Only ${esc(S.asName)} can change their own password.</p></div>` : ""}<form id="prPw" class="panel stack" ${S.asUser ? "hidden" : ""}><h2>Change password</h2><div class="fgrid">
          <label class="f" for="pr_p1">New password (at least 10 characters)<input id="pr_p1" type="password" autocomplete="new-password"></label>
          <label class="f" for="pr_p2">New password again<input id="pr_p2" type="password" autocomplete="new-password"></label></div>
          <div class="row"><button class="btn" type="submit">Change password</button></div></form></div></div>`;
  };
  document.addEventListener("submit", async e => {
    if (e.target.id === "prForm") { e.preventDefault();
      const self = {preferredName: $("pr_pref").value, mobile: $("pr_mob").value, whatsapp: $("pr_wa").value, timezone: $("pr_tz").value, languages: $("pr_lang").value, availability: $("pr_av").value};
      try {
        if (window.__sb && !window.__TEST_AS) { const sess = (await window.__sb.auth.getSession()).data.session; const r = await fetch("/api/me", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + ((sess || {}).access_token || "")}, body: JSON.stringify({self})}); const j = await r.json().catch(() => ({})); if (!r.ok) { toast(j.error || "Could not save."); return; } S.pr.self = j.self; }
        else { const cur = (await S.db.doc("roster/" + S.uid).get()).data() || {}; await S.db.doc("roster/" + S.uid).set({...cur, self: {...(cur.self || {}), ...self}}); S.pr.self = {...S.pr.self, ...self}; }
        toast("Your details are saved."); render();
      } catch(err){ toast("Could not save. Try again."); }
      return; }
    if (e.target.id === "prPw") { e.preventDefault();
      const a = $("pr_p1").value, b = $("pr_p2").value;
      if (a.length < 10) { toast("At least 10 characters."); return; } if (a !== b) { toast("The two passwords are different."); return; }
      if (!window.__sb || window.__TEST_AS) { toast("Password changed (test version: nothing is changed)."); $("pr_p1").value = $("pr_p2").value = ""; return; }
      const {error} = await window.__sb.auth.updateUser({password: a, data: {pw_set: true}});
      if (error) { toast(error.message); return; } $("pr_p1").value = $("pr_p2").value = ""; toast("Password changed. Use it next time you sign in."); }
  });
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-pr]"); if (!b) return; e.preventDefault(); if (b.dataset.pr === "back") { S.view = "trips"; render(); } if (b.dataset.pr === "open") { S.view = "profile"; render(); } });
  const _nav = navItems; navItems = function(){ const items = _nav(); return items.length && !items.some(i => i[0] === "profile") ? [...items, ["profile", "My profile"]] : items; };
})();
