"""Journey map on Destinations (Morten, 13 Nov 2026: "would it make any sense to use the interactive map we made for
Navoryx on Arche page?" ... "for the map, use the models we have in our aircraft interactive guide").

Archē's own map, built here from Archē's own data (severance rule: nothing is read from the Navoryx site):
- places: every city page, at its main airport (content/map_places.json, OurAirports, public domain)
- aircraft: the ten models of the aircraft guide, range and cruise speed from published sources (content/aircraft_perf.json)
- coastlines: Natural Earth 1:110m, public domain (content/world.json, tools/worldmap.mjs)
Tap where you start and where you go: the map draws the route around restricted airspace (routing.py, the Navoryx rules)
and shows the guide's aircraft that fly it nonstop or with one fuel stop, with an estimated flight time and one suggested
aircraft in the guide's green, with how it is calculated and the sources.
"Request a quote for this journey" opens the quote form with both places filled in. Places are those with a page only,
so nothing sanctioned can appear (the pages are already checked against content/excluded.json).
The map's city names are placed by the script and checked by tools/journey_test.js (no overlaps, at least 30 of 37
shown at 1440 and 390 px); the layout audit leaves the map box (.planner) to that test, as on the Navoryx site.
One script (site/journey.js) on one page, approved by Morten for this map (13 Nov 2026)."""
import os, re, json, html, datetime

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site"); C = os.path.join(HERE, "content")
PAGE = os.path.join(SITE, "destinations", "index.html")

def _d(iso):
    return datetime.date.fromisoformat(iso).strftime("%-d %B %Y")

