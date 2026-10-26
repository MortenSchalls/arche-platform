/* Archē Executive website statistics (first-party, no cookies, no browser storage, no outside services).
   Records: the page, the site a visitor came from (host only), campaign tags (utm_*), an organisation link code (?r=),
   device type, which sections were seen and what was used (quote form, call, WhatsApp, email, language, aircraft finder).
   The server adds the country and city from the network and never stores the IP address. Privacy notice: "Website statistics". */
(function () {
  "use strict";
  if (navigator.webdriver || /bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl) return;
  var visit = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  var q = new URLSearchParams(location.search), utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(function (k) { var v = q.get(k); if (v) utm[k.slice(4)] = v.slice(0, 60); });
  var ref = "";
  try { var h = document.referrer ? new URL(document.referrer).hostname : ""; ref = h && h !== location.hostname ? h.replace(/^www\./, "") : ""; } catch (e) {}
  var base = {
    visit: visit, path: location.pathname.slice(0, 60), lang: (document.documentElement.lang || "").slice(0, 5),
    ref: ref.slice(0, 80), utm: utm, code: (q.get("r") || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 12),
    device: innerWidth < 700 ? "phone" : innerWidth < 1100 ? "tablet" : "desktop"
  };
  var start = Date.now(), sent = {};
  function send(kind, detail, once) {
    if (once) { if (sent[kind + (detail || "")]) return; sent[kind + (detail || "")] = 1; }
    var body = JSON.stringify(Object.assign({}, base, { kind: kind, detail: String(detail || "").slice(0, 60), secs: Math.round((Date.now() - start) / 1000) }));
    try { if (navigator.sendBeacon && navigator.sendBeacon("/api/collect", new Blob([body], { type: "application/json" }))) return; } catch (e) {}
    try { fetch("/api/collect", { method: "POST", headers: { "content-type": "application/json" }, body: body, keepalive: true }); } catch (e) {}
  }
  window.__archeVisit = visit;
  send("view");

  // sections seen (each once)
  function watch() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { send("section", e.target.id, true); io.unobserve(e.target); } });
    }, { rootMargin: "-45% 0px -45% 0px" });   // counted when the section crosses the middle of the screen
    ["services", "why", "fleet", "journey", "contact"].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }
  setTimeout(watch, 1500);

  // what was used
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a,button");
    if (!a) return;
    var href = a.getAttribute("href") || "", txt = (a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (/^tel:/.test(href)) send("call", "", true);
    else if (/wa\.me|whatsapp/i.test(href)) send("whatsapp", "", true);
    else if (/^mailto:/.test(href)) send("email", "", true);
    else if (/portal\.archeaviation\.com/.test(href)) send("portal", "", true);
    else if (/^(EN|ไทย|中文|日本語)$/.test(txt)) send("language", txt, true);
    else if (a.closest("#fleet")) send("finder", txt, true);
  }, true);
  document.addEventListener("focusin", function (ev) {
    var f = ev.target.closest && ev.target.closest("input,select,textarea");
    if (f && !f.closest("#contact")) send("quote_start", "", true);
    else if (f) send("callback_start", "", true);
  }, true);

  // enquiry sent through the site's own form: tie it to this visit, record the outcome
  var of = window.fetch;
  if (of) window.fetch = function (url, opt) {
    try {
      if (String(url).indexOf("/api/enquiry") !== -1 && opt && typeof opt.body === "string") {
        var b = JSON.parse(opt.body); b.visit = visit; if (base.code) b.code = base.code; opt = Object.assign({}, opt, { body: JSON.stringify(b) });
        return of.call(this, url, opt).then(function (r) { if (r && r.ok) send(b.type === "callback" ? "callback_sent" : "quote_sent", "", true); return r; });
      }
    } catch (e) {}
    return of.apply(this, arguments);
  };

  // time on page when leaving
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") send("leave", "", true); });
})();
