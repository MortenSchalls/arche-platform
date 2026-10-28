/* Live training: one person shares the test portal, others watch it live (Morten, 28 Oct 2026: "train Natalia ...
   inside the portal so she sees what I do, a shared view in our own universe"). Test version only, on example data:
   in the real portal a shared view would show owner-only data (investors, other brokers' contacts), which the rules
   forbid. Talk over a phone or Teams call; this carries the picture, the pointer and the clicks.
   How it works: the sharer's page is copied (with typed values) every time it changes, compressed and sent over a
   Supabase Realtime broadcast channel named by a random code. Watchers show it in a frame without scripts, scaled to
   their screen, with the sharer's pointer and clicks. Either side can take over ("Share mine instead"). Nothing is
   stored anywhere. */
(function(){
  var SB_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
  var L = {ch: null, code: "", role: "", me: Math.random().toString(36).slice(2, 10), name: "", last: "", timer: null, obs: null, frame: null, ptr: null, leader: "", seen: 0, joined: false};
  var NAMES = {owner: "Test Owner", ops: "Test Operations", broker: "Test Broker", broker2: "Test Broker 2", candidate: "New candidate"};
  function $(id){ return document.getElementById(id); }
  function lib(){ return new Promise(function(ok, bad){
    if (window.__rtLib) return ok(window.__rtLib);
    var fake = window.supabase, s = document.createElement("script"); s.src = SB_JS;
    s.onload = function(){ window.__rtLib = window.supabase; window.supabase = fake; ok(window.__rtLib); };
    s.onerror = function(){ window.supabase = fake; bad(new Error("could not load the live connection")); };
    document.head.appendChild(s); }); }
  function newCode(){ var a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", c = "", r = new Uint32Array(8); crypto.getRandomValues(r); for (var i = 0; i < 8; i++) c += a[r[i] % a.length]; return c; }
  function b64(buf){ var s = "", b = new Uint8Array(buf); for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s){ var t = atob(s), b = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; }
  async function gz(str){ var cs = new CompressionStream("gzip"), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(str)); w.close(); return b64(await new Response(cs.readable).arrayBuffer()); }
  async function gunz(s){ var ds = new DecompressionStream("gzip"), w = ds.writable.getWriter(); w.write(unb64(s)); w.close(); return new Response(ds.readable).text(); }
  function send(ev, payload){ if (L.ch) L.ch.send({type: "broadcast", event: ev, payload: Object.assign({from: L.me}, payload)}); }
  function status(t){ var e = $("lvStatus"); if (e) e.textContent = t; }

  // ---------- sharing ----------
  function snapshot(){
    var src = document.body, clone = src.cloneNode(true);
    ["#testBar", "#lvMirror", "script", "noscript"].forEach(function(q){ clone.querySelectorAll(q).forEach(function(n){ n.remove(); }); });
    var a = src.querySelectorAll("input,select,textarea"), b = clone.querySelectorAll("input,select,textarea"), j = 0;
    for (var i = 0; i < a.length && j < b.length; i++) {
      if (a[i].closest("#testBar,#lvMirror")) continue;
      var x = a[i], y = b[j++];
      if (x.type === "password") { y.setAttribute("value", x.value ? "••••••" : ""); continue; }
      if (x.tagName === "SELECT") { Array.from(y.options).forEach(function(o, k){ if (x.options[k] && x.options[k].selected) o.setAttribute("selected", ""); else o.removeAttribute("selected"); }); }
      else if (x.tagName === "TEXTAREA") y.textContent = x.value;
      else if (x.type === "checkbox" || x.type === "radio") { if (x.checked) y.setAttribute("checked", ""); else y.removeAttribute("checked"); }
      else y.setAttribute("value", x.value);
    }
    return clone.innerHTML;
  }
  async function push(force){
    if (L.role !== "lead") return;
    var html = snapshot();
    if (!force && html === L.last) return;
    L.last = html;
    var z = await gz(html);
    send("dom", {z: z, w: innerWidth, h: innerHeight, sx: scrollX, sy: scrollY, theme: document.documentElement.getAttribute("data-theme") || "light", cls: document.body.className, name: L.name});
  }
  function schedule(){ if (L.role !== "lead") return; clearTimeout(L.timer); L.timer = setTimeout(function(){ push(false); }, 250); }
  var lastPtr = 0, lastScroll = 0;
  function onMove(e){ if (L.role !== "lead") return; var t = Date.now(); if (t - lastPtr < 50) return; lastPtr = t; send("ptr", {x: e.clientX, y: e.clientY}); }
  function onClick(e){ if (L.role === "lead") { send("click", {x: e.clientX, y: e.clientY}); schedule(); } }
  function onScroll(){ if (L.role !== "lead") return; var t = Date.now(); if (t - lastScroll < 80) return; lastScroll = t; send("scroll", {sx: scrollX, sy: scrollY}); }
  function onResize(){ if (L.role === "lead") push(true); }
  function startLead(){
    L.role = "lead"; L.last = ""; hideMirror();
    if (!L.obs) { L.obs = new MutationObserver(function(m){ if (m.some(function(r){ return !(r.target.closest && r.target.closest("#testBar,#lvMirror")); })) schedule(); });
      L.obs.observe(document.body, {subtree: true, childList: true, attributes: true, characterData: true}); }
    push(true); bar();
  }

  // ---------- watching ----------
  function showMirror(){
    var m = $("lvMirror");
    if (!m) {
      m = document.createElement("div"); m.id = "lvMirror";
      m.innerHTML = '<style>#lvMirror{position:fixed;inset:0;z-index:2147483000;background:#1b1e23;overflow:hidden}#lvMirror iframe{position:absolute;left:0;top:0;border:0;transform-origin:0 0;background:#fff}#lvPtr{position:absolute;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;z-index:2;transition:left .06s linear,top .06s linear}#lvPtr svg{display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}.lvRip{position:absolute;width:36px;height:36px;margin:-18px 0 0 -18px;border:3px solid #e8a33d;border-radius:50%;pointer-events:none;z-index:2;animation:lvr .7s ease-out forwards}@keyframes lvr{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}#lvWait{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#eef1f5;font:500 16px "Hanken Grotesk",system-ui,sans-serif;text-align:center;padding:24px}</style>'
        + '<div id="lvWait">Waiting for the shared screen…</div><iframe id="lvFrame" sandbox="allow-same-origin" title="Shared screen"></iframe><div id="lvPtr" hidden><svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l15 9-7 1.5L7.5 19z" fill="#e8a33d" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg></div>';
      document.body.appendChild(m);
      L.frame = $("lvFrame"); L.ptr = $("lvPtr");
      var bar0 = $("testBar"); if (bar0) { m.style.top = bar0.getBoundingClientRect().height + "px"; }
    }
    m.hidden = false; document.documentElement.style.overflow = "hidden";
  }
  function hideMirror(){ var m = $("lvMirror"); if (m) m.remove(); L.frame = null; L.ptr = null; L.geo = null; document.documentElement.style.overflow = ""; }
  function geo(w, h){
    var m = $("lvMirror"); if (!m || !L.frame) return;
    var W = m.clientWidth, H = m.clientHeight, s = Math.min(W / w, H / h, 1.25);
    L.frame.style.width = w + "px"; L.frame.style.height = h + "px"; L.frame.style.transform = "scale(" + s + ")";
    var ox = Math.max(0, (W - w * s) / 2); L.frame.style.left = ox + "px"; L.geo = {s: s, ox: ox};
  }
  async function render(p){
    showMirror(); var html = await gunz(p.z), f = L.frame; if (!f) return;
    var w = $("lvWait"); if (w) w.remove();
    geo(p.w, p.h);
    var d = f.contentDocument;
    if (!d || !d.body || !d.getElementById("lvBase")) {
      var head = Array.from(document.head.querySelectorAll("style,link[rel=stylesheet]")).map(function(n){ return n.outerHTML; }).join("");
      d.open(); d.write('<!doctype html><html data-theme="' + p.theme + '"><head><meta charset="utf-8"><base id="lvBase" href="' + location.href + '">' + head + '<style>a,button,input,select,textarea,label{pointer-events:none}</style></head><body></body></html>'); d.close();
    }
    d.documentElement.setAttribute("data-theme", p.theme); d.body.className = p.cls || "";
    d.body.innerHTML = html;
    f.contentWindow.scrollTo(p.sx || 0, p.sy || 0);
    if (p.name) { L.leader = p.name; var e = $("lvWho"); if (e) e.textContent = p.name; }
    L.seen = Date.now();
  }
  function dot(p){ if (!L.ptr || !L.geo) return; L.ptr.hidden = false; L.ptr.style.left = (L.geo.ox + p.x * L.geo.s) + "px"; L.ptr.style.top = (p.y * L.geo.s) + "px"; }
  function ripple(p){ var m = $("lvMirror"); if (!m || !L.geo) return; var r = document.createElement("div"); r.className = "lvRip"; r.style.left = (L.geo.ox + p.x * L.geo.s) + "px"; r.style.top = (p.y * L.geo.s) + "px"; m.appendChild(r); setTimeout(function(){ r.remove(); }, 800); dot(p); }
  function startWatch(){ L.role = "watch"; clearTimeout(L.timer); showMirror(); send("hello", {}); bar(); }

  // ---------- connection ----------
  async function join(code, role){
    try {
      await leave(true);
      L.code = code; status("Connecting…");
      var lib_ = await lib(), cfg = window.ARCHE_CONFIG || {};
      var c = lib_.createClient(cfg.supabaseUrl, cfg.supabaseKey, {auth: {persistSession: false, autoRefreshToken: false, storageKey: "arche.live"}});
      var ch = c.channel("arche-train-" + code, {config: {broadcast: {self: false, ack: false}}});
      ch.on("broadcast", {event: "dom"}, function(m){ var p = m.payload; if (L.role === "lead" && p.from !== L.me) { L.role = "watch"; } if (L.role === "watch") render(p).then(bar); });
      ch.on("broadcast", {event: "ptr"}, function(m){ if (L.role === "watch") dot(m.payload); });
      ch.on("broadcast", {event: "click"}, function(m){ if (L.role === "watch") ripple(m.payload); });
      ch.on("broadcast", {event: "scroll"}, function(m){ if (L.role === "watch" && L.frame) L.frame.contentWindow.scrollTo(m.payload.sx, m.payload.sy); });
      ch.on("broadcast", {event: "hello"}, function(m){ if (L.role === "lead") { push(true); send("note", {text: (m.payload.name || "Someone") + " joined"}); } });
      ch.on("broadcast", {event: "take"}, function(m){ if (L.role === "lead" && m.payload.from !== L.me) { L.role = "watch"; startWatch(); } });
      ch.on("broadcast", {event: "note"}, function(m){ status(m.payload.text); });
      ch.on("broadcast", {event: "bye"}, function(m){ if (L.role === "watch") { status((L.leader || "The sharer") + " stopped sharing"); } });
      L.ch = ch; L.client = c;
      ch.subscribe(function(st){
        if (st === "SUBSCRIBED") { L.joined = true; if (role === "lead") startLead(); else { startWatch(); send("hello", {name: L.name}); } status(role === "lead" ? "Sharing. Others join with code " + fmt(code) : "Connected. Waiting for the screen…"); }
        else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") status("Could not connect (" + st + "). Check the internet connection and try again.");
      });
      try { history.replaceState(null, "", location.pathname + "?" + (role === "lead" ? "share=" : "watch=") + code); } catch (e) {}
    } catch (e) { status("Could not start: " + (e.message || e)); }
  }
  async function leave(quiet){
    if (L.role === "lead") send("bye", {});
    clearTimeout(L.timer); if (L.obs) { L.obs.disconnect(); L.obs = null; }
    if (L.ch) { try { await L.client.removeChannel(L.ch); } catch (e) {} }
    L.ch = null; L.role = ""; L.joined = false; hideMirror();
    if (!quiet) { try { history.replaceState(null, "", location.pathname); } catch (e) {} bar(); }
  }
  function fmt(c){ return c.slice(0, 4) + "-" + c.slice(4); }

  // ---------- controls in the test bar ----------
  function bar(){
    var host = $("lvBox"); if (!host) return;
    var link = location.origin + location.pathname + "?watch=" + L.code;
    if (L.role === "lead") host.innerHTML = '<span>Sharing your screen · code <b>' + fmt(L.code) + '</b></span><button type="button" id="lvCopy">Copy link</button><button type="button" id="lvStop">Stop sharing</button><span id="lvStatus"></span>';
    else if (L.role === "watch") host.innerHTML = '<span>Watching <b id="lvWho">' + (L.leader || "…") + '</b> · code ' + fmt(L.code) + '</span><button type="button" id="lvTake">Share mine instead</button><button type="button" id="lvStop">Stop watching</button><span id="lvStatus"></span>';
    else host.innerHTML = '<button type="button" id="lvShare">Live training: share my screen</button><input id="lvCode" placeholder="Code" aria-label="Session code" maxlength="9" style="width:90px;font:inherit;font-size:12px;padding:3px 6px;border:1px solid #fff;background:transparent;color:#fff;border-radius:4px;text-transform:uppercase"><button type="button" id="lvWatch">Watch</button><span id="lvStatus"></span>';
    var on = function(id, f){ var e = $(id); if (e) e.onclick = f; };
    on("lvShare", function(){ join(newCode(), "lead"); });
    on("lvWatch", function(){ var c = (($("lvCode") || {}).value || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); if (c.length !== 8) { status("Enter the 8-letter code"); return; } join(c, "watch"); });
    on("lvStop", function(){ leave(false); });
    on("lvTake", function(){ send("take", {}); startLead(); });
    on("lvCopy", async function(){ try { await navigator.clipboard.writeText(link); status("Link copied: send it to the person you train"); } catch (e) { status(link); } });
  }
  document.addEventListener("DOMContentLoaded", function(){
    var tb = $("testBar"); if (!tb) return;
    var box = document.createElement("span"); box.id = "lvBox"; box.style.cssText = "display:inline-flex;flex-wrap:wrap;gap:8px;align-items:center;margin-left:auto";
    tb.appendChild(box);
    L.name = NAMES[window.__TEST_AS] || "Test user";
    bar();
    document.addEventListener("mousemove", onMove, true); document.addEventListener("click", onClick, true);
    document.addEventListener("input", schedule, true); document.addEventListener("change", schedule, true);
    addEventListener("scroll", onScroll, {passive: true}); addEventListener("resize", function(){ onResize(); if (L.role === "watch" && L.frame) geo(parseFloat(L.frame.style.width) || innerWidth, parseFloat(L.frame.style.height) || innerHeight); });
    addEventListener("pagehide", function(){ if (L.role === "lead") send("bye", {}); });
    setInterval(function(){ if (L.role === "lead") push(true); }, 5000);
    var q = new URLSearchParams(location.search), w = (q.get("watch") || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), s = (q.get("share") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (w.length === 8) join(w, "watch"); else if (s.length === 8) join(s, "lead");
  });
  window.__live = L;
})();
