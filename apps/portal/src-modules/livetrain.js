/* ---------- Live training in the real portal (Morten, 28 Oct 2026: "I need the live portal, so we need to give me the
   option to select what to share, instead of a preset default") ----------
   The owner shares his screen with chosen members only, and chooses which pages are shared. Other pages show
   "not shared" to the watchers. Always kept back, whatever is chosen (CLAUDE.md data rules): the investor and
   partner list (owner only), Security and Settings, and every email address and phone number on screen (masked).
   Transport: a PRIVATE Supabase Realtime channel "train:<id>". SQL 0020 lets only the owner and the chosen watchers
   join it, and only while the session in config/live is open (it ends by itself after the chosen hours). Nothing is
   stored except config/live (who, which pages, until when) and one audit-log line per session. Sound: phone or Teams. */
(function(){
  if (!window.__sb || (window.__TEST_AS && !window.__LIVE_TEST)) return;   // the test version has its own (tests/live-train.js)
  const NEVER = {security: 1, settings: 1};
  const LV = {ch: null, role: "", last: "", timer: null, obs: null, frame: null, ptr: null, geo: null, paused: false, sentPause: ""};
  S.live = S.live || null;
  const sb = () => window.__sb;
  const liveOpen = l => !!(l && l.id && l.until && l.until > now());
  const amWatcher = l => liveOpen(l) && (l.watchers || []).includes(S.uid);
  function watchCfg(){ if (S.liveW || typeof watchDoc !== "function") return; S.liveW = true;
    try { watchDoc("config/live", snap => { const v = snap.exists ? snap.data() : null; const was = S.live; S.live = v;
      if (LV.role === "watch" && !amWatcher(v)) stopWatch("The session has ended.");
      if (LV.role === "lead" && !liveOpen(v)) stopLead(true);
      if (JSON.stringify(was) !== JSON.stringify(v)) { render(); sylCards(); } }); } catch(e){} }
  function rid(){ const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, x => x.toString(16).padStart(2, "0")).join(""); }
  function b64(buf){ let s = ""; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s){ const t = atob(s), b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; }
  async function gz(str){ const cs = new CompressionStream("gzip"), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(str)); w.close(); return b64(await new Response(cs.readable).arrayBuffer()); }
  async function gunz(s){ const ds = new DecompressionStream("gzip"), w = ds.writable.getWriter(); w.write(unb64(s)); w.close(); return new Response(ds.readable).text(); }
  async function channel(id){
    const c = sb(); const {data} = await c.auth.getSession(); if (data && data.session) c.realtime.setAuth(data.session.access_token);
    return c.channel("train:" + id, {config: {private: true, broadcast: {self: false}}});
  }
  const send = (ev, p) => { if (LV.ch) LV.ch.send({type: "broadcast", event: ev, payload: {...(p || {}), from: S.uid}}); };

  // ---------- what may be shown ----------
  const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
  const PHONE = /(?:\+|\b00)\d[\d\s().\-]{6,}\d/g;
  const CONTACT_FIELD = /(^|[_-])(em|email|mail|ph|phone|tel|mobile|reach|wa|whatsapp|line|wechat)([_-]|$)/i;
  function mask(root){
    root.querySelectorAll("input,textarea").forEach(x => { const k = (x.id || "") + " " + (x.getAttribute("name") || ""); if (/^(email|tel)$/.test(x.type) || CONTACT_FIELD.test(x.id || "") || CONTACT_FIELD.test(x.getAttribute("name") || "")) { if (x.tagName === "TEXTAREA") x.textContent = "•••"; else x.setAttribute("value", x.getAttribute("value") ? "•••" : ""); } });
    root.querySelectorAll("a[href^='mailto:'],a[href^='tel:'],a[href*='wa.me']").forEach(a => a.setAttribute("href", "#"));
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; for (let n; (n = w.nextNode());) nodes.push(n);
    nodes.forEach(n => { const v = n.data.replace(EMAIL, "•••@•••").replace(PHONE, "+•• ••••"); if (v !== n.data) n.data = v; });
    root.querySelectorAll("*").forEach(el => Array.from(el.attributes).forEach(a => { if (/^(on|src$)/.test(a.name)) return; const v = a.value.replace(EMAIL, "•••@•••").replace(PHONE, "+•• ••••"); if (v !== a.value) el.setAttribute(a.name, v); }));
  }
  function shareable(){
    const l = S.live || {}, v = S.view || "today";
    if (S.preview) return {ok: false, why: "a preview"};
    if (NEVER[v]) return {ok: false, why: "a page that is never shared"};
    if (v === "prospects" && S.pSec === "inv") return {ok: false, why: "the investor and partner list (only you)"};
    if (!(l.scope || []).includes(v)) return {ok: false, why: "a page you did not share"};
    return {ok: true};
  }
  function snapshot(){
    const src = document.body, clone = src.cloneNode(true);
    clone.querySelectorAll("script,noscript,#lvMirror,#lvOwnerBar,#testBar,.toast,[data-live-skip]").forEach(n => n.remove());
    const a = src.querySelectorAll("input,select,textarea"), b = clone.querySelectorAll("input,select,textarea");
    let j = 0;
    for (let i = 0; i < a.length && j < b.length; i++) {
      const x = a[i]; if (x.closest("#lvMirror,#lvOwnerBar,#testBar,[data-live-skip]")) continue; const y = b[j++];
      if (x.type === "password" || x.type === "file") { y.setAttribute("value", ""); continue; }
      if (x.tagName === "SELECT") Array.from(y.options).forEach((o, k) => { if (x.options[k] && x.options[k].selected) o.setAttribute("selected", ""); else o.removeAttribute("selected"); });
      else if (x.tagName === "TEXTAREA") y.textContent = x.value;
      else if (x.type === "checkbox" || x.type === "radio") { if (x.checked) y.setAttribute("checked", ""); else y.removeAttribute("checked"); }
      else y.setAttribute("value", x.value);
    }
    mask(clone);
    return clone.innerHTML;
  }
  window.liveMask = mask;   // for the tests

  // ---------- sharing (owner) ----------
  async function push(force){
    if (LV.role !== "lead") return;
    const s = shareable();
    if (!s.ok) { if (force || LV.sentPause !== s.why) { LV.sentPause = s.why; LV.last = ""; send("pause", {why: s.why, name: S.myName || "The director"}); } bar(); return; }
    LV.sentPause = "";
    const html = snapshot(); if (!force && html === LV.last) return; LV.last = html;
    send("dom", {z: await gz(html), w: innerWidth, h: innerHeight, sx: scrollX, sy: scrollY, theme: document.documentElement.getAttribute("data-theme") || "light", cls: document.body.className, name: S.myName || "The director"});
    bar();
  }
  const schedule = () => { if (LV.role !== "lead") return; clearTimeout(LV.timer); LV.timer = setTimeout(() => push(false), 250); };
  let tPtr = 0, tScr = 0;
  document.addEventListener("mousemove", e => { if (LV.role !== "lead" || !shareable().ok) return; const t = Date.now(); if (t - tPtr < 50) return; tPtr = t; send("ptr", {x: e.clientX, y: e.clientY}); }, true);
  document.addEventListener("click", e => { if (LV.role === "lead") { if (shareable().ok && !e.target.closest("#lvOwnerBar")) send("click", {x: e.clientX, y: e.clientY}); schedule(); } }, true);
  document.addEventListener("input", schedule, true); document.addEventListener("change", schedule, true);
  addEventListener("scroll", () => { if (LV.role !== "lead" || !shareable().ok) return; const t = Date.now(); if (t - tScr < 80) return; tScr = t; send("scroll", {sx: scrollX, sy: scrollY}); }, {passive: true});
  addEventListener("resize", () => { if (LV.role === "lead") push(true); if (LV.role === "watch" && LV.frame) geo(parseFloat(LV.frame.style.width), parseFloat(LV.frame.style.height)); });
  addEventListener("pagehide", () => { if (LV.role === "lead") send("pause", {why: "a page that is reloading"}); });
  setInterval(() => { if (LV.role === "lead") push(true); }, 5000);
  async function startLead(l){
    try {
      LV.ch = await channel(l.id); LV.role = "lead"; LV.last = "";
      LV.ch.on("broadcast", {event: "hello"}, m => { push(true); const who = nm(m.payload.from); toast(`${who} is watching.`); });
      LV.ch.subscribe(st => { if (st === "SUBSCRIBED") push(true); else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") toast("Live training could not connect. Run SQL 0020 (Today) if you have not."); });
      if (!LV.obs) { LV.obs = new MutationObserver(m => { if (m.some(r => !(r.target.closest && r.target.closest("#lvOwnerBar,#lvMirror")))) schedule(); }); LV.obs.observe(document.body, {subtree: true, childList: true, attributes: true, characterData: true}); }
      bar();
    } catch(e){ toast("Live training could not start."); }
  }
  async function stopLead(quiet){
    if (LV.role !== "lead") return;
    send("bye", {}); clearTimeout(LV.timer); if (LV.obs) { LV.obs.disconnect(); LV.obs = null; }
    try { await sb().removeChannel(LV.ch); } catch(e){} LV.ch = null; LV.role = ""; bar(); sylCards();
    if (!quiet) { try { await S.db.doc("config/live").set({ended: now(), by: S.uid}); audit("Live training ended", ""); } catch(e){} }
  }
  function bar(){
    let b = document.getElementById("lvOwnerBar");
    if (LV.role !== "lead") { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "lvOwnerBar"; b.setAttribute("data-live-skip", ""); document.body.appendChild(b); }
    const s = shareable(), l = S.live || {};
    b.style.cssText = `position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 14px;background:${s.ok ? "#7a1f1f" : "#4a4f57"};color:#fff;font:600 13px/1.4 "Hanken Grotesk",system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)`;
    const so = !!(l.syl && l.syl.on);
    b.innerHTML = `<span>${s.ok ? "● Sharing this page with" : "Not shared: this is " + esc(s.why) + ". Watchers see a pause."} ${s.ok ? esc((l.watchers || []).map(who).join(", ")) : ""}</span><button type="button" class="btn small" data-syl="toggle" style="background:transparent;color:#fff;border:1px solid #fff">Syllabus: ${so ? "on" : "off"}</button><button type="button" class="btn small" data-lv="stop" style="background:#fff;color:#222">Stop sharing</button>`;
    sylCards();
  }

  // ---------- watching ----------
  function showMirror(){
    let m = document.getElementById("lvMirror");
    if (!m) {
      m = document.createElement("div"); m.id = "lvMirror";
      m.innerHTML = `<style>#lvMirror{position:fixed;inset:0;z-index:2147483000;background:#1b1e23;overflow:hidden}#lvMirror iframe{position:absolute;left:0;top:44px;border:0;transform-origin:0 0;background:#fff}#lvTop{position:absolute;left:0;right:0;top:0;height:44px;display:flex;gap:12px;align-items:center;padding:0 14px;background:#7a1f1f;color:#fff;font:600 13px "Hanken Grotesk",system-ui,sans-serif}#lvTop button{font:inherit;font-size:12px;padding:4px 10px;border:1px solid #fff;background:transparent;color:#fff;cursor:pointer}#lvPtr{position:absolute;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;z-index:2;transition:left .06s linear,top .06s linear}.lvRip{position:absolute;width:36px;height:36px;margin:-18px 0 0 -18px;border:3px solid #e8a33d;border-radius:50%;pointer-events:none;z-index:2;animation:lvr .7s ease-out forwards}@keyframes lvr{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}#lvMsg{position:absolute;left:0;right:0;top:44px;bottom:0;display:flex;align-items:center;justify-content:center;color:#eef1f5;font:500 16px "Hanken Grotesk",system-ui,sans-serif;text-align:center;padding:24px;z-index:1}</style>
        <div id="lvTop"><span id="lvWho">Live training</span><span style="margin-left:auto"></span><button type="button" data-lv="leave">Stop watching</button></div>
        <div id="lvMsg">Connecting…</div><iframe id="lvFrame" sandbox="allow-same-origin" title="Shared screen"></iframe>
        <div id="lvPtr" hidden><svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l15 9-7 1.5L7.5 19z" fill="#e8a33d" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg></div>`;
      document.body.appendChild(m); LV.frame = document.getElementById("lvFrame"); LV.ptr = document.getElementById("lvPtr");
    }
    document.documentElement.style.overflow = "hidden";
  }
  function msg(t){ const e = document.getElementById("lvMsg"); if (e) { e.textContent = t; e.style.display = t ? "flex" : "none"; } }
  function geo(w, h){ const m = document.getElementById("lvMirror"); if (!m || !LV.frame || !w) return; LV.lastWH = [w, h]; const W = m.clientWidth - (LV.sylW || 0), H = m.clientHeight - 44 - (LV.sylH || 0), s = Math.min(W / w, H / h, 1.25);
    const mg = document.getElementById("lvMsg"); if (mg) { mg.style.right = (LV.sylW || 0) + "px"; mg.style.bottom = (LV.sylH || 0) + "px"; }
    LV.frame.style.width = w + "px"; LV.frame.style.height = h + "px"; LV.frame.style.transform = `scale(${s})`; const ox = Math.max(0, (W - w * s) / 2); LV.frame.style.left = ox + "px"; LV.geo = {s, ox}; }
  async function show(p){
    showMirror(); const html = await gunz(p.z), f = LV.frame; if (!f) return; msg(""); f.style.visibility = "visible"; geo(p.w, p.h);
    const d = f.contentDocument;
    if (!d.getElementById("lvBase")) { const head = Array.from(document.head.querySelectorAll("style,link[rel=stylesheet]")).map(n => n.outerHTML).join("");
      d.open(); d.write(`<!doctype html><html><head><meta charset="utf-8"><base id="lvBase" href="${location.href}">${head}<style>a,button,input,select,textarea,label,summary{pointer-events:none}</style></head><body></body></html>`); d.close(); }
    d.documentElement.setAttribute("data-theme", p.theme); d.body.className = p.cls || ""; d.body.innerHTML = html; f.contentWindow.scrollTo(p.sx || 0, p.sy || 0);
    LV.leader = p.name; const w = document.getElementById("lvWho"); if (w) w.textContent = `● Watching ${p.name} live (contact details hidden)`;
    if (!document.getElementById("lvSylWatch") && sylOf() && sylOf().on) sylCards();
  }
  const at = p => LV.geo ? [LV.geo.ox + p.x * LV.geo.s, 44 + p.y * LV.geo.s] : null;
  function dot(p){ const c = at(p); if (!c || !LV.ptr) return; LV.ptr.hidden = false; LV.ptr.style.left = c[0] + "px"; LV.ptr.style.top = c[1] + "px"; }
  function ripple(p){ const c = at(p), m = document.getElementById("lvMirror"); if (!c || !m) return; const r = document.createElement("div"); r.className = "lvRip"; r.style.left = c[0] + "px"; r.style.top = c[1] + "px"; m.appendChild(r); setTimeout(() => r.remove(), 800); dot(p); }
  async function startWatch(){
    const l = S.live; if (!amWatcher(l)) return;
    try {
      showMirror(); msg("Connecting…");
      LV.ch = await channel(l.id); LV.role = "watch";
      LV.ch.on("broadcast", {event: "dom"}, m => show(m.payload));
      LV.ch.on("broadcast", {event: "pause"}, m => { msg(`${m.payload.name || LV.leader || "The director"} is on ${m.payload.why}. The picture comes back on a shared page.`); if (LV.frame) { LV.frame.contentDocument.body.innerHTML = ""; LV.frame.style.visibility = "hidden"; } if (LV.ptr) LV.ptr.hidden = true; });
      LV.ch.on("broadcast", {event: "ptr"}, m => dot(m.payload));
      LV.ch.on("broadcast", {event: "click"}, m => ripple(m.payload));
      LV.ch.on("broadcast", {event: "scroll"}, m => { if (LV.frame) LV.frame.contentWindow.scrollTo(m.payload.sx, m.payload.sy); });
      LV.ch.on("broadcast", {event: "bye"}, () => { msg(`${LV.leader || "The director"} stopped sharing.`); if (LV.frame) LV.frame.style.visibility = "hidden"; });
      LV.ch.subscribe(st => { if (st === "SUBSCRIBED") { msg("Connected. Waiting for the screen…"); send("hello", {}); } else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") msg("Could not connect. Ask the director to check the live training set-up (SQL 0020)."); });
    } catch(e){ msg("Could not connect."); }
  }
  async function stopWatch(text){ if (LV.ch) { try { await sb().removeChannel(LV.ch); } catch(e){} } LV.ch = null; LV.role = ""; const m = document.getElementById("lvMirror"); if (m) m.remove(); LV.frame = null; LV.ptr = null; LV.geo = null; document.documentElement.style.overflow = ""; if (text) toast(text); }

  // ---------- owner panel (Team) and watcher banner (every page) ----------
  function ownerPanel(){
    if (!S.isOwner || acting() !== "owner") return ""; watchCfg();
    const l = S.live, open = liveOpen(l);
    // everyone with access to the portal: the team list plus every active profile with a role (Morten, 28 Oct 2026)
    staffLoad();
    const members = [...new Set([...Object.entries(S.roster || {}).filter(([id, r]) => r && r.active !== false && r.role).map(([id]) => id), ...Object.keys(S.lvStaff || {})])].filter(id => id !== S.uid).sort((a, b) => who(a).localeCompare(who(b)));
    const views = navItems().filter(([k]) => !NEVER[k]);
    const F = S.lvForm = S.lvForm || {w: {}, s: {}, syl: "fam", h: 2};   // kept across re-renders while ticking
    if (open) return `<div class="panel" id="lvPanel" style="margin-bottom:16px"><h2>Live training</h2><p class="small">Open until ${esc(fmtT(l.until))} for ${esc((l.watchers || []).map(who).join(", "))}. Shared pages: ${esc((l.scope || []).map(k => (views.find(v => v[0] === k) || [k, k])[1]).join(", "))}.</p>
      <div class="row">${LV.role === "lead" ? `<button class="btn small danger" type="button" data-lv="stop">Stop sharing</button>` : `<button class="btn small primary" type="button" data-lv="resume">Share my screen now</button> <button class="btn small" type="button" data-lv="stop">End the session</button>`}</div></div>`;
    return `<div class="panel" id="lvPanel" style="margin-bottom:16px"><h2>Live training</h2><p class="small muted">Let chosen members watch your screen live, with your pointer and clicks. Talk over a phone or Teams call. Only the pages you tick are shown; on any other page they see a pause. Always kept back: the investor and partner list, Security, Settings, and every email address and phone number (masked).</p>
      <p class="small" style="margin:8px 0 4px"><b>Who may watch</b></p>${members.map(id => `<label class="check" for="lvw_${id}"><input type="checkbox" id="lvw_${id}" data-lvw="${id}" ${F.w[id] ? "checked" : ""}><span>${esc(who(id))}${roleOf(id) ? ` <span class="small muted">· ${esc(roleOf(id))}</span>` : ""}</span></label>`).join("") || `<p class="small muted">No members yet.</p>`}
      <p class="small" style="margin:8px 0 4px"><b>Pages to share</b></p>${views.map(([k, t]) => `<label class="check" for="lvs_${k}"><input type="checkbox" id="lvs_${k}" data-lvs="${k}" ${F.s[k] ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}
      <p class="small" style="margin:8px 0 4px"><b>Syllabus</b> (you can switch it on or off while sharing)</p><div class="fgrid"><label class="f" for="lvSyl">Follow<select id="lvSyl">${[["", "No syllabus: just share the screen"], ["fam", "Familiarisation (first day)"], ["full", "Full syllabus"]].map(([v, t]) => `<option value="${v}" ${F.syl === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label class="f" for="lvHours">Ends after<select id="lvHours">${[1, 2, 4, 8].map(h => `<option value="${h}" ${F.h === h ? "selected" : ""}>${h} hour${h > 1 ? "s" : ""}</option>`).join("")}</select></label></div>
      <button class="btn small primary" type="button" data-lv="start">Start sharing</button></div>`;
  }
  const ROLE_NAME = {owner: "owner", ops: "operations", broker: "broker", consultant: "consultant"};
  const who = id => ((S.roster || {})[id] && (S.roster[id].contractName || "")) || ((S.lvStaff || {})[id] || {}).name || nm(id);
  const roleOf = id => ROLE_NAME[((S.roster || {})[id] || {}).role || ((S.lvStaff || {})[id] || {}).role] || "";
  function staffLoad(){
    if (S.lvStaffAt && Date.now() - S.lvStaffAt < 60e3) return; S.lvStaffAt = Date.now();
    (async () => { try { const {data} = await sb().from("profiles").select("id,role,active,contract_name").eq("active", true);
      const o = {}; (data || []).forEach(r => { if (r.role && r.id !== S.uid) o[r.id] = {name: r.contract_name || "", role: r.role}; });
      if (JSON.stringify(o) !== JSON.stringify(S.lvStaff || {})) { S.lvStaff = o; render(); } } catch(e){} })();
  }
  function watcherBanner(){
    const l = S.live; if (!amWatcher(l) || LV.role === "watch") return "";
    return `<div class="note info" style="margin-bottom:16px"><b>${esc(nm(l.owner))} is sharing his screen with you</b> (live training, until ${esc(fmtT(l.until))}). <button class="btn small primary" type="button" data-lv="watch">Watch</button></div>`;
  }
  // Training → Live training (owner): moved from Team (Morten, 28 Oct 2026)
  const _trTabsLV = trTabs; trTabs = function(){ const h = _trTabsLV(); if (!S.isOwner || acting() !== "owner") return h; const t = S.trTab || "course";
    return h.replace(/<\/div>$/, `<button class="btn ${t === "live" ? "primary" : ""}" type="button" role="tab" aria-selected="${t === "live"}" data-trtab="live">Live training</button></div>`); };
  const _vTrainingLV = vTraining; vTraining = function(){ if ((S.trTab || "") !== "live" || !S.isOwner || acting() !== "owner") return _vTrainingLV();
    return `<div class="head"><div><h1>Training</h1><p class="muted small">Train someone live: they watch your screen in their own portal while you talk on the phone or Teams, with a syllabus if you want one.</p></div></div>` + trTabs() + ownerPanel(); };
  const _renderLV = renderNow; renderNow = function(){ watchCfg(); _renderLV(); const main = document.getElementById("main"); const ban = watcherBanner();
    if (main && ban && !document.getElementById("lvBanner")) { const d = document.createElement("div"); d.id = "lvBanner"; d.innerHTML = ban; main.insertBefore(d, main.firstChild); }
    if (LV.role === "lead") bar(); };
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-lv]"); if (!b) return; const a = b.dataset.lv;
    if (a === "watch") { startWatch(); return; }
    if (a === "leave") { stopWatch(); return; }
    if (!S.isOwner) return;
    if (a === "stop") { await stopLead(false); if (liveOpen(S.live)) { try { await S.db.doc("config/live").set({ended: now(), by: S.uid}); audit("Live training ended", ""); } catch(err){} } render(); return; }
    if (a === "resume") { startLead(S.live); return; }
    if (a === "start") {
      const watchers = [...document.querySelectorAll("[data-lvw]:checked")].map(x => x.dataset.lvw), scope = [...document.querySelectorAll("[data-lvs]:checked")].map(x => x.dataset.lvs);
      if (!watchers.length) { toast("Tick who may watch."); return; } if (!scope.length) { toast("Tick at least one page to share."); return; }
      const hours = Number(($("lvHours") || {}).value || 2), course = ($("lvSyl") || {}).value || "";
      const l = {id: rid(), owner: S.uid, watchers, scope, at: now(), until: new Date(Date.now() + hours * 3600e3).toISOString(), syl: {on: !!course, course: course || "fam", idx: 0, done: {}}};
      if (course) { S.live = l; l.syl.done = await sylLoadDone(course); const C = SYL[course]; const first = C.lessons.findIndex(x => !l.syl.done[x.id]); l.syl.idx = first < 0 ? 0 : first; }
      try { await S.db.doc("config/live").set(l); S.live = l; audit("Live training started", `${watchers.map(who).join(", ")} · ${scope.join(", ")} · ${hours} h`); startLead(l); toast("Sharing. They see a Watch button in their portal."); render(); }
      catch(err){ toast("Could not start. Try again."); }
    }
  });

  // ---------- syllabus: follow a course during live training (Morten, 28 Oct 2026), switched on or off at any time ----------
  // Familiarisation for the first day, and the full syllabus (manual Modules 0-14, then the practical stages). Each
  // lesson names the page to show, what to show, and a task or question for the trainee. "Lesson done" is kept in the
  // trainee's training record (train/<uid>/runs/syl-<course>-<lesson>); the director sees it there and in the session.
  const SYL = {
    fam: {t: "Familiarisation (first day)", lessons: [
      {id: "f1", t: "Welcome: what Archē Executive is and how we work", page: "today", min: 15, show: ["We are a broker, not an airline: a licensed operator flies every trip and is named in the quote and the agreement", "Our price: operator price and direct costs divided by 0.91 (9% margin); the director approves lower margins", "The director approves every booking before a confirmation is issued", "Four eyes: nobody prices, issues or records payment on their own trip"], check: "Explain in your own words what a broker does and who flies the aircraft."},
      {id: "f2", t: "Finding your way in the portal", page: "help", min: 15, show: ["The menu and your Dashboard", "Help and Portal rules: where the answers are", "Day and Night themes", "Notices: read them and press \"I have read this\""], check: "Find the Portal rules page and the Help page on your own."},
      {id: "f3", t: "Enquiries: the website and the enquiry pool", page: "pool", min: 20, show: ["Website enquiries arrive in the portal: reply within 15 minutes", "Open enquiries: taking an enquiry from the pool", "While you are supervised, some steps wait for the director's OK"], check: "Where does a new website enquiry appear, and how fast do we reply?"},
      {id: "f4", t: "A trip: the form and the steps guide", page: "trips", min: 25, show: ["New enquiry: client, legs, aircraft category, operator quote", "Fields marked * are needed before operations", "\"Steps to book this trip\": what is done, what is missing, who does it", "Save often; the trip keeps its history"], check: "Create a practice trip in the test portal and read its steps list aloud."},
      {id: "f5", t: "Checks that stop a trip", page: "trips", min: 25, show: ["Trip checks: red stops the trip, amber must be confirmed in writing", "Sanctions, cabotage, night curfews and the never-sell list", "Operator safety: ARGUS Platinum or Platinum Elite, WYVERN Wingman or Wingman PRO, IS-BAO Stage 2 or 3", "Any other operator: an Archē-approved operator or the director's approval; the safety line for the quote"], check: "Name the three accepted audits and what happens with any other operator."},
      {id: "f6", t: "Sending to operations and the director's OK", page: "queue", min: 15, show: ["\"Send to operations\" opens only when nothing is missing and nothing is red", "Operations issues the confirmation and records payments; brokers set only enquiry, quoted, submitted or cancelled", "Payment only through a secure payment request, never bank details"], check: "Who issues the confirmation, and may you issue your own trip?"},
      {id: "f7", t: "Prospects and contacts: the data rules", page: "prospects", min: 20, show: ["Organisations first; named people only as business contacts from the organisation's own site or a licensed database", "Every first message says where we found the details and offers an opt-out", "An opt-out deletes the person's details at once; no export of contact details", "You see contacts only on your own leads; opening them is logged"], check: "What must every first message to a named contact include?"},
      {id: "f8", t: "Commission, training and the next steps", page: "commission", min: 15, show: ["Your commission page", "Training: the academy, its quizzes and the practice trips", "The test portal for practice on example data", "The plan for the next sessions (full syllabus)"], check: "Agree with the director the first three academy modules to finish this week."}]},
    full: {t: "Full syllabus", lessons: [
      ["m0", "Module 0: Aviation for brokers", "training"], ["m1", "Module 1: Archē Executive and the broker's role", "today"], ["m2", "Module 2: Where we may and may not sell: the legal map", "trips"],
      ["m3", "Module 3: Compliance: KYC, sanctions, fraud, bribery and data protection", "trips"], ["m4", "Module 4: Our clients", "prospects"], ["m5", "Module 5: Enquiry intake and qualification", "pool"],
      ["m6", "Module 6: Flight feasibility and trip planning", "trips"], ["m7", "Module 7: Aircraft knowledge", "training"], ["m8", "Module 8: Sourcing on Avinode and operator vetting", "trips"],
      ["m9", "Module 9: Pricing and quoting", "trips"], ["m10", "Module 10: Contract, payment and settlement", "queue"], ["m11", "Module 11: Trip operations, disruption and the 24/7 desk", "queue"],
      ["m12", "Module 12: Selling and the consultant desk", "prospects"], ["m13", "Module 13: Case studies", "training"], ["m14", "Module 14: Assessment and certification", "training"]
    ].map(([id, t, page]) => ({id, t, page, min: 60, show: [`Academy: read ${t.split(":")[0]} and pass its quiz`, "Walk through the same steps in the portal on a real or practice trip", "Questions and the points to remember"], check: `Explain the critical rules of ${t.split(":")[0]} and show one of them in the portal.`})).concat([
      {id: "p1", t: "Practical: Avinode and payment system training", page: "trips", min: 120, show: ["Searching and requesting quotes on Avinode", "Comparing quotes like for like", "The payment request: how the client pays"], check: "Request and compare three quotes for a practice trip."},
      {id: "p2", t: "Practical: eight shadowed trips", page: "trips", min: 0, show: ["The trainee follows eight real trips from enquiry to the last landing", "Notes on each trip in the training record"], check: "Present one shadowed trip from start to finish."},
      {id: "p3", t: "Practical exam with the director", page: "training", min: 90, show: ["A full trip, priced, checked and ready for operations, without help"], check: "Pass the practical exam."},
      {id: "p4", t: "Ten supervised bookings", page: "trips", min: 0, show: ["Every step waits for the director's OK until released", "The director releases each step separately"], check: "Complete ten supervised bookings; the director signs the training record."}])}
  };
  window.LIVE_SYLLABUS = SYL;
  const sylOf = () => ((S.live || {}).syl) || null;
  const PAGES = {today: "Today", pool: "Enquiries", trips: "Trips", queue: "Operations", quotes: "Supplier quotes", prospects: "Prospects", commission: "Commission", control: "Control", assistant: "Assistant", team: "Team", training: "Training", help: "Help"};
  const pageName = k => PAGES[k] || ((navItems().find(v => v[0] === k) || [k, k])[1]);
  async function sylSet(patch){ const l = S.live; if (!liveOpen(l) || !S.isOwner) return; const syl = {on: false, course: "fam", idx: 0, done: {}, ...(l.syl || {}), ...patch}; const next = {...l, syl};
    try { await S.db.doc("config/live").set(next); S.live = next; render(); sylCards(); } catch(e){ toast("Could not save."); } }
  async function sylLoadDone(course){
    const out = {}; for (const w of (S.live || {}).watchers || []) { try { const q = await S.db.collection(`train/${w}/runs`).get(); q.docs.forEach(d => { if (d.id.startsWith(`syl-${course}-`)) out[d.id.slice(5 + course.length)] = true; }); } catch(e){} }
    return out;
  }
  function sylHtml(owner){
    const s = sylOf(); if (!s || !s.on) return "";
    const C = SYL[s.course] || SYL.fam, L = C.lessons[Math.min(s.idx || 0, C.lessons.length - 1)], done = s.done || {}, n = C.lessons.filter(x => done[x.id]).length;
    const here = (S.view || "") === L.page;
    return `<div style="font:13px/1.5 'Hanken Grotesk',system-ui,sans-serif;color:#eef1f5">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#a9bdd4">${esc(C.t)} · ${n} of ${C.lessons.length} done</div>
      <div style="font:400 19px/1.3 Prata,Georgia,serif;margin:6px 0 4px">${(s.idx || 0) + 1}. ${esc(L.t)}</div>
      <div style="font-size:12px;color:#c6cbd2">Page: ${esc(pageName(L.page))}${L.min ? " · about " + L.min + " min" : ""}${owner && !here ? ` <button type="button" data-syl="go" style="font:inherit;font-size:11px;padding:2px 8px;border:1px solid #a9bdd4;background:none;color:#eef1f5;cursor:pointer">Open it</button>` : ""}</div>
      <ol style="margin:10px 0 0 18px;padding:0">${L.show.map(x => `<li style="margin:4px 0">${esc(x)}</li>`).join("")}</ol>
      <div style="margin-top:10px;padding:8px 10px;border-left:3px solid #e8a33d;background:rgba(232,163,61,.12)"><b style="color:#e8a33d">${owner ? "Task for the trainee" : "Your task"}:</b> ${esc(L.check)}</div>
      ${owner ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button type="button" data-syl="prev" style="font:inherit;font-size:12px;padding:5px 10px;border:1px solid #a9bdd4;background:none;color:#eef1f5;cursor:pointer">Back</button><button type="button" data-syl="done" style="font:inherit;font-size:12px;padding:5px 10px;border:1px solid #eef1f5;background:#eef1f5;color:#2a2d32;cursor:pointer">${done[L.id] ? "Done ✓ · next" : "Lesson done · next"}</button><button type="button" data-syl="next" style="font:inherit;font-size:12px;padding:5px 10px;border:1px solid #a9bdd4;background:none;color:#eef1f5;cursor:pointer">Skip</button></div>
        <label style="display:block;margin-top:8px;font-size:12px;color:#c6cbd2">Course <select data-syl="course" style="font:inherit;font-size:12px;width:auto;min-height:0;padding:2px 4px">${Object.entries(SYL).map(([k, c]) => `<option value="${k}" ${k === s.course ? "selected" : ""}>${esc(c.t)}</option>`).join("")}</select></label>` : ""}
      <details style="margin-top:10px"><summary style="cursor:pointer;color:#a9bdd4">All lessons</summary><ol style="margin:6px 0 0 18px;padding:0;font-size:12px">${C.lessons.map((x, i) => `<li style="margin:2px 0;${i === (s.idx || 0) ? "font-weight:700" : ""}">${done[x.id] ? "✓ " : ""}${esc(x.t)}</li>`).join("")}</ol></details></div>`;
  }
  function sylCards(){
    // owner: a card above the sharing bar (never sent to watchers); watcher: a column beside the shared screen
    const s = sylOf(), on = !!(s && s.on && liveOpen(S.live));
    let oc = document.getElementById("lvSylOwner");
    if (LV.role === "lead" && on) { if (!oc) { oc = document.createElement("div"); oc.id = "lvSylOwner"; oc.setAttribute("data-live-skip", ""); oc.style.cssText = "position:fixed;right:16px;bottom:70px;width:min(360px,calc(100vw - 32px));max-height:60vh;overflow:auto;z-index:2147483000;background:#2a2d32;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.4);border:1px solid #474a50"; document.body.appendChild(oc); } oc.innerHTML = sylHtml(true); }
    else if (oc) oc.remove();
    const m = document.getElementById("lvMirror"); if (!m) return;
    let wc = document.getElementById("lvSylWatch");
    if (LV.role === "watch" && on) { if (!wc) { wc = document.createElement("div"); wc.id = "lvSylWatch"; m.appendChild(wc); }
      const side = m.clientWidth >= 900; wc.style.cssText = side ? "position:absolute;right:0;top:44px;bottom:0;width:320px;overflow:auto;background:#2a2d32;padding:16px;z-index:3;border-left:1px solid #474a50" : "position:absolute;left:0;right:0;bottom:0;height:42%;overflow:auto;background:#2a2d32;padding:14px;z-index:3;border-top:1px solid #474a50";
      wc.innerHTML = sylHtml(false); LV.sylW = side ? 320 : 0; LV.sylH = side ? 0 : Math.round(m.clientHeight * 0.42); }
    else { if (wc) wc.remove(); LV.sylW = 0; LV.sylH = 0; }
    const mg = document.getElementById("lvMsg"); if (mg) { mg.style.right = (LV.sylW || 0) + "px"; mg.style.bottom = (LV.sylH || 0) + "px"; }
    if (LV.frame && LV.lastWH) geo(LV.lastWH[0], LV.lastWH[1]);
  }
  window.liveSylCards = sylCards;
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-syl]"); if (!b || !S.isOwner || b.tagName === "SELECT") return;
    const s = sylOf() || {}, C = SYL[s.course] || SYL.fam, i = s.idx || 0, L = C.lessons[i], a = b.dataset.syl;
    if (a === "go") { S.view = L.page; render(); return; }
    if (a === "toggle") { if (s.on) { sylSet({on: false}); return; } const course = s.course || "fam"; sylSet({on: true, course, done: {...(s.done || {}), ...(await sylLoadDone(course))}}); return; }
    if (a === "prev") { sylSet({idx: Math.max(0, i - 1)}); return; }
    if (a === "next") { sylSet({idx: Math.min(C.lessons.length - 1, i + 1)}); return; }
    if (a === "done") {
      for (const w of (S.live || {}).watchers || []) { try { await S.db.doc(`train/${w}/runs/syl-${s.course || "fam"}-${L.id}`).set({kind: "syllabus", course: s.course || "fam", lesson: L.id, title: L.t, at: now(), by: S.uid}); } catch(err){} }
      audit("Training lesson done", `${(S.live.watchers || []).map(who).join(", ")} · ${L.t}`);
      sylSet({done: {...(s.done || {}), [L.id]: true}, idx: Math.min(C.lessons.length - 1, i + 1)}); return; }
  });
  document.addEventListener("change", e => { const el = e.target, F = S.lvForm; if (!F || !el.closest || !el.closest("#lvPanel")) return;
    if (el.dataset.lvw) F.w[el.dataset.lvw] = el.checked; else if (el.dataset.lvs) F.s[el.dataset.lvs] = el.checked; else if (el.id === "lvSyl") F.syl = el.value; else if (el.id === "lvHours") F.h = Number(el.value); });
  document.addEventListener("change", async e => { const el = e.target; if (!el.dataset || el.dataset.syl !== "course" || !S.isOwner) return; const course = el.value; sylSet({course, idx: 0, done: await sylLoadDone(course)}); });

  window.__liveTrain = LV;
})();
