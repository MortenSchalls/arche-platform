// Research agent panel (Morten, 8 Nov 2026). Example data only.
// The Director sees the panel in Prospects and saves on/off, frequency and focus to intel/agent (no AI limit, no key,
// no Run now: research is a Claude scheduled task since 8 Nov 2026); the last run shows what the checks rejected;
// brokers never see it; no sideways scroll at 390 px.
const {chromium}=require('playwright');
(async()=>{let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c||x===undefined?'':'  -> '+JSON.stringify(x).slice(0,300)));if(!c)fails++;};
const b=await chromium.launch();const errs=[];
for(const w of [390,1300]){
  const ctx=await b.newContext({viewport:{width:w,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(w+': '+e.message));
  await p.goto('http://localhost:8765/test.html?as=owner');await p.waitForTimeout(3500);
  await p.evaluate(()=>{S.view='prospects';S.pSec='sales';render();});await p.waitForTimeout(800);
  ok(w+': the Director sees the Research agent in Prospects',!!(await p.$('#agentBox'))&&/Research agent · off/.test(await p.textContent('#agentBox summary')));
  await p.evaluate(()=>{document.getElementById('agentBox').open=true;});await p.waitForTimeout(200);
  ok(w+': no AI limit, key or Run now in the panel',!(await p.$('#ag_cap'))&&!(await p.$('[data-act="agRun"]'))&&!/ANTHROPIC|Monthly AI limit|Waiting for the AI key/.test(await p.textContent('#agentBox'))&&/No AI key and no AI bill/.test(await p.textContent('#agentBox')));
  await p.check('#ag_on');await p.selectOption('#ag_freq','weekdays');await p.fill('#ag_focus','Family offices in Singapore\n\n Event organisers in Phuket ');
  await p.click('[data-act="agSave"]');await p.waitForTimeout(1200);
  const d=await p.evaluate(async()=>{const x=await S.db.doc('intel/agent').get();return x.exists?x.data():null;});
  ok(w+': settings saved (blank lines dropped)',d&&d.on===true&&d.freq==='weekdays'&&JSON.stringify(d.focus)==='["Family offices in Singapore","Event organisers in Phuket"]'&&!d.runNow,d);
  ok(w+': panel stays open after saving and shows it is on',await p.evaluate(()=>document.getElementById('agentBox').open)&&/on, monday to friday/.test(await p.textContent('#agentBox summary')));
  await p.evaluate(async()=>{const x=(await S.db.doc('intel/agent').get()).data();await S.db.doc('intel/agent').set({...x,state:'done',last:{at:new Date().toISOString(),added:4,operators:2,routes:3,rejected:2,held:1,note:'Research agent: 4 organisations added.',reasons:['Example One: already known','Example Two: source page does not open or does not name the organisation']}});});await p.waitForTimeout(1200);
  ok(w+': shows the last run and what the checks rejected, with reasons',/4 organisations added, 2 operators, contact routes for 3, 2 rejected by the checks, 1 held for your decision/.test(await p.textContent('#agState'))&&/source page does not open/.test(await p.textContent('#agentBox')));
  ok(w+': no sideways scroll',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await ctx.close();
  const c2=await b.newContext({viewport:{width:w,height:900}});const q=await c2.newPage();q.on('pageerror',e=>errs.push(w+' broker: '+e.message));
  await q.goto('http://localhost:8765/test.html?as=broker');await q.waitForTimeout(3500);await q.evaluate(()=>{S.view='prospects';render();});await q.waitForTimeout(600);
  ok(w+': brokers do not see the agent',!(await q.$('#agentBox')));await c2.close();
}
ok('no page errors',errs.length===0,errs);console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0)})();