def section(places, ac):
    srcs = "".join(f'<li>{html.escape(m["label"])}: range {m["range_nm"]:,} nm and {html.escape(m["basis"])}, <a href="{html.escape(m["source"][1])}" rel="noopener">{html.escape(m["source"][0])}</a>, checked {_d(m["source"][2])}; '
                   f'cabin {m["cabin_h"]:.2f} m high and {m["cabin_w"]:.2f} m wide, <a href="{html.escape(m["cabin_source"][1])}" rel="noopener">{html.escape(m["cabin_source"][0])}</a>, checked {_d(m["cabin_source"][2])}.</li>' for m in ac["models"])
    pl = places["source"]
    return f'''<!--ae:jm--><section class="jm" id="planner" aria-labelledby="jm-h">
<style>
.jm{{margin:8px 0 56px;padding:40px 0 0}}
.jm h2{{font:400 clamp(24px,3vw,34px)/1.2 Prata,Georgia,serif;color:var(--ink);margin:10px 0 10px}}
.jm .lead{{max-width:760px;margin:0 0 22px}}
.jm .map{{border:1px solid var(--line);background:rgba(243,245,248,.02);overflow-x:auto;-webkit-overflow-scrolling:touch}}
.jm .stage{{position:relative;min-width:100%}}
@media (max-width:900px){{.jm .stage{{width:1150px}}}}
.jm svg{{display:block;width:100%;height:auto;cursor:crosshair}}
.jm .lb{{position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;font:400 11px/1 Cinzel,serif;letter-spacing:.08em;text-transform:uppercase;color:#c6cbd2;background:rgba(36,38,43,.72);padding:3px 5px}}
.jm .lb.on{{color:#39ff8f}}
.jm .lb.hv{{color:#f3f5f8}}
.jm .coast{{fill:none;stroke:#a9bdd4;stroke-opacity:.45;stroke-width:.8;vector-effect:non-scaling-stroke}}
.jm .grat{{fill:none;stroke:#f3f5f8;stroke-opacity:.06;stroke-width:1;vector-effect:non-scaling-stroke}}
.jm .pt{{fill:#c6cbd2}}.jm .pt.hv{{fill:#f3f5f8}}.jm .pt.on{{fill:#39ff8f}}
.jm .ring{{fill:none;stroke:#39ff8f;stroke-width:1.5;vector-effect:non-scaling-stroke}}
.jm .route{{fill:none;stroke:#39ff8f;stroke-width:2.2;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 3px rgba(57,255,143,.55))}}
.jm .spark{{fill:#eafff3;filter:drop-shadow(0 0 4px #39ff8f)}}
.jm .hint{{font-size:14px;color:var(--muted);margin:10px 0 0}}
.jm .out{{margin:22px 0 0}}
.jm .out .r{{font:400 clamp(20px,2.4vw,26px)/1.3 Prata,Georgia,serif;color:var(--ink);margin:0}}
.jm .out .d{{margin:6px 0 16px;color:var(--text)}}
.jm table{{width:100%;border-collapse:collapse;font-size:15px}}
.jm th,.jm td{{text-align:left;padding:9px 10px 9px 0;border-bottom:1px solid var(--line);vertical-align:top}}
.jm th{{font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:400}}
.jm td.n{{white-space:nowrap}}.jm tr.best td{{color:#39ff8f}}.jm tr.best .cat{{color:#39ff8f;opacity:.8}}.jm .tag{{display:inline-block;margin-left:8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;border:1px solid #39ff8f;padding:2px 6px;vertical-align:2px}}.jm .cat{{display:block;font-size:13px;color:var(--muted)}}
.jm .acts{{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0 0}}
.jm .how{{margin:22px 0 0;font-size:14px;color:var(--muted)}}.jm .how summary{{cursor:pointer;color:var(--accent);letter-spacing:.14em;text-transform:uppercase;font-size:12.5px}}
.jm .how li{{margin:6px 0}}
</style>
<span class="eyebrow">Plan a journey</span>
<h2 id="jm-h">Which aircraft can fly it, and how long it takes</h2>
<p class="lead">Choose where you start and where you are going, on the map. You see the distance and, for ten example aircraft from our aircraft guide, whether each flies the journey nonstop and an estimate of the flight time. The examples are for reference only: we are not limited to them, and we find any aircraft type and model that fits your trip, upon availability.</p>
<div class="map planner" id="jm-map"></div>
<p class="hint" id="jm-hint">Tap where you start, then where you are going; a tap picks the nearest place. A third tap starts a new journey. On a phone, swipe the map sideways.</p>
<div class="out" id="jm-out" aria-live="polite"></div>
<details class="how" id="jm-how"><summary>How we calculate</summary>
<p>Distance is measured between the main airports of the two places along an approximate route that avoids airspace closed to aircraft registered in the EU, the UK, the US and Switzerland, and the conflict zones where the European Union Aviation Safety Agency's bulletins advise operators not to fly (checked 10 November 2026). An aircraft is shown as nonstop when that distance is within its published range: the maker's figure, flown in standard conditions with the reserves and load the maker states, which a full cabin, headwinds or a demanding airport can reduce. Otherwise it needs a fuel stop at a named airport (none in the Gulf while its bulletins apply), with each leg within 96% of the published range. Only aircraft that need no more than one fuel stop are shown. Flight time is the distance at the published cruise speed plus 24 minutes, and 1 hour 18 minutes for a fuel stop, in still air. The suggested aircraft needs the fewest stops and has the largest cabin (height by width) among the aircraft of the right size for the trip: light jets to super-midsize up to about three hours, super-midsize and heavy jets up to about six, heavy and ultra-long-range jets beyond. Each aircraft is shown by the variant its figures belong to. These are estimates for planning: the operator confirms the aircraft, the route and the time for your trip.</p>
<ul>{srcs}<li>Airport positions: <a href="{html.escape(pl[1])}" rel="noopener">{html.escape(pl[0])}</a>, read {_d(pl[2])}. Coastlines: Natural Earth (public domain).</li></ul>
</details>
<script src="/journey.js" defer></script>
</section><!--/ae:jm-->'''

