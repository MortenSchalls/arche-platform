/* ---------- Enquiry pool and booking cycle target (Morten, 24 Oct 2026) ----------
   Every charter enquiry (website form, charter email, phone) reaches the owner first. The owner releases it to all
   brokers (first come, first served) or assigns it to the most suitable person, and can reassign at any time.
   Brokers see the trip summary of open enquiries; the client's details open only for the broker who has it.
   Booking cycle target: each booking should go from enquiry to signed confirmation and client payment within
   S.terms.cycleDays days (default 5, set by the owner in Settings). Database rules: migration 0008. */
const POOL_SRC = {website: "Website", email: "Charter email", phone: "Phone", other: "Other"};
const cycleDays = () => Math.max(1, Math.round(num((S.terms || {}).cycleDays) || 5));
function cycleDay(fromIso){ const t = Date.parse(fromIso || ""); return isNaN(t) ? 0 : Math.floor((Date.now() - t) / 86400000) + 1; }
function cycleChip(t){
  if (!t || !t.d || ["clientPaid","flown","cancelled"].includes(t.stage)) return "";
  const n = cycleDay(t.d.enquiryAt || t.d.created), max = cycleDays(); if (!n) return "";
  return `<span class="chip ${n > max ? "c-returned" : n === max ? "c-review" : "c-quoted"}" title="Booking cycle target: enquiry to signed and paid within ${max} days">Day ${n} of ${max}</span>`;
}
function poolLegs(e){ return (e.legs || []).map(l => `${esc(l.from || "?")} → ${esc(l.to || "?")}${l.date ? " " + esc(fmtD(l.date)) : ""}`).join(" · ") || "Route to be confirmed"; }
function poolAgo(iso){ const m = Math.max(0, Math.round((Date.now() - Date.parse(iso || 0)) / 60000)); return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} days`; }
function poolWatch(){
  if (S.poolOn || !window.__sb && !S.db) return; S.poolOn = true;
  watchCol("pool", snap => { S.pool = {}; snap.docs.forEach(d => S.pool[d.id] = d.data()); render(); });
}
function poolPeople(){ return Object.entries(S.roster || {}).filter(([, p]) => p.active !== false && ["broker","consultant","ops"].includes(p.role)); }
function poolAssignSel(id, cur){ return `<select id="pa_${id}" aria-label="Assign to" style="width:auto">${[`<option value="">Assign to…</option>`, ...poolPeople().map(([uid, p]) => `<option value="${uid}" ${cur === uid ? "selected" : ""}>${esc(p.contractName || nm(uid))}</option>`)].join("")}</select>`; }

/* owner: everything that came in, waiting, taken */
function vPool(){
  poolWatch(); if (isStaff() && !S.subs["enquiries"]) watchCol("enquiries", snap => { S.enq = snap.docs.map(d => ({id: d.id, ...d.data()})); render(); });
  const all = Object.entries(S.pool || {}), webNew = (S.enq || []).filter(e => !e.handled && e.type !== "callback");
  const fresh = all.filter(([, e]) => e.status === "new"), open = all.filter(([, e]) => e.status === "released"), taken = all.filter(([, e]) => e.status === "claimed").sort((a, b) => (b[1].receivedAt || "").localeCompare(a[1].receivedAt || ""));
  const card = (id, e, actions) => `<div class="flag"><span class="sev low" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${poolLegs(e)}</b> · ${esc(e.pax || "?")} pax</p><p class="small muted">${esc(POOL_SRC[e.source] || e.source || "")} · received ${fmtT(e.receivedAt)}${e.note ? " · " + esc(e.note) : ""}</p>${actions}</div></div>`;
  const newActs = (key) => `<div class="row" style="margin-top:6px;gap:6px"><button class="btn small primary" type="button" data-pool="release|${key}">Release to all brokers</button>${poolAssignSel(key, "")}<button class="btn small" type="button" data-pool="assign|${key}">Assign</button><button class="btn small" type="button" data-pool="decline|${key}">Decline</button></div>`;
  return `<div class="head"><div><h1>Enquiries</h1><p class="muted small">Every charter enquiry comes here first. Release it to all brokers (the first to take it gets it) or assign it to the most suitable person. You can reassign at any time. Booking cycle target: ${cycleDays()} days from enquiry to signed and paid (change it in Settings).</p></div><div class="row"><button class="btn" type="button" data-pool="add">Add an enquiry from email or phone</button></div></div>
  ${S.poolAdd ? `<form id="poolForm" class="panel stack" style="max-width:820px;margin-bottom:16px"><h2>New enquiry</h2><div class="fgrid">
    <label class="f" for="pf_src">Came in by<select id="pf_src"><option value="email">Charter email</option><option value="phone">Phone</option><option value="other">Other</option></select></label>
    <label class="f" for="pf_pax">Passengers<input id="pf_pax" inputmode="numeric"></label>
    <label class="f" for="pf_from">From (airport or city)<input id="pf_from" required></label><label class="f" for="pf_to">To (airport or city)<input id="pf_to" required></label>
    <label class="f" for="pf_date">Date<input id="pf_date" type="date"></label><label class="f" for="pf_note">Trip notes<input id="pf_note"></label>
    <label class="f" for="pf_name">Client name<input id="pf_name" required></label><label class="f" for="pf_co">Company<input id="pf_co"></label>
    <label class="f" for="pf_mail">Client email<input id="pf_mail" type="email"></label><label class="f" for="pf_ph">Client phone<input id="pf_ph"></label>
    <label class="f wide" for="pf_msg">Their message<textarea id="pf_msg"></textarea></label></div>
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-pool="cancelAdd">Cancel</button></div></form>` : ""}
  <div class="grid2"><div class="stack">
    <div class="panel"><h2>New, waiting for you (${webNew.length + fresh.length})</h2>
      ${webNew.map(e => card("w:" + e.id, {legs: e.legs, pax: e.pax, source: "website", receivedAt: e.at, note: e.type === "quote" ? "" : e.type}, newActs("w:" + e.id))).join("")}
      ${fresh.map(([id, e]) => card(id, e, newActs(id))).join("")}
      ${webNew.length + fresh.length ? "" : `<p class="small muted">Nothing new.</p>`}</div>
    <div class="panel"><h2>Released, not taken yet (${open.length})</h2>
      ${open.map(([id, e]) => card(id, e, `<p class="small">Open for ${poolAgo(e.releasedAt)}</p><div class="row" style="margin-top:6px;gap:6px">${poolAssignSel(id, "")}<button class="btn small" type="button" data-pool="assign|${id}">Assign instead</button></div>`)).join("") || `<p class="small muted">None open.</p>`}</div></div>
    <div class="panel"><h2>Taken (${taken.length})</h2>
      ${taken.map(([id, e]) => { const n = cycleDay(e.receivedAt), max = cycleDays(), trip = allTrips().find(t => t.d.poolId === id);
        return card(id, e, `<p class="small"><b>${esc(nm(e.claimedBy))}</b> · ${e.how === "assigned" ? "assigned by you" : "took it"} ${fmtT(e.claimedAt)} · ${trip ? `trip ${esc(STAGES[trip.stage] || trip.stage)}` : "<b>no trip opened yet</b>"} ${trip && ["clientPaid","flown","cancelled"].includes(trip.stage) ? "" : `<span class="chip ${n > max ? "c-returned" : n === max ? "c-review" : "c-quoted"}">Day ${n} of ${max}</span>`}</p>
          <div class="row" style="margin-top:6px;gap:6px">${poolAssignSel(id, e.claimedBy)}<button class="btn small" type="button" data-pool="assign|${id}">Reassign</button></div>`); }).join("") || `<p class="small muted">None taken yet.</p>`}</div></div>`;
}

/* brokers: open enquiries, first come first served, and the ones they have */
function vOpenEnq(){
  poolWatch();
  const all = Object.entries(S.pool || {}), open = all.filter(([, e]) => e.status === "released"), mine = all.filter(([, e]) => e.status === "claimed" && e.claimedBy === S.uid);
  mine.forEach(([id]) => { S.poolC = S.poolC || {}; if (!(id in S.poolC)) { S.poolC[id] = undefined; S.db.doc("poolc/" + id).get().then(d => { S.poolC[id] = d.exists ? d.data() : null; }, () => { S.poolC[id] = null; }).finally(() => render()); } });
  const hasTrip = id => allTrips().some(t => t.d.poolId === id && t.bid === S.uid);
  return `<div class="head"><div><h1>Open enquiries</h1><p class="muted small">Enquiries released by Archē. First come, first served: the first broker to take one gets it. Contact the client within 15 minutes of taking it. Target: enquiry to signed and paid within ${cycleDays()} days.</p></div></div>
  <div class="grid2"><div class="panel"><h2>Open now (${open.length})</h2>
    ${open.map(([id, e]) => `<div class="flag"><span class="sev med" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${poolLegs(e)}</b> · ${esc(e.pax || "?")} pax</p><p class="small muted">${esc(POOL_SRC[e.source] || "")} · open for ${poolAgo(e.releasedAt)}${e.note ? " · " + esc(e.note) : ""}</p><div class="row" style="margin-top:6px"><button class="btn small primary" type="button" data-pool="take|${id}">Take it</button></div></div></div>`).join("") || `<p class="small muted">No open enquiries right now. New ones appear here as soon as Archē releases them.</p>`}</div>
  <div class="panel"><h2>Mine (${mine.length})</h2>
    ${mine.map(([id, e]) => { const c = (S.poolC || {})[id];
      return `<div class="flag"><span class="sev low" aria-hidden="true"></span><div style="flex:1;min-width:0"><p><b>${poolLegs(e)}</b> · ${esc(e.pax || "?")} pax</p>
      <p class="small">${c === undefined ? "Loading the client's details…" : c ? `${esc(c.name || "")}${c.company ? " · " + esc(c.company) : ""}<br>${esc(c.email || "")}${c.phone ? " · " + esc(c.phone) : ""}${c.reach ? " · " + esc(c.reach) : ""}${c.message ? `<br><span class="muted">${esc(c.message)}</span>` : ""}` : "Client details not available. Ask operations."}</p>
      <p class="small muted">${e.how === "assigned" ? "Assigned to you" : "You took it"} ${fmtT(e.claimedAt)} · <span class="chip ${cycleDay(e.receivedAt) > cycleDays() ? "c-returned" : "c-quoted"}">Day ${cycleDay(e.receivedAt)} of ${cycleDays()}</span></p>
      <div class="row" style="margin-top:6px">${hasTrip(id) ? `<span class="small">Trip opened.</span>` : `<button class="btn small primary" type="button" data-pool="trip|${id}">Open the trip</button>`}</div></div></div>`; }).join("") || `<p class="small muted">Nothing taken yet.</p>`}</div></div>`;
}

async function poolCreate(e, c, status, assignee){
  const id = "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at = now();
  const rec = {...e, status, receivedAt: e.receivedAt || at};
  if (status === "released") Object.assign(rec, {releasedAt: at, releasedBy: S.uid});
  if (status === "claimed") Object.assign(rec, {claimedBy: assignee, claimedAt: at, how: "assigned", assignedBy: S.uid});
  await S.db.doc("poolc/" + id).set(c); await S.db.doc("pool/" + id).set(rec); return id;
}
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-pool]"); if (!b) return; ev.preventDefault();
  const [a, key] = b.dataset.pool.split("|");
  if (a === "add") { S.poolAdd = true; render(); return; }
  if (a === "cancelAdd") { S.poolAdd = false; render(); return; }
  try {
    if (a === "take") { const ok = await window.__poolTake(key); if (ok) { audit("Enquiry taken", key); toast("It's yours. Contact the client within 15 minutes."); } else toast("Another broker took it first."); render(); return; }
    if (a === "trip") { const e = (S.pool || {})[key], c = (S.poolC || {})[key] || {}; if (!e) return;
      S.fromPool = {id: key, at: e.receivedAt};
      openEditor({bid: S.uid, did: "", d: {client: {name: c.name || "", company: c.company || "", email: c.email || "", phone: c.phone || ""}, trip: {legs: (e.legs || []).map(l => ({from: (l.from || "").toUpperCase(), to: (l.to || "").toUpperCase(), date: l.date || "", pax: e.pax || ""})), notes: [e.note, c.message].filter(Boolean).join("\n")}}}); return; }
    if (!S.isOwner) return;
    const sel = $("pa_" + key), who = sel ? sel.value : "";
    if (a === "assign" && !who) { toast("Choose who gets it."); return; }
    if (key.startsWith("w:")) {          // straight from the website feed
      const w = (S.enq || []).find(x => x.id === key.slice(2)); if (!w) return;
      if (a === "decline") { await S.db.doc("enquiries/" + w.id).set({...w, handled: true}); audit("Website enquiry declined", w.id); toast("Declined."); return; }
      const e = {source: "website", legs: (w.legs || []).map(l => ({from: l.from, to: l.to, date: l.date})), pax: w.pax || "", receivedAt: w.at, note: ""};
      const c = {name: w.name || "", email: /@/.test(w.reach || "") ? w.reach : "", phone: /@/.test(w.reach || "") ? (w.phone || "") : (w.reach || w.phone || ""), reach: w.reply ? "prefers " + w.reply : "", message: w.message || ""};
      const id = await poolCreate(e, c, a === "release" ? "released" : "claimed", who);
      await S.db.doc("enquiries/" + w.id).set({...w, handled: true});
      audit(a === "release" ? "Enquiry released to all brokers" : "Enquiry assigned", a === "release" ? id : `${id} · ${nm(who)}`);
      toast(a === "release" ? "Released to all brokers." : "Assigned."); return;
    }
    const e = (S.pool || {})[key]; if (!e) return;
    if (a === "decline") { await S.db.doc("pool/" + key).set({...e, status: "declined", closedAt: now()}); audit("Enquiry declined", key); toast("Declined."); return; }
    if (a === "release") { await S.db.doc("pool/" + key).set({...e, status: "released", releasedAt: now(), releasedBy: S.uid}); audit("Enquiry released to all brokers", key); toast("Released to all brokers."); return; }
    if (a === "assign") { const prev = e.claimedBy; await S.db.doc("pool/" + key).set({...e, status: "claimed", claimedBy: who, claimedAt: now(), how: "assigned", assignedBy: S.uid});
      audit(prev ? "Enquiry reassigned" : "Enquiry assigned", `${key} · ${prev ? nm(prev) + " → " : ""}${nm(who)}`); toast(prev ? "Reassigned." : "Assigned."); return; }
  } catch(err){ toast(err.code === "permission_denied" || err.code === "unknown_path" ? "The enquiry pool is not set up yet (run 0008 in Supabase)." : "Could not save. Try again."); }
});
document.addEventListener("submit", async ev => {
  if (ev.target.id !== "poolForm") return; ev.preventDefault();
  const v = id => ($(id) || {}).value ? $(id).value.trim() : "";
  const e = {source: v("pf_src"), legs: [{from: v("pf_from"), to: v("pf_to"), date: v("pf_date")}], pax: v("pf_pax"), note: v("pf_note")};
  const c = {name: v("pf_name"), company: v("pf_co"), email: v("pf_mail"), phone: v("pf_ph"), message: v("pf_msg")};
  if (!c.email && !c.phone) { toast("Add the client's email or phone."); return; }
  try { await poolCreate(e, c, "new"); S.poolAdd = false; audit("Enquiry added", `${e.legs[0].from} → ${e.legs[0].to}`); toast("Saved. Release or assign it below."); render(); }
  catch(err){ toast(err.code === "permission_denied" || err.code === "unknown_path" ? "The enquiry pool is not set up yet (run 0008 in Supabase)." : "Could not save. Try again."); }
});
