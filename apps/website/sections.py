"""Photo breaks, the "What every trip includes" row and the lighter background (Morten, 21 Oct 2026: "go live").

From the NUORI page-break example: full-width photos with one line, a row of three squares, white space.
The page itself is drawn by the design runtime, so the new parts are added by a small script after each
section it belongs to, in the page's own language. Photos: images/break-1, why-photo (moved here from
Why Archē), break-3, trio-1..3 (iStock, licensed 20 and 21 Oct 2026).
"""

# one tone lighter; muted text and accents lifted so every text colour keeps at least 4.5:1
TONE = {
    "#34373d": "#3b3f46", "#2c2f34": "#33363c", "#464a52": "#4d5159", "#2b2e33": "#31343a",
    "#a3a9b1": "#b1b6bd", "#8fa6c0": "#9db2ca",
    "rgb(52, 55, 61)": "rgb(59, 63, 70)", "rgba(52,55,61": "rgba(59,63,70", "rgba(52, 55, 61": "rgba(59, 63, 70",
    "rgb(43, 46, 51)": "rgb(49, 52, 58)", "rgba(43,46,51": "rgba(49,52,58", "rgba(43, 46, 51": "rgba(49, 52, 58",
}


def tone(s):
    for a, b in TONE.items():
        s = s.replace(a, b).replace(a.upper(), b)
    return s


TEXT = {
    "en": {"b1": "Your schedule. Your aircraft.", "b2": "Every detail, arranged.", "b3": "One call. Any hour.", "k": "What every trip includes",
           "t1": "Vetted operators", "s1": "Certificates, safety audits and a sanctions check before every booking.",
           "t2": "One fixed price", "s2": "Agreed before you fly and paid through a secure payment link.",
           "t3": "A 24/7 desk", "s3": "One team that answers at any hour, wherever you are."},
    "th": {"b1": "ตารางเวลาของคุณ เครื่องบินของคุณ", "b2": "ทุกรายละเอียด จัดการให้พร้อม", "b3": "โทรครั้งเดียว ได้ทุกเวลา", "k": "สิ่งที่รวมอยู่ในทุกเที่ยวบิน",
           "t1": "ผู้ให้บริการที่ผ่านการตรวจสอบ", "s1": "ตรวจใบรับรอง ผลการตรวจสอบความปลอดภัย และรายชื่อมาตรการคว่ำบาตร ก่อนการจองทุกครั้ง",
           "t2": "ราคาเดียวที่ตกลงไว้", "s2": "ตกลงราคาก่อนบิน และชำระเงินผ่านลิงก์ชำระเงินที่ปลอดภัย",
           "t3": "ทีมงานพร้อมดูแล 24/7", "s3": "ทีมเดียวที่พร้อมตอบทุกเวลา ไม่ว่าคุณจะอยู่ที่ใด"},
    "zh": {"b1": "您的行程，您的专机。", "b2": "每一处细节，皆已妥帖安排。", "b3": "一个电话，随时待命。", "k": "每次行程均包含",
           "t1": "经审核的运营商", "s1": "每次预订前，核查运营资质、安全审计及制裁名单。",
           "t2": "一口价", "s2": "起飞前确定价格，并通过安全支付链接付款。",
           "t3": "全天候服务台", "s3": "无论您身在何处，同一团队随时为您回应。"},
    "ja": {"b1": "あなたの予定に、あなたの機体を。", "b2": "細部まで、すべて手配済み。", "b3": "一本の電話で、いつでも。", "k": "すべてのフライトに含まれるもの",
           "t1": "審査済みの運航会社", "s1": "ご予約のたびに、運航証明、安全監査、制裁リストを確認します。",
           "t2": "確定した一つの料金", "s2": "ご搭乗前に料金を確定し、安全な決済リンクでお支払いいただけます。",
           "t3": "24時間対応デスク", "s3": "どこにいても、いつでも同じチームが対応します。"},
}

