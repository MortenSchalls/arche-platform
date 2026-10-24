/* ---------- Offer and agreement in the portal (Morten, 24 Oct 2026): nothing is sent as a file by email ----------
   Candidates read the commission offer here, train, ask for assessment, then read and sign their agreement here.
   The owner sends the agreement after a passed assessment and countersigns it; countersigning opens the portal and
   issues the onboarding package. The signed text is kept with both signatures and a fingerprint (SHA-256), so both
   sides can always see exactly what was signed. Database rules: migration 0009. Text: agreement-text.js. */
const OFFER_HTML = `<p>Our commission offer for independent brokers at Archē Executive: 27% of gross profit on your first 8 bookings each month, and 35% on every booking after that, with no cap.</p>
<h3>The role</h3><p>Archē Executive is a private jet charter brokerage serving clients worldwide, with Asia as its primary market. You join as an independent broker on a fully commission-based agreement: you build and close your own client business, and you earn a share of the gross profit on every trip you sell. You work from your own country (outside Singapore and Thailand), and there is no cap on what you can earn.</p>
<p>You work in the Archē broker portal, where every enquiry, quote, booking and payment is handled, and where you receive leads from our prospect research. You are responsible for each booking from start to finish: sourcing the aircraft, creating the booking and keeping the portal updated, special requests, ground handling, transport and airport access, the documents the operator needs, and following every flight to the last landing, including multi-leg trips and long-term charters. Operations checks and approves every trip and handles payments.</p>
<h3>How your commission works</h3><table><tr><th>Bookings in the calendar month</th><th>Your share of gross profit</th></tr><tr><td>Bookings 1 to 8</td><td>27%</td></tr><tr><td>Booking 9 and every booking after</td><td>35%</td></tr></table>
<ul><li><b>Gross profit</b> is the price the client pays, less what Archē Executive pays the aircraft operator and the direct costs of the trip.</li><li><b>One booking</b> is measured by value: one standard booking is a trip billed at USD 45,000 with USD 3,150 gross profit. A smaller trip counts as part of a booking, a larger one as more than one.</li><li>The count starts again on the first day of each month.</li><li>Because you earn a share of gross profit, a better margin on a trip pays you more.</li></ul>
<h3>What you can earn</h3><p>At 8 standard bookings a month you earn USD 6,804 a month, about USD 81,648 a year, and every booking above 8 adds USD 1,102.50.</p>
<table><tr><th>Standard bookings per month</th><th>Monthly commission (USD)</th><th>Yearly at that pace (USD)</th></tr><tr><td>4</td><td>3,402</td><td>40,824</td></tr><tr><td>6</td><td>5,103</td><td>61,236</td></tr><tr><td>8</td><td>6,804</td><td>81,648</td></tr><tr><td>10</td><td>9,009</td><td>108,108</td></tr><tr><td>12</td><td>11,214</td><td>134,568</td></tr></table>
<p class="small muted">Figures assume standard bookings at USD 3,150 gross profit each. They are examples, not a promise of earnings.</p>
<h3>Payment terms</h3><p>Commission is calculated only on completed bookings: every flight landed, the client paid in full, all extras settled and the booking closed in the portal.</p>
<ul><li><b>When it counts:</b> a booking counts in the month it is completed. For a multi-leg trip or a long-term charter, that is when the last flight has landed and the whole transaction is settled.</li><li><b>When you're paid:</b> by the 15th of the following month, with a statement of each booking and its gross profit. You can follow your commission in the portal at any time.</li><li><b>Cancellations and refunds:</b> if a trip is refunded after commission is paid, that commission is deducted from your next payment.</li><li><b>No cap:</b> the 35% rate applies to every booking from the 9th, however many you close in a month.</li><li><b>Fully commission-based:</b> there is no fixed salary or draw, and your commission is your full share of the profit on your bookings.</li></ul>
<h3>How we work</h3><ul><li><b>Enquiries:</b> you build your own clients, and Archē also releases the enquiries it receives to all brokers in the portal. First come, first served: the first broker to take one gets it. Archē may also assign an enquiry to the broker best suited to it.</li><li><b>Speed:</b> contact a new client within 15 minutes, and aim to take every booking from enquiry to signed and paid within 5 days.</li><li><b>Portal only:</b> every enquiry, quote, booking and payment goes through the Archē portal, and every booking is checked and approved by operations before the client receives a confirmation.</li><li><b>Client money:</b> clients pay Archē Executive directly through a secure payment request; you never collect client money yourself.</li><li><b>Archē accounts:</b> you work from your own Archē email address and the Archē company accounts on WhatsApp, LINE and WeChat, never from personal ones.</li><li><b>Our standard:</b> we serve the top 0.1% of travellers. You follow the Archē Standards of Conduct, including business attire and the Archē background in every online meeting.</li></ul>
<h3>Next steps</h3><p>Everything happens here in the portal, from your first step to your first booking. Nothing is sent to you as a file by email.</p>`;

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
  if (a.status !== "sent") return `<div class="panel stack" style="max-width:860px"><div class="row" style="justify-content:space-between"><h1>Your agreement</h1><div class="row"><button class="btn" type="button" data-agr="print">Print or save as PDF</button><button class="btn" type="button" data-agr="close">Back</button></div></div>${agrRender(a)}</div>`;
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
  return `<div class="panel stack" style="max-width:860px;margin:16px 0"><div class="row" style="justify-content:space-between"><h2>Agreement: ${esc(a.signedName || (S.joins[id] || {}).contractName || "")}</h2><div class="row"><button class="btn small" type="button" data-agr="print">Print or save as PDF</button><button class="btn small" type="button" data-agr="closeview">Close</button></div></div>${a.html || agrRender(a)}</div>`; }
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
    await S.db.doc("roster/" + id).set({contractName: j.contractName, role: j.role, base: j.base || "", cert: j.cert || "", since: at, active: true, workEmail: mail,
      onboarding: {assessedAt: (a.assess || {}).at || at, assessedBy: (a.assess || {}).by || S.uid, notes: (a.assess || {}).notes || "", issuedAt: at, agreement: a.version || AGR_VERSION}});
    await S.db.doc("join/" + id).delete();
    audit("Agreement countersigned; onboarding package issued", `${j.contractName} · ${mail}`); toast("Countersigned. Their portal opens with the onboarding package.");
  } catch(err){ toast(err.code === "permission_denied" || err.code === "unknown_path" ? "Agreements are not set up yet (run 0009 in Supabase)." : "Could not countersign."); }
}
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-agr]"); if (!b) return; ev.preventDefault();
  const [a, id] = b.dataset.agr.split("|");
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
