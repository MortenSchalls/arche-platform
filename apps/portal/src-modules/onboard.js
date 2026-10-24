/* ---------- Onboarding: academy first, assessment by the owner, then the onboarding package unlocks the portal (Morten, 24 Oct 2026) ----------
   1. A new person signs in and completes the Archē Broker Academy (academy.html, same login). Progress: progress/<uid>.
   2. They ask for assessment (the join request, academy completion code required).
   3. The owner assesses them in Team and, only if passed, enters their dedicated Archē email address and approves.
      That activates the person and issues the onboarding package (roster: workEmail, onboarding).
   4. On first sign-in the portal shows only the package: Archē email, email signature (they type only their name and
      direct phone), Standards of Conduct, meeting backgrounds. Confirming it opens the desk.
   Passwords are never part of the package: the email account's own set-up link sets the email password.
   Confirmation is kept in train/<uid>/runs/onboarding (people see their own; owner and operations see everyone's). */
const OB_CONDUCT = [
  ["Act for Archē", ["Present yourself as Archē Executive, never under your own brand or another company's.",
    "Email clients, operators and suppliers only from your dedicated Archē address, with the Archē signature and disclaimer unchanged. Never use a personal email address for Archē business, and never send bulk or marketing emails without approval.",
    "Message clients only through the Archē company accounts you are given on WhatsApp, LINE and WeChat, never from a personal account or number.",
    "Talk with the Archē team only in the dedicated WhatsApp groups that Archē creates. Never discuss clients or trips in other groups or apps.",
    "Put Archē's reputation and the client's interest ahead of your own commission."]],
  ["Client first", ["The client's safety, time and comfort come first in every decision.",
    "Reply to a client within 1 hour during their working day, and within 15 minutes while their trip is under way.",
    "Anticipate needs before the client asks, and confirm every detail in writing.",
    "Never promise anything Archē has not confirmed. If something goes wrong, tell the client early and honestly, with a solution."]],
  ["How we speak and write", ["Always polite, calm and warm. Address clients formally until they invite otherwise.",
    "No slang, jokes at anyone's expense or emoji in client messages.",
    "Never argue with a client, and never criticise a competitor, an operator or a colleague.",
    "Short, clear, correct English, or the client's own language where you are fluent."]],
  ["Online meetings", ["Camera on, using the Archē meeting background.",
    "Business attire: a dark suit or jacket with a collared shirt or blouse, or equivalent formal business dress.",
    "A quiet, well-lit place, a good headset and a stable connection; join a few minutes early.",
    "Display name: First name Last name · Archē Executive. No eating, smoking or other tasks during the meeting."]],
  ["Discretion", ["Never disclose who our clients are, where they fly or with whom, to anyone outside Archē.",
    "Never post about clients, flights or aircraft on social media, and never take photos of clients.",
    "Never use a client relationship for your own benefit."]],
  ["Personal conduct", ["Never deal with a client or a live trip under the influence of alcohol or drugs.",
    "Do not accept a gift or hospitality worth more than USD 100 without Archē's written approval."]],
  ["Feedback and consequences", ["Every client is asked to rate their trip. A rating of 3 or less out of 5, or a complaint, starts service recovery led by Archē and a review with you.",
    "A first shortfall leads to a written warning and coaching.",
    "Two ratings of 3 or less within 6 months, one serious complaint that Archē upholds, or any breach of discretion may end your agreement at once."]]
];
const OB_WEBMAIL = /@(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|aol|proton|protonmail|gmx|mail|yandex|qq|163)\./i;
const obMine = () => S.myRoster || S.roster[S.uid] || {};
const obNeeded = () => acting() === "broker" && !S.preview && !!obMine().onboarding && !(S.obAck && S.obAck.ackAt);
function obLoadAck(){
  if (S.obAckLoading || S.obAck !== undefined || !S.uid) return; S.obAckLoading = true;
  S.db.doc(`train/${S.uid}/runs/onboarding`).get().then(d => { S.obAck = d.exists ? d.data() : null; }, () => { S.obAck = null; }).finally(() => { S.obAckLoading = false; render(); });
}
function obLoadProg(id){
  S.obProg = S.obProg || {}; if (id in S.obProg) return; S.obProg[id] = undefined;
  S.db.doc("progress/" + id).get().then(d => { S.obProg[id] = d.exists ? d.data() : null; }, () => { S.obProg[id] = null; }).finally(() => render());
}
function obProgLine(p){
  if (p === undefined) return "Academy: loading…";
  if (!p) return "Academy: not started";
  const mods = Object.values(p.mods || {}), passed = mods.filter(m => m && m.passed).length;
  return `Academy: ${passed} module${passed === 1 ? "" : "s"} passed${p.completedAt ? ` · completed ${fmtD(p.completedAt)}` : " · not completed"}`;
}

