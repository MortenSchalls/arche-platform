"""Journey map on Destinations (Morten, 13 Nov 2026: "would it make any sense to use the interactive map we made for
Navoryx on Arche page?" ... "for the map, use the models we have in our aircraft interactive guide").

Archē's own map, built here from Archē's own data (severance rule: nothing is read from the Navoryx site):
- places: every city page, at its main airport (content/map_places.json, OurAirports, public domain)
- aircraft: the ten models of the aircraft guide, range and cruise speed from published sources (content/aircraft_perf.json)
- coastlines: Natural Earth 1:110m, public domain (content/world.json, tools/worldmap.mjs)
Tap or choose where you start and where you go: the map draws the great-circle route and shows, for each aircraft in the
guide, whether it flies the distance nonstop and an estimated flight time, with how it is calculated and the sources.
"Request a quote for this journey" opens the quote form with both places filled in. Places are those with a page only,
so nothing sanctioned can appear (the pages are already checked against content/excluded.json).
One script (site/journey.js) on one page, approved by Morten for this map (13 Nov 2026)."""
import os, re, json, html, datetime

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, "site"); C = os.path.join(HERE, "content")
PAGE = os.path.join(SITE, "destinations", "index.html")

def _d(iso):
    return datetime.date.fromisoformat(iso).strftime("%-d %B %Y")

