// Lists every screen the recorded narration covers (Morten, 7 Nov 2026), straight from the academy as a trainee sees
// it: each module's intro, every lesson screen, the key points, every module-check question, and the feedback for
// each "Try it" and check question (right and wrong). Each gets the same key the player computes, its text as the
// screen reader would say it, and the paragraphs for a flowing narration. Output: audio/screens.int.json.
// Run: node apps/academy/audio/screens.js  (needs the test build apps/academy/build/t_full.html)
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({viewport: {width: 1200, height: 900}});
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'build', 't_full.html')); await p.waitForTimeout(800);
  const out = await p.evaluate(async () => {
    const T = window.__T(), A = window.__AUD, sleep = ms => new Promise(r => setTimeout(r, ms));
    const ids = T.PATHS.broker.concat(T.PATHS.consultant).filter((x, i, a) => a.indexOf(x) === i);
    T.ST.name = "Example Trainee"; T.ST.role = "broker"; T.ST.mods = {}; ids.forEach(id => T.ST.mods[id] = {passed: true, best: 100, total: 1, attempts: 1}); T.ST.review = [];
    const norm = t => String(t || "").replace(/\s+/g, " ").trim();
    // paragraphs for the narration: a heading stands alone; list items, table rows and answer options flow on as one paragraph
    const paras = items => { const out = []; let run = null;
      items.forEach(({el, t}) => { const tag = el.tagName, grp = tag === "LI" ? "li" : tag === "TR" ? "tr" : el.classList.contains("opt") ? "opt" : "";
        if (grp && run && run.g === grp && run.p === el.parentElement) { run.t += " " + t; return; }
        run = grp ? {g: grp, p: el.parentElement, t} : null; out.push(run || {t}); });
      return out.map(x => x.t); };
    const list = [], seen = new Set();
    const add = (kind, where, key, items) => { if (seen.has(key)) return; seen.add(key); list.push({key, kind, where, text: items.map(x => norm(x.el.textContent)), say: paras(items)}); };
    const screenNow = (kind, where, root) => { const items = A.collect(root).filter(x => !x.el.closest("[data-nokey]")); add(kind, where, A.screenKey(root), items); };
    const fb = (where, el) => add("feedback", where, A.fbKey(el), [{el, t: A.textOf(el)}]);
    for (const id of Object.keys(T.MODS)) {
      const M = T.MODS[id], n = M.secs.length + 2 + (M.quiz.length ? 1 : 0);
      T.go(id); await sleep(30);
      for (let s = 0; s < n; s++) {
        T.step(s); await sleep(20);
        const v = T.view(), check = s === n - 1 && M.quiz.length;
        if (!check) {
          screenNow(s === 0 ? "intro" : s === n - (M.quiz.length ? 2 : 1) ? "keypoints" : "lesson", `${id} screen ${s + 1}`);
          // feedback for each "Try it": the right answer and one wrong answer
          const tries = [...document.querySelectorAll("#view [data-try]")].length;
          for (let k = 0; k < tries; k++) for (const pickRight of [true, false]) {
            T.step(s); await sleep(10);
            const el = document.querySelectorAll("#view [data-try]")[k], opts = el.querySelectorAll(".opt");
            for (let j = 0; j < opts.length; j++) { opts[j].click(); const f = el.querySelector(".fb"); const right = /^Right\./.test(norm(f && f.textContent));
              if (right === pickRight) { fb(`${id} screen ${s + 1} try ${k + 1}`, f); break; } T.step(s); await sleep(5); }
          }
        } else {
          // module check: every question, and its feedback when answered right and when answered wrong
          for (let qi = 0; qi < M.quiz.length; qi++) {
            for (const pickRight of [true, false]) {
              T.step(s); await sleep(10);
              for (let a = 0; a < qi; a++) { const q = document.querySelector("#qz .opts .opt"); q.click(); document.getElementById("qnext").click(); await sleep(2); }
              const root = document.getElementById("qz"); if (pickRight) screenNow("question", `${id} check question ${qi + 1}`, root);
              const q = M.quiz[qi], j = pickRight ? null : null;
              const opts = [...root.querySelectorAll(".opt")], text = opts.map(o => norm(o.lastElementChild.textContent));
              const want = pickRight ? text.indexOf(norm(q.o[q.a])) : text.findIndex(t => t !== norm(q.o[q.a]));
              opts[want].click(); fb(`${id} check question ${qi + 1}`, root.querySelector(".fb"));
            }
          }
        }
      }
    }
    return list;
  });
  const file = path.join(__dirname, 'screens.int.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 1));
  const chars = out.reduce((a, x) => a + x.say.join(" ").length, 0), by = {};
  out.forEach(x => by[x.kind] = (by[x.kind] || 0) + 1);
  console.log(out.length, 'screens', by, chars, 'characters', errs.length ? 'ERRORS ' + errs.join(' | ') : '');
  await b.close();
})();
