/* ---------- The Director's menu in groups (Morten, 25 Nov 2026, peer proposal P7: "All") ----------
   On a computer the Director's 19 menu items sat in two rows; peers keep five to seven. The items now sit in six groups:
   Today, Trips, Clients and prospects, Team, Money, More. A group with one item is a plain button; the others open a short
   list on click, hover or keyboard focus. On a phone (Menu) every item shows under its group heading. Brokers keep their
   short menu as it is. Every item keeps its own button, so links, badges and keyboard use work as before. */
(function(){
  const NG = [["trips", "Trips", ["pool", "trips", "queue", "quotes", "supervise"]], ["clients", "Clients and prospects", ["prospects", "website"]],
    ["team", "Team", ["team", "onboarding", "training"]], ["money", "Money", ["commission", "reports", "books", "control"]]];
  const _shell = renderShell;
  renderShell = function(items){
    _shell(items);
    if (acting() !== "owner" || items.length < 9) return;
    const nav = $("nav"); if (!nav) return;
    const btn = k => nav.querySelector(`button[data-view="${k}"]`), used = new Set(["today"]), groups = [];
    NG.forEach(([id, label, keys]) => { const bs = keys.map(btn).filter(Boolean); bs.forEach(b => used.add(b.dataset.view)); if (bs.length) groups.push([id, label, bs]); });
    const rest = [...nav.querySelectorAll("button[data-view]")].filter(b => !used.has(b.dataset.view));
    if (rest.length) groups.push(["more", "More", rest]);
    const site = nav.querySelector('button[data-act="website"]'), today = btn("today");
    nav.innerHTML = ""; nav.classList.add("grouped"); if (today) nav.append(today);
    groups.forEach(([id, label, bs]) => {
      if (bs.length === 1) { nav.append(bs[0]); return; }
      const cur = bs.some(b => b.getAttribute("aria-current") === "page"), badge = bs.reduce((n, b) => n + (+((b.querySelector(".badge") || {}).textContent || 0) || 0), 0);
      const g = document.createElement("div"); g.className = "ngrp" + (S.navOpen === id ? " open" : ""); g.dataset.ng = id;
      g.innerHTML = `<button type="button" class="nghead" data-ngh="${id}" aria-expanded="${S.navOpen === id}" ${cur ? 'aria-current="page"' : ""}>${esc(label)}${badge ? ` <span class="badge">${badge}</span>` : ""}<span aria-hidden="true" class="ngcar">▾</span></button><div class="ngpop" role="menu" aria-label="${esc(label)}"></div>`;
      bs.forEach(b => g.querySelector(".ngpop").append(b)); nav.append(g); });
    if (site) nav.append(site);
  };
  document.addEventListener("click", ev => {
    const h = ev.target.closest && ev.target.closest("[data-ngh]");
    if (h) { ev.preventDefault(); S.navOpen = S.navOpen === h.dataset.ngh ? null : h.dataset.ngh; document.querySelectorAll("#nav .ngrp").forEach(g => { const o = g.dataset.ng === S.navOpen; g.classList.toggle("open", o); g.querySelector(".nghead").setAttribute("aria-expanded", o); }); return; }
    if (S.navOpen && !(ev.target.closest && ev.target.closest("#nav .ngrp"))) { S.navOpen = null; document.querySelectorAll("#nav .ngrp.open").forEach(g => { g.classList.remove("open"); g.querySelector(".nghead").setAttribute("aria-expanded", "false"); }); }
    if (ev.target.closest && ev.target.closest("#nav .ngpop [data-view]")) S.navOpen = null;
  }, true);
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && S.navOpen) { S.navOpen = null; document.querySelectorAll("#nav .ngrp.open").forEach(g => g.classList.remove("open")); } });
  const css = document.createElement("style");
  css.textContent = `#nav.grouped{align-items:center}
#nav .ngrp{position:relative}
#nav .nghead .ngcar{font-size:9px;margin-left:6px;opacity:.7}
#nav .ngpop{display:none;position:absolute;right:0;top:100%;z-index:60;min-width:220px;padding:6px;background:var(--surface);border:1px solid var(--line2);box-shadow:0 10px 28px rgba(0,0,0,.28)}
#nav .ngpop button{display:block;width:100%;text-align:left;color:var(--text)}
#nav .ngpop button:hover,#nav .ngpop button[aria-current="page"]{color:var(--ink)}
#nav .ngrp.open .ngpop,#nav .ngrp:focus-within .ngpop{display:block}
@media (hover:hover) and (min-width:1025px){#nav .ngrp:hover .ngpop{display:block}}
@media (max-width:1024px){#nav .ngrp{width:100%}#nav .nghead{pointer-events:none;color:var(--hdr-muted)!important;font-size:10px!important;margin-top:8px}#nav .nghead .ngcar{display:none}#nav .ngpop{display:block;position:static;box-shadow:none;border:0;background:transparent;padding:0}#nav .ngpop button{color:var(--hdr-ink)}#nav .ngpop button:hover,#nav .ngpop button[aria-current="page"]{color:var(--hdr-strong)}}`;
  document.head.append(css);
})();
