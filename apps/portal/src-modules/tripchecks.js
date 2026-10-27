/* ---------- Trip checks: red / amber / grey / green (Morten, 27 Oct 2026) ----------
   "If it is on the list, it shows in RED and cannot accept", and the same for cabotage, curfew and other rules.
   Sources: airport-rules.json (built from apps/website/content: sanctioned places and the verified airport rules,
   each with its official source and date) and the portal's airport list (airports.json: country, position, runway).
   RED stops the trip: it cannot be sent to operations, approved or issued. A sanctioned country or airport cannot
   be released; a possible name match only by the owner, with a recorded reason. AMBER must be confirmed with the
   operator (ticked, with name and date) before the trip goes to operations. GREY means the rule is not checked yet:
   the operator confirms. GREEN only where a verified rule was checked. */
(function(){
  const TC = window.TC = {rules: null, ready: null, live: {}, timer: {}};
  const EU = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" "));
  const EEA_CH = new Set(["NO", "IS", "LI", "CH"]);
  function load(){
    if (!TC.ready) TC.ready = fetch("airport-rules.json").then(r => r.json()).then(j => { TC.rules = j; render(); }).catch(() => { TC.ready = null; });
    if (typeof loadAirports === "function") loadAirports();
    return TC.ready;
  }
  load();
  const X = () => (TC.rules || {}).excluded || {countries: [], words: [], iso2: [], airports_iata: []};
  const placeRx = () => new RegExp("\\b(" + X().countries.concat(X().words).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "i");
  const placeRed = txt => !!(txt && X().countries.length && placeRx().test(String(txt)));
  const aptRed = code => { const a = APT.by[String(code || "").toUpperCase()]; return !!a && (X().iso2.includes(a.cc) || X().airports_iata.includes(a.iata)); };
  const cname = cc => (APT.cn || {})[cc] || cc;
  const toMin = s => { const m = /^(\d\d):(\d\d)/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : null; };
  const inWin = (t, w) => { const a = toMin(w[0]), b = toMin(w[1]); return a <= b ? t >= a && t < b : t >= a || t < b; };
  const src = r => r && r.srcUrl ? ` <a class="small" href="${esc(r.srcUrl)}" target="_blank" rel="noopener">source, checked ${esc(fmtD(r.checked))}</a>` : "";

  // every check for one trip: [{key, sev, leg, text}]
  window.tripChecks = function(d, st){
    const out = [], legs = ((d.trip || {}).legs) || [], q = d.quote || {}, c = d.client || {}, oc = q.opCountry || "";
    const add = (key, sev, leg, text) => out.push({key, sev, leg, text});
    if (placeRed(c.country)) add("place|client", "red", null, `Client's country (${esc(c.country)}) is a sanctioned place. Archē does not take this trip.`);
    if (placeRed(c.payer)) add("place|payer", "red", null, `The payer (${esc(c.payer)}) names a sanctioned place. Archē does not take this trip.`);
    const scr = d.screen || {}, rel = (st || {}).sanctionsRelease;   // only owner/operations can write trip status
    (scr.results || []).filter(r => r.result !== "no match").forEach(r => { const ok = rel && (rel.names || []).includes(r.name); add("name|" + r.name, ok ? "green" : "red", null, ok ? `Possible match on ${esc(r.name)} released by the owner: ${esc(rel.note)}` : `Possible sanctions match: <b>${esc(r.name)}</b> resembles ${esc(r.hits.map(h => h.listed + " (" + h.list + ")").join("; "))}. The trip stops until the owner checks it.`); });
    if (!scr.at && (c.name || c.company)) add("name|unscreened", "grey", null, "Names not screened yet: save the trip to screen them.");
    legs.forEach((l, i) => {
      const n = i + 1, A = APT.by[l.from], B = APT.by[l.to], RA = (TC.rules || {airports: {}}).airports[l.from], RB = (TC.rules || {airports: {}}).airports[l.to];
      [[l.from, A], [l.to, B]].forEach(([code, ap]) => { if (aptRed(code)) add(`apt|${n}|${code}`, "red", n, `${esc(code)} is in a sanctioned country (${esc(cname(ap.cc))}). This leg is not possible.`); });
      if (A && B) {
        const dom = A.cc === B.cc, intraEU = EU.has(A.cc) && EU.has(B.cc);
        if (dom || intraEU) {
          if (!oc) add(`cab|${n}`, "grey", n, `Leg ${n} ${dom ? "is domestic in " + esc(cname(A.cc)) : "is between two EU countries"}: enter the operator's country (AOC) to check cabotage.`);
          else if (dom && A.cc === "US" && oc !== "US") add(`cab|${n}`, "red", n, `Leg ${n} is between two US airports and the operator is from ${esc(cname(oc))}. Not allowed (49 U.S.C. § 41703(c)). Use a US operator for this leg.`);
          else if (intraEU && !EU.has(oc)) add(`cab|${n}`, EEA_CH.has(oc) ? "amber" : "red", n, EEA_CH.has(oc) ? `Leg ${n} is between EU airports and the operator is from ${esc(cname(oc))}: get the operator's written confirmation of traffic rights.` : `Leg ${n} is between EU airports and the operator is from ${esc(cname(oc))}. Only EU-licensed carriers may fly it (Regulation 1008/2008, Article 15). Use an EU operator for this leg.`);
          else if (dom && oc !== A.cc) add(`cab|${n}`, "amber", n, `Leg ${n} is domestic in ${esc(cname(A.cc))} with an operator from ${esc(cname(oc))} (cabotage). Most countries forbid this: get the operator's written confirmation of traffic rights.`);
        }
      }
      // departure airport rules
      if (RA && RA.status !== "unavailable") {
        const cf = RA.rules.curfew, t = toMin(l.time);
        if (cf && !cf.none && (cf.windows_local || []).length) {
          if (t === null) add(`cur|${n}|dep`, "amber", n, `${esc(l.from)} has a night curfew (${esc(cf.v)}). Add the departure time.${src(cf)}`);
          else if (cf.windows_local.some(w => inWin(t, w))) add(`cur|${n}|dep`, "red", n, `Departure ${esc(l.time)} from ${esc(l.from)} is inside the night curfew: ${esc(cf.v)}.${src(cf)}`);
        }
        const cu = RA.rules.customs;
        if (A && B && A.cc !== B.cc && cu && cu.h24 === false && cu.hours_local && t !== null && !cu.hours_local.some(w => inWin(t, w))) add(`cus|${n}|dep`, "amber", n, `Departure ${esc(l.time)} is outside customs hours at ${esc(l.from)}: ${esc(cu.v)}.${src(cu)}`);
      } else if (l.from && A && !aptRed(l.from)) add(`rules|${l.from}`, "grey", n, `Airport rules for ${esc(l.from)} not checked yet (being researched). The operator confirms curfew, customs and slots.`);
      // arrival airport rules (arrival time is not in the trip yet)
      if (RB && RB.status !== "unavailable") {
        const cf = RB.rules.curfew;
        if (cf && !cf.none && (cf.windows_local || []).length) add(`cur|${n}|arr`, "amber", n, `${esc(l.to)} has a night curfew: ${esc(cf.v)}. Confirm with the operator that the arrival falls outside it.${src(cf)}`);
        const mx = RB.rules.max_aircraft; if (mx) add(`size|${n}|${l.to}`, "amber", n, `${esc(l.to)}: ${esc(mx.v)}. Confirm the aircraft fits.${src(mx)}`);
      } else if (l.to && B && !aptRed(l.to)) add(`rules|${l.to}`, "grey", n, `Airport rules for ${esc(l.to)} not checked yet (being researched). The operator confirms curfew, customs and slots.`);
      if (RA && RA.status === "verified" && !out.some(x => x.leg === n && x.sev !== "grey")) add(`ok|${n}`, "green", n, `Leg ${n}: ${esc(l.from)} rules checked, nothing stops it.`);
    });
    // drop duplicates (same airport not checked twice)
    const seen = new Set(); return out.filter(x => !seen.has(x.key) && seen.add(x.key));
  };
  window.tripBlockers = function(d, st){
    const all = tripChecks(d, st), acks = d.acks || {};
    return {red: all.filter(x => x.sev === "red"), amberOpen: all.filter(x => x.sev === "amber" && !acks[x.key]), all};
  };
  const DOT = {red: "high", amber: "med", grey: "low", green: "ok"};
  window.tripChecksBlock = function(t){
    if (!TC.rules || !APT.list) { load(); return ""; }
    const d = t.d, {red, amberOpen, all} = tripBlockers(d, t.st), acks = d.acks || {};
    if (!all.length) return "";
    const mine = t.bid === S.uid, rel = (t.st || {}).sanctionsRelease;
    const row = x => `<div class="flag tc-${x.sev}"><span class="sev ${DOT[x.sev]}" aria-hidden="true" style="${x.sev === "green" ? "background:#5fa37a" : x.sev === "grey" ? "background:#8a9099" : ""}"></span><div><p><b>${x.sev === "red" ? "Stop" : x.sev === "amber" ? "Confirm" : x.sev === "grey" ? "Not checked" : "Checked"}</b> · ${x.text}</p>
      ${x.sev === "amber" ? (acks[x.key] ? `<p class="small muted">Confirmed with the operator by ${esc(nm(acks[x.key].by))}, ${esc(fmtT(acks[x.key].at))}: ${esc(acks[x.key].note || "")}</p>` : (mine || isStaff()) ? `<p class="small"><button class="btn small" type="button" data-tc="ack|${esc(t.bid)}|${esc(t.did)}|${esc(x.key)}">Confirmed with the operator</button></p>` : "") : ""}</div></div>`;
    const nameRed = red.some(x => x.key.startsWith("name|"));
    const release = nameRed && S.isOwner && acting() === "owner" ? `<div class="fgrid"><label class="f wide" for="tc_rel">Owner: after checking dates of birth, nationality and addresses against the listing<input id="tc_rel" placeholder="e.g. different person: listed person born 1961, our client born 1985"></label></div><div class="row"><button class="btn small" type="button" data-tc="release|${esc(t.bid)}|${esc(t.did)}">Not the listed person: release</button></div>` : "";
    const head = red.length ? `<div class="note bad small"><b>This trip is stopped.</b> ${red.length} red item${red.length > 1 ? "s" : ""} below. It cannot go to operations, be approved or be issued until ${red.some(x => !x.key.startsWith("name|")) ? "the trip is changed" : "the owner releases it"}.</div>` : amberOpen.length ? `<div class="note warn small">${amberOpen.length} item${amberOpen.length > 1 ? "s" : ""} to confirm with the operator before the trip goes to operations.</div>` : "";
    return `<div class="panel" style="padding:16px;margin:8px 0"><h3 style="margin-top:0">Trip checks</h3>${head}${["red", "amber", "grey", "green"].flatMap(s => all.filter(x => x.sev === s)).map(row).join("")}${release}
      <p class="small muted">Red stops the trip. Amber must be confirmed with the operator. Grey: not checked yet; the operator confirms. Rules come from official sources, each with its check date.</p></div>`;
  };

  // live red in the trip form
  function mark(el, html){ let m = el.parentElement.querySelector(".tcmsg"); if (!m) { m = document.createElement("span"); m.className = "tcmsg small"; m.style.cssText = "display:block;color:var(--bad);margin-top:4px;font-weight:600"; el.parentElement.appendChild(m); } m.innerHTML = html || ""; el.style.outline = html ? "2px solid var(--bad)" : ""; el.setAttribute("aria-invalid", html ? "true" : "false"); }
  async function screenNames(names){
    const s = window.__sb ? (await window.__sb.auth.getSession()).data.session : null;
    const r = await fetch("/api/screen", {method: "POST", headers: {"content-type": "application/json", authorization: "Bearer " + (s ? s.access_token : "")}, body: JSON.stringify({names})});
    const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status); return j;
  }
  const NAMEFIELDS = ["e_cn", "e_co", "e_py", "q_op"];
  document.addEventListener("input", ev => {
    const el = ev.target; if (!el || !el.closest || !el.closest("#edForm")) return;
    if (el.id === "e_ct" || el.id === "e_py") mark(el, placeRed(el.value) ? "Sanctioned place: Archē does not take this trip." : "");
    if (NAMEFIELDS.includes(el.id)) {
      clearTimeout(TC.timer[el.id]); const v = el.value.trim();
      if (v.length < 4) { if (el.id !== "e_py" || !placeRed(el.value)) mark(el, ""); return; }
      TC.timer[el.id] = setTimeout(async () => {
        try { const j = await screenNames([v]); const r = j.results[0]; TC.live[v] = r; if (el.value.trim() === v) mark(el, r.result === "no match" ? "" : `Possible sanctions match: resembles ${esc(r.hits.map(h => h.listed + " (" + h.list + ")").join("; "))}. The trip will stop until the owner checks it.`); }
        catch(e){ /* screening not available: the save step records it as not screened */ }
      }, 800);
    }
  });
  document.addEventListener("change", ev => {
    const el = ev.target; if (!el || !el.classList || !el.classList.contains("apt")) return;
    setTimeout(() => { const v = el.value.toUpperCase().trim(); const hit = APT.by[v] || (aptSearch(v).find(h => h.a.iata === v) || {}).a; mark(el, hit && aptRed(hit.icao) ? `In a sanctioned country (${esc(cname(hit.cc))}): not possible.` : ""); }, 50);
  });
  // on save: screen the names and record the result on the trip; red keeps the trip as an enquiry
  window.tcBeforeSave = async function(body){
    const c = body.client || {}, names = [c.name, c.company, c.payer, (body.quote || {}).operator].map(x => String(x || "").trim()).filter(x => x.length >= 3);
    const prevNames = ((body.screen || {}).results || []).map(r => r.name).join("|");
    if (names.length && names.join("|") !== prevNames) {
      try { const j = await screenNames(names); body.screen = {at: now(), lists: j.lists, listsAt: j.at, results: j.results}; }
      catch(e){ body.screen = {at: null, error: String(e.message || e).slice(0, 120), results: []}; }
    }
    const {red} = tripBlockers(body, {});
    if (red.length) { if (!["enquiry", "quoted"].includes(body.stage)) body.stage = "quoted"; toast(`Saved. ${red.length} red item${red.length > 1 ? "s" : ""}: the trip cannot go further. See Trip checks.`); }
    return false;
  };
  // the gates: send to operations, approve, issue
  function stopIfRed(t, step){
    if (!t) return false; const {red, amberOpen} = tripBlockers(t.d, t.st);
    if (red.length) { toast(`Cannot ${step}: ${red.length} red item${red.length > 1 ? "s" : ""} in Trip checks.`); return true; }
    if (step === "send to operations" && amberOpen.length) { toast(`Confirm ${amberOpen.length} amber item${amberOpen.length > 1 ? "s" : ""} with the operator first (Trip checks).`); return true; }
    return false;
  }
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest('[data-act="submit"],[data-ap="ok"],[data-act="confIssue"],[data-act="issue"]'); if (!b) return;
    const t = b.dataset.ap ? (() => { const [bid, did] = (b.dataset.id || "").split("|"); return allTrips().find(x => x.bid === bid && x.did === did); })() : tripById(S.sel);
    const step = b.dataset.act === "submit" ? "send to operations" : b.dataset.ap ? "approve" : "issue";
    if (stopIfRed(t, step)) { ev.stopImmediatePropagation(); ev.preventDefault(); }
  }, true);
  document.addEventListener("click", async ev => {
    const b = ev.target.closest && ev.target.closest("[data-tc]"); if (!b) return; ev.preventDefault();
    const [a, bid, did, key] = b.dataset.tc.split("|"); const t = allTrips().find(x => x.bid === bid && x.did === did); if (!t) return;
    if (a === "ack") {
      const acks = {...(t.d.acks || {}), [key]: {at: now(), by: S.uid, note: "confirmed with the operator"}};
      await deskWrite(t, {acks}, "Trip check confirmed with the operator: " + key.split("|")[0]); toast("Recorded."); return;
    }
    if (a === "release" && S.isOwner) {
      const note = (($("tc_rel") || {}).value || "").trim(); if (note.length < 15) { toast("Write what you checked (at least 15 characters)."); return; }
      await statusWrite(t, {sanctionsRelease: {at: now(), by: S.uid, note, names: ((t.d.screen || {}).results || []).filter(r => r.result !== "no match").map(r => r.name)}}, "Owner released a possible sanctions match: " + note);
      audit("Sanctions match released", `${(t.d.client || {}).company || (t.d.client || {}).name || t.did} · ${note.slice(0, 80)}`); toast("Released and recorded."); return;
    }
  });
})();
