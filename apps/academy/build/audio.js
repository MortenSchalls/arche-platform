/* ---------- audio: reads any screen aloud with the device's own voice, written out as natural speech ---------- */
const AUDIO = (() => {
  const AKEY = "arche-cbt-audio-v2";
  const synth = window.speechSynthesis, can = !!(synth && window.SpeechSynthesisUtterance);
  let cfg = {on:false, rate:1, voice:"", auto:true};
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(AKEY)) || {}); } catch(e) {}
  const keep = () => { try { localStorage.setItem(AKEY, JSON.stringify(cfg)); } catch(e) {} };
  let items = [], idx = 0, playing = false, single = false, token = 0, cur = null;
  const btn = $("audioBtn"), dock = $("dock");
  const SEL = "#view h1, #view h2, #view h3, #view p:not(.eyebrow):not(.code), #view li, #view tbody tr, #view .doc, #view .opt, #view .fb, #view .issue, #view .res .it, #view .box, #view .reg summary, #view [data-say]";

  /* words a voice already says well; other 3-5 letter capitals are spelled out */
  const SAYABLE = new Set("EASA NATA ATOL ICAO IATA NBAA CAAS CAAT EBAA SIAC ARGUS OFAC FAA CAA UN EU UK US KYC PEP PEPS AOC FBO UTC GST VAT APD TCO PDPA SKY NOTAM IS-BAO OPSGROUP AML MAS".split(" "));
  const spell = w => w.split("").join(" ");
  function speakable(raw, kind){
    let t = " " + String(raw||"").replace(/\s+/g," ") + " ";
    if (kind === "h") t = t.replace(/^\s*\d+(\.\d+)*[A-Z]?\s+/, " ");                 // "2.4 Flights…" -> "Flights…"
    t = t.replace(/[↗›‹✕"“”]/g, "").replace(/…/g, ".");
    t = t.replace(/\be\.g\.,?/gi, "for example").replace(/\bi\.e\.,?/gi, "that is").replace(/\betc\./gi, "and so on").replace(/\bvs\.?\b/gi, "versus");
    t = t.replace(/\bUSD\s?([\d,]+(\.\d+)?)/g, "$1 US dollars").replace(/\bUSD\b/g, "US dollars");
    t = t.replace(/(\d)\s?%/g, "$1 percent").replace(/÷/g, " divided by ").replace(/(\d)\s?×/g, "$1 times").replace(/×/g, " times ");
    t = t.replace(/UTC\s?\+\s?(\d+)/g, "UTC plus $1").replace(/(\d\d:\d\d)Z\b/g, "$1 Zulu").replace(/\+/g, " plus ").replace(/&/g, " and ");
    t = t.replace(/\b([A-Z0-9]{1,2})-([A-Z0-9]{3,5})\b/g, (m,a,b) => /^\d+$/.test(a+b) ? m : spell(a) + ", " + spell(b));   // HB-JXA
    t = t.replace(/\b([A-Za-z]+)[.-](\w+)[.-](\d+)\b/g, (m,a,b,c) => a + " " + b + " " + spell(c));                       // CH.AOC.1042, KYC-2026-0147
    t = t.replace(/\b[A-Z]{3,5}\b/g, w => SAYABLE.has(w) ? w : (/^[A-Z]{4}$/.test(w) || /^[A-Z]{3}$/.test(w) && !/[AEIOU]/.test(w)) ? spell(w) : w);
    t = t.replace(/([A-Za-z0-9])\s?[–—]\s?([A-Za-z0-9])/g, (m,a,b) => a + " to " + b);    // WSSS–VTBD, Bangkok – Phuket
    t = t.replace(/\s\/\s|\//g, " or ").replace(/·/g, ", ").replace(/;/g, ",").replace(/(\D):|:(\D)/g, "$1,$2").replace(/[()]/g, ", ");
    t = t.replace(/\s+,/g, ",").replace(/,(\s*,)+/g, ",").replace(/,\s*\./g, ".").replace(/\.\s*\./g, ".").replace(/\s+/g, " ").trim().replace(/^,\s*/, "");
    if (t && !/[.!?]$/.test(t)) t += ".";
    return t;
  }
  function textOf(el){
    if (el.dataset && el.dataset.say) return speakable(el.dataset.say);
    const tag = el.tagName;
    if (/^H[1-3]$/.test(tag) || tag === "SUMMARY") return speakable(el.textContent, "h");
    if (tag === "TR") {
      const tb = el.closest("table"), hs = tb ? [...tb.querySelectorAll("thead th")].map(h => h.textContent.trim().toLowerCase()) : [];
      const cells = [...el.children].map(c => c.textContent.trim());
      if (cells.length <= 2) return speakable(cells.filter(Boolean).join(". "));
      const [first, ...rest] = cells;
      return speakable(first + ". " + rest.map((c,i) => c ? (hs[i+1] ? hs[i+1] + ", " + c : c) : "").filter(Boolean).join(". "));
    }
    if (el.classList.contains("opt")) {
      const k = el.querySelector(".k"), body = [...el.children].filter(n => n !== k).map(n => n.textContent).join(" ") || el.textContent;
      return (k ? k.textContent.trim().toUpperCase() + ". " : "") + speakable(body);
    }
    if (el.classList.contains("it")) {
      const ok = el.classList.contains("pass"), b = el.querySelector("b"), tag2 = el.querySelector(".tag"), rest = el.lastElementChild;
      if (ok) return speakable(b.textContent) .replace(/\.$/, "") + ", correct.";
      const why = rest ? [...rest.childNodes].filter(n => n !== b && n !== tag2).map(n => n.textContent).join(" ") : "";
      return "To fix, " + (tag2 ? tag2.textContent.toLowerCase() + ". " : "") + speakable(b.textContent + ". " + why);
    }
    return speakable(el.textContent);
  }
  function collect(root){
    const all = [...document.querySelectorAll(SEL)].filter(el => !el.closest(".links") && !el.closest("[hidden]") && !el.closest("button.tile") && (!root || root.contains(el)));
    const top = all.filter(el => !all.some(o => o !== el && o.contains(el) && !o.matches("[data-say]")) || el.matches("[data-say]"));
    return top.filter(el => !top.some(o => o !== el && o.matches("[data-say]") && o.contains(el))).map(el => ({el, t:textOf(el)})).filter(x => x.t.replace(/[.,\s]/g,"").length > 1);
  }

  /* best voice: neural or enhanced English voices first */
  const rank = v => {
    let r = 0;
    if (/natural|neural|online|premium|enhanced|siri/i.test(v.name)) r -= 4;
    if (/google/i.test(v.name)) r -= 2;
    if (/compact|espeak|robot|novelty|bad news|bells|whisper|zarvox|trinoids|albert|bubbles|cellos|fred|junior|ralph|kathy|boing|bahh|hysterical|organ|superstar|wobble|jester|good news/i.test(v.name)) r += 10;
    if (/^en-(GB|US|AU|IE)/i.test(v.lang)) r -= 1;
    return r;
  };
  function voices(){ if (!can) return []; const vs = synth.getVoices(); const en = vs.filter(v => /^en/i.test(v.lang)); return (en.length ? en : vs).slice().sort((a,b) => rank(a) - rank(b) || a.name.localeCompare(b.name)); }
  function pickVoice(){ const vs = voices(); return vs.find(v => v.voiceURI === cfg.voice) || vs[0] || null; }
  function fillVoices(){
    const list = voices(), sel = $("aVoice"); if (!list.length) return;
    sel.innerHTML = list.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name.replace(/^Microsoft\s+/,"").replace(/\s+Online\s+\(Natural\)/," (natural)"))}</option>`).join("");
    if (!cfg.voice || !list.some(v => v.voiceURI === cfg.voice)) { cfg.voice = list[0].voiceURI; keep(); }
    sel.value = cfg.voice;
    $("aTip").hidden = rank(list[0]) <= -3;
  }
  function mark(el){ if (cur) cur.classList.remove("reading"); cur = el; if (el) { el.classList.add("reading"); const r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > window.innerHeight - 130) el.scrollIntoView({block:"center", behavior:"smooth"}); } }
  function setUI(){
    btn.setAttribute("aria-pressed", String(cfg.on)); btn.textContent = cfg.on ? "Audio on" : "Audio off";
    dock.hidden = !cfg.on; document.body.classList.toggle("audio-on", cfg.on);
    $("aPlay").textContent = playing ? "Pause" : "Play";
  }
  function stop(){ token++; playing = false; if (can) synth.cancel(); setUI(); }
  /* one utterance per paragraph; very long ones split at sentence ends into chunks of about 230 characters */
  function chunks(t){
    if (t.length <= 260) return [t];
    const out = []; let buf = "";
    (t.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [t]).forEach(s => { if ((buf + s).length > 230 && buf) { out.push(buf.trim()); buf = ""; } buf += s; });
    if (buf.trim()) out.push(buf.trim()); return out;
  }
  function speakFrom(i, one){
    if (!can) return; token++; const my = token; synth.cancel();
    if (one !== undefined) single = one;
    if (i >= items.length || (single && i !== idx && playing)) { playing = false; mark(null); $("aNow").textContent = single ? "Paused." : "End of this screen."; single = false; setUI(); return; }
    idx = Math.max(0, i); playing = true; setUI();
    const it = items[idx]; mark(it.el); $("aNow").textContent = it.el.textContent.replace(/\s+/g," ").trim();
    const parts = chunks(it.t); let p = 0;
    const next = () => {
      if (my !== token) return;
      if (p >= parts.length) { if (single) { playing = false; single = false; mark(null); $("aNow").textContent = "Press Play to continue."; setUI(); return; } setTimeout(() => { if (my === token) speakFrom(idx + 1); }, 220); return; }
      const u = new SpeechSynthesisUtterance(parts[p++]); const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
      u.rate = +cfg.rate || 1; u.pitch = 1;
      u.onend = next; u.onerror = e => { if (my === token && e.error !== "interrupted" && e.error !== "canceled") next(); };
      synth.speak(u);
    };
    next();
  }
  function screen(root){
    if (!cfg.on) return;
    mark(null); items = collect(root); idx = 0; single = false;
    if (cfg.auto) setTimeout(() => speakFrom(0, false), 200); else { stop(); $("aNow").textContent = "Press Play to listen to this screen."; }
  }
  function focus(el){
    if (!cfg.on || !el) return;
    const all = collect(); const k = all.findIndex(x => x.el === el || el.contains(x.el));
    items = all; idx = k < 0 ? 0 : k; speakFrom(idx, true);
  }
  if (!can) { btn.disabled = true; btn.textContent = "Audio unavailable"; btn.title = "This browser has no built-in voice. Try Chrome, Edge or Safari."; return {screen(){}, focus(){}, speakable}; }
  fillVoices(); if (synth.addEventListener) synth.addEventListener("voiceschanged", fillVoices); else synth.onvoiceschanged = fillVoices;
  $("aRate").value = String(cfg.rate); $("aAuto").checked = cfg.auto !== false;
  btn.onclick = () => { cfg.on = !cfg.on; keep(); setUI(); if (cfg.on) { fillVoices(); items = collect(); speakFrom(0, false); } else { stop(); mark(null); } };
  $("aPlay").onclick = () => { if (playing) { stop(); $("aNow").textContent = "Paused."; } else { if (!items.length) items = collect(); speakFrom(idx, false); } };
  $("aNext").onclick = () => { if (!items.length) items = collect(); speakFrom(Math.min(items.length - 1, idx + 1), false); };
  $("aPrev").onclick = () => { if (!items.length) items = collect(); speakFrom(Math.max(0, idx - 1), false); };
  $("aRate").onchange = e => { cfg.rate = +e.target.value; keep(); if (playing) speakFrom(idx); };
  $("aVoice").onchange = e => { cfg.voice = e.target.value; keep(); if (playing) speakFrom(idx); };
  $("aAuto").onchange = e => { cfg.auto = e.target.checked; keep(); };
  document.addEventListener("visibilitychange", () => { if (document.hidden && playing) stop(); });
  setUI();
  return {screen, focus, speakable};
})();