/* step 1-3 for people who are not approved yet */
function vPending(){
  obLoadProg(S.uid);
  const p = S.obProg[S.uid], done = !!(p && p.completedAt);
  const step = (n, title, body, state) => `<div class="flag"><span class="sev ${state === "done" ? "low" : state === "now" ? "med" : "low"}" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${n}. ${title}</b>${state === "done" ? ' <span class="chip c-flown">Done</span>' : ""}</p>${body}</div></div>`;
  const s1 = step(1, "Complete the Archē Broker Academy", `<p class="small">Sign in to the academy with this same login. Your progress is saved as you go.</p><p class="small muted">${esc(obProgLine(p))}</p><div class="row" style="margin-top:6px"><a class="btn small ${done ? "" : "primary"}" href="academy.html" target="_blank" rel="noopener">Open the Broker Academy</a></div>`, done ? "done" : "now");
  const s2 = S.myJoin
    ? step(2, "Assessment requested", `<p class="small">You asked for assessment as <b>${esc(S.myJoin.role === "ops" ? "operations" : "broker")}</b> under the name <b>${esc(S.myJoin.contractName)}</b> on ${fmtD(S.myJoin.at)}.</p>`, "done")
    : step(2, "Ask for your assessment", `<p class="small">When the academy is complete, send your request with your academy completion code.</p>
    <form id="joinForm" class="stack" style="margin-top:8px">
      <div class="fgrid">
        <label class="f" for="j_name">Full legal name, as on your agreement<input id="j_name" required autocomplete="name"></label>
        <label class="f" for="j_role">Role<select id="j_role"><option value="broker">Broker (remote)</option><option value="consultant">Charter consultant</option><option value="ops">Operations</option></select></label>
        <label class="f" for="j_base">Country you work from<input id="j_base" required></label>
        <label class="f" for="j_cert">Academy completion code<input id="j_cert" placeholder="AE2.…"></label>
      </div>
      <label class="check" for="j_agree"><input type="checkbox" id="j_agree" required><span>I will make every enquiry, quote, booking and payment for Archē Executive in this portal, and nowhere else.</span></label>
      <div class="row"><button class="btn primary" type="submit">Ask for assessment</button></div>
    </form>`, done ? "now" : "");
  const s3 = step(3, "Assessment and onboarding package", `<p class="small">The director assesses your training. If you pass, you receive your Archē email address and your onboarding package, and the portal opens for you.</p>`, S.myJoin ? "now" : "");
  return `<div class="panel stack" style="max-width:680px"><h1>Join Archē Executive</h1><p class="muted">Every broker trains and is assessed before their first client. Three steps:</p>${s1}${s2}${s3}</div>`;
}