def section(places, ac):
    srcs = "".join(f'<li><a href="{html.escape(m["source"][1])}" rel="noopener">{html.escape(m["source"][0])}</a>: {html.escape(m["name"])}, '
                   f'{m["range_nm"]:,} nm, {html.escape(m["basis"])}. Checked {_d(m["source"][2])}.</li>' for m in ac["models"])
    pl = places["source"]
    opts = "".join(f'<option value="{i}">{html.escape(p["name"])}</option>' for i, p in sorted(enumerate(places["places"]), key=lambda x: x[1]["name"]))
    return f'''<!--ae:jm--><section class="jm" id="planner" aria-labelledby="jm-h">
<style>
.jm{{margin:8px 0 56px;padding:40px 0 0}}
.jm h2{{font:400 clamp(24px,3vw,34px)/1.2 Prata,Georgia,serif;color:var(--ink);margin:10px 0 10px}}
.jm .lead{{max-width:760px;margin:0 0 22px}}
.jm .pick{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px 24px;max-width:760px;margin:0 0 18px}}
.jm label{{display:flex;flex-direction:column;gap:6px;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}}
.jm select{{font:400 16px/1.4 'Hanken Grotesk',system-ui,sans-serif;color:var(--ink);background:rgba(243,245,248,.04);border:1px solid var(--line);padding:10px 12px;letter-spacing:0;text-transform:none}}
.jm select option{{color:#f3f5f8;background:#3b3f46}}
.jm .map{{position:relative;border:1px solid var(--line);background:rgba(243,245,248,.02);overflow-x:auto;-webkit-overflow-scrolling:touch}}
@media (max-width:760px){{.jm svg{{min-width:760px}}}}
.jm svg{{display:block;width:100%;height:auto}}
.jm .coast{{fill:none;stroke:#a9bdd4;stroke-opacity:.45;stroke-width:.8;vector-effect:non-scaling-stroke}}
.jm .grat{{fill:none;stroke:#f3f5f8;stroke-opacity:.06;stroke-width:1;vector-effect:non-scaling-stroke}}
.jm .pt{{fill:#c6cbd2}}.jm .pt.on{{fill:#f3f5f8}}
.jm .hit{{fill:transparent;cursor:pointer}}.jm .hit:focus{{outline:none}}.jm .hit:focus+.pt{{fill:#f3f5f8}}
.jm .ring{{fill:none;stroke:#f3f5f8;stroke-width:1.5;vector-effect:non-scaling-stroke}}
.jm .route{{fill:none;stroke:#f3f5f8;stroke-width:2;vector-effect:non-scaling-stroke}}
.jm .hint{{font-size:14px;color:var(--muted);margin:10px 0 0}}
.jm .out{{margin:22px 0 0}}
.jm .out .r{{font:400 clamp(20px,2.4vw,26px)/1.3 Prata,Georgia,serif;color:var(--ink);margin:0}}
.jm .out .d{{margin:6px 0 16px;color:var(--text)}}
.jm table{{width:100%;border-collapse:collapse;font-size:15px}}
.jm th,.jm td{{text-align:left;padding:9px 10px 9px 0;border-bottom:1px solid var(--line);vertical-align:top}}
.jm th{{font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:400}}
.jm td.n{{white-space:nowrap}}.jm .cat{{display:block;font-size:13px;color:var(--muted)}}
.jm .acts{{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0 0}}
.jm .how{{margin:22px 0 0;font-size:14px;color:var(--muted)}}.jm .how summary{{cursor:pointer;color:var(--accent);letter-spacing:.14em;text-transform:uppercase;font-size:12.5px}}
.jm .how li{{margin:6px 0}}
</style>
<span class="eyebrow">Plan a journey</span>
<h2 id="jm-h">Which aircraft can fly it, and how long it takes</h2>
<p class="lead">Choose where you start and where you are going, on the map or in the lists. You see the distance and, for each aircraft in our aircraft guide, whether it flies the journey nonstop and an estimate of the flight time.</p>
<div class="pick"><label for="jm-a">From<select id="jm-a"><option value="">Choose a place</option>{opts}</select></label>
<label for="jm-b">To<select id="jm-b"><option value="">Choose a place</option>{opts}</select></label></div>
<div class="map" id="jm-map"></div>
<p class="hint" id="jm-hint">Tap where you start, then where you are going. A third tap starts a new journey. On a phone, swipe the map sideways.</p>
<div class="out" id="jm-out" aria-live="polite"></div>
<details class="how" id="jm-how"><summary>How we calculate</summary>
<p>Distance is the great-circle distance between the main airports of the two places. Flight time is that distance at the published cruise speed, plus 30 minutes for climb and descent, in still air; a journey longer than the published range adds about an hour for each fuel stop, and an aircraft that would need more than two stops is shown as not suited. These are estimates: the real range and time depend on passengers, luggage, weather, winds, the airports and the routing, and the operator confirms them for your trip. Published ranges assume standard reserves.</p>
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
function path(a, b){ var f1=a.lat*R, l1=a.lon*R, f2=b.lat*R, l2=b.lon*R, d = gc(a,b)/NM, s = '', prev = null, n = 96;
  for (var i = 0; i <= n; i++){ var t = i/n, A = Math.sin((1-t)*d)/Math.sin(d), B = Math.sin(t*d)/Math.sin(d);
    var x = A*Math.cos(f1)*Math.cos(l1) + B*Math.cos(f2)*Math.cos(l2), y = A*Math.cos(f1)*Math.sin(l1) + B*Math.cos(f2)*Math.sin(l2), z = A*Math.sin(f1) + B*Math.sin(f2);
    var lat = Math.atan2(z, Math.sqrt(x*x+y*y))/R, lon = Math.atan2(y, x)/R, p = P(lon, lat);
    var jump = prev !== null && Math.abs(wrap(lon) - wrap(prev)) > 180;
    s += (i === 0 || jump ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); prev = lon; }
  return s; }
var ns = 'http://www.w3.org/2000/svg', el = function(n, a){ var e = document.createElementNS(ns, n); for (var k in a) e.setAttribute(k, a[k]); return e; };
var box = document.getElementById('jm-map'); if (!box) return;
var svg = el('svg', {viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'World map of the places we have guides for'});
var g = ''; for (var lo = -180; lo < 180; lo += 30){ var x = ((lo + 180) / 360) * W; g += 'M' + x + ' 0V' + H; }
for (var la = 60; la >= -60; la -= 30){ var y = ((T - la) / 360) * W; if (y > 0 && y < H) g += 'M0 ' + y + 'H' + W; }
svg.appendChild(el('path', {d: g, 'class': 'grat'}));
svg.appendChild(el('path', {d: D.world.path, 'class': 'coast'}));
var route = el('path', {d: '', 'class': 'route'}); svg.appendChild(route);
var rings = el('g', {}); svg.appendChild(rings);
var sel = [];
var pa = document.getElementById('jm-a'), pb = document.getElementById('jm-b'), out = document.getElementById('jm-out');
D.places.forEach(function(p, i){ var q = P(p.lon, p.lat);
  var hit = el('circle', {cx: q[0], cy: q[1], r: 11, 'class': 'hit', tabindex: '-1'});
  var t = el('title', {}); t.textContent = p.name; hit.appendChild(t);
  hit.addEventListener('click', function(){ tap(i); });
  svg.appendChild(hit); svg.appendChild(el('circle', {cx: q[0], cy: q[1], r: 3.2, 'class': 'pt', id: 'jm-p' + i})); });
box.appendChild(svg);
function tap(i){ if (sel.length >= 2) sel = []; if (sel.length === 1 && sel[0] === i) return; sel.push(i); sync(); }
function sync(){ pa.value = sel.length > 0 ? String(sel[0]) : ''; pb.value = sel.length > 1 ? String(sel[1]) : ''; draw(); }
pa.addEventListener('change', function(){ var a = pa.value === '' ? null : +pa.value, b = pb.value === '' ? null : +pb.value; sel = []; if (a !== null) sel.push(a); if (b !== null && b !== a) sel.push(b); draw(); });
pb.addEventListener('change', function(){ var a = pa.value === '' ? null : +pa.value, b = pb.value === '' ? null : +pb.value; sel = []; if (a !== null) sel.push(a); if (b !== null && b !== a) sel.push(b); draw(); });
function hm(h){ var m = Math.round(h * 4) * 15, hh = Math.floor(m / 60), mm = m % 60; return 'about ' + hh + ' h' + (mm ? ' ' + mm + ' min' : ''); }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function draw(){
  rings.innerHTML = ''; document.querySelectorAll('.jm .pt.on').forEach(function(e){ e.setAttribute('class', 'pt'); });
  sel.forEach(function(i){ var p = D.places[i], q = P(p.lon, p.lat); rings.appendChild(el('circle', {cx: q[0], cy: q[1], r: 7, 'class': 'ring'})); document.getElementById('jm-p' + i).setAttribute('class', 'pt on'); });
  if (sel.length < 2){ route.setAttribute('d', ''); out.innerHTML = sel.length ? '<p class="d">From ' + esc(D.places[sel[0]].name) + '. Now choose where you are going.</p>' : ''; return; }
  var a = D.places[sel[0]], b = D.places[sel[1]], nm = gc(a, b), km = nm * 1.852;
  route.setAttribute('d', path(a, b));
  var rows = D.ac.map(function(m){ var stops = nm <= m.range_nm ? 0 : Math.ceil(nm / m.range_nm) - 1, h = nm / m.kt + 0.5 + stops;
    var st = stops > 2 ? 'Not suited: more than two fuel stops' : stops ? (stops === 1 ? 'One fuel stop' : 'Two fuel stops') : 'Nonstop';
    return '<tr><td>' + esc(m.name) + '<span class="cat">' + esc(m.cat) + '</span></td><td>' + st + '</td><td class="n">' + (stops > 2 ? '–' : hm(h)) + '</td></tr>'; }).join('');
  var q = '/?from=' + encodeURIComponent(a.name) + '&to=' + encodeURIComponent(b.name) + '#top';
  out.innerHTML = '<p class="r">' + esc(a.name) + ' to ' + esc(b.name) + '</p><p class="d">' + Math.round(nm).toLocaleString('en') + ' nm (' + Math.round(km).toLocaleString('en') + ' km), great-circle distance.</p>' +
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
    import company
    pub = [p for p in places["places"] if not (company.LAUNCHED and p.get("draft"))]
    places = dict(places, places=pub)
    data = {"world": world, "places": [{k: p[k] for k in ("name", "path", "lat", "lon")} for p in pub],
            "ac": [{k: m[k] for k in ("name", "cat", "range_nm", "kt")} for m in ac["models"]]}
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
