// Journey map on Destinations: picks, results, phone width, quote form prefill. Run after build.py:
//   (cd apps/website/site && python3 -m http.server 8793 &) ; NODE_PATH=$(npm root -g) node apps/website/tools/journey_test.js
const {chromium} = require('playwright');
const U = 'http://localhost:8793';
let fail = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + JSON.stringify(x || ''))); if (!c) fail++; };
(async () => { const b = await chromium.launch(); const errs = [];
  for (const w of [1440, 390]) { const p = await b.newPage({viewport: {width: w, height: 900}}); p.on('pageerror', e => errs.push(e.message));
    await p.goto(U + '/destinations/'); await p.waitForTimeout(600);
    const o = await p.evaluate(() => [...document.querySelectorAll('#jm-a option')].map(x => [x.value, x.textContent]));
    ok(w + ' every city page is a place (37)', o.length - 1 === 37, o.length);
    const id = n => o.find(x => x[1] === n)[0];
    await p.selectOption('#jm-a', id('Singapore')); await p.selectOption('#jm-b', id('Tokyo')); await p.waitForTimeout(200);
    const t = await p.textContent('#jm-out');
    ok(w + ' Singapore to Tokyo about 2,880 nm', /2,8\d\d nm/.test(t), t.slice(0, 80));
    ok(w + ' ten aircraft listed', (await p.$$('#jm-out tbody tr')).length === 10);
    ok(w + ' Challenger 350 nonstop, CJ3 one stop', /Challenger 300 \/ 350Super-midsizeNonstop/.test(t) && /CJ3\+Light jetOne fuel stop/.test(t), t);
    ok(w + ' route drawn', (await p.getAttribute('.jm .route', 'd')).length > 50);
    ok(w + ' no sideways page scroll', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const q = await p.getAttribute('#jm-out a.btn.p', 'href'); ok(w + ' quote link carries the journey', q === '/?from=Singapore&to=Tokyo#top', q);
    await p.close(); }
  const p = await b.newPage(); await p.goto(U + '/?from=Singapore&to=%3Cb%3ETokyo#top'); await p.waitForTimeout(1200);
  const v = await p.evaluate(() => [...document.querySelectorAll('input')].map(i => i.value).filter(Boolean));
  ok('quote form filled, markup stripped', v[0] === 'Singapore' && v[1] === 'bTokyo', v);
  ok('no script errors', errs.length === 0, errs);
  await b.close(); console.log(fail ? fail + ' FAILED' : 'journey map: all passed'); process.exit(fail ? 1 : 0); })();