/* the owner's assessment card in Team */
function obJoinCard(id, j){
  obLoadProg(id);
  return `<div class="flag"><span class="sev low" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${esc(j.contractName)}</b> · ${esc(j.role)} · ${esc(j.base || "")}</p>
    <p class="small muted">Academy code: <span class="mono">${esc(j.cert || "none")}</span> · Requested ${fmtD(j.at)}</p>
    <p class="small">${esc(obProgLine(S.obProg[id]))}</p>
    <div class="fgrid" style="margin-top:6px">
      <label class="f" for="ob_mail_${id}">Archē email address created for them<input id="ob_mail_${id}" type="email" autocomplete="off" placeholder="first.last@…"></label>
      <label class="f" for="ob_note_${id}">Assessment notes<input id="ob_note_${id}" autocomplete="off" placeholder="What you checked and the result"></label>
    </div>
    <div class="row" style="margin-top:6px"><button class="btn small primary" type="button" data-approve="${id}">Passed: approve and issue package</button><button class="btn small" type="button" data-decline="${id}">Decline</button></div></div></div>`;
}
async function obApprove(id){
  const j = S.joins[id]; if (!j) return;
  const mail = (($("ob_mail_" + id) || {}).value || "").trim().toLowerCase(), note = (($("ob_note_" + id) || {}).value || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(mail)) { toast("Enter the Archē email address you created for them."); return; }
  if (OB_WEBMAIL.test(mail)) { toast("Use their dedicated Archē address, not a personal one."); return; }
  if (!note) { toast("Add a short note on the assessment."); return; }
  const at = now();
  try {
    await S.db.doc("roster/" + id).set({contractName:j.contractName, role:j.role, base:j.base || "", cert:j.cert || "", since:at, active:true, workEmail:mail, onboarding:{assessedAt:at, assessedBy:S.uid, notes:note, issuedAt:at}});
    await S.db.doc("join/" + id).delete();
    audit("Assessed and approved; onboarding package issued", `${j.contractName} · ${j.role} · ${mail}`); toast("Approved. Their portal opens with the onboarding package.");
  } catch(err){ toast("Could not approve."); }
}
function obTeamCell(id, p){
  if (!p.onboarding) return `<span class="small muted">Before the package</span>`;
  S.obAcks = S.obAcks || {};
  if (!(id in S.obAcks)) { S.obAcks[id] = undefined; S.db.doc(`train/${id}/runs/onboarding`).get().then(d => { S.obAcks[id] = d.exists ? d.data() : null; }, () => { S.obAcks[id] = null; }).finally(() => render()); }
  const a = S.obAcks[id];
  return `<span class="small">Issued ${fmtD(p.onboarding.issuedAt)}${a && a.ackAt ? ` · confirmed ${fmtD(a.ackAt)}` : a === undefined ? "" : " · <b>not confirmed yet</b>"}</span>`;
}

