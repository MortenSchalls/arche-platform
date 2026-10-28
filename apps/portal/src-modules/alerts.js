/* ---------- Alerts: recipients, channels and the official sender (Morten, 26 Oct 2026) ----------
   The owner keeps here who receives portal alerts, on which channel (SMS, WhatsApp, email) and for which events, in the
   order alerts escalate. The company's official WhatsApp number is added once it is set up and verified by Meta;
   until then nothing is sent. Stored owner-only in alert_settings (SQL 0013), never in the code. */
const ALERT_EVENTS = {
  approve: "Booking waiting for your approval",
  steps: "Supervised step waiting for an OK",
  pool: "New enquiry in the pool",
  recovery: "Service recovery or overdue follow-up",
  flight: "Flight status change (departed, delayed, diverted, cancelled, landed)",
  late: "Backup or rotation late",
  escalate: "Escalation: nobody acted in time"
};
function alertPhone(raw){
  const d = String(raw || "").replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.startsWith("+")) return /^\+\d{8,15}$/.test(d) ? d : null;
  if (d.startsWith("00")) return /^00\d{8,15}$/.test(d) ? "+" + d.slice(2) : null;
  if (/^0\d{8,9}$/.test(d)) return "+66" + d.slice(1);   // Thai number written the local way
  return null;
}
const alertPhoneShow = p => { const m = String(p || "").match(/^\+66(\d{2})(\d{3})(\d{4})$/); return m ? `+66 ${m[1]} ${m[2]} ${m[3]}` : (p || ""); };
function alertLoad(){
  if (!S.isOwner || S.preview || S.alertsOn) return; S.alertsOn = true;
  S.db.doc("alerts/settings").onSnapshot(snap => { S.alerts = snap.exists ? snap.data() : {recipients: []}; S.alertsReady = true; render(); }, () => { S.alertsReady = false; render(); });
}
async function alertSave(next, line){
  try { await S.db.doc("alerts/settings").set(next); S.alerts = next; audit("Alert settings changed", line); toast("Saved."); render(); }
  catch(e){ toast(e && (e.code === "permission_denied" || e.code === "unknown_path" || /exist/.test(e.message || "")) ? "Run SQL 0013 first (Team > To do for you)." : "Could not save. Try again."); }
}
function alertsPanel(){
  if (!S.isOwner || S.preview) return "";
  alertLoad();
  const A = S.alerts || {recipients: []}, R = A.recipients || [], snd = A.sender || {};
  const people = [[S.uid, S.myName || "You"], ...Object.entries(S.roster || {}).filter(([id, p]) => id !== S.uid && p.active !== false).map(([id, p]) => [id, p.contractName || nm(id)])];
  const row = (r, i) => `<div class="flag"><span class="sev ${r.active === false ? "low" : "med"}" aria-hidden="true"></span><div style="flex:1;min-width:0">
      <p><b>${i + 1}. ${esc(r.name)}</b>${r.active === false ? ` <span class="chip c-enquiry">Paused</span>` : ""} <span class="small muted">· ${r.uid ? (r.uid === S.uid ? "linked to you" : "linked to " + esc(nm(r.uid))) : "not linked to a portal user: no phone alerts"}</span></p>
      <p class="small">${[r.sms ? `SMS ${esc(alertPhoneShow(r.sms))}` : "", r.phone ? `WhatsApp ${esc(alertPhoneShow(r.phone))}` : "", r.email ? `Email ${esc(r.email)}` : ""].filter(Boolean).join(" · ")}</p>
      <p class="small muted">${Object.keys(ALERT_EVENTS).filter(k => (r.events || {})[k]).map(k => esc(ALERT_EVENTS[k])).join(" · ") || "No alerts chosen"}</p>
      <div class="row" style="margin-top:6px">${i > 0 ? `<button class="btn small" type="button" data-al="up" data-i="${i}">Move up</button>` : ""}<button class="btn small" type="button" data-al="edit" data-i="${i}">Change</button><button class="btn small" type="button" data-al="pause" data-i="${i}">${r.active === false ? "Resume" : "Pause"}</button><button class="btn small danger" type="button" data-al="del" data-i="${i}">Remove</button></div></div></div>`;
  const ed = S.alertEdit, cur = ed !== undefined && ed !== null && ed >= 0 ? R[ed] || {} : {events: Object.fromEntries(Object.keys(ALERT_EVENTS).map(k => [k, true]))};
  const form = ed !== undefined && ed !== null ? `<form id="alForm" class="stack" style="border-top:1px solid var(--line);padding-top:10px;margin-top:8px">
      <div class="fgrid"><label class="f" for="al_who">Who<select id="al_who"><option value="">Someone else</option>${people.map(([id, n]) => `<option value="${id}" ${cur.uid === id ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
      <label class="f" for="al_name">Name shown<input id="al_name" value="${esc(cur.name || "")}" required></label>
      <label class="f" for="al_sms">SMS number<input id="al_sms" inputmode="tel" value="${esc(cur.sms ? alertPhoneShow(cur.sms) : "")}" placeholder="Thai: 08… · other: +country code"></label>
      <label class="f" for="al_phone">WhatsApp number (optional)<input id="al_phone" inputmode="tel" value="${esc(cur.phone ? alertPhoneShow(cur.phone) : "")}" placeholder="If different, or leave empty"></label>
      <label class="f" for="al_mail">Email (optional)<input id="al_mail" type="email" value="${esc(cur.email || "")}"></label></div>
      <fieldset class="stack" style="border:0;padding:0;margin:0"><legend class="small"><b>Alerts to receive</b></legend>${Object.entries(ALERT_EVENTS).map(([k, l]) => `<label class="check" for="al_ev_${k}"><input type="checkbox" id="al_ev_${k}" ${(cur.events || {})[k] ? "checked" : ""}><span class="small">${esc(l)}</span></label>`).join("")}</fieldset>
      <div class="row"><button class="btn small primary" type="submit">${ed >= 0 ? "Save changes" : "Add"}</button><button class="btn small" type="button" data-al="cancel">Cancel</button></div></form>` : `<div class="row" style="margin-top:8px"><button class="btn small primary" type="button" data-al="add">Add a person</button></div>`;
  return `<div class="panel" style="margin-bottom:16px" id="alertsPanel"><h2>Alerts</h2>
    <p class="small muted">Who gets alerts from the portal, by SMS, WhatsApp or email, and for what. Alerts go to the first person in the list; if nobody acts in time they move down the list. Numbers here are seen only by owners.</p>
    ${S.alertsReady === false ? `<div class="note info small">Run SQL "alerts (0013)" in To do for you first.</div>` : ""}
    <div class="note ${snd.number ? "ok" : "info"} small"><b>Official WhatsApp number:</b> ${snd.number ? `${esc(alertPhoneShow(snd.number))}${snd.verified ? " · verified by Meta" : " · waiting for Meta verification"}` : "not set up yet. Nothing is sent by WhatsApp until it is."}<br><b>SMS:</b> ${A.smsReady ? "connected" : "not connected yet: SMS alerts start once an SMS service is set up (on your task list)."}
      <div class="row" style="margin-top:6px"><input id="al_snd" inputmode="tel" style="max-width:220px" placeholder="Company number" value="${esc(snd.number ? alertPhoneShow(snd.number) : "")}"><label class="check" for="al_ver" style="margin:0"><input type="checkbox" id="al_ver" ${snd.verified ? "checked" : ""}><span class="small">Verified by Meta</span></label><button class="btn small" type="button" data-al="sender">Save number</button></div></div>
    ${R.length ? R.map(row).join("") : `<p class="small muted" style="margin-top:8px">Nobody added yet.</p>`}${form}${alertDeviceBlock()}</div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-al]"); if (!b || !S.isOwner) return; e.preventDefault();
  const a = b.dataset.al, i = +b.dataset.i, A = S.alerts || {recipients: []}, R = [...(A.recipients || [])];
  if (a === "add") { S.alertEdit = -1; render(); return; }
  if (a === "edit") { S.alertEdit = i; render(); return; }
  if (a === "cancel") { S.alertEdit = null; render(); return; }
  if (a === "up" && i > 0) { [R[i - 1], R[i]] = [R[i], R[i - 1]]; return alertSave({...A, recipients: R}, `${R[i - 1].name} moved up`); }
  if (a === "pause") { R[i] = {...R[i], active: R[i].active === false}; return alertSave({...A, recipients: R}, `${R[i].name} ${R[i].active ? "resumed" : "paused"}`); }
  if (a === "del") { if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Click again to remove"; return; } const n = R[i].name; R.splice(i, 1); return alertSave({...A, recipients: R}, `${n} removed`); }
  if (a === "sender") { const v = ($("al_snd") || {}).value || "", p = v.trim() ? alertPhone(v) : ""; if (p === null) { toast("Write the number as 08… (Thai) or with +country code."); return; }
    return alertSave({...A, sender: p ? {number: p, verified: !!($("al_ver") || {}).checked, at: now()} : {}}, p ? "Official WhatsApp number saved" : "Official WhatsApp number removed"); }
});
document.addEventListener("change", e => { if (e.target.id !== "al_who") return; const id = e.target.value, n = $("al_name"); if (id && n && !n.value) n.value = id === S.uid ? (S.myName || "") : (((S.roster || {})[id] || {}).contractName || ""); });
document.addEventListener("submit", e => {
  if (e.target.id !== "alForm") return; e.preventDefault();
  const A = S.alerts || {recipients: []}, R = [...(A.recipients || [])], ed = S.alertEdit;
  const name = $("al_name").value.trim(), raw = $("al_phone").value.trim(), rawS = $("al_sms").value.trim(), email = $("al_mail").value.trim(), phone = raw ? alertPhone(raw) : "", sms = rawS ? alertPhone(rawS) : "";
  if (!name) { toast("Add a name."); return; }
  if (phone === null || sms === null) { toast("Write each number as 08… (Thai) or with +country code."); return; }
  if (!phone && !sms && !email) { toast("Add an SMS number, a WhatsApp number or an email."); return; }
  if (email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { toast("Check the email address."); return; }
  const events = Object.fromEntries(Object.keys(ALERT_EVENTS).map(k => [k, !!($("al_ev_" + k) || {}).checked]));
  const rec = {id: ed >= 0 ? R[ed].id : "r" + Date.now().toString(36), uid: $("al_who").value || null, name, sms, phone, email, events, active: ed >= 0 ? R[ed].active !== false : true, added: ed >= 0 ? R[ed].added : now()};
  if (ed >= 0) R[ed] = rec; else R.push(rec);
  S.alertEdit = null; alertSave({...A, recipients: R}, `${name} ${ed >= 0 ? "changed" : "added"}`);
});

/* ---------- this device: phone push, test alert, repeat settings, status (Morten, 26 Oct 2026) ---------- */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || "");
const isHomeApp = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const u8 = s => { const b = atob((s + "===".slice((s.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, c => c.charCodeAt(0)); };
async function pushState(){
  try { if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported"; const reg = await navigator.serviceWorker.getRegistration("/"); const sub = reg && await reg.pushManager.getSubscription(); return sub ? "on" : (typeof Notification !== "undefined" && Notification.permission === "denied" ? "blocked" : "off"); } catch(e){ return "unsupported"; }
}
async function pushEnable(){
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) { toast(isIOS() && !isHomeApp() ? "On iPhone: tap Share, then Add to Home Screen. Open Archē from the Home Screen and press this again." : "This browser cannot show alerts. Try Chrome or Safari."); return; }
  try {
    const perm = await Notification.requestPermission(); if (perm !== "granted") { toast("Alerts are blocked for this site. Allow notifications in the phone's settings."); S.pushSt = "blocked"; render(); return; }
    const reg = await navigator.serviceWorker.register("/sw.js", {scope: "/"}); await navigator.serviceWorker.ready;
    const k = await (await fetch("/api/alerts?vapid=1")).json(); if (!k.publicKey) { toast("Alerts are not set up on the server yet (see To do for you)."); return; }
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: u8(k.publicKey)});
    const j = sub.toJSON(), h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(j.endpoint)))).slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join("");
    await S.db.doc(`push/${S.uid}/subs/${h}`).set({endpoint: j.endpoint, keys: j.keys, device: (navigator.userAgent || "").replace(/\(.*?\)/, "").slice(0, 60), at: now()});
    S.pushSt = "on"; audit("Alerts turned on for a device", isIOS() ? "iPhone or iPad" : "browser"); toast("Alerts are on for this device."); render();
  } catch(e){ toast("Could not turn alerts on. Try again."); }
}
async function pushTest(){
  try { const s = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
    const r = await fetch("/api/alerts", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + (s ? s.access_token : "")}, body: JSON.stringify({test: true})});
    const j = await r.json(); if (!r.ok) { toast(j.detail || j.error || "The test could not be sent."); return; }
    S.alertTest = `Test at ${fmtT(now())}: phone ${j.pushed} of ${j.devices} device${j.devices === 1 ? "" : "s"}. Email ${j.email === "ok" ? `accepted by Resend for ${j.to} from ${j.from}. If it does not arrive within a few minutes, look in Spam and in Resend > Emails (it shows delivered or bounced).` : j.email + "."}`;
    toast("Test sent. The result is shown in Alerts."); render();
  } catch(e){ toast("The test could not be sent. Alerts may not be set up on the server yet."); }
}
function alertDeviceBlock(){
  if (S.pushSt === undefined) { S.pushSt = null; pushState().then(x => { S.pushSt = x; render(); }); }
  const st = S.pushSt, A = S.alerts || {}, ST = S.alertStatus || null;
  if (!S.alertStatusOn && S.db) { S.alertStatusOn = true; S.db.doc("alerts/status").get().then(d => { S.alertStatus = d.exists ? d.data() : null; render(); }, () => {}); }
  return `<div class="stack" style="border-top:1px solid var(--line);padding-top:10px;margin-top:10px"><h3 style="margin:0">This phone or computer</h3>
    <p class="small">${st === "on" ? "Alerts are on for this device." : st === "blocked" ? "Alerts are blocked for this site: allow notifications in the phone's settings." : st === "unsupported" ? (isIOS() ? "On iPhone: tap Share, then Add to Home Screen, and open Archē from the Home Screen. Then turn alerts on here." : "This browser cannot show alerts.") : "Alerts are off for this device."}</p>
    <div class="row">${st !== "on" ? `<button class="btn small primary" type="button" data-al="pushOn">Turn on alerts on this device</button>` : ""}<button class="btn small" type="button" data-al="test">Send a test alert</button></div>${S.alertTest ? `<div class="note info small" style="overflow-wrap:anywhere">${esc(S.alertTest)}</div>` : ""}
    <h3 style="margin:8px 0 0">Until someone acts</h3>
    <div class="row"><label class="f" for="al_rep" style="max-width:220px">Repeat the alert every (minutes)<input id="al_rep" type="number" min="5" max="120" value="${Number(A.repeatMin) || 15}"></label><label class="f" for="al_esc" style="max-width:260px">Add the next person after (minutes)<input id="al_esc" type="number" min="10" max="240" value="${Number(A.escalateMin) || 30}"></label><button class="btn small" type="button" data-al="timing">Save</button></div>
    <p class="small muted">Phone alerts repeat at this interval and email at most once an hour, until the booking, request or enquiry has been dealt with. Each alert gives only the type and trip reference.</p>
    <p class="small">${ST && ST.lastRun ? `Last check ${fmtT(ST.lastRun)} · ${ST.open} waiting · ${ST.pushes} phone and ${ST.emails} email alerts sent${ST.email ? "" : " · email not connected yet"}${(ST.errors || []).length ? ` · problems: ${esc(ST.errors.join("; "))}` : ""}` : "The server check has not run yet (see To do for you)."}</p></div>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-al]"); if (!b) return; const a = b.dataset.al;
  if (a === "pushOn") { e.preventDefault(); pushEnable(); }
  else if (a === "test" && S.isOwner) { e.preventDefault(); pushTest(); }
  else if (a === "timing" && S.isOwner) { e.preventDefault(); const r = Math.min(120, Math.max(5, +($("al_rep") || {}).value || 15)), x = Math.min(240, Math.max(10, +($("al_esc") || {}).value || 30)); alertSave({...(S.alerts || {recipients: []}), repeatMin: r, escalateMin: x}, `Repeat every ${r} min, next person after ${x} min`); }
});
