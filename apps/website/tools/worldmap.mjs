// Builds content/world.json for the journey map on Destinations: land outlines from Natural Earth 1:110m
// (public domain), via the world-atlas package. Archē's own copy; nothing is read from any other site.
// Usage: node tools/worldmap.mjs <path to world-atlas/land-110m.json> <path to topojson-client>
// Coastlines drawn as lines (no fill), so outlines cut at the map's edge never join up.
// Equirectangular, centred on 100°E (the world seen from Singapore), 75°N to 60°S, viewBox 1000 wide.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const [, , landPath, clientDir] = process.argv;
const require = createRequire(import.meta.url);
const { feature } = require(clientDir);
const topo = JSON.parse(fs.readFileSync(landPath, 'utf8'));
const land = feature(topo, topo.objects.land);
const C = 100, W = 1000, TOP = 75, BOT = -60, H = Math.round(W * (TOP - BOT) / 360);
const wrap = l => { let x = l - C; while (x < -180) x += 360; while (x > 180) x -= 360; return x; };
const P = ([lon, lat]) => [((wrap(lon) + 180) / 360) * W, ((TOP - lat) / 360) * W];
let d = '';
const rings = land.features.flatMap(f => f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat());
for (const ring of rings) {
  let prev = null;
  for (const pt of ring) {
    if (pt[1] < BOT - 2 || pt[1] > TOP + 2) { prev = null; continue; }
    const [x, y] = P(pt);
    const jump = prev && Math.abs(wrap(pt[0]) - wrap(prev[0])) > 180;
    d += (!prev || jump ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    prev = pt;
  }
}
const out = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'content', 'world.json');
fs.writeFileSync(out, JSON.stringify({ centre: C, width: W, height: H, top: TOP, path: d, source: 'Natural Earth 1:110m land (public domain), via world-atlas 2' }));
console.log('world.json', d.length, 'chars', W, 'x', H);
