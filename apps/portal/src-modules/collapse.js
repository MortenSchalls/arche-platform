/* ---------- Today and Dashboard: every section can be collapsed (Morten, 28 Oct 2026: "make all my information on
   Today's page collapsible if I want to see less or more") ----------
   Each panel's heading gets a ▾/▸ button; a collapsed panel keeps only its heading (with its count), so the page is a
   short list of what is there. "Collapse all" and "Expand all" sit under the page title. What is collapsed is
   remembered on this device only (a viewing preference, nothing else). Short alert notes stay visible. */
(function(){
  const KEY = "arche.collapsed.v1";
  const VIEWS = {today: 1, home: 1};
  let st = {}; try { st = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch(e){ st = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} };
  const keyOf = (view, title) => view + ":" + title.replace(/\s*\(\d+\)\s*/g, " ").replace(/\d+/g, "#").replace(/\s+/g, " ").trim().slice(0, 80);
  function decorate(){
    const v = S.view; if (!VIEWS[v]) return;
    const main = document.getElementById("main"); if (!main) return;
    const sec = (box, h) => {
      if (box.dataset.clp || box.closest("[data-clp]")) return;
      let head = h; while (head.parentElement && head.parentElement !== box) head = head.parentElement;
      if (head.parentElement !== box) return;
      const title = (h.textContent || "").trim(); if (!title) return;
      const k = keyOf(v, title); box.dataset.clp = k; head.setAttribute("data-clp-head", ""); any++;
      const b = document.createElement("button"); b.type = "button"; b.className = "clpbtn"; b.setAttribute("data-clp", k);
      h.insertBefore(b, h.firstChild); h.setAttribute("data-clp-title", k); h.style.cursor = "pointer";
      set(box, !!st[k]);
    };
    let any = 0;
    // 1. panels with a heading
    [...main.querySelectorAll(".panel")].filter(p => !p.parentElement.closest(".panel") && !p.closest("#lvMirror")).forEach(p => { const h = p.querySelector("h2,h3"); if (h) sec(p, h); });
    // 2. sections laid out as a heading row above their own panel (e.g. Bookings to approve)
    [...main.querySelectorAll("div")].filter(d => !d.classList.contains("panel") && !d.closest(".panel,[data-clp],#lvMirror") && d.children.length >= 2 && !d.querySelector("[data-clp]")).forEach(d => {
      const f = d.firstElementChild; const h = f && (f.matches("h2,h3") ? f : f.querySelector(":scope > h2, :scope > h3")); if (h) sec(d, h); });
    // 3. the row of key figures gets its own small heading
    const kp = main.querySelector(":scope > .kpis, :scope > div > .kpis");
    if (kp && !kp.closest("[data-clp]")) { const w = document.createElement("div"); w.className = "clpkpi"; kp.parentElement.insertBefore(w, kp);
      const h = document.createElement("h3"); h.className = "clpkpi-h"; h.textContent = "Key figures"; w.appendChild(h); w.appendChild(kp); sec(w, h); }
    if (any && !main.querySelector(".clpall")) {
      const bar = document.createElement("div"); bar.className = "row clpall"; bar.style.cssText = "gap:6px;margin:-4px 0 12px";
      bar.innerHTML = `<button class="btn small" type="button" data-clpall="0">Collapse all</button><button class="btn small" type="button" data-clpall="1">Expand all</button>`;
      const hd = main.querySelector(".head"); if (hd && hd.parentElement) hd.parentElement.insertBefore(bar, hd.nextSibling); else main.insertBefore(bar, main.firstChild);
    }
  }
  function set(p, closed){
    p.classList.toggle("clp-off", closed);
    const b = p.querySelector(".clpbtn"); if (b) { b.textContent = closed ? "▸" : "▾"; b.setAttribute("aria-expanded", String(!closed)); b.setAttribute("aria-label", closed ? "Show this section" : "Hide this section"); }
  }
  const _rn = renderNow; renderNow = function(){ _rn(); try { decorate(); } catch(e){} };
  document.addEventListener("click", e => {
    const all = e.target.closest && e.target.closest("[data-clpall]");
    if (all) { const open = all.dataset.clpall === "1"; document.querySelectorAll("#main [data-clp]:not(button):not(h2):not(h3)").forEach(p => { st[p.dataset.clp] = !open; set(p, !open); }); save(); return; }
    // only the heading (or its ▾/▸ button) opens and closes a section; a click on a box, field, link or button inside it
    // never does (30 Oct 2026: ticking a box in a section closed the section)
    if (!e.target.closest || e.target.closest("a,select,input,label,textarea") || (e.target.closest("button") && !e.target.closest(".clpbtn"))) return;
    const t = e.target.closest("button.clpbtn,[data-clp-title]"); if (!t) return;
    const p = t.closest("div[data-clp]"); if (!p) return;
    const k = p.dataset.clp; st[k] = !st[k]; if (!st[k]) delete st[k]; save(); set(p, !!st[k]);
  });
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-clp-title]")) { e.preventDefault(); e.target.click(); } });
  window.__clp = {decorate, st};
})();
