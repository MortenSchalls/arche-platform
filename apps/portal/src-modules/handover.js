/* ---------- Client handover when a broker leaves (Morten, 31 Oct 2026: "add to the portal and as well the contract").
   The cost of a leaver is the client business that goes with them, not the hire. Agreement clause 8.5 (version 2026-10-31.1):
   Archē names the broker who takes over each Registered Client; the leaving broker introduces them personally within the
   notice period; the client becomes the new broker's Registered Client.
   Owner, in the leaving file (Onboarding / Team): the leaver's client book from their trips, a successor per client, one
   click to hand over. The handover creates an own lead for the successor with the client's details and trip history and
   a 48-hour first-contact task on their Today; the leaver (during notice) sees "introduce your successor" tasks; the owner
   ticks "introduced" and sees "contacted" when the successor logs the first contact. Today flags clients not handed over. */
(function(){
  const H48 = 48 * 3600e3;
  const keyOf = c => String((c.company || c.name || "")).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const hid = k => "c" + Array.from(k).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36);
  window.clientBook = function(uid){
    const book = {};
    allTrips().filter(t => t.bid === uid && t.stage !== "cancelled").forEach(t => {
      const c = t.d.client || {}, k = keyOf(c); if (!k) return;
      const b = book[k] || (book[k] = {key: k, id: hid(k), name: c.company || c.name, contact: c.company ? (c.name || "") : "", email: c.email || "", phone: c.phone || "", country: c.country || "", trips: 0, flown: 0, value: 0, last: ""});
      b.trips++; if (t.stage === "flown") b.flown++;
      b.value += (t.st && num(t.st.price)) || 0;
      const d = ((t.d.trip || {}).legs || []).map(l => l.date).filter(Boolean).sort().pop() || String(t.d.created || "").slice(0, 10);
      if (d > b.last) b.last = d;
      if (!b.email && c.email) b.email = c.email; if (!b.phone && c.phone) b.phone = c.phone;
    });
    return Object.values(book).sort((a, b) => b.value - a.value || b.trips - a.trips);
  };
  // the owner can take clients and leads too (Morten, 31 Oct 2026: "I should be able to rotate clients and lead to me also")
  const successors = leaver => [[S.uid, "Me (" + ((S.myName || nm(S.uid) || "owner").split(" ")[0]) + ")"], ...Object.entries(S.roster || {}).filter(([id, p]) => id !== leaver && id !== S.uid && p.active !== false && !p.offboard && ["broker", "consultant", "ops", "owner"].includes(p.role)).map(([id, p]) => [id, p.contractName || nm(id)])];
  S.hoLead = S.hoLead || {};
  function leadState(to, leadId){
    const k = to + "/" + leadId; if (S.hoLead[k] === undefined) { S.hoLead[k] = null; S.db.doc(`leads/${to}/items/${leadId}`).get().then(d => { S.hoLead[k] = d.exists ? d.data() : false; render(); }).catch(() => { S.hoLead[k] = false; }); }
    const l = S.hoLead[k]; if (!l) return null;
    return (l.log || []).find(x => !x.system && Date.parse(x.t) >= Date.parse(l.assignedAt || 0)) || null;
  }
  function panel(id, p){
    const o = p.offboard || {}, ho = o.handover || {}, book = clientBook(id), sx = successors(id);
    if (!book.length) return `<p class="small muted" style="margin-top:6px">Client handover: no clients on their trips.</p>`;
    const open = book.filter(b => !ho[b.id]).length;
    return `<details ${open ? "open" : ""} style="margin-top:8px"><summary class="small"><b>Client handover</b> · ${book.length - open} of ${book.length} clients handed over (agreement clause 8.5)</summary>
      <p class="small muted">Name the broker who takes over each client. They get the client as their own lead with a call due within 48 hours; ${esc(p.contractName || nm(id))} introduces them personally before access ends.</p>
      ${open ? `<div class="row" style="margin:6px 0"><button class="btn small" type="button" data-ho="allme" data-uid="${id}">Hand all ${open} to me</button></div>` : ""}
      <div class="tbl"><table class="small"><thead><tr><th scope=col>Client</th><th scope=col>Trips</th><th scope=col>Billed</th><th scope=col>Last</th><th scope=col>Successor</th><th scope=col>Status</th></tr></thead><tbody>
      ${book.map(b => { const h = ho[b.id], c = h ? leadState(h.to, h.leadId) : null;
        return `<tr><td>${esc(b.name)}${b.contact ? `<br><span class="muted">${esc(b.contact)}</span>` : ""}</td><td>${b.trips}${b.flown ? ` (${b.flown} flown)` : ""}</td><td>${b.value ? usd(b.value) : "–"}</td><td>${b.last ? fmtD(b.last) : "–"}</td>
          <td>${h ? esc(h.toName || nm(h.to)) : `<select id="ho_${id}_${b.id}" aria-label="Successor for ${esc(b.name)}"><option value="">Choose</option>${sx.map(([u, n]) => `<option value="${u}">${esc(n)}</option>`).join("")}</select>`}</td>
          <td>${h ? `${c ? `<span class="chip c-flown">Contacted ${fmtD(c.t)}</span>` : Date.now() > Date.parse(h.due) ? `<span class="chip c-returned">Call overdue</span>` : `<span class="chip c-review">Call due ${fmtT(h.due)}</span>`}
              <br><label class="check" for="hi_${id}_${b.id}"><input type="checkbox" id="hi_${id}_${b.id}" data-ho="intro" data-uid="${id}" data-k="${b.id}" ${h.introAt ? "checked" : ""}><span>Introduced by ${esc((p.contractName || nm(id)).split(" ")[0])}</span></label>`
            : `<button class="btn small" type="button" data-ho="give" data-uid="${id}" data-k="${b.id}">Hand over</button>`}</td></tr>`; }).join("")}
      </tbody></table></div></details>`;
  }
  const _oc = offboardCard;
  offboardCard = function(id, p){ const h = _oc(id, p); const i = h.lastIndexOf("</div></div>"); return i < 0 ? h + panel(id, p) : h.slice(0, i) + panel(id, p) + h.slice(i); };
  const _of = offboardForm;
  offboardForm = function(id){ return _of(id).replace("Open trips stay with you to finish (clause 8.4).", "Open trips stay with you to finish (clause 8.4). Then hand over each client to a named broker in the leaving file (clause 8.5)."); };

  // hand one client to a successor: an own lead with a 48-hour call; recorded in the leaving file
  async function giveClient(id, k, to, quiet){
    const p = (S.roster || {})[id]; if (!p || !p.offboard) return false;
    const c = clientBook(id).find(x => x.id === k); if (!c) return false;
    const at = now(), due = new Date(Date.now() + H48).toISOString(), leadId = "ho" + Date.now().toString(36) + k.slice(1, 5), from = p.contractName || nm(id), toName = to === S.uid ? (S.myName || nm(to)) : ((S.roster[to] || {}).contractName || nm(to));
    const lead = {own: true, imported: false, org: c.name, segment: "", kind: "client", country: c.country, region: typeof AE_ENGINE === "object" && AE_ENGINE.regionOf ? AE_ENGINE.regionOf(c.country) : "", city: "", website: "",
      source: `Client handover from ${from} (agreement clause 8.5)`, why: `Existing Archē client: ${c.trips} trip${c.trips === 1 ? "" : "s"}${c.flown ? `, ${c.flown} flown` : ""}${c.value ? `, ${usd(c.value)} billed` : ""}${c.last ? `, last ${fmtD(c.last)}` : ""}. Call within 48 hours: introduce yourself, confirm anything open, and agree how they like to be served.`,
      approach: "", avenues: [c.contact ? {type: "Contact", label: c.contact, url: ""} : null, c.email ? {type: "Email", label: c.email, url: ""} : null, c.phone ? {type: "Phone", label: c.phone, url: ""} : null].filter(Boolean),
      status: "new", added: at, assignedAt: at, sourcedBy: id, handover: {from: id, fromName: from, at, due, by: S.uid}, log: []};
    try {
      await S.db.doc(`leads/${to}/items/${leadId}`).set(lead);
      const cur = ((S.roster || {})[id] || p).offboard;
      const o = {...cur, handover: {...(cur.handover || {}), [k]: {to, toName, name: c.name, at, due, leadId}}};
      await S.db.doc("roster/" + id).update({offboard: JSON.parse(JSON.stringify(o))});
      if (S.roster[id]) S.roster[id] = {...S.roster[id], offboard: o};
      audit("Client handed over", `${c.name}: ${from} → ${toName}`); if (!quiet) toast(`${c.name} handed over to ${toName}. Call due within 48 hours.`);
      return true;
    } catch(err){ if (!quiet) toast("Could not hand over the client. Try again."); return false; }
  }
  window.handAllToMe = async function(id){
    const p = (S.roster || {})[id]; if (!p || !p.offboard) return 0; let n = 0;
    for (const b of clientBook(id)) if (!((S.roster[id] || p).offboard.handover || {})[b.id]) { if (await giveClient(id, b.id, S.uid, true)) n++; }
    return n;
  };
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest('[data-ho="give"],[data-ho="allme"]'); if (!b || !S.isOwner) return; e.preventDefault();
    const id = b.dataset.uid;
    if (b.dataset.ho === "allme") { const n = await handAllToMe(id); toast(n ? `${n} client${n === 1 ? "" : "s"} handed over to you. Calls due within 48 hours.` : "Nothing left to hand over."); render(); return; }
    const k = b.dataset.k, to = ($(`ho_${id}_${k}`) || {}).value; if (!to) { toast("Choose who takes over this client."); return; }
    await giveClient(id, k, to); render();
  });

  /* ---- Lock now (Morten, 31 Oct 2026: "lock all access with immediate effect ... fraud, or any other of the things that I can
     terminate with immediate effect"): agreement clause 8.3. One action: access off at once (the database refuses every
     request from that login from the next one), rights and alerts removed, open enquiries back to the pool, prospects back
     to rotation, their own leads and every client to the owner, and the file marked Locked with the reason. Open trips stay
     with the owner to finish. No notice to members. ---- */
  const _of2 = offboardForm;
  offboardForm = function(id){
    return _of2(id).replace('<option value="breach">Today, for breach (clause 8.3)</option>', '<option value="breach">Today, for breach (clause 8.3)</option><option value="lock">Lock now: fraud or another clause 8.3 ground (everything off at once, all clients and leads to me)</option>');
  };
  const _run = offboardRun;
  offboardRun = async function(id, mode, reason){
    if (mode !== "lock") return _run(id, mode, reason);
    await _run(id, "breach", "LOCKED: " + reason);
    let p = (S.roster || {})[id];
    try { const d = await S.db.doc("roster/" + id).get(); if (d.exists) { p = d.data(); S.roster[id] = p; } } catch(e){}
    if (!p || !p.offboard) { toast("Locked, but the leaving file could not be read. Hand the clients over in Onboarding."); return; }
    try { const o = {...p.offboard, mode: "lock", locked: {at: now(), by: S.uid, reason}}; await S.db.doc("roster/" + id).update({offboard: JSON.parse(JSON.stringify(o)), active: false}); S.roster[id] = {...p, offboard: o, active: false}; } catch(e){}
    const n = await handAllToMe(id);
    audit("Access locked with immediate effect", `${nm(id)} · ${reason}`);
    toast(`Locked. Access is off now; ${n} client${n === 1 ? "" : "s"} and their own leads moved to you.`); render();
  };
  // a red Lock now button next to each active member in Team
  if (typeof vTeam === "function") {
    const _vt = vTeam;
    vTeam = function(){ return _vt().replace(/(<button class="btn small danger" type="button" data-offboard="([^"]+)">[^<]*<\/button>)/g, (m, btn, id) => btn + ` <button class="btn small danger" type="button" data-lock="${id}" title="Fraud or another clause 8.3 ground">Lock now</button>`); };
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-lock]"); if (!b || !S.isOwner) return; e.preventDefault();
    S.offboardId = b.dataset.lock; S.lockPick = true; S.view = "onboarding"; render();
    setTimeout(() => { const m = $("off_mode"); if (m) { m.value = "lock"; const w = $("off_why"); if (w) w.focus(); } const el = document.getElementById("intakePanel"); if (el) el.scrollIntoView({behavior: "smooth"}); }, 50);
  });

  document.addEventListener("change", async e => {
    const el = e.target; if (!el.dataset || el.dataset.ho !== "intro" || !S.isOwner) return;
    const id = el.dataset.uid, k = el.dataset.k, p = (S.roster || {})[id]; if (!p || !p.offboard || !(p.offboard.handover || {})[k]) return;
    const o = JSON.parse(JSON.stringify(p.offboard)); o.handover[k].introAt = el.checked ? now() : null;
    try { await S.db.doc("roster/" + id).update({offboard: o}); } catch(err){ toast("Could not save."); }
  });

  // Today: the successor's 48-hour call; the leaver's introductions; the owner's clients still to hand over
  const _tf = tasksFor;
  tasksFor = function(bid, asOps){
    const out = _tf(bid, asOps), t0 = Date.now();
    if (bid && bid === S.uid) {
      Object.entries(S.leads || {}).forEach(([lid, l]) => { const h = l.handover; if (!h) return;
        if ((l.log || []).some(x => !x.system && Date.parse(x.t) >= Date.parse(l.assignedAt || 0))) return;
        out.push({sev: t0 > Date.parse(h.due) ? 0 : 1, text: `Client handover from ${h.fromName}: call ${l.org} by ${fmtT(h.due)} and log the contact`, act: `data-view="leads" data-lead="${lid}"`}); });
      const mo = (S.myRoster || {}).offboard;
      if (mo && mo.handover && (S.myRoster || {}).active !== false) Object.values(mo.handover).filter(h => !h.introAt).forEach(h =>
        out.push({sev: 1, text: `Introduce ${h.toName} to ${h.name} personally before ${fmtD(mo.endDate)}, then email them both (agreement clause 8.5)`, act: `data-view="today"`}));
    }
    return out.sort((a, b) => a.sev - b.sev);
  };
  if (typeof leaveTodayFlags === "function") {
    const _lf = leaveTodayFlags;
    leaveTodayFlags = function(){
      const out = _lf();
      if (S.isOwner) Object.entries(S.roster || {}).filter(([, p]) => p.offboard && !p.offboard.closed).forEach(([id, p]) => {
        const n = clientBook(id).filter(b => !(p.offboard.handover || {})[b.id]).length;
        if (n) out.push(`${p.contractName || nm(id)} is leaving: ${n} client${n === 1 ? "" : "s"} not handed over yet. Name a successor for each in the leaving file (clause 8.5).`);
      });
      return out;
    };
  }
})();
