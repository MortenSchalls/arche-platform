/* ---------- Offer and agreement in the portal (Morten, 24 Oct 2026): nothing is sent as a file by email ----------
   Candidates read the commission offer here, train, ask for assessment, then read and sign their agreement here.
   The owner sends the agreement after a passed assessment and countersigns it; countersigning opens the portal and
   issues the onboarding package. The signed text is kept with both signatures and a fingerprint (SHA-256), so both
   sides can always see exactly what was signed. Database rules: migration 0009. Text: agreement-text.js. */
const OFFER_HTML = `<p class="lead"><b>Build your own private aviation business with the backing of a full charter brokerage, and keep up to 35% of the profit on every trip you sell.</b> There is no cap on what you can earn.</p>
<table><tr><th>At a glance</th><th></th></tr><tr><td>Your share of gross profit</td><td>27% on your first 8 bookings each month, 35% on every booking after that</td></tr><tr><td>At 8 bookings a month</td><td>USD 8,748 a month, about USD 104,976 a year</td></tr><tr><td>Where you work</td><td>From your own country, on your own schedule</td></tr><tr><td>Your clients</td><td>Your own network, plus enquiries Archē releases to its brokers</td></tr><tr><td>Paid</td><td>Monthly, by the 15th, with a full statement</td></tr><tr><td>Getting started</td><td>Online training, assessment and signing, all here in the portal</td></tr></table>
<h3>About Archē Executive</h3><p>Archē Executive is an independent private jet charter brokerage based in Singapore, serving clients worldwide with Asia as its home market. We serve business leaders, family offices, private travellers, public figures, corporate groups and government delegations.</p><p>We own no aircraft, so our advice stays honest: our only job is to find the right aircraft and the right operator for each trip. Before we recommend an aircraft, we know who flies it, how it is maintained and what the client is paying for. Every quote names the operator, every trip has one all-in price, and our clients' privacy is absolute.</p><p>As an Archē broker, that is the promise you carry to every client.</p>

<h3>Why brokers choose Archē</h3><ul><li><b>A share that grows with you.</b> You earn 27% of the gross profit on your first 8 bookings each month and 35% on every booking after that. The more you close, the more of each trip you keep.</li><li><b>Clients come to you too.</b> Besides the clients you bring, Archē releases the enquiries it receives to its brokers in the portal. The first broker to take one gets it.</li><li><b>We carry the back office.</b> Operations checks every trip, issues every confirmation and handles client and operator payments. Your time goes into your clients.</li><li><b>Freedom to work your way.</b> You are an independent broker, working from your own country and setting your own hours.</li><li><b>A name built for the top 0.1%.</b> You represent a house that serves the most demanding travellers, with the tools, training and presentation to match.</li><li><b>Paid on time, with full visibility.</b> You follow every booking and your commission live in the portal, and receive a statement and payment by the 15th of each month.</li></ul>
<h3>What you can earn</h3><p>At 8 standard bookings a month you earn USD 8,748 a month, about USD 104,976 a year. From the 9th booking, each one earns you USD 1,417.50.</p>
<table><tr><th>Standard bookings a month</th><th>Your monthly commission (USD)</th><th>At that pace for a year (USD)</th></tr><tr><td>4</td><td>4,374</td><td>52,488</td></tr><tr><td>6</td><td>6,561</td><td>78,732</td></tr><tr><td>8</td><td>8,748</td><td>104,976</td></tr><tr><td>10</td><td>11,583</td><td>138,996</td></tr><tr><td>12</td><td>14,418</td><td>173,016</td></tr><tr><td>16</td><td>20,088</td><td>241,056</td></tr></table>
<p class="small muted">These figures assume standard bookings of USD 45,000 with USD 4,050 gross profit each. They show how the commission works; they are not a promise of earnings.</p>
<h3>How your commission works</h3><table><tr><th>Bookings in the calendar month</th><th>Your share of gross profit</th><th>Per standard booking</th></tr><tr><td>1 to 8</td><td>27%</td><td>USD 1,093.50</td></tr><tr><td>9 and every one after</td><td>35%</td><td>USD 1,417.50</td></tr></table>
<ul><li><b>Gross profit</b> is the price the client pays, less what Archē pays the aircraft operator and the direct costs of the trip. A better margin on a trip pays you more.</li><li><b>One standard booking</b> is a trip billed at USD 45,000. A smaller trip counts as part of one, a larger trip as more than one.</li><li><b>The count starts fresh</b> on the first day of each month, and there is no cap.</li><li><b>Commission is earned when a booking is complete:</b> every flight landed, the client paid in full and all extras settled. For multi-leg trips and long-term charters, that is when the last flight has landed.</li><li><b>If a trip is refunded</b> after commission is paid, that commission is deducted from your next payment.</li></ul>
<h3>What you bring</h3><ul><li><b>Relationships and drive</b> to find and win private and corporate charter clients.</li><li><b>Ownership of every booking</b>, from the first call to the final landing: sourcing the aircraft, special requests, ground handling, airport transport and access, the documents the operator needs, and following every flight, including multi-leg trips and long-term charters.</li><li><b>Speed.</b> You contact a new client within 15 minutes and aim to take each booking from enquiry to signed and paid within 5 days.</li><li><b>The Archē standard.</b> Polished, discreet and client first: your Archē email and company messaging accounts, business attire and the Archē background in every online meeting.</li></ul>
<h3>What Archē gives you</h3><ul><li><b>The Archē portal</b>, where every enquiry, quote, booking, document and commission statement lives in one place.</li><li><b>The Archē Broker Academy</b>, online, so you start with the knowledge and confidence to quote and book from day one.</li><li><b>Your Archē identity:</b> your own Archē email address and signature, the company messaging accounts and the Archē meeting background.</li><li><b>Leads and enquiries:</b> prospects from our research, and the enquiries Archē releases to its brokers.</li><li><b>Operations behind every trip.</b> Clients pay Archē directly through a secure payment request, so you never handle client money.</li></ul>
<h3>Your path to your first booking</h3><p>Everything happens here in the portal. There is no paperwork by email. Follow the steps below; we look forward to welcoming you to Archē Executive.</p>`;

