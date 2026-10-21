"""Builds site/preview.html: the live page plus the design ideas under review, for Morten to compare (21 Oct 2026).

Ideas (from the NUORI page-break example): full-width photo breaks with one line, a row of three squares
("What every trip includes"), and a background one tone lighter (Morten 21 Oct 2026: keep these; season line dropped).
A small panel at the bottom switches each idea on and off. Nothing here changes the live page.
English only for now; the lines get translated once the design is chosen.
Run after build.py:  python3 make_preview.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "site")

CSS = r"""
<style id="pv-css">
.pv-band{position:relative;height:min(74vh,700px);background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;overflow:hidden}
.pv-band::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(24,26,30,.30) 0%,rgba(24,26,30,.52) 55%,rgba(24,26,30,.62) 100%)}
.pv-band p{position:relative;margin:0;padding:0 24px;text-align:center;font-family:'Cinzel',serif;font-weight:500;color:#f3f5f8;font-size:clamp(19px,2.5vw,34px);letter-spacing:.32em !important;line-height:1.5;text-shadow:0 2px 18px rgba(0,0,0,.35)}
.pv-band small{display:block;margin-top:14px;font-family:'Hanken Grotesk',system-ui,sans-serif;font-size:13px;letter-spacing:.2em !important;color:#dfe6ee;text-transform:uppercase}
@media (min-width:1025px) and (prefers-reduced-motion:no-preference){.pv-band{background-attachment:fixed}}
@media (max-width:760px){.pv-band{height:56vh}.pv-band p{letter-spacing:.2em !important;font-size:18px}}
.pv-trio{max-width:1440px;margin:0 auto;padding:0 40px 140px;box-sizing:border-box}
.pv-trio .pv-k{font-size:12.5px;letter-spacing:.16em !important;text-transform:uppercase;color:#a9bdd4;margin:0 0 28px}
.pv-trio .pv-g{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.pv-trio figure{margin:0}
.pv-trio .pv-img{aspect-ratio:1/1;background-size:cover;background-position:center}
.pv-trio figcaption{padding-top:18px}
.pv-trio figcaption b{display:block;font-family:var(--serif,'Prata'),Georgia,serif;font-weight:400;font-size:22px;color:#f3f5f8;margin-bottom:6px}
.pv-trio figcaption span{font-size:15px;color:#c6cbd2}
@media (max-width:760px){.pv-trio{padding:0 16px 96px}.pv-trio .pv-g{grid-template-columns:1fr;gap:36px}}
.pv-season{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;padding:22px 16px;border-top:1px solid rgba(169,189,212,.25);border-bottom:1px solid rgba(169,189,212,.25);
  font-family:'Cinzel',serif;font-size:14px;letter-spacing:.28em !important;color:#dfe6ee;text-align:center}
.pv-season a{color:#a9bdd4;text-decoration:none;border-bottom:1px solid rgba(169,189,212,.5)}
#pv-panel{position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;margin:0 auto;max-width:720px;background:#1f2125;color:#f3f5f8;border:1px solid #676b71;
  font:500 13px/1.4 'Hanken Grotesk',system-ui,sans-serif;padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;box-shadow:0 8px 28px rgba(0,0,0,.45)}
#pv-panel b{letter-spacing:.12em !important;color:#f3c26b}
#pv-panel label{display:flex;gap:6px;align-items:center;cursor:pointer}
#pv-panel select{font:inherit;background:#2c2e33;color:#f3f5f8;border:1px solid #676b71;padding:2px 6px}
#pv-panel button{font:inherit;background:transparent;color:#f3f5f8;border:1px solid #676b71;padding:2px 8px;cursor:pointer}
#pv-panel.min > :not(.pv-keep){display:none}
body.pv-off-bands .pv-band, body.pv-off-trio .pv-trio{display:none}
body:not(.pv-off-bands) .pv-moved{display:none !important}
.pv-ph{background:repeating-linear-gradient(135deg,#454951 0 14px,#4a4e56 14px 28px) !important;display:flex;align-items:center;justify-content:center;text-align:center}
.pv-ph small{display:block;max-width:80%;margin:12px auto 0;font:500 13px/1.5 'Hanken Grotesk',system-ui,sans-serif;letter-spacing:.06em !important;text-transform:none;color:#f3c26b}
.pv-trio .pv-ph small{margin:0 auto}
</style>
"""

JS = r"""
<script id="pv-js">
(function(){
  var BANDS = [
    {after:"services", img:"img/break-1.webp", line:"Your schedule. Your aircraft.", note:"New photo 1: wing above clouds at dawn (wide)"},
    {before:"journey", img:"img/why-photo.webp", line:"Every detail, arranged.", note:"Our cabin photo, moved here from Why Archē (no longer shown there)"},
    {before:"contact", img:"img/break-3.webp", line:"One call. Any hour.", note:"New photo 2: business jet on the apron at night, cabin lights on (wide)"}];
  var TRIO = [
    {img:"img/trio-1.webp", t:"Vetted operators", s:"Certificates, safety audits and a sanctions check before every booking.", note:"New photo 3: pilot's walk-around inspection or cockpit pre-flight check (square)"},
    {img:"img/trio-2.webp", t:"One fixed price", s:"Agreed before you fly and paid securely through Paynode.", note:"New photo 4: quiet detail, e.g. cabin table with a tablet or a signed document (square)"},
    {img:"img/trio-3.webp", t:"A 24/7 desk", s:"One team that answers at any hour, wherever you are.", note:"New photo 5: phone call at night, city or airport lights behind (square)"}];
  /* background tones: current charcoal and two lighter steps; muted text lifted so it keeps 4.5:1 */
  var TONES = {
    current: {},
    lighter: {"#34373d":"#3b3f46","#2c2f34":"#33363c","#464a52":"#4d5159","#2b2e33":"#31343a","#a3a9b1":"#b1b6bd","#8fa6c0":"#9db2ca"},
    lightest:{"#34373d":"#42464e","#2c2f34":"#393c42","#464a52":"#545860","#2b2e33":"#373a40","#a3a9b1":"#bdc2c8","#8fa6c0":"#a9bdd4"}};
  var tone = "lighter";
  function el(h){ var d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstChild; }
  function band(b){ var n = el('<div class="pv-band' + (b.img ? '' : ' pv-ph') + '" role="img" aria-label="' + b.line + '"><p>' + b.line.toUpperCase() + (b.img ? '' : '<small>' + b.note + '</small>') + '</p></div>'); if (b.img) n.style.backgroundImage = "url('" + b.img + "')"; return n; }
  function trio(){ return el('<section class="pv-trio" aria-label="What every trip includes"><p class="pv-k">What every trip includes</p><div class="pv-g">' +
    TRIO.map(function(x){ return '<figure><div class="pv-img' + (x.img ? '' : ' pv-ph') + '"' + (x.img ? ' style="background-image:url(\'' + x.img + '\')"' : '') + '>' + (x.img ? '' : '<small>' + x.note + '</small>') + '</div><figcaption><b>' + x.t + '</b><span>' + x.s + '</span></figcaption></figure>'; }).join("") + '</div></section>'); }
  function season(){ return el('<div class="pv-season">WINTER SEASON <span aria-hidden="true">·</span> NISEKO <span aria-hidden="true">·</span> THE MALDIVES <span aria-hidden="true">·</span> <a href="#contact">PLAN YOUR TRIP</a></div>'); }
  function place(){
    BANDS.forEach(function(b, i){
      if (document.querySelector('.pv-band[data-i="' + i + '"]')) return;
      var ref = document.getElementById(b.after || b.before); if (!ref) return;
      var n = band(b); n.dataset.i = i; ref.parentNode.insertBefore(n, b.after ? ref.nextSibling : ref);
    });
    if (!document.querySelector(".pv-trio")) { var w = document.getElementById("why"); if (w) w.parentNode.insertBefore(trio(), w.nextSibling); }
    var wp = document.getElementById("why-photo"); if (wp && wp.parentNode && !wp.parentNode.classList.contains("pv-moved")) wp.parentNode.classList.add("pv-moved");
    paint();
  }
  function paint(){
    var map = TONES[tone];
    document.querySelectorAll("[style]").forEach(function(n){
      if (n.closest("#pv-panel")) return;
      if (!n.hasAttribute("data-pv-orig")) n.setAttribute("data-pv-orig", n.getAttribute("style"));
      var s = n.getAttribute("data-pv-orig");
      for (var k in map) s = s.split(k).join(map[k]);
      if (n.getAttribute("style") !== s) n.setAttribute("style", s);
    });
    document.body.style.background = map["#34373d"] || "";
  }
  var busy = false;
  new MutationObserver(function(){ if (busy) return; busy = true; requestAnimationFrame(function(){ place(); busy = false; }); }).observe(document.documentElement, {childList:true, subtree:true});
  function panel(){
    var p = el('<div id="pv-panel" role="region" aria-label="Preview controls"><b class="pv-keep">PREVIEW</b>' +
      '<label><input type="checkbox" data-pv="bands" checked> Photo breaks</label>' +
      '<label><input type="checkbox" data-pv="trio" checked> Row of three</label>' +
      '<label>Background <select id="pv-tone"><option value="lighter">One tone lighter</option><option value="current">Current charcoal</option></select></label>' +
      '<button type="button" class="pv-keep" id="pv-min">Hide</button></div>');
    document.body.appendChild(p);
    p.addEventListener("change", function(e){
      var k = e.target.dataset.pv; if (k) document.body.classList.toggle("pv-off-" + k, !e.target.checked);
      if (e.target.id === "pv-tone") { tone = e.target.value; paint(); }
    });
    document.getElementById("pv-min").onclick = function(){ p.classList.toggle("min"); this.textContent = p.classList.contains("min") ? "Show" : "Hide"; };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function(){ panel(); place(); }); else { panel(); place(); }
})();
</script>
"""


def build():
    s = open(os.path.join(OUT, "index.html"), encoding="utf-8").read()
    s = s.replace('<link rel="canonical" href="https://archeaviation.com/">', '<meta name="robots" content="noindex,nofollow">', 1)
    assert "</head>" in s and "</body>" in s
    # new How-it-works step 1 photo: the preview reads the photo list with journey-1 pointing at the new file
    swap = ("<script>(function(){var f=window.fetch;window.fetch=function(u,o){return f.apply(this,arguments).then(function(r){"
            "if(String(u).indexOf('image-slots.state.json')<0)return r;return r.clone().json().then(function(j){if(j&&j['journey-1'])j['journey-1'].u='img/journey-1-new.webp';"
            "return new Response(JSON.stringify(j),{headers:{'content-type':'application/json'}});}).catch(function(){return r;});});};})();</script>")
    s = s.replace("</head>", swap + CSS + "</head>", 1)
    i = s.rindex("</body>")
    s = s[:i] + JS + s[i:]
    open(os.path.join(OUT, "preview.html"), "w", encoding="utf-8").write(s)
    print("preview written", len(s))


if __name__ == "__main__":
    build()