CSS = """<style id="arche-breaks-css">
.ar-band{position:relative;height:min(74vh,700px);background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ar-band::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(24,26,30,.30) 0%,rgba(24,26,30,.52) 55%,rgba(24,26,30,.62) 100%)}
.ar-band p{position:relative;margin:0;padding:0 24px;text-align:center;font-family:'Cinzel',serif;font-weight:500;color:#f3f5f8;font-size:clamp(19px,2.5vw,34px);letter-spacing:.32em !important;line-height:1.5;text-transform:uppercase;text-shadow:0 2px 18px rgba(0,0,0,.35)}
html:is(:lang(th),:lang(zh),:lang(ja)) .ar-band p{font-family:var(--serif,'Prata'),'Noto Sans Thai','Noto Sans SC','Noto Sans JP',serif;letter-spacing:.14em !important;text-transform:none}
@media (min-width:1025px) and (prefers-reduced-motion:no-preference){.ar-band{background-attachment:fixed}}
@media (max-width:760px){.ar-band{height:56vh}.ar-band p{letter-spacing:.2em !important;font-size:18px}}
.ar-trio{max-width:1440px;margin:0 auto;padding:0 40px 140px;box-sizing:border-box}
.ar-trio .ar-k{font-size:12.5px;letter-spacing:.16em !important;text-transform:uppercase;color:#a9bdd4;margin:0 0 28px}
.ar-trio .ar-g{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.ar-trio figure{margin:0}
.ar-trio .ar-img{aspect-ratio:1/1;background-size:cover;background-position:center}
.ar-trio figcaption{padding-top:18px}
.ar-trio figcaption b{display:block;font-family:var(--serif,'Prata'),Georgia,serif;font-weight:400;font-size:22px;color:#f3f5f8;margin-bottom:6px}
.ar-trio figcaption span{font-size:15px;color:#c6cbd2}
@media (max-width:760px){.ar-trio{padding:0 16px 96px}.ar-trio .ar-g{grid-template-columns:1fr;gap:36px}}
div:has(> #why-photo), .ar-moved{display:none !important}
</style>
"""

JS = """<script id="arche-breaks-js">
(function(){
  var T = %s;
  var L = (document.documentElement.lang || "en").slice(0, 2); var t = T[L] || T.en;
  var BANDS = [["services", "after", "img/break-1.webp", "b1"], ["journey", "before", "img/why-photo.webp", "b2"], ["contact", "before", "img/break-3.webp", "b3"]];
  function el(h){ var d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstChild; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function band(b){ var n = el('<div class="ar-band" role="img" aria-label="' + esc(t[b[3]]) + '"><p>' + esc(t[b[3]]) + '</p></div>'); n.style.backgroundImage = "url('" + b[2] + "')"; n.setAttribute("data-ar", b[0]); return n; }
  function trio(){ var it = [["img/trio-1.webp", "t1", "s1"], ["img/trio-2.webp", "t2", "s2"], ["img/trio-3.webp", "t3", "s3"]];
    return el('<section class="ar-trio" data-ar="why" aria-label="' + esc(t.k) + '"><p class="ar-k">' + esc(t.k) + '</p><div class="ar-g">' + it.map(function(x){
      return '<figure><div class="ar-img" role="img" aria-label="' + esc(t[x[1]]) + '" style="background-image:url(\\'' + x[0] + '\\')"></div><figcaption><b>' + esc(t[x[1]]) + '</b><span>' + esc(t[x[2]]) + '</span></figcaption></figure>'; }).join("") + '</div></section>'); }
  function place(){
    BANDS.forEach(function(b){ document.querySelectorAll('[id="' + b[0] + '"]').forEach(function(ref){
      var nb = b[1] === "after" ? ref.nextElementSibling : ref.previousElementSibling;
      if (nb && nb.getAttribute("data-ar") === b[0]) return;
      ref.parentNode.insertBefore(band(b), b[1] === "after" ? ref.nextSibling : ref); }); });
    document.querySelectorAll('[id="why"]').forEach(function(ref){ var nb = ref.nextElementSibling; if (!(nb && nb.getAttribute("data-ar") === "why")) ref.parentNode.insertBefore(trio(), ref.nextSibling); });
    document.querySelectorAll('[id="why-photo"]').forEach(function(w){ if (w.parentNode) w.parentNode.classList.add("ar-moved"); });
  }
  var busy = false;
  new MutationObserver(function(){ if (busy) return; busy = true; requestAnimationFrame(function(){ place(); busy = false; }); }).observe(document.documentElement, {childList:true, subtree:true});
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", place); else place();
})();
</script>
"""


def apply(s):
    """Add the breaks and the row of three, and lighten the background, in the page HTML."""
    import json
    assert "</head>" in s and "</body>" in s
    s = tone(s)
    s = s.replace("</head>", CSS + "</head>", 1)
    i = s.rindex("</body>")
    return s[:i] + (JS % json.dumps(TEXT, ensure_ascii=False)) + s[i:]
