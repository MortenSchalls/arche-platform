/* ---------- The trip, one step at a time (Morten, 25 Nov 2026: "Fix this now ... The trip is one long page with about
   12 panels ... Best in class is a guided path: one step on screen at a time, the next one unlocking when it is done ...
   On a phone the long trip page is heavy") ----------
   The trip file shows a bar of the eight booking steps and only the panels of the step chosen; it opens on the step that
   is due. Done steps carry a tick, the step due is marked, later steps can still be opened to look ahead. The header, the
   Steps list for the chosen step, the action row and the history (folded) stay on every step. "Show every section" puts
   the whole file on one page again. A "Go there" in the Steps list opens the step that holds the field. */
const TRIP_STEP_SHORT = ["Client and trip", "Operator quote", "Checks and documents", "Confirmation", "Send", "Authorise and issue", "Signature and payment", "Flight and follow-up"];
const TRIP_STEP_OF_ID = {secRtb: "4", secAvinode: "2", secOptions: "2", secTC: "3", secSafety: "3", secOpTerms: "3", secChecks: "3", secDocs: "3", sec24: "4", secConfRow: "4", secBook: "6 7 8", secOps: "6 7 8", secSig: "7", secAfter: "8"};
S.tripStep = S.tripStep || {}; S.tripAll = /[?&]steps=all\b/.test(location.search);
function tripStepNow(t){ try { const s = tripSteps(t), i = s.findIndex(x => !x.done); return i < 0 ? 8 : i + 1; } catch(e){ return 1; } }
function tripStepOf(el){
  if (el.dataset && el.dataset.step) return el.dataset.step;
  if (el.id === "secNext" || el.id === "secSend" || el.id === "tripStepBar" || el.classList.contains("head") || el.classList.contains("lock") || el.classList.contains("note")) return "all";
  if (TRIP_STEP_OF_ID[el.id]) return TRIP_STEP_OF_ID[el.id];
  for (const id in TRIP_STEP_OF_ID) if (el.querySelector("#" + id)) return TRIP_STEP_OF_ID[id];
  if (el.querySelector('[data-act="openConf"]')) return "4";
  const h = ((el.querySelector("h2, h3") || {}).textContent || "").trim();
  if (/^(Client|Trip|Client requests|Operational extras)/.test(h)) return "1";
  if (/^Price at|^Trip co-pilot|^AI/.test(h)) return "2";
  if (/^History/.test(h)) return "hist";
  return "all";
}
(function(){
  const _tf = tripFile;
  tripFile = function(t){
    const html = _tf(t); if (!t || t.stage === "cancelled") return html;
    const tpl = document.createElement("template"); tpl.innerHTML = html.trim();
    const root = tpl.content.firstElementChild; if (!root) return html;
    const steps = (() => { try { return tripSteps(t); } catch(e){ return []; } })();
    // a step picked by hand holds until the step due moves on, then the page follows the step due (review 25 Nov 2026)
    const now = tripStepNow(t), pick = S.tripStep[t.did], cur = S.tripAll ? 0 : (pick && pick.due === now ? pick.s : now);
    [...root.children].forEach(el => {
      const s = tripStepOf(el);
      if (s === "hist") { const d = document.createElement("details"); d.className = "trip-hist"; d.innerHTML = `<summary class="small" style="cursor:pointer">History</summary>`; el.querySelector("h3") && el.querySelector("h3").remove(); d.appendChild(el.cloneNode(true)); el.replaceWith(d); return; }
      if (s === "all") return;
      el.dataset.step = s;
      if (cur && !s.split(" ").includes(String(cur))) el.hidden = true;
    });
    /* one "Authorise and issue" screen (Morten, 25 Nov 2026: "three Director screens for one decision"): the approval,
       Booking with the operator and the check before Issue, in that order, under one heading */
    { const ap = [...root.children].find(x => x.classList.contains("apcard") || /Approved by the Director|Waiting for the Director's approval/.test(x.textContent || "") && x.classList.contains("note"));
      const book = root.querySelector("#secBook"), ops = root.querySelector("#secOps");
      if (ops && !["issued", "clientPaid", "flown"].includes(t.stage)) {
        const w = document.createElement("div"); w.id = "secAuth"; w.className = "panel stack"; w.dataset.step = "6"; w.style.background = "var(--raised)";
        w.innerHTML = `<h2 style="margin:0">Authorise and issue</h2><p class="small muted" style="margin:0">Three parts, in order: approve the booking, book the aircraft with the operator, then check and issue. The broker's price, KYC, payment request and screening are taken over at Issue.</p>`;
        const part = (n, el, title) => { if (!el) return; const h = el.querySelector("h2, h3"); if (h && title) h.textContent = title; const s = document.createElement("div"); s.innerHTML = `<p class="small" style="margin:8px 0 2px"><b>${n}.</b></p>`; w.appendChild(s.firstElementChild); el.hidden = false; delete el.dataset.step; w.appendChild(el); };
        ops.replaceWith(w);
        part(1, ap, null); part(2, book, "Book the aircraft with the operator"); part(3, ops, "Check and issue");
        const pc = w.querySelector('#secOps [data-act="openConf"]'); if (pc) pc.textContent = "Open the confirmation and issue";
        const sv = w.querySelector('#secOps [data-act="opsSave"]'); if (sv) sv.textContent = "Save a price change";
        if (cur && cur !== 6) w.hidden = true;
      }
    }
    // the step bar: done ticked, due step marked, the chosen one open
    const bar = document.createElement("nav"); bar.id = "tripStepBar"; bar.className = "tstep"; bar.setAttribute("aria-label", "Booking steps");
    bar.innerHTML = TRIP_STEP_SHORT.map((n, i) => { const k = i + 1, done = steps[i] && steps[i].done; return `<button type="button" class="tstep-b${done ? " done" : ""}${k === now ? " due" : ""}${k === cur ? " on" : ""}" data-tstep="${k}" aria-current="${k === cur ? "step" : "false"}"><span class="tstep-n">${done ? "✓" : k}</span><span class="tstep-t">${esc(n)}</span></button>`; }).join("")
      + `<button type="button" class="tstep-all small" data-tstep="${S.tripAll ? "guided" : "all"}">${S.tripAll ? "One step at a time" : "Show every section"}</button>`;
    const next = root.querySelector("#secNext"), head = root.querySelector(".head");
    (next || head) ? (next || head).insertAdjacentElement(next ? "beforebegin" : "afterend", bar) : root.prepend(bar);
    // the Steps list shows the chosen step only
    if (next && cur) next.querySelectorAll(".ns-step").forEach((x, i) => { if (i + 1 !== cur) x.hidden = true; else x.classList.add("now"); });
    if (cur && cur !== now && next) { const p = next.querySelector("p"); if (p) p.insertAdjacentHTML("afterend", `<p class="small muted" style="margin:2px 0 0">You are looking at step ${cur}. <button type="button" class="btn small" data-tstep="${now}">Back to the step due (${now})</button></p>`); }
    return root.outerHTML;
  };
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest("[data-tstep]");
    if (b) { ev.preventDefault(); const v = b.dataset.tstep, t = tripById(S.sel); if (!t) return;
      if (v === "all") S.tripAll = true; else if (v === "guided") S.tripAll = false; else { S.tripAll = false; S.tripStep[t.did] = {s: +v, due: tripStepNow(t)}; }
      render(); const bar = $("tripStepBar"); if (bar) { bar.scrollIntoView({block: "start"}); const on = bar.querySelector(".on"); if (on) on.scrollIntoView({inline: "center", block: "nearest"}); } return; }
    // an approval card's "Open trip" goes straight to Authorise and issue
    const o = ev.target.closest && ev.target.closest(".apcard [data-open]"); if (o) { const did = (o.dataset.open || "").split("|")[1]; if (did) { S.tripStep[did] = {s: 6, due: 6}; S.tripAll = false; } }
    // "Go there" to a field in another step: open that step first
    const g = ev.target.closest && ev.target.closest("[data-ns]"); if (!g) return;
    const go = g.dataset.ns, id = go.startsWith("sec|") || go.startsWith("el|") ? go.split("|")[1] : go.startsWith("doc|") ? "secDocs" : "";
    const el = id && document.getElementById(id), sec = el && el.closest("[data-step][hidden]");
    if (sec) { const t = tripById(S.sel); if (t) { S.tripStep[t.did] = {s: +sec.dataset.step.split(" ")[0], due: tripStepNow(t)}; render(); } }
  }, true);
})();
(function(){
  const css = document.createElement("style");
  css.textContent = `.tstep{display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px;margin:4px 0 0;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.tstep-b{flex:0 0 auto;display:flex;align-items:center;gap:6px;border:1px solid var(--line);background:transparent;color:inherit;border-radius:999px;padding:6px 12px 6px 6px;font:inherit;font-size:13px;cursor:pointer;min-height:36px}
.tstep-b .tstep-n{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1px solid var(--line);font-size:12px}
.tstep-b.done .tstep-n{background:var(--ok);border-color:var(--ok);color:#fff}
.tstep-b.due{border-color:var(--steel)}.tstep-b.due .tstep-n{border-color:var(--steel);color:var(--steel)}
.tstep-b.on{background:var(--steel);border-color:var(--steel);color:#fff}.tstep-b.on .tstep-n{border-color:#fff;color:#fff;background:transparent}
.tstep-all{flex:0 0 auto;border:0;background:transparent;color:var(--steel);text-decoration:underline;cursor:pointer;padding:6px 8px;font:inherit;font-size:12px}
.trip-hist>summary{padding:6px 0}
[data-step][hidden],.ns-step[hidden]{display:none!important}
@media (max-width:640px){.tstep-b .tstep-t{display:none}.tstep-b.on .tstep-t,.tstep-b.due .tstep-t{display:inline}}`;
  document.head.appendChild(css);
})();