/* the package itself */
function obSigHtml(name, phone, mail){
  const c = S.company || {}, e = s => esc(s || ""), web = (c.web || "archeaviation.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const logo = c.sigLogo || "https://" + web + "/img/arche-email-logo.png";
  const p = "margin:0 0 6px 0";
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;color:#2b2e33;max-width:560px">
<tr><td style="padding:0 0 14px 0"><img src="${e(logo)}" width="120" alt="Archē Executive" style="display:block;border:0;width:120px;height:auto"></td></tr>
<tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#2b2e33;padding:0 0 2px 0">${e(name) || "[Your name]"}</td></tr>
<tr><td style="font-size:12px;letter-spacing:.06em;color:#5a6068;padding:0 0 10px 0">INDEPENDENT BROKER &middot; ARCH&#274; EXECUTIVE</td></tr>
<tr><td style="border-top:1px solid #c9d1db;padding:10px 0 0 0;font-size:13px;line-height:20px;color:#2b2e33">M&nbsp; <a href="tel:${e((phone || "").replace(/[^+\d]/g, ""))}" style="color:#2b2e33;text-decoration:none">${e(phone) || "[Your direct phone]"}</a><br>E&nbsp; <a href="mailto:${e(mail)}" style="color:#2b2e33;text-decoration:none">${e(mail)}</a><br><a href="https://${e(web)}" style="color:#4d6a8c;text-decoration:none">${e(web)}</a></td></tr>
<tr><td style="padding:16px 0 0 0;font-size:10px;line-height:14px;color:#5f646b">
<p style="${p}">${e(c.name || "Arche Executive Pte. Ltd.")} is registered in Singapore, UEN ${e(c.reg || "[UEN]")}, registered office ${e((c.address || "[registered office]").replace(/\s*\n\s*/g, ", "))}.</p>
<p style="${p}"><b>Confidential:</b> this email and any attachments are intended only for the named recipient and may be confidential. If you received it in error, please tell the sender and delete it; do not copy, use or disclose it.</p>
<p style="${p}"><b>Payments:</b> Arch&#275; Executive never sends bank details by email and never asks you to change payment details. Pay only through the secure payment request issued by Arch&#275; Executive. If in doubt, call us on a number you already know.</p>
<p style="${p}"><b>Flights:</b> Arch&#275; Executive arranges charter flights as agent for its clients and is not an aircraft operator. Flights are operated by licensed air operators, which keep operational control. Nothing in this email is a binding offer or confirmation; a charter is confirmed only by a charter agreement and confirmation issued by Arch&#275; Executive.</p>
<p style="margin:0"><b>Privacy:</b> we handle personal data under Singapore&rsquo;s Personal Data Protection Act 2012 and, where they apply, the EU and UK General Data Protection Regulations. Read our <a href="https://${e(web)}/privacy.html" style="color:#4d6a8c">privacy notice</a> or contact our Data Protection Officer at ${e(c.privacy || "[privacy email]")}. To stop receiving emails from us, reply &ldquo;unsubscribe&rdquo;.</p>
</td></tr></table>`;
}
function vWelcome(){
  if (S.obAck === undefined) { obLoadAck(); return `<div class="panel"><p class="small muted">Loading your onboarding package…</p></div>`; }
  const me = obMine(), ack = S.obAck || {}, f = S.obForm || (S.obForm = {name: (ack.sig && ack.sig.name) || me.contractName || "", phone: (ack.sig && ack.sig.phone) || ""});
  const mail = me.workEmail || "";
  const conduct = OB_CONDUCT.map(([h, items]) => `<h3>${esc(h)}</h3><ul class="small" style="margin:4px 0 10px 18px">${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`).join("");
  const confirmed = !!ack.ackAt;
  return `<div class="head"><div><h1>Welcome to Archē Executive${me.contractName ? ", " + esc(me.contractName.split(" ")[0]) : ""}</h1><p class="muted small">${confirmed ? `Your onboarding package. You confirmed it on ${fmtD(ack.ackAt)}; it stays here for reference.` : "You passed your assessment. Set up the items below and confirm at the end; your desk opens straight after."}</p></div></div>
  <div class="stack" style="max-width:760px">
  <div class="panel stack"><h2>1. Your Archē email</h2><p>Your address: <b class="mono">${esc(mail || "to be issued")}</b></p>
    <p class="small">Use only this address for Archē business. Your email password comes separately, as a one-time set-up link from the email service. Archē never sends passwords in this package or by email. Turn on two-step verification when you first sign in.</p>
    <p class="small"><b>Messaging:</b> you are added to the Archē company accounts on WhatsApp, LINE and WeChat for clients, and to the Archē team groups on WhatsApp for everything internal. Use only these.</p>
    <p class="small muted">Your portal and academy login stays the one you already use. Never share any login.</p></div>
  <div class="panel stack"><h2>2. Your email signature</h2><p class="small">Type only your name and direct phone number. Everything else is fixed and must not be changed.</p>
    <div class="fgrid"><label class="f" for="ob_n">Name as it should appear<input id="ob_n" value="${esc(f.name)}" autocomplete="name"></label><label class="f" for="ob_p">Direct phone, with country code<input id="ob_p" value="${esc(f.phone)}" inputmode="tel" autocomplete="tel" placeholder="+65 …"></label></div>
    <div id="obSig" style="background:#fff;border:1px solid var(--line, #d6dbe1);border-radius:8px;padding:16px;overflow-x:auto">${obSigHtml(f.name, f.phone, mail)}</div>
    <div class="row"><button class="btn primary" type="button" data-ob="copy">Copy signature</button><button class="btn" type="button" data-ob="dl">Download signature file</button></div>
    <p class="small muted">Paste it into your email app's signature setting (Gmail: Settings › See all settings › Signature; Outlook: Settings › Mail › Compose and reply).</p></div>
  <div class="panel stack"><h2>3. Standards of Conduct</h2><p class="small">We serve the top 0.1% of travellers, and we deliver that standard every time. These rules are part of your agreement.</p>${conduct}</div>
  <div class="panel stack"><h2>4. Meeting background</h2><p class="small">Use the Archē background in every online meeting. Pick the one where the logo sits on the side your head does not cover. Your own view may look mirrored; clients see it the right way round.</p>
    <div class="row"><a class="btn" href="img/arche-meeting-bg-right.jpg" download>Background, logo right</a><a class="btn" href="img/arche-meeting-bg-left.jpg" download>Background, logo left</a></div>
    <p class="small muted">Set your display name to: ${esc((f.name || "First name Last name"))} · Archē Executive</p></div>
  ${confirmed ? "" : `<div class="panel stack"><h2>5. Confirm</h2>
    <label class="check" for="ob_c1"><input type="checkbox" id="ob_c1"><span>I have read the Standards of Conduct and will follow them.</span></label>
    <label class="check" for="ob_c2"><input type="checkbox" id="ob_c2"><span>I have set up my Archē email with the signature above, and the meeting background.</span></label>
    <div class="row"><button class="btn primary" type="button" data-ob="ack">Confirm and open my desk</button></div></div>`}
  </div>`;
}
function obReadForm(){ const n = $("ob_n"), p = $("ob_p"); if (n && p) S.obForm = {name: n.value.trim(), phone: p.value.trim()}; return S.obForm || {name:"", phone:""}; }
document.addEventListener("input", e => {
  if (e.target.id !== "ob_n" && e.target.id !== "ob_p") return;
  const f = obReadForm(), box = $("obSig"); if (box) box.innerHTML = obSigHtml(f.name, f.phone, obMine().workEmail || "");
});
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-ob]"); if (!b) return; e.preventDefault();
  const f = obReadForm(), html = obSigHtml(f.name, f.phone, obMine().workEmail || "");
  if (b.dataset.ob === "copy" || b.dataset.ob === "dl") {
    if (!f.name || !f.phone) { toast("Type your name and direct phone first."); return; }
    if (b.dataset.ob === "dl") { const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>Archē email signature</title></head><body>${html}</body></html>`], {type: "text/html"}); const a = Object.assign(document.createElement("a"), {href: URL.createObjectURL(blob), download: "Arche-email-signature.html"}); document.body.appendChild(a); a.click(); a.remove(); return; }
    try { await navigator.clipboard.write([new ClipboardItem({"text/html": new Blob([html], {type: "text/html"}), "text/plain": new Blob([$("obSig").innerText], {type: "text/plain"})})]); toast("Signature copied. Paste it into your email signature setting."); }
    catch(err){ const r = document.createRange(); r.selectNodeContents($("obSig")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Press Ctrl+C (or Cmd+C) to copy the selected signature."); }
    return;
  }
  if (b.dataset.ob === "ack") {
    if (!($("ob_c1") || {}).checked || !($("ob_c2") || {}).checked) { toast("Tick both boxes to confirm."); return; }
    if (!f.name || !f.phone) { toast("Type your name and direct phone for the signature first."); return; }
    const d = {kind: "onboarding", ackAt: now(), conduct: true, sig: {name: f.name, phone: f.phone}};
    try { await S.db.doc(`train/${S.uid}/runs/onboarding`).set(d); S.obAck = d; audit("Onboarding package confirmed", f.name); S.view = "home"; toast("Welcome aboard. Your desk is open."); render(); }
    catch(err){ toast("Could not save. Try again."); }
  }
});