JS = r"""(function(){
var D = __DATA__;
var W = D.world.width, H = D.world.height, C = D.world.centre, T = D.world.top;
var wrap = function(l){ var x = l - C; while (x < -180) x += 360; while (x > 180) x -= 360; return x; };
var P = function(lon, lat){ return [((wrap(lon) + 180) / 360) * W, ((T - lat) / 360) * W]; };
var R = Math.PI / 180, NM = 3440.065;
function gc(a, b){ var f1 = a.lat*R, f2 = b.lat*R, dl = (b.lon-a.lon)*R;
  var h = Math.sin((f2-f1)/2)*Math.sin((f2-f1)/2) + Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)*Math.sin(dl/2);
  return 2 * NM * Math.asin(Math.min(1, Math.sqrt(h))); }
function seg(a, b, out){ var f1=a[0]*R, l1=a[1]*R, f2=b[0]*R, l2=b[1]*R, d = gc({lat:a[0],lon:a[1]},{lat:b[0],lon:b[1]})/NM, n = Math.max(2, Math.ceil(d * NM / 60));
  for (var i = out.length ? 1 : 0; i <= n; i++){ var t = i/n, A = d ? Math.sin((1-t)*d)/Math.sin(d) : 1-t, B = d ? Math.sin(t*d)/Math.sin(d) : t;
    var x = A*Math.cos(f1)*Math.cos(l1) + B*Math.cos(f2)*Math.cos(l2), y = A*Math.cos(f1)*Math.sin(l1) + B*Math.cos(f2)*Math.sin(l2), z = A*Math.sin(f1) + B*Math.sin(f2);
    var lat = Math.atan2(z, Math.sqrt(x*x+y*y))/R, lon = Math.atan2(y, x)/R, q = P(lon, lat), prev = out[out.length - 1];
    out.push([q[0], q[1], !prev || Math.abs(wrap(lon) - prev[3]) > 180, wrap(lon)]); } }
function samples(pts){ var out = []; for (var i = 0; i + 1 < pts.length; i++) seg(pts[i], pts[i + 1], out); return out; }
function dOf(S, upto){ var s = ''; for (var i = 0; i < upto && i < S.length; i++) s += (S[i][2] ? 'M' : 'L') + S[i][0].toFixed(1) + ' ' + S[i][1].toFixed(1); return s; }
var ns = 'http://www.w3.org/2000/svg', el = function(n, a){ var e = document.createElementNS(ns, n); for (var k in a) e.setAttribute(k, a[k]); return e; };
var box = document.getElementById('jm-map'); if (!box) return;
var stage = document.createElement('div'); stage.className = 'stage'; box.appendChild(stage);
var svg = el('svg', {viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'World map of the places we have guides for. Tap where you start, then where you are going.'});
var g = ''; for (var lo = -180; lo < 180; lo += 30){ var x = ((lo + 180) / 360) * W; g += 'M' + x + ' 0V' + H; }
for (var la = 60; la >= -60; la -= 30){ var y = ((T - la) / 360) * W; if (y > 0 && y < H) g += 'M0 ' + y + 'H' + W; }
svg.appendChild(el('path', {d: g, 'class': 'grat'}));
svg.appendChild(el('path', {d: D.world.path, 'class': 'coast'}));
var route = el('path', {d: '', 'class': 'route'}); svg.appendChild(route);
var spark = el('circle', {r: 3.5, 'class': 'spark', cx: -10, cy: -10}); svg.appendChild(spark);
var rings = el('g', {}); svg.appendChild(rings);
var XY = D.places.map(function(p){ return P(p.lon, p.lat); });
D.places.forEach(function(p, i){ svg.appendChild(el('circle', {cx: XY[i][0], cy: XY[i][1], r: 3.2, 'class': 'pt', id: 'jm-p' + i})); });
stage.appendChild(svg);
var labels = D.places.map(function(p, i){ var d = document.createElement('span'); d.className = 'lb'; d.textContent = p.name; d.id = 'jm-l' + i; stage.appendChild(d); return d; });
var sel = [], out = document.getElementById('jm-out'), hv = -1;
// city names: placed where they touch no other name or point (crowded areas first), placed again when the width changes
function place(){ var w = svg.getBoundingClientRect().width; if (!w) return; var k = w / W, fs = w < 700 ? 10 : 11;
  var pts = XY.map(function(q){ return [q[0] * k, q[1] * k]; }), boxes = [], order = pts.map(function(_, i){ return i; });
  var crowd = function(i){ return pts.filter(function(q){ return Math.abs(q[0] - pts[i][0]) < 90 && Math.abs(q[1] - pts[i][1]) < 50; }).length; };
  order.sort(function(a, b){ return (sel.indexOf(b) >= 0) - (sel.indexOf(a) >= 0) || crowd(b) - crowd(a); });   // chosen places first, so their names always show
  var hitPt = function(r){ return pts.some(function(q){ return q[0] > r[0] - 4 && q[0] < r[2] + 4 && q[1] > r[1] - 4 && q[1] < r[3] + 4; }); };
  var hitBox = function(r){ return boxes.some(function(o){ return r[0] < o[2] + 2 && r[2] > o[0] - 2 && r[1] < o[3] + 2 && r[3] > o[1] - 2; }); };
  order.forEach(function(i){ var L = labels[i]; L.style.fontSize = fs + 'px'; L.style.display = '';
    var bw = L.offsetWidth, bh = L.offsetHeight, x = pts[i][0], y = pts[i][1], best = null;
    var cand = [[1,0],[-1,0],[0,-1],[0,1],[1,-1],[-1,-1],[1,1],[-1,1],[2,0],[-2,0],[0,-2],[0,2],[2,-1],[-2,-1],[2,1],[-2,1]];
    for (var c = 0; c < cand.length && !best; c++){ var dx = cand[c][0], dy = cand[c][1];
      var cx = x + dx * (bw / 2 + 7), cy = y + dy * (bh / 2 + 6);
      var r = [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2];
      if (r[0] < 2 || r[2] > w - 2 || r[1] < 2 || r[3] > w * H / W - 2) continue;
      if (!hitBox(r) && !hitPt(r)) best = [cx, cy, r]; }
    if (best){ boxes.push(best[2]); L.style.left = best[0] + 'px'; L.style.top = best[1] + 'px'; } else L.style.display = 'none'; });
}
var nearest = function(ev){ var r = svg.getBoundingClientRect(), k = r.width / W, mx = ev.clientX - r.left, my = ev.clientY - r.top, bi = -1, bd = 30;
  XY.forEach(function(q, i){ var d = Math.hypot(q[0] * k - mx, q[1] * k - my); if (d < bd){ bd = d; bi = i; } });
  labels.forEach(function(L, i){ var b = L.getBoundingClientRect(); if (L.style.display !== 'none' && ev.clientX >= b.left && ev.clientX <= b.right && ev.clientY >= b.top && ev.clientY <= b.bottom && bd > 8) bi = i; });
  return bi; };
svg.addEventListener('click', function(ev){ var i = nearest(ev); if (i >= 0) tap(i); });
svg.addEventListener('mousemove', function(ev){ var i = nearest(ev); if (i === hv) return; if (hv >= 0){ labels[hv].classList.remove('hv'); document.getElementById('jm-p' + hv).classList.remove('hv'); }
  hv = i; svg.style.cursor = i >= 0 ? 'pointer' : 'crosshair'; if (i >= 0){ labels[i].classList.add('hv'); document.getElementById('jm-p' + i).classList.add('hv'); } });
window.addEventListener('resize', function(){ clearTimeout(place.t); place.t = setTimeout(place, 120); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(place); place();
function tap(i){ if (sel.length >= 2) sel = []; if (sel.length === 1 && sel[0] === i) return; sel.push(i); draw(); }
window.__jmTap = tap;
var anim = 0;
function fly(S){ cancelAnimationFrame(anim);
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){ route.setAttribute('d', dOf(S, S.length)); spark.setAttribute('cx', -10); return; }
  var t0 = performance.now(), dur = 1800, n = S.length;
  var step = function(t){ var f = Math.min(1, (t - t0) / dur), e = 0.5 - Math.cos(Math.PI * f) / 2, x = e * (n - 1), k = Math.floor(x), r = x - k;
    var d = dOf(S, k + 1), a = S[k], b = S[Math.min(n - 1, k + 1)], hx = a[0], hy = a[1];
    if (b && !b[2]){ hx = a[0] + (b[0] - a[0]) * r; hy = a[1] + (b[1] - a[1]) * r; d += 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1); }
    route.setAttribute('d', d); spark.setAttribute('cx', hx); spark.setAttribute('cy', hy);   // the line follows the moving point
    if (f < 1) anim = requestAnimationFrame(step); else { route.setAttribute('d', dOf(S, n)); spark.setAttribute('cx', -10); } };
  anim = requestAnimationFrame(step); }
function hm(h){ var m = Math.round(h * 4) * 15, hh = Math.floor(m / 60), mm = m % 60; return 'about ' + hh + ' h' + (mm ? ' ' + mm + ' min' : ''); }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function draw(){
  rings.innerHTML = ''; document.querySelectorAll('.jm .pt.on').forEach(function(e){ e.classList.remove('on'); }); labels.forEach(function(L){ L.classList.remove('on'); });
  sel.forEach(function(i){ rings.appendChild(el('circle', {cx: XY[i][0], cy: XY[i][1], r: 7, 'class': 'ring'})); document.getElementById('jm-p' + i).classList.add('on'); labels[i].classList.add('on'); });
  place();
  if (sel.length < 2){ cancelAnimationFrame(anim); spark.setAttribute('cx', -10); route.setAttribute('d', ''); out.innerHTML = sel.length ? '<p class="d">From ' + esc(D.places[sel[0]].name) + '. Now choose where you are going.</p>' : ''; return; }
  var a = D.places[sel[0]], b = D.places[sel[1]], ia = D.rp.indexOf(a.path), ib = D.rp.indexOf(b.path), rev = ia > ib;
  var rt = D.routes[Math.min(ia, ib) + '|' + Math.max(ia, ib)], flip = function(ps){ return rev ? ps.slice().reverse() : ps; };
  var opts = D.ac.map(function(m){ var v = rt.v[String(m.range_nm)]; if (v === null || v === undefined) return null;   // more than one fuel stop: not shown
    var nm = v === 0 ? rt.r[0] : v[1], stop = v === 0 ? null : v[0];
    return {m: m, nm: nm, stop: stop, h: nm / m.kt + 0.4 + (stop ? 1.3 : 0), pts: flip(v === 0 ? rt.r[1] : v[3]), detour: v === 0 ? rt.r[2] : v[4]}; }).filter(Boolean);
  var t = rt.r ? rt.r[0] / 459 + 0.4 : 99, band = t <= 3 ? ['Light jet', 'Midsize jet', 'Super-midsize'] : t <= 6 ? ['Super-midsize', 'Heavy jet'] : ['Heavy jet', 'Ultra-long-range'];
  var big = function(x, y){ return y.m.cabin - x.m.cabin; }, non = opts.filter(function(o){ return !o.stop; });
  var best = non.filter(function(o){ return band.indexOf(o.m.cat) >= 0; }).sort(big)[0] || non.slice().sort(big)[0] || opts.slice().sort(function(x, y){ return x.h - y.h; })[0];
  opts.sort(function(x, y){ return (y === best) - (x === best) || (!!x.stop - !!y.stop) || x.h - y.h; });
  route.setAttribute('d', ''); fly(samples(best.pts));
  var mid = (XY[sel[0]][0] + XY[sel[1]][0]) / 2 / W; if (box.scrollWidth > box.clientWidth) box.scrollLeft = mid * box.scrollWidth - box.clientWidth / 2;
  var rows = opts.map(function(o){ var on = o === best;
    return '<tr' + (on ? ' class="best"' : '') + '><td>' + esc(o.m.name) + (on ? ' <span class="tag">Suggested</span>' : '') + '<span class="cat">' + esc(o.m.cat) + '</span></td><td>' + (o.stop ? 'One fuel stop, ' + esc(o.stop) : 'Nonstop') + '</td><td class="n">' + hm(o.h) + '</td></tr>'; }).join('');
  var nmS = Math.round(best.nm), km = Math.round(best.nm * 1.852);
  var q = '/?from=' + encodeURIComponent(a.name) + '&to=' + encodeURIComponent(b.name) + '#top';
  out.innerHTML = '<p class="r">' + esc(a.name) + ' to ' + esc(b.name) + '</p><p class="d">' + nmS.toLocaleString('en') + ' nm (' + km.toLocaleString('en') + ' km)' + (best.stop ? ' with a fuel stop in ' + esc(best.stop) : '') + (best.detour ? ', routed around restricted airspace' : '') + '. Suggested: ' + esc(best.m.name) + ', the largest cabin among the right-sized example aircraft that fly it ' + (best.stop ? 'with one fuel stop' : 'nonstop') + '.</p>' +
    '<p class="d">Example aircraft from our guide that fly it nonstop or with one fuel stop, for reference only. We are not limited to these types and models: we find whatever fits your trip, upon availability.</p>' +
    '<table><thead><tr><th scope="col">Aircraft</th><th scope="col">Nonstop or stops</th><th scope="col">Estimated time</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="acts"><a class="btn p" href="' + q + '">Request a quote for this journey</a><a class="btn" href="' + esc(a.path) + '">' + esc(a.name) + ' guide</a><a class="btn" href="' + esc(b.path) + '">' + esc(b.name) + ' guide</a></div>' +
    '<p class="hint">Estimates only; see How we calculate. Any aircraft, any route, upon availability.</p>';
}
})();
"""

