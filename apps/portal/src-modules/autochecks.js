/* ---------- Pre-issue checks set by the portal (Morten, 31 Oct 2026: "anything in the portal possible should be real
   time checked ... never manual labour, but always an integral part of the task") ----------
   Six of the seven pre-issue ticks follow a record the portal already checks, so nobody ticks them by hand:
     never, risk  from Trip checks (no red item, every amber confirmed with the operator)
     aoc          from Documents (the operator's AOC attached)
     audit        from Operator safety (record complete, nothing red)
     ins, terms   from Operator terms and insurance (bookingplan.js)
   Only "route" (routing, permits and continuous journey confirmed with the operator) stays a person's tick.
   The tick is written to the trip when the record becomes complete, and taken back if a red item appears. */
(function(){
  const docOf = (d, kind) => (d.docs || []).some(x => x.kind === kind);
  const tripOk = t => { if (typeof tripBlockers !== "function") return null; const b = tripBlockers(t.d, t.st); return !b.red.length && !b.amberOpen.length; };
  const AUTO = {
    never: {from: "Trip checks", sec: "secTC", ok: tripOk},
    risk: {from: "Trip checks", sec: "secTC", ok: tripOk},
    aoc: {from: "Documents (AOC attached)", sec: "secDocs", ok: t => docOf(t.d, "AOC")},
    audit: {from: "Operator safety", sec: "secSafety", ok: t => typeof safetyNeeds === "function" ? !safetyNeeds(t.d, t.st).length && !safetyBreaches(t.d).length : null},
    kyc: {from: "the KYC record below", sec: "kycRec", ok: t => typeof kycState === "function" ? !!kycState(t).ok : null}   // workflow audit 25 Nov 2026: one KYC source
  };
  window.AUTO_CHECKS = Object.keys(AUTO).concat(["ins", "terms"]);
  window.autoTickState = function(t){ const out = {}; for (const k in AUTO) { const v = AUTO[k].ok(t); if (v !== null) out[k] = !!v; } return out; };
  const editable = t => (t.bid === S.uid || (typeof isStaff === "function" && isStaff())) && ["enquiry", "quoted", "returned"].includes(t.stage);
  S.acSync = S.acSync || {};
  function sync(t){
    if (!t || !editable(t)) return;
    const auto = autoTickState(t), cur = t.d.checks || {}, next = {...cur};
    let change = false;
    for (const k in auto) {
      if (auto[k] && !cur[k]) { next[k] = true; change = true; }
      else if (!auto[k] && cur[k] && (k === "never" || k === "risk")) { next[k] = false; change = true; }   // a red item or open amber takes the tick back
    }
    const sig = t.did + JSON.stringify(next);
    if (!change || S.acSync[t.did] === sig) return;
    S.acSync[t.did] = sig;
    deskWrite(t, {checks: next}, "Pre-issue checks updated by the portal").catch(() => { S.acSync[t.did] = null; });
  }
  window.autoChecksSync = sync;
  /* why an automatic tick is not set yet, and where to go (25 Nov 2026: in the test booking the top two ticks could not be
     ticked by hand and nothing said what would tick them) */
  function whyNot(t, k){
    let why = "", sec = "";
    if (k === "never" || k === "risk") { const b = tripBlockers(t.d, t.st); sec = "secTC";
      why = b.red.length ? `${b.red.length} red item${b.red.length > 1 ? "s" : ""} in Trip checks must be cleared first.` : b.amberOpen.length ? `Confirm ${b.amberOpen.length === 1 ? "the amber item" : "the " + b.amberOpen.length + " amber items"} in Trip checks with the operator, then press Confirmed with the operator on each; this box then ticks itself.` : ""; }
    else if (k === "aoc") { sec = "secDocs"; why = "Attach the operator's AOC under Documents; this box then ticks itself."; }
    else if (k === "audit") { sec = "secSafety"; const n = typeof safetyNeeds === "function" ? safetyNeeds(t.d, t.st) : []; why = n.length ? `Complete Operator safety (${n.length} open); this box then ticks itself.` : "Clear the item in Operator safety; this box then ticks itself."; }
    else if (k === "ins" || k === "terms") { sec = "secOpTerms"; why = "Fill in Operator terms and insurance; this box then ticks itself."; }
    else if (k === "kyc") { sec = "kycRec"; why = (typeof kycState === "function" && kycState(t).why ? kycState(t).why + ". " : "") + "Save the KYC record just below; this box then ticks itself."; }
    return why ? `<span class="small" style="display:block;margin-top:3px;color:var(--text)">${esc(why)} <button class="btn small" type="button" data-ns="sec|${sec}">Go there</button></span>` : "";
  }
  const _tf = tripFile;
  tripFile = function(t){
    let h = _tf(t); const auto = autoTickState(t);
    for (const k in AUTO) {
      if (!(k in auto)) continue;
      h = h.replace(new RegExp(`(<input type="checkbox" id="ck_${k}" data-ck="${k}")[^>]*>`), `$1 ${auto[k] ? "checked" : ""} disabled>`)
           .replace(new RegExp(`(id="ck_${k}"[^]*?<span>)([^<]*)(</span>)`), `$1$2 <span class="muted">(set by the portal from ${AUTO[k].from})</span>${auto[k] ? "" : whyNot(t, k)}$3`);
    }
    // ins and terms come from Operator terms and insurance (bookingplan.js): say so on the box itself, with the way there
    ["ins", "terms"].forEach(k => { if (!(t.d.checks || {})[k] && !(typeof opTermsDone === "function" && opTermsDone(t.d))) h = h.replace(new RegExp(`(id="ck_${k}"[^]*?<span>[^<]*(?:<span class="muted">[^<]*</span>)?)(</span>)`), `$1${whyNot(t, k)}$2`); });
    setTimeout(() => sync(t), 0);
    return h;
  };
  // the automatic ticks cannot be set or cleared by hand
  document.addEventListener("change", e => {
    const el = e.target; if (!el.dataset || !AUTO[el.dataset.ck]) return;
    e.stopImmediatePropagation(); const t = tripById(S.sel); if (!t) return;
    const a = AUTO[el.dataset.ck]; el.checked = !!(autoTickState(t)[el.dataset.ck]);
    toast(`This tick follows ${a.from}. Complete it there.`);
    const s = $(a.sec); if (s) s.scrollIntoView({block: "start", behavior: "smooth"});
  }, true);
})();
