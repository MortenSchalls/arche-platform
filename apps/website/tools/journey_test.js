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
    await click('Singapore'); await click('Tokyo'); await p.waitForTimeout(1600);
    const shown = await p.evaluate(() => [...document.querySelectorAll('.jm .lb')].filter(x => x.style.display !== 'none').map(x => x.getBoundingClientRect()));
    const overl = shown.some((a, i) => shown.some((b, j) => j > i && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    ok(w + ' city names do not overlap (' + shown.length + ' of 37 shown)', !overl && shown.length >= 30, shown.length);
    ok(w + ' route is the guide green', (await p.evaluate(() => getComputedStyle(document.querySelector('.jm .route')).stroke)) === 'rgb(57, 255, 143)');
    const t = await p.textContent('#jm-out');
    ok(w + ' Singapore to Tokyo about 2,880 nm', /2,8\d\d nm/.test(t), t.slice(0, 80));
    ok(w + ' ten aircraft listed', (await p.$$('#jm-out tbody tr')).length === 10);
    ok(w + ' Challenger 350 nonstop, CJ3 one stop', /Challenger 300 \/ 350Super-midsizeNonstop/.test(t) && /CJ3\+Light jetOne fuel stop/.test(t), t);
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