def run():
    places = json.load(open(os.path.join(C, "map_places.json"), encoding="utf-8"))
    ac = json.load(open(os.path.join(C, "aircraft_perf.json"), encoding="utf-8"))
    world = json.load(open(os.path.join(C, "world.json"), encoding="utf-8"))
    routes = json.load(open(os.path.join(C, "routes.json"), encoding="utf-8"))   # tools/routes.py: the Navoryx routing rules, per aircraft
    import company
    pub = [p for p in places["places"] if not (company.LAUNCHED and p.get("draft"))]
    places = dict(places, places=pub)
    data = {"world": world, "places": [{k: p[k] for k in ("name", "path", "lat", "lon")} for p in pub],
            "ac": [{"name": m["label"], "cat": m["cat"], "range_nm": m["range_nm"], "kt": m["kt"], "cabin": round(m["cabin_h"] * m["cabin_w"], 3)} for m in ac["models"]],
            "rp": routes["places"], "routes": routes["routes"]}
    open(os.path.join(SITE, "journey.js"), "w", encoding="utf-8").write(JS.replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":"))))
    t = open(PAGE, encoding="utf-8").read()
    t = re.sub(r"<!--ae:jm-->.*?<!--/ae:jm-->", "", t, flags=re.S)
    anchor = '<main><div class="wrap">'
    assert t.count(anchor) == 1
    t = t.replace(anchor, anchor + section(places, ac), 1)
    open(PAGE, "w", encoding="utf-8").write(t)
    print("  journey map: Destinations,", len(pub), "places,", len(ac["models"]), "aircraft")

if __name__ == "__main__":
    run()
