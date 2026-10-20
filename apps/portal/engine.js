/* Archē Executive prospect engine. One file, used by the portal page and by the scheduled run.
   Pure function: engine(state, cfg, nowISO) -> {writes, report, board, metrics}.
   state = {prospects:{id:doc}, leads:{bid:{id:doc}}, roster:{id:doc}, trips:[{bid,did,d,st}]}
   writes = [{op:"set"|"update"|"delete", path:"collection/.../docId", data}] */
(function (root) {
  "use strict";
  const DEFAULTS = {
    firstTouchHours: 48,      // first contact due after assignment
    followUpDays: 14,         // longest gap between contacts on an open lead
    parkDays: 90,             // "Not now" is revisited after this
    maxOpen: 40,              // open leads per broker
    perRound: 10,             // new prospects per broker per round
    weeklyFloor: 5,           // every active broker gets at least this many a week while prospects are free
    maxHops: 3,               // brokers tried before the owner decides
    minAddsPerMonth: 10,      // prospects each broker must add per month
    addsBoostMax: 1.0,        // brokers who add prospects get up to this much extra share of new leads (1.0 = double)
    updatePointsCap: 20,      // most points a month for contact-route updates
    minNoteChars: 15,         // a contact counts for points only with a real note
    enquiryDays: 14,          // an "enquiry" lead with no trip after this goes back to follow-up
    wFit: 0.35, wPerf: 0.40, wFair: 0.25,
    boardVisible: true
  };
  const CLOSED = new Set(["dnc", "duplicate"]);
  const DAY = 864e5, HOUR = 36e5;
  const t = s => (s ? Date.parse(s) : NaN);
  const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\b(ltd|limited|pte|llc|inc|co|company|group|holdings?|the|sa|ag|gmbh|plc|bhd|sdn)\b/g, "").replace(/[^a-z0-9]+/g, "");
  const domain = u => { try { return new URL(/^https?:/.test(u) ? u : "https://" + u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
  const REGION_OF = {"singapore":"Asia-Pacific","thailand":"Asia-Pacific","malaysia":"Asia-Pacific","indonesia":"Asia-Pacific","philippines":"Asia-Pacific","vietnam":"Asia-Pacific","hong kong":"Asia-Pacific","china":"Asia-Pacific","japan":"Asia-Pacific","korea":"Asia-Pacific","south korea":"Asia-Pacific","taiwan":"Asia-Pacific","india":"Asia-Pacific","australia":"Asia-Pacific","new zealand":"Asia-Pacific","cambodia":"Asia-Pacific","maldives":"Asia-Pacific","sri lanka":"Asia-Pacific",
    "united arab emirates":"Middle East","uae":"Middle East","dubai":"Middle East","saudi arabia":"Middle East","qatar":"Middle East","kuwait":"Middle East","bahrain":"Middle East","oman":"Middle East","israel":"Middle East","jordan":"Middle East","lebanon":"Middle East","turkey":"Middle East",
    "united kingdom":"Europe","uk":"Europe","france":"Europe","germany":"Europe","switzerland":"Europe","italy":"Europe","spain":"Europe","monaco":"Europe","denmark":"Europe","sweden":"Europe","norway":"Europe","netherlands":"Europe","belgium":"Europe","austria":"Europe","portugal":"Europe","greece":"Europe","ireland":"Europe","poland":"Europe","malta":"Europe","cyprus":"Europe","finland":"Europe","luxembourg":"Europe",
    "united states":"North America","usa":"North America","canada":"North America","mexico":"Latin America","brazil":"Latin America","argentina":"Latin America","chile":"Latin America","colombia":"Latin America","panama":"Latin America",
    "south africa":"Africa","nigeria":"Africa","kenya":"Africa","egypt":"Africa","morocco":"Africa","ghana":"Africa"};
  const regionOf = c => REGION_OF[String(c || "").trim().toLowerCase()] || "";

  function lastTouch(lead) { let m = NaN; (lead && lead.log || []).forEach(x => { if (x.system) return; const v = t(x.t); if (!(v <= m)) m = v; }); return m; }
  function firstTouchAfter(lead, since) { let m = NaN; (lead && lead.log || []).forEach(x => { if (x.system) return; const v = t(x.t); if (v >= since && !(v >= m)) m = v; }); return m; }

  function engine(state, cfgIn, nowISO) {
    const cfg = Object.assign({}, DEFAULTS, cfgIn || {});
    const NOW = t(nowISO), month = nowISO.slice(0, 7);
    const P = JSON.parse(JSON.stringify(state.prospects || {}));
    const L = JSON.parse(JSON.stringify(state.leads || {}));
    const roster = state.roster || {}, trips = state.trips || [];
    const writes = [], report = {imported: 0, duplicates: 0, assigned: 0, moved: 0, parked: 0, review: 0, updates: 0, repaired: 0, stale: 0, notes: [], suspects: []};
    const realNote = x => !x.system && String(x.note || "").trim().length >= cfg.minNoteChars;
    const W = (op, path, data) => writes.push(data === undefined ? {op, path} : {op, path, data});
    const brokers = Object.entries(roster).filter(([, r]) => r.active !== false && (r.role === "broker" || r.role === "consultant")).map(([id, r]) => ({id, r}));
    const leadOf = (bid, pid) => (L[bid] || {})[pid];

    /* 1. import prospects brokers added themselves */
    const keyIdx = {};
    Object.entries(P).forEach(([id, p]) => { keyIdx["n:" + norm(p.org) + "|" + norm(p.country)] = id; const d = domain(p.website); if (d) keyIdx["d:" + d] = id; });
    Object.entries(L).forEach(([bid, items]) => Object.entries(items).forEach(([lid, l]) => {
      if (!l.own || l.imported || l.status === "duplicate") return;
      const kN = "n:" + norm(l.org) + "|" + norm(l.country), d = domain(l.website), dup = keyIdx[kN] || (d && keyIdx["d:" + d]);
      if (dup && dup !== lid) {
        const nl = Object.assign({}, l, {status: "duplicate", imported: true, duplicateOf: dup, updated: nowISO, log: (l.log || []).concat([{t: nowISO, system: true, channel: "Portal", outcome: "duplicate", note: "Already in the database. The first finder keeps the credit."}])});
        L[bid][lid] = nl; W("set", `leads/${bid}/items/${lid}`, nl); report.duplicates++; return;
      }
      const p = {org: l.org, segment: l.segment || "Other", kind: l.kind || "client", region: l.region || regionOf(l.country) || "", country: l.country || "", province: l.province || "", city: l.city || "", website: l.website || "", source: l.source || "Added by broker", why: l.why || "", approach: l.approach || "", avenues: l.avenues || [],
        status: "assigned", added: l.added || nowISO, addedBy: bid, sourcedBy: bid, sourcedAt: l.added || nowISO, assignedTo: bid, assignedAt: l.added || nowISO, history: [{t: nowISO, to: bid, reason: "Found by this broker: first right to work it"}]};
      P[lid] = p; keyIdx[kN] = lid; if (d) keyIdx["d:" + d] = lid;
      W("set", `prospects/${lid}`, p);
      const nl = Object.assign({}, l, {imported: true, sourcedBy: bid, assignedAt: p.assignedAt, status: l.status === "new" || !l.status ? "assigned" : l.status, updated: nowISO});
      L[bid][lid] = nl; W("set", `leads/${bid}/items/${lid}`, nl); report.imported++;
    }));

    /* 2. broker metrics */
    const M = {};
    brokers.forEach(({id}) => M[id] = {open: 0, recv30: 0, recv7: 0, assigned90: 0, adds30: 0, updMonth: 0, enqMonth: 0, confMonth: 0, flownMonth: 0, gpMonth: 0, quotedMonth: 0, breaches90: 0, breaches30: 0, enquiries90: 0, flown90: 0, gp90: 0, addsMonth: 0, segWins: {}, regions: new Set(), countries: new Set(), points: 0, roundNew: 0});
    brokers.forEach(({id, r}) => { const base = String(r.base || "").trim(); if (base) { M[id].countries.add(base.toLowerCase()); const rg = regionOf(base); if (rg) M[id].regions.add(rg); } (r.regions || []).forEach(x => M[id].regions.add(x)); });
    Object.values(P).forEach(p => {
      (p.history || []).forEach(h => {
        const at = t(h.t);
        if (h.to && M[h.to]) { if (NOW - at < 30 * DAY) M[h.to].recv30++; if (NOW - at < 7 * DAY) M[h.to].recv7++; if (NOW - at < 90 * DAY) M[h.to].assigned90++; }
        if (h.from && M[h.from] && h.cold) { if (NOW - at < 90 * DAY) M[h.from].breaches90++; if (NOW - at < 30 * DAY) M[h.from].breaches30++; if (h.t.slice(0, 7) === month) M[h.from].points -= 3; }
      });
      if (p.sourcedBy && M[p.sourcedBy] && String(p.sourcedAt || "").slice(0, 7) === month) { M[p.sourcedBy].addsMonth++; M[p.sourcedBy].points += 3; }
      if (p.sourcedBy && M[p.sourcedBy] && NOW - t(p.sourcedAt) < 30 * DAY) M[p.sourcedBy].adds30++;
    });
    Object.entries(L).forEach(([bid, items]) => { if (!M[bid]) return; Object.values(items).forEach(l => {
      if (!CLOSED.has(l.status) && l.status !== "notnow" && !l.own_pending) M[bid].open++;
      if (l.own && !l.imported && String(l.added || "").slice(0, 7) === month) { M[bid].addsMonth++; M[bid].points += 3; }
      const days = new Set(); (l.log || []).forEach(x => { if (realNote(x) && (x.by || bid) === bid && String(x.t).slice(0, 7) === month) days.add(String(x.t).slice(0, 10)); }); M[bid].points += days.size;
    }); });
    trips.forEach(tr => { const m = M[tr.bid]; if (!m) return; const d = tr.d || {}, st = tr.st || {};
      const created = t(d.created); if (String(d.created || "").slice(0, 7) === month) { m.enqMonth++; if ((d.quote || {}).opPrice > 0) m.quotedMonth++; }
      if (st.issuedAt && String(st.issuedAt).slice(0, 7) === month && st.state !== "cancelled") m.confMonth++;
      if (st.state === "flown" && String(st.flownDate || "").slice(0, 7) === month) { m.flownMonth++; m.gpMonth += (st.price || 0) - (st.opPrice || 0) - (st.direct || 0) + (st.xsClient || 0) - (st.xsCost || 0); }
      if (d.prospectId && NOW - created < 90 * DAY) m.enquiries90++; if (d.prospectId && String(d.created || "").slice(0, 7) === month) m.points += 10;
      if (st.state === "flown") { const fl = t(st.flownDate); const gp = (st.price || 0) - (st.opPrice || 0) - (st.direct || 0) + (st.xsClient || 0) - (st.xsCost || 0);
        if (NOW - fl < 90 * DAY) { m.flown90++; m.gp90 += gp; } if (String(st.flownDate || "").slice(0, 7) === month) m.points += 25;
        const seg = (P[d.prospectId] || {}).segment; if (seg) m.segWins[seg] = (m.segWins[seg] || 0) + 1; } });
    const maxGp = Math.max(1, ...Object.values(M).map(m => m.gp90));
    Object.values(M).forEach(m => {
      if (m.assigned90 < 5) m.perf = 0.6; // new brokers start fair
      else { const onTime = 1 - Math.min(1, m.breaches90 / m.assigned90), conv = Math.min(1, m.enquiries90 / m.assigned90 * 3); m.perf = 0.5 * onTime + 0.3 * conv + 0.2 * (m.gp90 / maxGp); }
    });
    const totalRecv30 = Object.values(M).reduce((a, m) => a + m.recv30, 0) || 1;
    const dayOfMonth = +nowISO.slice(8, 10);

    function score(bid, p) {
      const m = M[bid]; const c = String(p.country || "").toLowerCase();
      let fit = m.countries.has(c) ? 1 : (p.region && m.regions.has(p.region)) ? 0.7 : (p.region === "Global" ? 0.5 : 0.3);
      if (p.segment && m.segWins[p.segment]) fit = Math.min(1, fit + 0.2);
      const wOf = x => 1 + cfg.addsBoostMax * Math.min(1, x.adds30 / Math.max(1, cfg.minAddsPerMonth));
      const wSum = brokers.reduce((a, b) => a + wOf(M[b.id]), 0) || 1, target = wOf(m) / wSum, n = brokers.length || 1;
      const share = m.recv30 / totalRecv30, fair = Math.max(0, Math.min(1, 0.5 + (target - share) * n / 2));
      let s = cfg.wFit * fit + cfg.wPerf * m.perf + cfg.wFair * fair;
      if (m.recv7 + m.roundNew < cfg.weeklyFloor) s += 0.3;
      s -= 0.05 * m.breaches30;
      if (dayOfMonth >= 20 && m.addsMonth < cfg.minAddsPerMonth) s -= 0.1;
      const why = [fit >= 1 ? "same country" : fit >= 0.7 ? "your region" : "", m.recv7 + m.roundNew < cfg.weeklyFloor ? "weekly share" : "", fair > 0.6 ? "fair-share top-up" : "", m.adds30 >= cfg.minAddsPerMonth ? "bonus share for the prospects you add" : "", m.perf >= 0.7 ? "strong follow-up record" : ""].filter(Boolean).join(", ");
      return {s, why: why || "best available match"};
    }
    function pick(p, exclude) {
      let best = null;
      brokers.forEach(({id}) => { const m = M[id]; if (exclude.has(id) || m.open >= cfg.maxOpen || m.roundNew >= cfg.perRound) return; const sc = score(id, p); if (!best || sc.s > best.s) best = {id, s: sc.s, why: sc.why}; });
      return best;
    }
    function leadFrom(p, pid, prevLog, reason, bid) {
      return {org: p.org, segment: p.segment, kind: p.kind || "client", region: p.region || "", province: p.province || "", avenues: p.avenues || [], country: p.country || "", city: p.city || "", website: p.website || "", source: p.source || "", why: p.why || "", approach: p.approach || "", sourcedBy: p.sourcedBy || "",
        status: "assigned", assignedAt: nowISO, firstTouchDue: new Date(NOW + cfg.firstTouchHours * HOUR).toISOString(), reason, updated: nowISO,
        log: (prevLog || []).concat([{t: nowISO, system: true, channel: "Portal", outcome: "assigned", note: reason}])};
    }
    function assign(pid, p, bid, reason, fromBid, cold) {
      /* order matters: if a round stops half-way, the prospect is never without a lead.
         1) write the new lead, 2) point the prospect at it, 3) only then remove the old copy */
      const prevLead = fromBid ? leadOf(fromBid, pid) : null;
      const nl = leadFrom(p, pid, prevLead && prevLead.log, reason, bid);
      L[bid] = L[bid] || {}; L[bid][pid] = nl; W("set", `leads/${bid}/items/${pid}`, nl);
      const h = {t: nowISO, to: bid, reason}; if (fromBid) { h.from = fromBid; if (cold) h.cold = true; }
      p.history = (p.history || []).concat([h]); p.assignedTo = bid; p.assignedAt = nowISO; p.status = "assigned"; delete p.parkedUntil;
      W("update", `prospects/${pid}`, {assignedTo: bid, assignedAt: nowISO, status: "assigned", history: p.history, parkedUntil: null});
      if (fromBid && prevLead && fromBid !== bid) { W("delete", `leads/${fromBid}/items/${pid}`); delete L[fromBid][pid]; if (M[fromBid]) M[fromBid].open--; }
      M[bid].open++; M[bid].roundNew++; M[bid].recv7++; M[bid].recv30++;
    }

    /* 2b. repair: a prospect whose lead is missing gets it back; copies left with a previous broker are removed */
    Object.entries(P).forEach(([pid, p]) => {
      if (!p.assignedTo || CLOSED.has(p.status) || p.status === "review") return;
      const bid = p.assignedTo;
      if (!leadOf(bid, pid) && M[bid]) {
        let prev = null; Object.keys(L).forEach(b => { if (b !== bid && L[b][pid]) prev = L[b][pid]; });
        const nl = leadFrom(p, pid, prev && prev.log, "Restored: the lead was missing after an interrupted round", bid);
        nl.assignedAt = p.assignedAt || nowISO; nl.firstTouchDue = new Date(t(nl.assignedAt) + cfg.firstTouchHours * HOUR).toISOString();
        L[bid] = L[bid] || {}; L[bid][pid] = nl; W("set", `leads/${bid}/items/${pid}`, nl); report.repaired++;
      }
    });
    Object.entries(L).forEach(([bid, items]) => Object.entries(items).forEach(([lid, l]) => {
      const p = P[lid]; if (!p || l.status === "duplicate") return;
      if (p.assignedTo && p.assignedTo !== bid && leadOf(p.assignedTo, lid)) { W("delete", `leads/${bid}/items/${lid}`); delete L[bid][lid]; if (M[bid] && !CLOSED.has(l.status) && l.status !== "notnow") M[bid].open--; report.stale++; }
    }));
    /* 2c. activity that looks wrong goes to the owner's spot check */
    Object.entries(L).forEach(([bid, items]) => { if (!M[bid]) return; const perDay = {}, notes = {};
      Object.entries(items).forEach(([lid, l]) => (l.log || []).forEach(x => { if (x.system || NOW - t(x.t) > 7 * DAY) return; const d = String(x.t).slice(0, 10); perDay[d] = (perDay[d] || 0) + 1; const k = String(x.note || "").trim().toLowerCase(); if (k) (notes[k] = notes[k] || new Set()).add(lid); }));
      Object.entries(perDay).forEach(([d, n]) => { if (n > 25) report.suspects.push({bid, why: `${n} contacts logged on ${d}`}); });
      Object.entries(notes).forEach(([k, set]) => { if (set.size >= 4) report.suspects.push({bid, why: `Same note on ${set.size} leads: "${k.slice(0, 60)}"`}); });
    });

    /* 3. keep every assigned prospect warm */
    Object.entries(P).forEach(([pid, p]) => {
      if (!p.assignedTo || CLOSED.has(p.status) || p.status === "review") return;
      const bid = p.assignedTo, l = leadOf(bid, pid);
      if (!l) return;
      if (l.status === "dnc") { if (p.status !== "dnc") { p.status = "dnc"; W("update", `prospects/${pid}`, {status: "dnc", dncAt: nowISO}); } return; }
      const aAt = t(l.assignedAt || p.assignedAt), last = lastTouch(l), first = firstTouchAfter(l, aAt);
      if (l.status === "enquiry") {
        const hasTrip = trips.some(tr => tr.bid === bid && (tr.d || {}).prospectId === pid);
        const since = isNaN(last) ? aAt : last;
        if (hasTrip || NOW - since <= cfg.enquiryDays * DAY) { if (p.status !== "enquiry") { p.status = "enquiry"; W("update", `prospects/${pid}`, {status: "enquiry"}); } return; }
        const nl2 = Object.assign({}, l, {status: "contacted", updated: nowISO, log: (l.log || []).concat([{t: nowISO, system: true, channel: "Portal", outcome: "contacted", note: `Marked enquiry ${cfg.enquiryDays} days ago but no trip was opened: back to follow-up`}])});
        L[bid][pid] = nl2; W("set", `leads/${bid}/items/${pid}`, nl2);
        if (p.status !== "assigned") { p.status = "assigned"; W("update", `prospects/${pid}`, {status: "assigned"}); }
        return;
      }
      if (l.status === "notnow") {
        const until = (isNaN(last) ? aAt : last) + cfg.parkDays * DAY;
        if (NOW < until) { if (p.status !== "notnow") { p.status = "notnow"; W("update", `prospects/${pid}`, {status: "notnow", parkedUntil: new Date(until).toISOString()}); report.parked++; } return; }
        const ex = new Set([bid]); const nb = pick(p, ex);
        if (nb) { assign(pid, p, nb.id, `Revisit after "Not now" (${cfg.parkDays} days): fresh approach by another broker · ${nb.why}`, bid, false); report.moved++; }
        return;
      }
      let cold = "";
      if (isNaN(first) && NOW - aAt > cfg.firstTouchHours * HOUR) cold = `no first contact within ${cfg.firstTouchHours} hours`;
      else if (!isNaN(last) && NOW - last > cfg.followUpDays * DAY) cold = `no follow-up for ${cfg.followUpDays} days`;
      if (!cold) return;
      const tried = new Set((p.history || []).map(h => h.to).filter(Boolean)); tried.add(bid);
      const hist = p.history || [], lastRestart = hist.map(h => !!h.restart).lastIndexOf(true);
      const coldHops = hist.slice(lastRestart + 1).filter(h => h.cold).length + 1;
      if (coldHops >= cfg.maxHops) {
        p.status = "review"; W("update", `prospects/${pid}`, {status: "review", reviewReason: `Went cold with ${coldHops} brokers (last: ${cold}). Your decision.`, history: (p.history || []).concat([{t: nowISO, from: bid, cold: true, reason: cold}])});
        if (leadOf(bid, pid)) { W("delete", `leads/${bid}/items/${pid}`); delete L[bid][pid]; }
        report.review++; return;
      }
      let nb = pick(p, tried); if (!nb) nb = pick(p, new Set([bid]));
      if (nb) { assign(pid, p, nb.id, `Moved to you: ${cold} with the previous broker · ${nb.why}`, bid, true); report.moved++; }
      else report.notes.push(`${p.org}: went cold but no broker has capacity.`);
    });

    /* 4. assign free prospects */
    const free = Object.entries(P).filter(([, p]) => p.kind !== "operator" && !p.assignedTo && !CLOSED.has(p.status) && p.status !== "review" && p.status !== "notnow")
      .sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0) || ((b[1].avenues || []).length - (a[1].avenues || []).length) || String(a[1].added || "").localeCompare(String(b[1].added || "")));
    for (const [pid, p] of free) { const nb = pick(p, new Set()); if (!nb) break; assign(pid, p, nb.id, `New prospect for you · ${nb.why}`, null, false); report.assigned++; }

    /* 5. contact-route updates from brokers: merged into the prospect, 1 point each */
    Object.entries(L).forEach(([bid, items]) => Object.entries(items).forEach(([pid, l]) => {
      const ups = (l.updates || []); if (!ups.some(u => !u.merged)) return;
      const p = P[pid]; if (!p) return;
      const av = (p.avenues || []).slice(); let changed = false;
      const ups2 = ups.map(u => { if (u.merged) return u; const key = (u.url || u.label || "").trim().toLowerCase(); if (key && !av.some(x => (x.url || x.label || "").trim().toLowerCase() === key)) { av.push({type: u.type || "other", label: u.label || u.url, url: u.url || "", note: (u.note ? u.note + " · " : "") + "added by broker " + nowISO.slice(0, 10)}); changed = true; } report.updates++; return Object.assign({}, u, {merged: nowISO}); });
      if (changed) { p.avenues = av; W("update", `prospects/${pid}`, {avenues: av, updatedByBroker: nowISO}); }
      const nl = Object.assign({}, l, {updates: ups2, avenues: changed ? av : l.avenues}); L[bid][pid] = nl; W("set", `leads/${bid}/items/${pid}`, nl);
    }));
    Object.entries(L).forEach(([bid, items]) => { if (!M[bid]) return; Object.values(items).forEach(l => (l.updates || []).forEach(u => { if (u.merged && (u.by || bid) === bid && String(u.t).slice(0, 7) === month) M[bid].updMonth++; })); M[bid].points += Math.min(cfg.updatePointsCap, M[bid].updMonth); });

    /* 6. leaderboard and obligations */
    const board = {month, updated: nowISO, visible: !!cfg.boardVisible, rows: brokers.map(({id, r}) => ({id, name: r.contractName || "Broker", points: M[id].points, adds: M[id].addsMonth, minAdds: cfg.minAddsPerMonth, updates: M[id].updMonth, open: M[id].open, breaches30: M[id].breaches30, enquiries: M[id].enqMonth, quoted: M[id].quotedMonth, confirmed: M[id].confMonth, flown: M[id].flownMonth, perf: Math.round(M[id].perf * 100)})).sort((a, b) => b.points - a.points)};
    const metrics = {}; Object.entries(M).forEach(([id, m]) => metrics[id] = {open: m.open, recv7: m.recv7, recv30: m.recv30, perf: Math.round(m.perf * 100), breaches30: m.breaches30, enquiries90: m.enquiries90, flown90: m.flown90, addsMonth: m.addsMonth, points: m.points});
    return {writes, report, board, metrics, cfg};
  }
  const api = {engine, DEFAULTS, norm, lastTouch, regionOf};
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.AE_ENGINE = api;
})(typeof window !== "undefined" ? window : globalThis);
