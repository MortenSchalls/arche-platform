/* ---------- Today for brokers and operations (Morten, 28 Oct 2026: "can we have a Today page for each function") ----------
   The first page brokers and operations see: what needs them today, in the order to do it. The Dashboard stays for
   progress and figures. Built only from what the portal already records; every line opens the trip or lead.
   Broker: tasks (returned files, quotes, follow-ups, leads due), flights today and tomorrow on their trips,
     aftercare, work waiting on operations or the director, open enquiries in the pool, notices.
   Operations: tasks (files to check, signatures, payments, operator payments, flights to record), flights today and
     tomorrow on every trip, client payments outstanding with the balance date, aftercare, notices.
   Every section can be collapsed (collapse.js). */
(function(){
  const _nav = navItems;
  navItems = function(){ const r = acting(), items = _nav(); return (r === "broker" || r === "ops") && !items.some(i => i[0] === "today") ? [["today", "Today"], ...items] : items; };
  const localISO = (ms) => new Date(ms).toLocaleDateString("en-CA");          // the user's own calendar date, YYYY-MM-DD
  const cl = t => (t.d.client && (t.d.client.company || t.d.client.name)) || "Client";
  const firstLeg = t => (legsOf(t)[0] || {}).date || "";
  const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  function flights(trips, goto){
    const t0 = localISO(Date.now()), t1 = localISO(Date.now() + 864e5), rows = [];
    trips.filter(t => ["issued", "clientPaid", "flown"].includes(t.stage)).forEach(t => legsOf(t).forEach((l, i) => {
      if (l.date === t0 || l.date === t1) rows.push({t, l, i, day: l.date === t0 ? "Today" : "Tomorrow"}); }));
    rows.sort((a, b) => (a.l.date + (a.l.time || "")).localeCompare(b.l.date + (b.l.time || "")));
    return `<div class="panel"><h2>Flights today and tomorrow (${rows.length})</h2>${rows.length ? `<div class="tbl"><table class="small"><thead><tr><th scope=col>When</th><th scope=col>Leg</th><th scope=col>Status</th><th scope=col>Client</th><th scope=col></th></tr></thead><tbody>${rows.map(x => { const ls = (legSt(x.t)[x.i] || {}), tl = typeof tailOf === "function" ? tailOf(x.t) : "";
        return `<tr><td>${x.day} ${esc(x.l.time || "")}</td><td><b>${esc(x.l.from)} → ${esc(x.l.to)}</b>${legsOf(x.t).length > 1 ? ` <span class="muted">leg ${x.i + 1} of ${legsOf(x.t).length}</span>` : ""}${tl ? `<br><span class="muted">${esc(tl)}</span>` : ""}</td><td>${typeof legChip === "function" ? legChip(ls) : ""}${ls.note ? `<br><span class="muted">${esc(ls.note)}</span>` : ""}</td><td>${esc(cl(x.t))}${goto === "queue" ? ` <span class="muted">· ${esc(nm(x.t.bid))}</span>` : ""}</td><td><a href="#" data-open="${x.t.bid}|${x.t.did}" data-goto="${goto}">Open</a>${tl ? ` · <a href="${esc(trackUrls(tl)[0][1])}" target="_blank" rel="noopener noreferrer" data-trk="1">Track</a>` : ""}</td></tr>`; }).join("")}</tbody></table></div>
      <p class="small muted">Delayed, diverted and cancelled legs show in red. Track opens the aircraft on Flightradar24 in a small window beside the portal (some private aircraft are hidden). Follow every leg until the last passenger has landed, then follow up with the client within 24 hours (manual 11.5).</p>` : `<p class="small muted">No flights today or tomorrow.</p>`}</div>`;
  }
  function waiting(me){
    const rows = [];
    myTrips(me).forEach(t => { const op = `data-open="${t.bid}|${t.did}" data-goto="trips"`;
      if (t.stage === "review") rows.push(`<button type="button" class="task s2" ${op}><span class="dot" aria-hidden="true"></span><span>With operations: ${esc(cl(t))}</span></button>`);
      if (typeof gateReq === "function") { const g = gateReq(me, "quote", t.did); if (g && g.status === "pending") rows.push(`<button type="button" class="task s2" ${op}><span class="dot" aria-hidden="true"></span><span>Quote waiting for the director's OK: ${esc(cl(t))}</span></button>`); } });
    return `<div class="panel"><h2>Waiting on others (${rows.length})</h2>${rows.length ? `<div class="tasks">${rows.join("")}</div>` : `<p class="small muted">Nothing waiting on operations or the director.</p>`}</div>`;
  }
  function pool(){
    if (typeof poolWatch === "function") poolWatch();
    const open = Object.values(S.pool || {}).filter(e => e.status === "released").length;
    return `<div class="panel"><h2>Open enquiries in the pool (${open})</h2><p class="small">${open ? "Enquiries waiting for a broker. The first to take one owns it." : "No open enquiries right now."}</p><div class="row"><button class="btn small" type="button" data-view="openenq">Open enquiries</button></div></div>`;
  }
  function payments(){
    const t0 = localISO(Date.now()), rows = allTrips().filter(t => t.stage === "issued" && !(t.st || {}).clientPaid && !ownTrip(t)).map(t => {
      const first = firstLeg(t), bal = first ? addDays(first, -7) : "", full = first && bal <= String((t.st || {}).issuedAt || "").slice(0, 10);
      return {t, first, due: full ? "full amount due now (departure within 7 days)" : bal ? "balance by " + fmtD(bal) : "", late: !full && bal && bal < t0, now: !!full};
    }).sort((a, b) => (a.first || "9").localeCompare(b.first || "9"));
    return `<div class="panel"><h2>Client payments outstanding (${rows.length})</h2>${rows.length ? `<div class="tasks">${rows.map(x => `<button type="button" class="task s${x.late || x.now ? 0 : 1}" data-open="${x.t.bid}|${x.t.did}" data-goto="queue"><span class="dot" aria-hidden="true"></span><span>${esc(cl(x.t))}: first flight ${x.first ? fmtD(x.first) : "–"}${x.due ? ", " + esc(x.due) : ""}${x.late ? " · overdue" : ""}</span></button>`).join("")}</div>
      <p class="small muted">Deposit 25% (at least USD 2,500) on signature; balance 7 days before the first departure; the full amount if departure is within 7 days. Payment only by the secure payment request.</p>` : `<p class="small muted">No confirmed trip is waiting for client payment.</p>`}</div>`;
  }
  function roleToday(r){
    const me = S.uid, asBroker = r === "broker" || S.alsoBroker, asOps = r === "ops";
    const tasks = tasksFor(asBroker ? me : null, asOps), urgent = tasks.filter(x => x.sev <= 1).length;
    const tripsF = asOps ? allTrips() : myTrips(me), t0 = localISO(Date.now()), t1 = localISO(Date.now() + 864e5);
    const nFl = tripsF.filter(t => ["issued", "clientPaid", "flown"].includes(t.stage)).reduce((n, t) => n + legsOf(t).filter(l => l.date === t0 || l.date === t1).length, 0);
    const nRev = asOps ? allTrips().filter(t => t.stage === "review" && !ownTrip(t)).length : myTrips(me).filter(t => t.stage === "review").length;
    const ac = typeof acTaskPanel === "function" ? acTaskPanel(asOps && isStaff()) : "";
    return `<div class="head"><div><h1>Today</h1><p class="muted small">${new Date().toLocaleDateString("en-GB", {weekday: "long", day: "numeric", month: "long"})} · what needs you today, most urgent first. Your progress and figures are on the Dashboard.</p></div><div class="row"><button class="btn" type="button" data-view="home">Dashboard</button></div></div>
      ${typeof noticePanel === "function" ? noticePanel() : ""}
      <div class="kpis"><div class="kpi"><div class="l">Urgent</div><div class="v">${urgent}</div></div><div class="kpi"><div class="l">All tasks</div><div class="v">${tasks.length}</div></div><div class="kpi"><div class="l">Flights today and tomorrow</div><div class="v">${nFl}</div></div><div class="kpi"><div class="l">${asOps ? "Files to check" : "With operations"}</div><div class="v">${nRev}</div></div></div>
      <div class="grid2"><div class="panel"><h2>Your tasks (${tasks.length})</h2>${taskList(tasks)}</div>
      <div class="stack">${flights(tripsF, asOps ? "queue" : "trips")}${asOps ? payments() : waiting(me)}${asBroker ? pool() : ""}</div></div>${ac}`;
  }
  const _vT = vToday;
  vToday = function(){ const r = acting(); return r === "broker" || r === "ops" ? roleToday(r) : afterHead(_vT(), `<div style="margin-bottom:16px">${flights(allTrips(), "trips")}</div>`); };   // the owner sees every flight too (Morten, 28 Oct 2026)
  window.roleToday = roleToday;
})();