const AGR_S2 = [["consultant","Consultant (name, or company name and registration number)"],["individual","Individual performing the services (if a company)"],["address","Address"],["territory","Territory (country of residence and work)"],["email","Email for notices"],["taxReg","Tax registration in the Territory (if any)"]];
function agrFill(html, c){ const co = c || {}; return html.replaceAll("{{UEN}}", esc(co.reg || "")).replaceAll("{{OFFICE}}", esc((co.address || "").replace(/\s*\n\s*/g, ", "))).replaceAll("{{PRIVACY}}", esc(co.privacy || "")); }
function agrRender(a, opts){   // the full agreement, as signed or to be signed
  const o = opts || {}, d = a.details || {}, co = a.company || S.company || {};
  const s2 = `<h2>Schedule 2: Consultant details</h2><div class="tbl"><table><tr><th>Item</th><th>Details</th></tr>${AGR_S2.map(([k, l]) => `<tr><td>${l}</td><td>${o.form ? `<input id="ag_${k}" value="${esc(d[k] || "")}" aria-label="${esc(l)}" ${k === "individual" || k === "taxReg" ? "" : "required"}>` : esc(d[k] || "–")}</td></tr>`).join("")}
    <tr><td>Archē email for notices</td><td>${esc(co.email || "")}</td></tr><tr><td>Start date</td><td>${esc(a.start ? fmtD(a.start) : "On Archē's countersignature")}</td></tr></table></div>`;
  const sig = (who, nm_, title, at) => `<p><b>${who}</b><br>Name: ${esc(nm_ || "–")}${title ? `<br>Title: ${esc(title)}` : ""}<br>Signed electronically: ${at ? esc(fmtT(at)) : "not yet"}</p>`;
  const s3 = `<h2>Schedule 3: Signatures</h2>${sig("Signed for and on behalf of " + esc(co.name || "Arche Executive Pte. Ltd."), a.counterName, a.counterTitle, a.counterAt)}${sig("Signed by the Consultant", a.signedName, "", a.signedAt)}${a.hash ? `<p class="small muted">Fingerprint of the signed text (SHA-256): <span class="mono" style="word-break:break-all">${esc(a.hash)}</span> · version ${esc(a.version || "")}</p>` : ""}`;
  return `<div class="agrdoc" id="agrDoc"><h1>Independent Broker Consultancy Agreement</h1><p class="small muted">${esc(co.name || "Arche Executive Pte. Ltd.")} · version ${esc(a.version || AGR_VERSION)}</p>${agrFill(AGR_MAIN, co)}${s2}${s3}${agrFill(AGR_TAIL, co)}</div>`;
}
async function agrHash(text){ const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
const agrText = html => { const d = document.createElement("div"); d.innerHTML = html; d.querySelectorAll(".small.muted").forEach(n => { if (/Fingerprint|version/.test(n.textContent)) n.remove(); }); d.querySelectorAll("input").forEach(i => i.replaceWith(document.createTextNode(i.value))); return d.textContent.replace(/\s+/g, " ").trim(); };
function agrCoReady(){ const c = S.company || {}; return !!(c.name && c.reg && c.address && c.email && c.signName && c.signTitle); }

/* candidate: read and sign */
function vAgreementSign(){
  const a = S.myAgr; if (!a) return "";
  if (a.status !== "sent") return `<div class="panel stack" style="max-width:860px"><div class="row" style="justify-content:space-between"><h1>Your agreement</h1><div class="row"><button class="btn" type="button" data-agr="copy">Download a copy</button><button class="btn" type="button" data-agr="print">Print or save as PDF</button><button class="btn" type="button" data-agr="close">Back</button></div></div>${agrRender(a)}</div>`;
  return `<form id="agrForm" class="panel stack" style="max-width:860px"><div class="row" style="justify-content:space-between"><h1>Read and sign your agreement</h1><button class="btn" type="button" data-agr="close">Back</button></div>
    <p class="small">Read the whole agreement, fill in your details in Schedule 2, then sign at the end. Your electronic signature has the same effect as a handwritten one. You can print it or save it as a PDF at any time.</p>
    ${agrRender({...a, details: {consultant: (S.myJoin || {}).contractName || "", territory: (S.myJoin || {}).base || "", ...(a.details || {})}}, {form: true})}
    <div class="panel stack" style="background:var(--raised)"><h2>Sign</h2>
      <label class="check" for="ag_r1"><input type="checkbox" id="ag_r1"><span>I have read the whole agreement, including Schedules 1 to 5.</span></label>
      <label class="check" for="ag_r2"><input type="checkbox" id="ag_r2"><span>I agree to be bound by it, and I sign it electronically by typing my full legal name.</span></label>
      <label class="f" for="ag_name">Full legal name<input id="ag_name" autocomplete="name" required></label>
      <div class="row"><button class="btn primary" type="submit">Sign the agreement</button><button class="btn" type="button" data-agr="print">Print or save as PDF</button></div></div></form>`;
}
document.addEventListener("submit", async ev => {
  if (ev.target.id !== "agrForm") return; ev.preventDefault();
  const a = S.myAgr; if (!a || a.status !== "sent") return;
  const details = Object.fromEntries(AGR_S2.map(([k]) => [k, (($("ag_" + k) || {}).value || "").trim()]));
  const missing = AGR_S2.filter(([k]) => !["individual","taxReg"].includes(k) && !details[k]);
  if (missing.length) { toast("Fill in Schedule 2: " + missing.map(m => m[1].split(" (")[0]).join(", ") + "."); return; }
  if (!$("ag_r1").checked || !$("ag_r2").checked) { toast("Tick both boxes to sign."); return; }
  const name = $("ag_name").value.trim();
  if (name.split(/\s+/).length < 2) { toast("Type your full legal name."); return; }
  const signedAt = now(), rec = {...a, details, signedName: name, signedAt, signedUA: navigator.userAgent.slice(0, 200), company: {...S.company}};
  const html = agrRender(rec);
  try { const hash = await agrHash(agrText(html));
    const ok = await window.__agrSign({details, signedName: name, signedAt, signedUA: rec.signedUA, company: rec.company, hash, html});
    if (ok) { toast("Signed. Archē will countersign and open your portal."); S.agrOpen = false; render(); } else toast("This agreement can no longer be signed. Ask Archē Executive.");
  } catch(err){ toast("Could not sign. Try again."); }
});

/* owner: send, view, countersign (in the Team card) */
function agrOwnerBlock(id, j){
  const a = (S.agrs || {})[id];
  if (!a) return `<div class="fgrid" style="margin-top:6px"><label class="f" for="ob_note_${id}">Assessment notes<input id="ob_note_${id}" autocomplete="off" placeholder="What you checked and the result"></label><label class="f" for="ag_start_${id}">Start date (optional)<input id="ag_start_${id}" type="date"></label></div>
    ${agrCoReady() ? "" : `<p class="small" style="color:var(--warn)">Fill in the company details in Settings first (legal name, UEN, address, bookings email, signatory and title). They go into the agreement.</p>`}
    <div class="row" style="margin-top:6px"><button class="btn small primary" type="button" data-agr="send|${id}" ${agrCoReady() ? "" : "disabled"}>Passed: send agreement</button><button class="btn small" type="button" data-decline="${id}">Decline</button></div>`;
  if (a.status === "sent") return `<p class="small">Assessment passed ${fmtD(a.assess && a.assess.at)}. Agreement sent ${fmtT(a.sentAt)}, waiting for their signature.</p><div class="row" style="margin-top:6px"><button class="btn small" type="button" data-agr="view|${id}">View agreement</button><button class="btn small" type="button" data-agr="withdraw|${id}">Withdraw</button></div>`;
  if (a.status === "signed") return `<p class="small"><b>Signed</b> by ${esc(a.signedName)} on ${fmtT(a.signedAt)}.</p>
    <div class="fgrid" style="margin-top:6px"><label class="f" for="ob_mail_${id}">Archē email address created for them<input id="ob_mail_${id}" type="email" autocomplete="off" placeholder="name@…"></label></div>
    <div class="row" style="margin-top:6px"><button class="btn small" type="button" data-agr="view|${id}">View agreement</button><button class="btn small primary" type="button" data-approve="${id}">Countersign and issue onboarding package</button></div>`;
  return `<p class="small muted">Agreement ${esc(a.status)}.</p>`;
}
function agrWatchOwner(){ if (S.agrOn || !S.isOwner) return; S.agrOn = true; watchCol("agr", snap => { S.agrs = {}; snap.docs.forEach(d => S.agrs[d.id] = d.data()); render(); }); }
function agrModal(){ const id = S.agrView; if (!id) return ""; const a = (S.agrs || {})[id] || (id === S.uid ? S.myAgr : null); if (!a) return "";
  return `<div class="panel stack" style="max-width:860px;margin:16px 0"><div class="row" style="justify-content:space-between"><h2>Agreement: ${esc(a.signedName || (S.joins[id] || {}).contractName || "")}</h2><div class="row"><button class="btn small" type="button" data-agr="copy">Download a copy</button><button class="btn small" type="button" data-agr="print">Print or save as PDF</button><button class="btn small" type="button" data-agr="closeview">Close</button></div></div>${a.html || agrRender(a)}</div>`; }
async function agrCountersign(id){
  const j = S.joins[id], a = (S.agrs || {})[id]; if (!j || !a || a.status !== "signed") return;
  const mail = (($("ob_mail_" + id) || {}).value || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(mail)) { toast("Enter the Archē email address you created for them."); return; }
  if (OB_WEBMAIL.test(mail)) { toast("Use their dedicated Archē address, not a personal one."); return; }
  const c = S.company || {}; if (!c.signName || !c.signTitle) { toast("Add the authorised signatory and title in Settings first."); return; }
  const at = now(), done = {...a, status: "active", counterName: c.signName, counterTitle: c.signTitle, counterAt: at, counterBy: S.uid};
  done.html = agrRender(done);
  try {
    await S.db.doc("agr/" + id).set(done);
    await S.db.doc("roster/" + id).set({contractName: j.contractName, role: j.role, base: j.base || "", cert: j.cert || "", since: at, active: true, workEmail: mail, supervised: true,
      onboarding: {assessedAt: (a.assess || {}).at || at, assessedBy: (a.assess || {}).by || S.uid, notes: (a.assess || {}).notes || "", issuedAt: at, agreement: a.version || AGR_VERSION}});
    await S.db.doc("join/" + id).delete();
    audit("Agreement countersigned; onboarding package issued", `${j.contractName} · ${mail}`); toast("Countersigned. Their portal opens with the onboarding package.");
  } catch(err){ toast(err.code === "permission_denied" || err.code === "unknown_path" ? "Agreements are not set up yet (run 0009 in Supabase)." : "Could not countersign."); }
}
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-agr]"); if (!b) return; ev.preventDefault();
  const [a, id] = b.dataset.agr.split("|");
  if (a === "copy") { const el = document.getElementById("agrDoc"); if (!el) return; await obSave("Arche-broker-agreement.html", new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>Archē broker agreement</title><style>body{font:14px/1.6 Helvetica,Arial,sans-serif;max-width:820px;margin:32px auto;padding:0 16px;color:#2b2e33}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}h2{margin-top:24px}</style></head><body>${el.outerHTML}</body></html>`], {type: "text/html"})); return; }
  if (a === "print") { document.body.classList.add("printing-agr"); setTimeout(() => { window.print(); document.body.classList.remove("printing-agr"); }, 50); return; }
  if (a === "open") { S.agrOpen = true; render(); scrollTo(0, 0); return; }
  if (a === "close") { S.agrOpen = false; render(); return; }
  if (a === "offer") { S.offerOpen = !S.offerOpen; render(); return; }
  if (a === "view") { S.agrView = id; render(); return; }
  if (a === "closeview") { S.agrView = null; render(); return; }
  if (!S.isOwner) return;
  try {
    if (a === "send") { const note = (($("ob_note_" + id) || {}).value || "").trim(), start = (($("ag_start_" + id) || {}).value || "");
      if (!note) { toast("Add a short note on the assessment."); return; }
      if (!agrCoReady()) { toast("Fill in the company details in Settings first."); return; }
      await S.db.doc("agr/" + id).set({status: "sent", version: AGR_VERSION, sentAt: now(), sentBy: S.uid, start, assess: {notes: note, at: now(), by: S.uid}, company: {...S.company}});
      audit("Assessment passed; agreement sent", (S.joins[id] || {}).contractName || id); toast("Agreement sent. They read and sign it in the portal."); return; }
    if (a === "withdraw") { await S.db.doc("agr/" + id).delete(); audit("Agreement withdrawn", (S.joins[id] || {}).contractName || id); toast("Withdrawn."); return; }
  } catch(err){ toast(err.code === "permission_denied" || err.code === "unknown_path" ? "Agreements are not set up yet (run 0009 in Supabase)." : "Could not save."); }
});
