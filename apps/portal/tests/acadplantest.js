// Joining page → academy (Morten, 4 Nov 2026: why invitees stop at step 2). Example data only.
// 1. The academy steps, titles and reading times used on the joining page and in reminders match the academy itself.
// 2. A new candidate sees "Your next step" at the top, opens the academy in the same tab with no second sign-in, finds
//    their name filled in, and the visit is recorded; back on the joining page the offer folds away and the button
//    says "Continue where you left off" with the next module and its length.
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
(async()=>{let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const H=path.join(__dirname,'..');
const dist=fs.readFileSync(path.join(H,'..','academy','dist','arche-broker-academy.html'),'utf8');
// the academy's own course list and reading times
const course={};for(const m of dist.matchAll(/\{"id":"(m\d+|lab|book|exam)","n":"([^"]+)","t":"([^"]+)"/g))course[m[1]]={n:m[2],t:m[3]};
const mins={};for(const id of Object.keys(course)){const i=dist.indexOf('"'+id+'":{"intro"');if(i<0)continue;let d=0,j=dist.indexOf('{',i);const st=j;for(;j<dist.length;j++){const c=dist[j];if(c==='"'){j++;while(dist[j]!=='"'){if(dist[j]==='\\')j++;j++;}continue;}if(c==='{')d++;else if(c==='}'){d--;if(!d)break;}}const mm=dist.slice(st,j+1).match(/"min":(\d+)\}$/);if(mm)mins[id]=+mm[1];}
const paths=JSON.parse(dist.match(/PATHS = (\{[^;]*?\})\s*[;\n]/)[1]);
const ob=fs.readFileSync(path.join(H,'src-modules','onboard.js'),'utf8');
const OB=eval('('+ob.match(/const OB_ACAD = (\{[\s\S]*?\n\});/)[1]+')');
ok('joining page: same paths as the academy',JSON.stringify(OB.paths)===JSON.stringify(paths),{OB:OB.paths,paths});
const bad=Object.keys(course).filter(id=>{const [t,min]=OB.steps[id]||[];const want=/^\d+$/.test(course[id].n)?`Module ${course[id].n} · ${course[id].t}`:course[id].t;return t!==want||(min||0)!==(mins[id]||0);});
ok('joining page: every step title and reading time matches the academy',bad.length===0,bad.map(id=>[id,OB.steps[id],course[id],mins[id]]));
const api=await import(path.join(H,'api','invite.mjs'));
const bad2=Object.keys(course).filter(id=>{const done={};for(const k of paths.broker){if(k===id)break;done[k]={passed:true};}const n=api.academyNext({role:'broker',mods:done});return !n||n.id!==id||n.title!==OB.steps[id][0]||n.min!==OB.steps[id][1];});
ok('reminder email: same next step, title and length as the joining page',bad2.length===0,bad2);
const idx=fs.readFileSync(path.join(H,'index.html'),'utf8');ok('index.html carries the same academy plan',idx.includes(ob.match(/const OB_ACAD = \{[\s\S]*?\n\};/)[0]));

const b=await chromium.launch();const errs=[];
for(const w of [390,1300]){
  const ctx=await b.newContext({viewport:{width:w,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(w+': '+e.message));
  await p.goto('http://localhost:8765/test.html?as=candidate');await p.waitForTimeout(3500);
  const top=await p.evaluate(()=>{const n=document.getElementById('obNext');if(!n)return null;const a=n.querySelector('a');return {t:n.innerText,y:n.getBoundingClientRect().top+scrollY,href:a&&a.getAttribute('href'),target:a&&a.target};});
  ok(w+': "Your next step" at the top of the joining page',top&&/Your next step: start the Archē Broker Academy\. Module 0 · Aviation for brokers · about 21 min/.test(top.t)&&top.y<700,top);
  ok(w+': Start the academy opens in the same tab, no second sign-in wording',top&&/Start the academy/i.test(top.t)&&top.href==='academy.test.html'&&!top.target&&!/Sign in to the academy/.test(await p.textContent('#main')),top);
  ok(w+': the offer is open on the first visit',/up to 35% of the profit/.test(await p.textContent('#main')));
  ok(w+': no sideways scroll on the joining page',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.click('#obNext a');await p.waitForTimeout(3500);
  ok(w+': academy opened in the same tab',/academy\.test\.html/.test(p.url()),p.url());
  ok(w+': the start form has the name from the login',await p.evaluate(()=>(document.getElementById('nm')||{}).value==='Example Tester'));
  const visit=await p.evaluate(async()=>{const db=await __arche.use('db');const s=await __sb.auth.getSession();const d=await db.doc('train/'+s.data.session.user.id+'/runs/academy').get();return d.exists?d.data():null;});
  ok(w+': academy visit recorded for the joining log',visit&&visit.count>=1&&visit.first&&visit.last&&visit.kind==='academy-visit',visit);
  // start, pass module 0 in the test data, go back to the joining page
  await p.evaluate(async()=>{const db=await __arche.use('db');const s=await __sb.auth.getSession();await db.doc('progress/'+s.data.session.user.id).set({v:1,name:'Example Tester',role:'broker',mods:{m0:{passed:true,best:100,attempts:1}},updated:new Date().toISOString()});});await p.waitForTimeout(1500);
  await p.goto('http://localhost:8765/test.html?as=candidate');await p.waitForTimeout(3500);
  const top2=await p.evaluate(()=>{const n=document.getElementById('obNext');const a=n&&n.querySelector('a');return n&&{t:n.innerText,href:a&&a.getAttribute('href')};});
  ok(w+': back on the joining page: Continue where you left off, Module 1 and its length',top2&&/continue the Archē Broker Academy\. Module 1 · Archē Executive and the broker's role · about 12 min · 1 of 19 done/.test(top2.t)&&/Continue where you left off/i.test(top2.t)&&top2.href==='academy.test.html#m1',top2);
  ok(w+': the offer has folded away; Read the offer opens it',!/up to 35% of the profit/.test(await p.textContent('#main'))&&!!(await p.$('[data-agr="offer"]')));
  await p.click('#obNext a');await p.waitForTimeout(3000);
  ok(w+': Continue opens Module 1 directly',/#m1$/.test(p.url())&&/Archē Executive and the broker's role/.test(await p.evaluate(()=>document.getElementById('view').innerText)),p.url());
  ok(w+': no sideways scroll in the academy',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await ctx.close();
}
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
