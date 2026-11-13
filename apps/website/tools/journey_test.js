// Journey map on Destinations: picks, results, phone width, quote form prefill. Run after build.py:
//   (cd apps/website/site && python3 -m http.server 8793 &) ; NODE_PATH=$(npm root -g) node apps/website/tools/journey_test.js
const {chromium} = require('playwright');
const U = 'http://localhost:8793';
let fail = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + JSON.stringify(x || ''))); if (!c) fail++; };
(async () => { const b = await chromium.launch(); const errs = [];
  for (const w of [1440, 390]) { const p = await b.newPage({viewport: {width: w, height: 900}}); p.on('pageerror', e => errs.push(e.message));
    await p.goto(U + '/destinations/'); await p.waitForTimeout(600);
    const names = await p.evaluate(() => [...document.querySelectorAll('.jm .lb')].map(x => x.textContent));
    ok(w + ' every city page is a place (37)', names.length === 37, names.length);
    ok(w + ' no drop-down lists, map only', (await p.$$('#planner select')).length === 0);
    const click = async n => { const i = names.indexOf(n); await p.evaluate(i => document.getElementById('jm-p' + i).scrollIntoView({block: 'center', inline: 'center'}), i);
      const b = await p.locator('#jm-p' + i).boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
    await click('Singapore'); await click('Tokyo'); await p.waitForTimeout(700);
    const mid = await p.evaluate(() => { const r = document.querySelector('.jm .route'), s = document.querySelector('.jm .spark'), d = r.getAttribute('d'), m = d.match(/([\d.]+) ([\d.]+)$/);
      return {head: [+m[1], +m[2]], dot: [+s.getAttribute('cx'), +s.getAttribute('cy')], part: r.getTotalLength()}; });
    ok(w + ' mid-flight the line ends at the moving point', Math.hypot(mid.head[0] - mid.dot[0], mid.head[1] - mid.dot[1]) < 1 && mid.dot[0] > 0, mid);
    await p.waitForTimeout(1500);
    const shown = await p.evaluate(() => [...document.querySelectorAll('.jm .lb')].filter(x => x.style.display !== 'none').map(x => x.getBoundingClientRect()));
    const overl = shown.some((a, i) => shown.some((b, j) => j > i && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    ok(w + ' city names do not overlap (' + shown.length + ' of 37 shown)', !overl && shown.length >= 30, shown.length);
    ok(w + ' route is the guide green', (await p.evaluate(() => getComputedStyle(document.querySelector('.jm .route')).stroke)) === 'rgb(57, 255, 143)');
    const t = await p.textContent('#jm-out');
    ok(w + ' Singapore to Tokyo about 2,880 nm', /2,8\d\d nm/.test(t), t.slice(0, 80));
    const rows = await p.$$eval('#jm-out tbody tr', rs => rs.map(r => [r.className, r.textContent]));
    ok(w + ' only aircraft with at most one fuel stop', rows.length >= 1 && rows.every(r => /Nonstop|One fuel stop/.test(r[1])), rows);
    ok(w + ' one suggested aircraft, first, in the guide green, nonstop', rows[0][0] === 'best' && rows.filter(r => r[0] === 'best').length === 1 && /Nonstop/.test(rows[0][1])
      && (await p.$eval('#jm-out tr.best td', e => getComputedStyle(e).color)) === 'rgb(57, 255, 143)', rows[0]);
    ok(w + ' Singapore to Tokyo suggests a heavy or ultra-long-range jet', /Heavy jet|Ultra-long-range/.test(rows[0][1]), rows[0][1]);
    ok(w + ' route drawn', (await p.getAttribute('.jm .route', 'd')).length > 50);
    ok(w + ' no sideways page scroll', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.screenshot({path: '/tmp/claude-0/-home-claude/3678dbf8-f26a-505b-b9f6-0376a0bfbc99/scratchpad/jm2_' + w + '.png'});
    const q = await p.getAttribute('#jm-out a.btn.p', 'href'); ok(w + ' quote link carries the journey', q === '/?from=Singapore&to=Tokyo#top', q);
    await p.close(); }
  const p = await b.newPage(); await p.goto(U + '/?from=Singapore&to=%3Cb%3ETokyo#top'); await p.waitForTimeout(1200);
  const v = await p.evaluate(() => [...document.querySelectorAll('input')].map(i => i.value).filter(Boolean));
  ok('quote form filled, markup stripped', v[0] === 'Singapore' && v[1] === 'bTokyo', v);
  ok('no script errors', errs.length === 0, errs);
  await b.close(); console.log(fail ? fail + ' FAILED' : 'journey map: all passed'); process.exit(fail ? 1 : 0); })();
