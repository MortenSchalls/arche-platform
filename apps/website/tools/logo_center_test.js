// The logo in the top menu sits exactly centred over the watermark aircraft on every page and width (Morten, 13 Nov 2026:
// "the Arche on ALL pages always site exactly on top centered over the watermark aircraft"). Run after build.py with the
// site served on 8793:  NODE_PATH=$(npm root -g) node apps/website/tools/logo_center_test.js
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const SITE = path.join(__dirname, '..', 'site'), U = 'http://localhost:8793';
const pages = []; (function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/^(fonts|img|assets|api|vendor)$/.test(f)) walk(p); } else if (f.endsWith('.html') && !/^(404|t_)/.test(f)) pages.push('/' + path.relative(SITE, p).replace(/index\.html$/, '')); } })(SITE);
(async () => { const b = await chromium.launch(); let bad = [], n = 0;
  for (const w of [1920, 1440, 1280, 1024, 800, 390]) { const p = await b.newPage({viewport: {width: w, height: 900}});
    for (const u of pages) { await p.goto(U + u, {waitUntil: 'domcontentloaded'}); await p.waitForTimeout(150);
      const r = await p.evaluate(() => { const t = document.querySelector('.ae-nav-brand .w'), m = document.querySelector('.ae-nav-brand svg'), i = document.querySelector('.ae-wm>i');
        if (!t || !i) return null; const a = t.getBoundingClientRect(), g = m.getBoundingClientRect(), c = i.getBoundingClientRect();
        // the word without its trailing letter-spacing (padding-left balances it), the emblem, and the aircraft's centre (18.5% + 63%/2 of the compass box)
        return {word: a.left + a.width / 2, mark: g.left + g.width / 2, jet: c.left + c.width * (0.185 + 0.315)}; });
      n++; if (!r) { bad.push(`${w} ${u}: no logo or watermark`); continue; }
      const d = Math.max(Math.abs(r.word - r.jet), Math.abs(r.mark - r.jet)); if (d > 1.5) bad.push(`${w} ${u}: off by ${d.toFixed(1)} px`); }
    await p.close(); }
  await b.close(); console.log(bad.slice(0, 20).join('\n') || ''); console.log(`logo over the aircraft: ${n - bad.length} of ${n} page views centred within 1.5 px`); process.exit(bad.length ? 1 : 0); })();
